using System.ComponentModel.DataAnnotations;

namespace DeliveryApi.Models;

public class Categoria
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public int ComercioId { get; set; }

    public Comercio Comercio { get; set; } = null!;

    public bool Activo { get; set; } = true;
}