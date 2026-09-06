namespace DeliveryApi.DTOs;

public class ActualizarProductoDto
{
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public decimal Precio { get; set; }

    public string? ImagenUrl { get; set; }

    public int CategoriaId { get; set; }
}