namespace DeliveryApi.DTOs;

public class RegistrarDispositivoPushDto
{
    public string ExpoPushToken { get; set; }
        = string.Empty;

    public string Aplicacion { get; set; }
        = string.Empty;

    public string Plataforma { get; set; }
        = "Android";
}