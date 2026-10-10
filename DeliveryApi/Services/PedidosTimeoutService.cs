using DeliveryApi.Data;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Services;

public class PedidosTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PedidosTimeoutService> _logger;

    public PedidosTimeoutService(IServiceProvider serviceProvider, ILogger<PedidosTimeoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio de Temporizadores de Pedidos iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try {
                await ProcesarTimeoutsPedidosAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar temporizadores de pedidos.");
            }

            // Ejecutar la revisión cada 30 segundos
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task ProcesarTimeoutsPedidosAsync()
    {
        using var scope = _serviceProvider.CreateScope();

        // AQUÍ ESTÁ EL CAMBIO: Usamos DeliveryDbContext
        var context = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();

        var ahoraUtc = DateTime.UtcNow;

        // 1. REGLA 5 MINUTOS: Restaurante no aceptó el pedido
        var limiteCincoMinutos = ahoraUtc.AddMinutes(-5);
        var pedidosExpiradosComercio = await context.Pedidos
            .Where(p => p.Estado == "Pendiente" && p.Fecha <= limiteCincoMinutos)
            .ToListAsync();

        foreach (var pedido in pedidosExpiradosComercio)
        {
            pedido.Estado = "Cancelado";
            pedido.IndicacionesEntrega = string.IsNullOrEmpty(pedido.IndicacionesEntrega)
                ? "[Sistema] Cancelado automáticamente: El restaurante no confirmó el pedido en 5 minutos."
                : pedido.IndicacionesEntrega + " | [Sistema] Cancelado automáticamente por timeout del comercio.";

            _logger.LogInformation($"Pedido #{pedido.Id} cancelado automáticamente por timeout de 5 min del comercio.");
        }

        // 2. REGLA 10 MINUTOS:
        // Si el repartidor tomó el pedido pero no lo recogió
        // dentro de 10 minutos, se libera para otro repartidor.
        var limiteDiezMinutos = ahoraUtc.AddMinutes(-10);

        var pedidosExpiradosRepartidor = await context.Pedidos
            .Where(p =>
                p.Estado == "Asignado a repartidor" &&
                p.RepartidorId != null &&
                p.FechaAsignacionRepartidor != null &&
                p.FechaAsignacionRepartidor <= limiteDiezMinutos)
            .ToListAsync();

        foreach (var pedido in pedidosExpiradosRepartidor)
        {
            _logger.LogInformation(
                "Pedido #{PedidoId} liberado del repartidor #{RepartidorId} por timeout de 10 minutos.",
                pedido.Id,
                pedido.RepartidorId
            );

            pedido.RepartidorId = null;
            pedido.FechaAsignacionRepartidor = null;
            pedido.Estado = "Listo para recoger";
        }

        if (pedidosExpiradosComercio.Any() || pedidosExpiradosRepartidor.Any())
        {
            await context.SaveChangesAsync();
        }
    }
}