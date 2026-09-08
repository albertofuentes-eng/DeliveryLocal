using System.ComponentModel.DataAnnotations;

namespace DeliveryApi.Models;

public class Comercio
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required]
    [MaxLength(250)]
    public string Direccion { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }

    // Ubicación física del comercio
    public decimal? Latitud { get; set; }

    public decimal? Longitud { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Usuario> Usuarios { get; set; }
        = new List<Usuario>();
}