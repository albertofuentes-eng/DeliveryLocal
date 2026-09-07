namespace DeliveryApi.Models;

public class SolicitudRepartidor
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public string TipoVehiculo { get; set; } = string.Empty;

    public string? Placa { get; set; }

    // Pendiente / Aprobada / Rechazada
    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public DateTime? FechaRevision { get; set; }

    // Administrador que revisó la solicitud
    public int? RevisadoPorUsuarioId { get; set; }

    public Usuario? RevisadoPorUsuario { get; set; }

    public string? Observacion { get; set; }
}