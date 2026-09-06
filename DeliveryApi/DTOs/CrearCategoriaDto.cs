using System.ComponentModel.DataAnnotations;

namespace DeliveryApi.DTOs;

public class CrearCategoriaDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public int ComercioId { get; set; }
}