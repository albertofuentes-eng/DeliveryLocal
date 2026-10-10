
namespace DeliveryApi.Models;

public class TransaccionPago
{
    public int Id { get; set; }

    // Pedido asociado a la transacción.
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    // Importe que se intenta cobrar.
    public decimal Monto { get; set; }

    // Moneda de la operación.
    public string Moneda { get; set; } = "GTQ";

    // Pendiente / Aprobado / Rechazado / Reembolsado
    public string Estado { get; set; } = "Pendiente";

    // Pasarela que procesa el pago.
    public string? Proveedor { get; set; }

    // Identificador devuelto por la pasarela.
    public string? ReferenciaExterna { get; set; }

    // Identificador único de la solicitud para
    // evitar procesar el mismo intento dos veces.
    public string? ClaveIdempotencia { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaConfirmacion { get; set; }

    // Mensaje técnico o motivo de rechazo.
    public string? Observacion { get; set; }
}
