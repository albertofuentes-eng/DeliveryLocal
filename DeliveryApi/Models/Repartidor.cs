namespace DeliveryApi.Models;

public class Repartidor
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public string TipoVehiculo { get; set; } = string.Empty;

    public string? Placa { get; set; }

    public bool Disponible { get; set; } = false;

    public decimal? LatitudActual { get; set; }

    public decimal? LongitudActual { get; set; }

    public DateTime? UltimaActualizacionUbicacion { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Pedido> Pedidos { get; set; }
        = new List<Pedido>();
}