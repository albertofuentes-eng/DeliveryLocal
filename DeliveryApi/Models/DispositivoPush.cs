namespace DeliveryApi.Models;

public class DispositivoPush
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string ExpoPushToken { get; set; }
        = string.Empty;

    public string Aplicacion { get; set; }
        = string.Empty;

    public string Plataforma { get; set; }
        = "Android";

    public bool Activo { get; set; }
        = true;

    public DateTime FechaRegistro { get; set; }
        = DateTime.UtcNow;

    public DateTime FechaActualizacion { get; set; }
        = DateTime.UtcNow;

    public Usuario Usuario { get; set; }
        = null!;
}