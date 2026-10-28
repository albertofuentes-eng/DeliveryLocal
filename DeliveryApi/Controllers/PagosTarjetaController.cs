
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

        // Evitar crear otro checkout si ya existe
        // un intento registrado como pendiente o aprobado.
        bool existeIntento = await _context
            .Set<TransaccionPago>()
            .AnyAsync(
                t => t.PedidoId == pedido.Id &&
                     (t.Estado == "Pendiente" ||
                      t.Estado == "Aprobado"),
                cancellationToken);

        if (existeIntento)
        {
            return Conflict(new
            {
                mensaje = "Este pedido ya tiene un intento de pago registrado."
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
