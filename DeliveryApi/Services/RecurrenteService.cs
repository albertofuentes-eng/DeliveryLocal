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

public record RecurrenteCheckout(
    string Id,
    string CheckoutUrl
);