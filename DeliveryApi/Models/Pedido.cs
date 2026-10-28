
namespace DeliveryApi.Models;

public class Pedido
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public int ComercioId { get; set; }
    public Comercio Comercio { get; set; } = null!;

    public int? RepartidorId { get; set; }
    public Repartidor? Repartidor { get; set; }

    public DateTime? FechaAsignacionRepartidor { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public DateTime? FechaEntrega { get; set; }

    public string Estado { get; set; } = "Pendiente";

    // Domicilio / Recoger
    public string TipoEntrega { get; set; } = "Domicilio";

    public string? DireccionEntrega { get; set; }

    public decimal? LatitudEntrega { get; set; }

    public decimal? LongitudEntrega { get; set; }

    public string? TelefonoEntrega { get; set; }

    public string? ReferenciaEntrega { get; set; }

    public string? IndicacionesEntrega { get; set; }

    // Ahora / Despues
    public string TipoTiempo { get; set; } = "Ahora";

    public DateTime? FechaProgramada { get; set; }

    // ==========================================
    // IMPORTES DEL PEDIDO
    // ==========================================

    public decimal Subtotal { get; set; }

    public decimal Envio { get; set; }

    public decimal Total { get; set; }

    public ICollection<DetallePedido> Detalles { get; set; }
        = new List<DetallePedido>();

    // ==========================================
    // FASE 3: TOKEN / QR DE ENTREGA
    // ==========================================

    public string? TokenEntrega { get; set; }

    public bool TokenUsado { get; set; } = false;

    public DateTime? FechaConfirmacionEntrega { get; set; }

    // ==========================================
    // FASE 3: MÉTODOS DE PAGO
    // ==========================================

    // Efectivo / Transferencia
    public string MetodoPago { get; set; } = "Efectivo";

    // Pendiente / ComprobanteSubido / Verificado / Rechazado
    public string EstadoPago { get; set; } = "Pendiente";

    public string? ComprobantePagoUrl { get; set; }

    // Fecha UTC en que el administrador verificó el pago.
    // Se utilizará para calcular el tiempo de aceptación del comercio.
    public DateTime? FechaVerificacionPago { get; set; }

    // ==========================================
    // FASE 3: DISTRIBUCIÓN DEL DINERO
    // ==========================================

    // Importe que corresponde al comercio.
    public decimal MontoComercio { get; set; }

    // Ingreso bruto correspondiente al envío.
    public decimal MontoDeliveryLocal { get; set; }

    // Comisión real cobrada por la pasarela.
    // Se conocerá cuando el proveedor la reporte.
    public decimal? ComisionPasarela { get; set; }

    // Identificador de la operación en la pasarela.
    public string? ReferenciaPagoExterno { get; set; }

    // Proveedor utilizado para procesar el pago.
    public string? ProveedorPago { get; set; }

    // Estado de distribución de fondos.
    // Pendiente / Parcial / Liquidado / Fallido
    public string EstadoLiquidacion { get; set; } = "Pendiente";

    // Fecha en que se completó la liquidación.
    public DateTime? FechaLiquidacion { get; set; }
}
