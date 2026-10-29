
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using DeliveryApi.Data;
using DeliveryApi.Models;
using DeliveryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Authorize]
[Route("api/pagos-tarjeta")]
public class PagosTarjetaController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly RecurrenteService _recurrente;

    public PagosTarjetaController(
        DeliveryDbContext context,
        RecurrenteService recurrente)
    {
        _context = context;
        _recurrente = recurrente;
    }

    // POST: api/pagos-tarjeta/pedidos/15/checkout
    [HttpPost("pedidos/{pedidoId:int}/checkout")]
    public async Task<IActionResult> CrearCheckout(
        int pedidoId,
        CancellationToken cancellationToken)
    {
        // Identificar al cliente mediante su token.
        string? usuarioIdTexto =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("usuarioId")?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!int.TryParse(usuarioIdTexto, out int usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "No se pudo identificar al cliente."
            });
        }

        // IMPORTANTE:
        // El cliente solamente puede pagar sus propios pedidos.
        var pedido = await _context.Pedidos
            .FirstOrDefaultAsync(
                p => p.Id == pedidoId &&
                     p.UsuarioId == usuarioId,
                cancellationToken);

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        if (pedido.MetodoPago != "Tarjeta")
        {
            return BadRequest(new
            {
                mensaje = "Este pedido no utiliza pago con tarjeta."
            });
        }

        if (pedido.Estado != "Pendiente" ||
            pedido.EstadoPago != "Pendiente")
        {
            return Conflict(new
            {
                mensaje = "Este pedido ya no admite un nuevo pago."
            });
        }

        // Recurrente exige un importe minimo de Q5
        // para este checkout de prueba.
        if (pedido.Total < 5m)
        {
            return BadRequest(new
            {
                mensaje = "El importe no cumple el minimo de pago."
            });
        }

        // Recuperar el checkout existente sin generar otro cobro.
        var intentoExistente = await _context
            .Set<TransaccionPago>()
            .Where(t => t.PedidoId == pedido.Id &&
                        t.Proveedor == "Recurrente" &&
                        (t.Estado == "Pendiente" ||
                         t.Estado == "Aprobado"))
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (intentoExistente != null)
        {
            if (intentoExistente.Estado != "Pendiente" ||
                string.IsNullOrWhiteSpace(intentoExistente.ReferenciaExterna) ||
                pedido.ReferenciaPagoExterno != intentoExistente.ReferenciaExterna ||
                !Uri.TryCreate(intentoExistente.Observacion, UriKind.Absolute, out var urlGuardada) ||
                urlGuardada.Scheme != Uri.UriSchemeHttps ||
                urlGuardada.Host != "app.recurrente.com")
            {
                return Conflict(new
                {
                    mensaje = "El pago existente requiere revisión."
                });
            }

            RecurrenteEstadoCheckout consulta;

            try
            {
                consulta = await _recurrente.ConsultarEstadoCheckoutAsync(
                    intentoExistente.ReferenciaExterna,
                    cancellationToken);
            }
            catch (Exception ex) when (
                ex is InvalidOperationException ||
                ex is System.Net.Http.HttpRequestException ||
                ex is TaskCanceledException ||
                ex is System.Text.Json.JsonException)
            {
                return StatusCode(502, new
                {
                    mensaje = "No fue posible consultar el pago existente."
                });
            }

            if (consulta.Estado != "unpaid")
            {
                return Conflict(new
                {
                    mensaje = consulta.Estado == "paid"
                        ? "El pago ya fue recibido. Espera la confirmación."
                        : consulta.Estado == "payment_in_progress"
                            ? "El pago está procesándose."
                            : "El checkout venció y requiere revisión."
                });
            }

            return Ok(new
            {
                pedidoId = pedido.Id,
                transaccionId = intentoExistente.Id,
                monto = pedido.Total,
                moneda = "GTQ",
                checkoutId = intentoExistente.ReferenciaExterna,
                checkoutUrl = intentoExistente.Observacion,
                estadoPago = pedido.EstadoPago,
                recuperado = true
            });
        }
        RecurrenteCheckout checkout;

        try
        {
            // El importe sale de SQL Server.
            // Nunca aceptamos el total enviado por la app.
            checkout = await _recurrente.CrearCheckoutAsync(
                pedido.Id,
                pedido.Total,
                cancellationToken);
        }
        catch (Exception ex) when (
            ex is InvalidOperationException ||
            ex is System.Net.Http.HttpRequestException ||
            ex is TaskCanceledException)
        {
            // No exponer claves ni detalles internos.
            return StatusCode(502, new
            {
                mensaje = "No fue posible crear el checkout de Recurrente."
            });
        }

        // Guardar el intento en SQL Server.
        var transaccion = new TransaccionPago
        {
            PedidoId = pedido.Id,
            Monto = pedido.Total,
            Moneda = "GTQ",
            Estado = "Pendiente",
            Proveedor = "Recurrente",
            ReferenciaExterna = checkout.Id,
            Observacion = checkout.CheckoutUrl,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Set<TransaccionPago>().Add(transaccion);

        pedido.ProveedorPago = "Recurrente";
        pedido.ReferenciaPagoExterno = checkout.Id;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            pedidoId = pedido.Id,
            transaccionId = transaccion.Id,
            monto = pedido.Total,
            moneda = "GTQ",
            checkoutId = checkout.Id,
            checkoutUrl = checkout.CheckoutUrl,
            estadoPago = pedido.EstadoPago
        });
    }
}
