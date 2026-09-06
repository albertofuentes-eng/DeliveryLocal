using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DeliveryApi.Models;

public class Producto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Precio { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }

    public bool Disponible { get; set; } = true;

    public int ComercioId { get; set; }

    public Comercio Comercio { get; set; } = null!;

    public int CategoriaId { get; set; }

    public Categoria Categoria { get; set; } = null!;
}