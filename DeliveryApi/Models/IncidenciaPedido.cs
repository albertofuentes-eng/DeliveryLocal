
namespace DeliveryApi.Models;

public class IncidenciaPedido
{
    public int Id { get; set; }

    // Pedido relacionado con la incidencia.
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    // Repartidor que reporta el problema.
    public int RepartidorId { get; set; }

    public Repartidor Repartidor { get; set; } = null!;

    // ClienteAusente, DireccionIncorrecta,
    // ClienteRechaza, Accidente u Otro.
    public string Motivo { get; set; } = string.Empty;

    // Explicación del problema.
    public string Descripcion { get; set; } = string.Empty;

    // Ruta o URL de la fotografía de evidencia.
    public string? EvidenciaUrl { get; set; }

    // Pendiente, EnRevision, Resuelta o Rechazada.
    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaReporte { get; set; } = DateTime.UtcNow;

    // Información que registra el administrador.
    public int? AdministradorId { get; set; }

    public string? Resolucion { get; set; }

    public DateTime? FechaResolucion { get; set; }
}
