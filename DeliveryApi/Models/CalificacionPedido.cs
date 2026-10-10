
namespace DeliveryApi.Models;

public class CalificacionPedido
{
    public int Id { get; set; }

    // Pedido al que pertenece la calificación.
    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    // Usuario que realiza la calificación.
    public int EmisorUsuarioId { get; set; }

    public Usuario EmisorUsuario { get; set; } = null!;

    // Usuario que recibe la calificación.
    public int ReceptorUsuarioId { get; set; }

    public Usuario ReceptorUsuario { get; set; } = null!;

    // ClienteARepartidor / RepartidorACliente
    public string Tipo { get; set; } = string.Empty;

    // Valor permitido: 1 a 5.
    public int Puntuacion { get; set; }

    // Comentario opcional, máximo 500 caracteres.
    public string? Comentario { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
