namespace DeliveryApi.DTOs;

public class ActualizarComercioDto
{
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string Direccion { get; set; } = string.Empty;

    public string? Telefono { get; set; }

    public string? ImagenUrl { get; set; }
}