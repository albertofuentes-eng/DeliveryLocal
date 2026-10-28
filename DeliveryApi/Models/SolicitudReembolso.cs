namespace DeliveryApi.Models;

public class SolicitudReembolso
{
    public int Id { get; set; }

    // Pedido que requiere una devolución.
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    // Cantidad que debe revisarse para devolver.
    public decimal Monto { get; set; }

    public string Moneda { get; set; } = "GTQ";

    // Pendiente / EnProceso / Completado / Rechazado
    public string Estado { get; set; } = "Pendiente";

    // Razón por la que se solicita el reembolso.
    public string Motivo { get; set; } = string.Empty;

    // Fecha en que se generó la solicitud.
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Fecha en que se resolvió.
    public DateTime? FechaResolucion { get; set; }

    // Referencia bancaria de la devolución realizada.
    public string? ReferenciaDevolucion { get; set; }

    // Observaciones del administrador.
    public string? ObservacionAdmin { get; set; }
}