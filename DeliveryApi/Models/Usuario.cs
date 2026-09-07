namespace DeliveryApi.Models;

public class Usuario
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Correo { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? Telefono { get; set; }

    public string Rol { get; set; } = "Cliente";

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Solo aplica a usuarios con Rol = Comercio
    public int? ComercioId { get; set; }

    public Comercio? Comercio { get; set; }

    public Repartidor? Repartidor { get; set; }

    public ICollection<SolicitudRepartidor> SolicitudesRepartidor { get; set; }
        = new List<SolicitudRepartidor>();

    public ICollection<SolicitudRepartidor> SolicitudesRepartidorRevisadas { get; set; }
        = new List<SolicitudRepartidor>();
}