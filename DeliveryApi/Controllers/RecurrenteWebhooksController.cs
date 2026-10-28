
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks/recurrente")]
public class RecurrenteWebhooksController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecurrenteWebhooksController> _logger;

    public RecurrenteWebhooksController(
        DeliveryDbContext context,
        IConfiguration configuration,
        ILogger<RecurrenteWebhooksController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> RecibirWebhook()
    {
        // 1. Leer el cuerpo original del webhook.
        // Es necesario para verificar la firma.
        using var reader = new StreamReader(
            Request.Body,
            Encoding.UTF8);

        string cuerpo = await reader.ReadToEndAsync();

        string mensajeId =
            Request.Headers["svix-id"].ToString();

        string timestamp =
            Request.Headers["svix-timestamp"].ToString();

        string firma =
            Request.Headers["svix-signature"].ToString();

        // El signing secret es diferente de la API Secret Key.
        string? webhookSecret =
            _configuration["Recurrente:WebhookSecret"];

        if (string.IsNullOrWhiteSpace(webhookSecret))
        {
            _logger.LogError(
                "Falta configurar el secreto del webhook de Recurrente.");

            return StatusCode(503, new
            {
                mensaje = "Webhook no configurado."
            });
        }

        // 2. Rechazar notificaciones sin firma válida.
        if (!VerificarFirma(
                cuerpo,
                mensajeId,
                timestamp,
                firma,
                webhookSecret))
        {
            _logger.LogWarning(
                "Webhook de Recurrente rechazado por firma inválida.");

            return Unauthorized(new
            {
                mensaje = "Firma de webhook inválida."
            });
        }

        // 3. Interpretar el evento firmado.
        JsonDocument documento;

        try
        {
            documento = JsonDocument.Parse(cuerpo);
        }
        catch (JsonException)
        {
            return BadRequest(new
            {
                mensaje = "JSON inválido."
            });
        }

        using (documento)
        {
            var evento = documento.RootElement;

            if (!evento.TryGetProperty(
                    "event_type",
                    out var tipoEventoJson))
            {
                return BadRequest();
            }

            string? tipoEvento =
                tipoEventoJson.GetString();

            // Por ahora solo procesamos cobros exitosos.
            if (tipoEvento != "intent.succeeded")
            {
                return Ok(new
                {
                    mensaje = "Evento recibido sin cambios."
                });
            }

            // DeliveryLocal utiliza Recurrente para tarjetas.
            if (!evento.TryGetProperty(
                    "type",
                    out var tipoPagoJson) ||
                tipoPagoJson.GetString() != "payment")
            {
                return Ok(new
                {
                    mensaje = "Método de pago no aplicable."
                });
            }

            // 4. Extraer los datos del pago.
            if (!evento.TryGetProperty(
                    "checkout",
                    out var checkoutJson) ||
                checkoutJson.ValueKind != JsonValueKind.Object ||
                !checkoutJson.TryGetProperty(
                    "id",
                    out var checkoutIdJson) ||
                !evento.TryGetProperty(
                    "amount_in_cents",
                    out var montoJson) ||
                !evento.TryGetProperty(
                    "currency",
                    out var monedaJson) ||
                !evento.TryGetProperty(
                    "status",
                    out var estadoJson))
            {
                return BadRequest(new
                {
                    mensaje = "Evento incompleto."
                });
            }

            string? checkoutId =
                checkoutIdJson.GetString();

            string? moneda =
                monedaJson.GetString();

            string? estado =
                estadoJson.GetString();

            if (string.IsNullOrWhiteSpace(checkoutId) ||
                !montoJson.TryGetInt64(out long montoCentavos) ||
                montoCentavos <= 0 ||
                moneda != "GTQ" ||
                estado != "succeeded")
            {
                return BadRequest(new
                {
                    mensaje = "Datos del pago inválidos."
                });
            }

            // 5. Usar una transacción de SQL Server.
            // Protege contra confirmaciones simultáneas.
            await using var dbTransaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            var transaccion = await _context
                .Set<TransaccionPago>()
                .Include(t => t.Pedido)
                .FirstOrDefaultAsync(t =>
                    t.Proveedor == "Recurrente" &&
                    t.ReferenciaExterna == checkoutId);

            if (transaccion == null ||
                transaccion.Pedido == null)
            {
                _logger.LogWarning(
                    "Webhook recibido para checkout no registrado: {CheckoutId}",
                    checkoutId);

                // Pedimos un reintento por si el checkout
                // aún está terminando de registrarse.
                return StatusCode(503, new
                {
                    mensaje = "Checkout todavía no registrado."
                });
            }

            var pedido = transaccion.Pedido;

            // 6. Comprobar que corresponde a este pedido.
            if (pedido.MetodoPago != "Tarjeta" ||
                pedido.ReferenciaPagoExterno != checkoutId ||
                transaccion.Moneda != "GTQ")
            {
                _logger.LogError(
                    "Datos inconsistentes en pago del pedido #{PedidoId}.",
                    pedido.Id);

                return Conflict(new
                {
                    mensaje = "El checkout no corresponde al pedido."
                });
            }

            // Comprobar importe exacto en centavos.
            long montoEsperado = decimal.ToInt64(
                pedido.Total * 100m);

            long montoTransaccion = decimal.ToInt64(
                transaccion.Monto * 100m);

            if (montoCentavos != montoEsperado ||
                montoCentavos != montoTransaccion)
            {
                _logger.LogError(
                    "Importe incorrecto en pago del pedido #{PedidoId}.",
                    pedido.Id);

                return Conflict(new
                {
                    mensaje = "El importe no coincide."
                });
            }

            // 7. Idempotencia:
            // no volver a confirmar un pago ya procesado.
            if (pedido.EstadoPago == "Verificado" &&
                transaccion.Estado == "Aprobado")
            {
                await dbTransaction.CommitAsync();

                return Ok(new
                {
                    mensaje = "Pago confirmado anteriormente."
                });
            }

            // Si el pedido fue cancelado, NO reactivarlo.
            // Debe revisarse el pago y su posible reembolso.
            if (pedido.Estado != "Pendiente")
            {
                transaccion.Estado = "Revision";
                transaccion.Observacion =
                    "Pago recibido cuando el pedido ya no estaba pendiente. Revisar conciliación y posible reembolso.";

                await _context.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                _logger.LogWarning(
                    "Pago del pedido #{PedidoId} requiere revisión.",
                    pedido.Id);

                return Ok(new
                {
                    mensaje = "Pago registrado para revisión."
                });
            }

            if (pedido.EstadoPago != "Pendiente")
            {
                return Conflict(new
                {
                    mensaje = "El pedido tiene un estado de pago incompatible."
                });
            }

            // 8. Confirmar el pago.
            DateTime fechaConfirmacion = DateTime.UtcNow;

            pedido.EstadoPago = "Verificado";
            pedido.FechaVerificacionPago = fechaConfirmacion;
            pedido.ProveedorPago = "Recurrente";
            pedido.ReferenciaPagoExterno = checkoutId;

            transaccion.Estado = "Aprobado";
            transaccion.FechaConfirmacion =
                fechaConfirmacion;

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation(
                "Pago Recurrente confirmado para pedido #{PedidoId}.",
                pedido.Id);

            return Ok(new
            {
                mensaje = "Pago confirmado correctamente.",
                pedidoId = pedido.Id,
                estadoPago = pedido.EstadoPago
            });
        }
    }

    private static bool VerificarFirma(
        string cuerpo,
        string mensajeId,
        string timestamp,
        string firma,
        string secreto)
    {
        if (string.IsNullOrWhiteSpace(mensajeId) ||
            string.IsNullOrWhiteSpace(timestamp) ||
            string.IsNullOrWhiteSpace(firma) ||
            !secreto.StartsWith("whsec_"))
        {
            return false;
        }

        if (!long.TryParse(timestamp, out long segundos))
        {
            return false;
        }

        // Rechazar mensajes con más de cinco minutos
        // de diferencia respecto al reloj del servidor.
        long ahora =
            DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        if (segundos < ahora - 300 ||
            segundos > ahora + 300)
        {
            return false;
        }

        try
        {
            byte[] llave = Convert.FromBase64String(
                secreto.Substring("whsec_".Length));

            string contenidoFirmado =
                $"{mensajeId}.{timestamp}.{cuerpo}";

            byte[] firmaCalculada =
                HMACSHA256.HashData(
                    llave,
                    Encoding.UTF8.GetBytes(contenidoFirmado));

            // Svix puede enviar más de una firma.
            string[] firmas = firma.Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries);

            foreach (string firmaIndividual in firmas)
            {
                if (!firmaIndividual.StartsWith("v1,"))
                {
                    continue;
                }

                byte[] firmaRecibida;

                try
                {
                    firmaRecibida = Convert.FromBase64String(
                        firmaIndividual.Substring(3));
                }
                catch (FormatException)
                {
                    continue;
                }

                if (firmaRecibida.Length ==
                        firmaCalculada.Length &&
                    CryptographicOperations.FixedTimeEquals(
                        firmaRecibida,
                        firmaCalculada))
                {
                    return true;
                }
            }
        }
        catch (FormatException)
        {
            return false;
        }

        return false;
    }
}
