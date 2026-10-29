using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace DeliveryApi.Services;

public class RecurrenteService
{

    private readonly IConfiguration _configuration;

    public RecurrenteService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    private static readonly HttpClient Http = new()
    {
        BaseAddress = new Uri("https://app.recurrente.com/api/"),
        Timeout = TimeSpan.FromSeconds(30)
    };

    public async Task<RecurrenteEstadoCheckout> ConsultarEstadoCheckoutAsync(
        string checkoutId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(checkoutId) ||
            !checkoutId.StartsWith("ch_", StringComparison.Ordinal) ||
            checkoutId.Length <= 3 ||
            !checkoutId.Substring(3).All(char.IsLetterOrDigit))
        {
            throw new InvalidOperationException(
                "Identificador de checkout inválido.");
        }

        string? secretKey = _configuration["Recurrente:SecretKey"];

        if (string.IsNullOrWhiteSpace(secretKey) ||
            !secretKey.StartsWith("sk_test_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Se requiere una llave TEST de Recurrente.");
        }

        using var solicitud = new HttpRequestMessage(
            HttpMethod.Get,
            $"checkouts/{checkoutId}");

        solicitud.Headers.Add("X-SECRET-KEY", secretKey);

        using var respuesta = await Http.SendAsync(
            solicitud, cancellationToken);

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"No se pudo consultar el checkout. HTTP {(int)respuesta.StatusCode}.");
        }

        string contenido = await respuesta.Content
            .ReadAsStringAsync(cancellationToken);

        using var documento = JsonDocument.Parse(contenido);
        var raiz = documento.RootElement;

        if (!raiz.TryGetProperty("id", out var idJson) ||
            idJson.GetString() != checkoutId ||
            !raiz.TryGetProperty("status", out var estadoJson) ||
            !raiz.TryGetProperty("live_mode", out var modoJson) ||
            modoJson.ValueKind != JsonValueKind.False)
        {
            throw new InvalidOperationException(
                "La respuesta del checkout no es válida para Sandbox.");
        }

        string? estado = estadoJson.GetString();

        if (estado != "unpaid" &&
            estado != "paid" &&
            estado != "payment_in_progress" &&
            estado != "expired")
        {
            throw new InvalidOperationException(
                "Estado de checkout desconocido.");
        }

        return new RecurrenteEstadoCheckout(estado!);
    }
    public async Task<string> ObtenerIntentCheckoutAsync(
        string checkoutId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(checkoutId) ||
            !checkoutId.StartsWith("ch_", StringComparison.Ordinal) ||
            checkoutId.Length <= 3 ||
            !checkoutId.Substring(3).All(char.IsLetterOrDigit))
        {
            throw new InvalidOperationException(
                "Identificador de checkout inválido.");
        }

        string? secretKey = _configuration["Recurrente:SecretKey"];

        if (string.IsNullOrWhiteSpace(secretKey) ||
            !secretKey.StartsWith("sk_test_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Se requiere una llave TEST de Recurrente.");
        }

        using var solicitud = new HttpRequestMessage(
            HttpMethod.Get,
            $"checkouts/{checkoutId}");

        solicitud.Headers.Add("X-SECRET-KEY", secretKey);

        using var respuesta = await Http.SendAsync(
            solicitud, cancellationToken);

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Recurrente respondió HTTP {(int)respuesta.StatusCode}.");
        }

        string contenido = await respuesta.Content
            .ReadAsStringAsync(cancellationToken);

        using var documento = JsonDocument.Parse(contenido);

        var raiz = documento.RootElement;

        if (!raiz.TryGetProperty("id", out var id) ||
            id.GetString() != checkoutId ||
            !raiz.TryGetProperty("live_mode", out var modo) ||
            modo.ValueKind != JsonValueKind.False ||
            !raiz.TryGetProperty("status", out var estado) ||
            estado.GetString() != "paid")
        {
            throw new InvalidOperationException(
                "El checkout no está confirmado como pagado en Sandbox.");
        }

        if (!raiz.TryGetProperty("latest_intent", out var intent) ||
            intent.ValueKind != JsonValueKind.Object ||
            !intent.TryGetProperty("id", out var idIntent))
        {
            throw new InvalidOperationException(
                "No se encontró el intent del pago.");
        }

        string? intentId = idIntent.GetString();

        if (string.IsNullOrWhiteSpace(intentId) ||
            !intentId.StartsWith("in_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "El identificador del pago es inválido.");
        }

        return intentId;
    }
    public async Task<RecurrenteRefundResult> SolicitarReembolsoAsync(
        string intentId,
        string claveIdempotencia,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(intentId) ||
            !intentId.StartsWith("in_", StringComparison.Ordinal) ||
            !intentId.Substring(3).All(char.IsLetterOrDigit))
        {
            throw new ArgumentException("Intent de pago inválido.");
        }

        if (string.IsNullOrWhiteSpace(claveIdempotencia) ||
            claveIdempotencia.Length > 150)
        {
            throw new ArgumentException("Clave de idempotencia inválida.");
        }

        string? secretKey = _configuration["Recurrente:SecretKey"];

        if (string.IsNullOrWhiteSpace(secretKey) ||
            !secretKey.StartsWith("sk_test_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Los reembolsos requieren una llave TEST.");
        }

        using var solicitud = new HttpRequestMessage(
            HttpMethod.Post, "refunds");

        solicitud.Headers.Add("X-SECRET-KEY", secretKey);
        solicitud.Headers.Add("Idempotency-Key", claveIdempotencia);

        solicitud.Content = new StringContent(
            JsonSerializer.Serialize(new { intent_id = intentId }),
            Encoding.UTF8,
            "application/json");

        using var respuesta = await Http.SendAsync(
            solicitud, cancellationToken);

        string contenido = await respuesta.Content
            .ReadAsStringAsync(cancellationToken);

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Recurrente no confirmó el reembolso. HTTP {(int)respuesta.StatusCode}. " +
                "Revisar el estado en el proveedor antes de reintentar.");
        }

        using var documento = JsonDocument.Parse(contenido);
        var raiz = documento.RootElement;

        if (!raiz.TryGetProperty("id", out var idJson) ||
            !raiz.TryGetProperty("status", out var estadoJson))
        {
            throw new InvalidOperationException(
                "Respuesta incompleta. Revisar en Recurrente antes de reintentar.");
        }

        string? refundId = idJson.GetString();
        string? estado = estadoJson.GetString();

        if (string.IsNullOrWhiteSpace(refundId) ||
            (estado != "pending" &&
             estado != "succeeded" &&
             estado != "failed" &&
             estado != "voided"))
        {
            throw new InvalidOperationException(
                "Respuesta desconocida. Revisar antes de reintentar.");
        }

        return new RecurrenteRefundResult(refundId, estado!);
    }
    public async Task<RecurrenteCheckout> CrearCheckoutAsync(
        int pedidoId,
        decimal total,
        CancellationToken cancellationToken = default)
    {
        if (pedidoId <= 0)
        {
            throw new ArgumentException("Pedido inválido.");
        }

        if (total < 5m)
        {
            throw new ArgumentException(
                "El monto mínimo para pagar en GTQ es Q5."
            );
        }

        if (decimal.Round(total, 2) != total)
        {
            throw new ArgumentException(
                "El total debe tener como máximo dos decimales."
            );
        }

        string? secretKey = _configuration["Recurrente:SecretKey"];

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException(
                "No está configurada la llave de Recurrente."
            );
        }

        if (!secretKey.StartsWith(
                "sk_test_",
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Esta integración requiere una llave TEST."
            );
        }

        int montoCentavos = decimal.ToInt32(total * 100m);

        var datos = new
        {
            items = new[]
            {
                new
                {
                    name = $"Pedido DeliveryLocal #{pedidoId}",
                    amount_in_cents = montoCentavos,
                    currency = "GTQ",
                    quantity = 1
                }
            }
        };

        using var solicitud = new HttpRequestMessage(
            HttpMethod.Post,
            "checkouts"
        );

        solicitud.Headers.Add(
            "X-SECRET-KEY",
            secretKey
        );

        solicitud.Content = new StringContent(
            JsonSerializer.Serialize(datos),
            Encoding.UTF8,
            "application/json"
        );

        using var respuesta = await Http.SendAsync(
            solicitud,
            cancellationToken
        );

        if (!respuesta.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Recurrente rechazó la solicitud. " +
                $"Código HTTP: {(int)respuesta.StatusCode}."
            );
        }

        string contenido = await respuesta.Content
            .ReadAsStringAsync(cancellationToken);

        using var documento = JsonDocument.Parse(contenido);

        var raiz = documento.RootElement;

        if (!raiz.TryGetProperty("id", out var idJson) ||
            !raiz.TryGetProperty(
                "checkout_url",
                out var urlJson))
        {
            throw new InvalidOperationException(
                "La respuesta de Recurrente está incompleta."
            );
        }

        string? id = idJson.GetString();
        string? url = urlJson.GetString();

        if (string.IsNullOrWhiteSpace(id) ||
            string.IsNullOrWhiteSpace(url) ||
            !Uri.TryCreate(
                url,
                UriKind.Absolute,
                out var checkoutUri) ||
            checkoutUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new InvalidOperationException(
                "Recurrente devolvió un checkout inválido."
            );
        }

        return new RecurrenteCheckout(
            id,
            checkoutUri.ToString()
        );
    }
}

public record RecurrenteEstadoCheckout(string Estado);

public record RecurrenteCheckout(
    string Id,
    string CheckoutUrl
);




public record RecurrenteRefundResult(string Id, string Estado);
