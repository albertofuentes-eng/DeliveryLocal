namespace DeliveryApi.Models;

public class Pedido
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int ComercioId { get; set; }
    public Comercio Comercio { get; set; } = null!;

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public string Estado { get; set; } = "Pendiente";

    // Tipo de entrega:
    // Domicilio / Recoger
    public string TipoEntrega { get; set; } = "Domicilio";

    // Solo aplica cuando es Domicilio
    public string? DireccionEntrega { get; set; }

    public decimal? LatitudEntrega { get; set; }

    public decimal? LongitudEntrega { get; set; }

    public string? TelefonoEntrega { get; set; }

    public string? ReferenciaEntrega { get; set; }

    public string? IndicacionesEntrega { get; set; }

    // Ahora / Despues
    public string TipoTiempo { get; set; } = "Ahora";

    // Solo aplica cuando el cliente programa
    public DateTime? FechaProgramada { get; set; }

    public decimal Subtotal { get; set; }

    public decimal Envio { get; set; }

    public decimal Total { get; set; }

    public ICollection<DetallePedido> Detalles { get; set; }
        = new List<DetallePedido>();
}