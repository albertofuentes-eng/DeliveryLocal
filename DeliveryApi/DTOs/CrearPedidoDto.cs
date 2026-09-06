namespace DeliveryApi.DTOs;

public class CrearPedidoDto
{
    public int ComercioId { get; set; }

    public string TipoEntrega { get; set; } = "Domicilio";

    public string? DireccionEntrega { get; set; }

    public decimal? LatitudEntrega { get; set; }

    public decimal? LongitudEntrega { get; set; }

    public string? TelefonoEntrega { get; set; }

    public string? ReferenciaEntrega { get; set; }

    public string? IndicacionesEntrega { get; set; }

    public string TipoTiempo { get; set; } = "Ahora";

    public DateTime? FechaProgramada { get; set; }

    public List<CrearDetallePedidoDto> Productos { get; set; }
        = new();
}