
namespace DeliveryApi.Models;

public class LiquidacionPago
{
    public int Id { get; set; }

    // Pedido al que pertenece la liquidación
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    // Comercio o DeliveryLocal
    public string Beneficiario { get; set; } = string.Empty;

    // Importe bruto correspondiente al beneficiario
    public decimal MontoBruto { get; set; }

    // Comisión que corresponde descontar
    public decimal Comision { get; set; }

    // Importe final que debe recibir
    public decimal MontoNeto { get; set; }

    // Pendiente / Procesando / Completada / Fallida
    public string Estado { get; set; } = "Pendiente";

    // Pasarela o mecanismo utilizado
    public string? Proveedor { get; set; }

    // Referencia de la transferencia
    public string? ReferenciaExterna { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaLiquidacion { get; set; }

    public string? Observacion { get; set; }
}
