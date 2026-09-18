using System.Net.Http.Json;

namespace DeliveryApi.Services;

public class ExpoPushService
{
    private readonly HttpClient _httpClient;

    public ExpoPushService(
        HttpClient httpClient
    )
    {
        _httpClient = httpClient;
    }

    public async Task EnviarNotificacionAsync(
        string expoPushToken,
        string titulo,
        string mensaje,
        object? datos = null
    )
    {
        var payload = new
        {
            to = expoPushToken,
            sound = "default",
            title = titulo,
            body = mensaje,
            data = datos
        };

        var response =
            await _httpClient.PostAsJsonAsync(
                "https://exp.host/--/api/v2/push/send",
                payload
            );

        response.EnsureSuccessStatusCode();
    }
}