using System.ComponentModel.DataAnnotations;

namespace DeliveryApi.DTOs;

public class CrearProductoDto
{
    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public decimal Precio { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }

    public int ComercioId { get; set; }

    public int CategoriaId { get; set; }
}