
using DeliveryApi.Data;
using Microsoft.EntityFrameworkCore;
using DeliveryApi.Models;

namespace DeliveryApi.Services;

public class PedidosTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PedidosTimeoutService> _logger;

    public PedidosTimeoutService(
        IServiceProvider serviceProvider,
        ILogger<PedidosTimeoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Servicio de Temporizadores de Pedidos iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Procesar pagos verificados:
                // Transferencia y Tarjeta.
                await ProcesarPagosVerificadosAsync();

                // Procesar cancelaciones y liberaciones.
                await ProcesarTimeoutsPedidosAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al procesar temporizadores de pedidos.");
            }

            // Ejecutar la revisión cada 30 segundos.
            await Task.Delay(
                TimeSpan.FromSeconds(30),
                stoppingToken);
        }
    }

    // ==========================================
    // REGLAS GENERALES DE TEMPORIZADORES
    // ==========================================

    private async Task ProcesarTimeoutsPedidosAsync()
    {
        using var scope = _serviceProvider.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<DeliveryDbContext>();

        var expoPushService = scope.ServiceProvider
            .GetRequiredService<ExpoPushService>();

        var ahoraUtc = DateTime.UtcNow;

        // ==========================================
        // REGLA 1: TIEMPOS SEGÚN MÉTODO DE PAGO
        // ==========================================

        var limiteCincoMinutos =
            ahoraUtc.AddMinutes(-5);

        var limiteQuinceMinutos =
            ahoraUtc.AddMinutes(-15);

        var pedidosExpiradosComercio = await context.Pedidos
            .Where(p =>
                p.Estado == "Pendiente" &&
                (
                    // EFECTIVO:
                    // Mantiene los cinco minutos originales.
                    // Transferencia y Tarjeta no entran
                    // en esta condición.
                    (
                        p.MetodoPago != "Transferencia" &&
                        p.MetodoPago != "Tarjeta" &&
                        p.Fecha <= limiteCincoMinutos
                    )

                    ||

                    // TRANSFERENCIA:
                    // El cliente dispone de 15 minutos
                    // para subir el comprobante.
                    (
                        p.MetodoPago == "Transferencia" &&
                        p.EstadoPago == "Pendiente" &&
                        p.ComprobantePagoUrl == null &&
                        p.Fecha <= limiteQuinceMinutos
                    )
                )
            )
            .ToListAsync();

        foreach (var pedido in pedidosExpiradosComercio)
        {
            bool esTransferencia =
                pedido.MetodoPago == "Transferencia";

            string motivo = esTransferencia
                ? "No se recibió el comprobante en 15 minutos."
                : "El restaurante no confirmó el pedido en 5 minutos.";

            pedido.Estado = "Cancelado";

            string observacion =
                $"[Sistema] Cancelado automáticamente: {motivo}";

            pedido.IndicacionesEntrega =
                string.IsNullOrEmpty(pedido.IndicacionesEntrega)
                    ? observacion
                    : pedido.IndicacionesEntrega + " | " + observacion;

            _logger.LogInformation(
                "Pedido #{PedidoId} cancelado automáticamente. Motivo: {Motivo}",
                pedido.Id,
                motivo
            );
        }

        // ==========================================
        // REGLA 2: REPARTIDOR - 10 MINUTOS
        // ==========================================

        // Si el repartidor tomó el pedido pero
        // no lo recogió en diez minutos,
        // se libera para otro repartidor.

        var limiteDiezMinutos =
            ahoraUtc.AddMinutes(-10);

        var pedidosExpiradosRepartidor = await context.Pedidos
            .Where(p =>
                p.Estado == "Asignado a repartidor" &&
                p.RepartidorId != null &&
                p.FechaAsignacionRepartidor != null &&
                p.FechaAsignacionRepartidor <= limiteDiezMinutos)
            .ToListAsync();

        foreach (var pedido in pedidosExpiradosRepartidor)
        {
            if (pedido.RepartidorId is not int repartidorIdAnterior)
            {
                continue;
            }

            // Buscar al repartidor anterior.
            var repartidor = await context.Repartidores
                .FirstOrDefaultAsync(
                    r => r.Id == repartidorIdAnterior);

            // Liberar el pedido.
            pedido.RepartidorId = null;
            pedido.FechaAsignacionRepartidor = null;
            pedido.Estado = "Listo para recoger";

            // Devolver la disponibilidad.
            if (repartidor != null)
            {
                repartidor.Disponible = true;
            }

            _logger.LogInformation(
                "Pedido #{PedidoId} preparado para liberación del repartidor #{RepartidorId}.",
                pedido.Id,
                repartidorIdAnterior
            );
        }

        // ==========================================
        // GUARDAR CAMBIOS EN SQL SERVER
        // ==========================================

        if (pedidosExpiradosComercio.Any() ||
            pedidosExpiradosRepartidor.Any())
        {
            await context.SaveChangesAsync();

            _logger.LogInformation(
                "Cambios de temporizadores guardados correctamente en SQL Server."
            );

            // ==========================================
            // NOTIFICACIONES AL CLIENTE
            // ==========================================

            foreach (var pedido in pedidosExpiradosComercio)
            {
                try
                {
                    var tokensCliente = await context.DispositivosPush
                        .Where(d =>
                            d.UsuarioId == pedido.UsuarioId &&
                            d.Aplicacion == "Cliente" &&
                            d.Activo)
                        .Select(d => d.ExpoPushToken)
                        .ToListAsync();

                    string mensaje =
                        pedido.MetodoPago == "Transferencia"
                            ? $"Tu pedido #{pedido.Id} fue cancelado porque no se recibió el comprobante de pago dentro de 15 minutos."
                            : $"Tu pedido #{pedido.Id} fue cancelado porque el restaurante no lo aceptó dentro de 5 minutos.";

                    foreach (var tokenPush in tokensCliente)
                    {
                        try
                        {
                            await expoPushService.EnviarNotificacionAsync(
                                tokenPush,
                                "Pedido cancelado",
                                mensaje,
                                new
                                {
                                    tipo = "Pedido",
                                    pedidoId = pedido.Id,
                                    estado = pedido.Estado
                                }
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(
                                ex,
                                "No se pudo enviar la notificación del pedido #{PedidoId}.",
                                pedido.Id
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "No se pudieron consultar los dispositivos del cliente del pedido #{PedidoId}.",
                        pedido.Id
                    );
                }
            }
        }
    }

    // ==========================================
    // PAGOS VERIFICADOS: TRANSFERENCIA Y TARJETA
    // 5 MINUTOS PARA ACEPTAR EL PEDIDO
    // ==========================================

    private async Task ProcesarPagosVerificadosAsync()
    {
        using var scope = _serviceProvider.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<DeliveryDbContext>();

        var expoPushService = scope.ServiceProvider
            .GetRequiredService<ExpoPushService>();

        var limite = DateTime.UtcNow.AddMinutes(-5);

        const string motivo =
            "El restaurante no confirmó el pedido dentro de los 5 minutos posteriores a la verificación del pago.";

        const string observacion =
            "[Sistema] Cancelado automáticamente: el restaurante no confirmó en 5 minutos. Reembolso pendiente de revisión.";

        // ==========================================
        // CONSULTA 1: BUSCAR PEDIDOS VENCIDOS
        // ==========================================

        var pedidosVencidos = await context.Pedidos
            .AsNoTracking()
            .Where(p =>
                p.Estado == "Pendiente" &&

                // Transferencia O Tarjeta.
                (
                    p.MetodoPago == "Transferencia" ||
                    p.MetodoPago == "Tarjeta"
                ) &&

                // El pago debe estar verificado.
                p.EstadoPago == "Verificado" &&

                // Cinco minutos desde la verificación.
                p.FechaVerificacionPago != null &&
                p.FechaVerificacionPago <= limite)
            .Select(p => new
            {
                p.Id,
                p.UsuarioId,
                p.Total
            })
            .ToListAsync();

        foreach (var pedido in pedidosVencidos)
        {
            bool cancelado = false;

            try
            {
                // ==========================================
                // TRANSACCIÓN SEGURA EN SQL SERVER
                // ==========================================

                // La cancelación y la solicitud de
                // reembolso deben guardarse juntas.

                await using (var transaccion =
                    await context.Database.BeginTransactionAsync())
                {
                    // ==========================================
                    // CONSULTA 2: CONFIRMAR QUE SIGUE PENDIENTE
                    // ==========================================

                    // Evita cancelar un pedido que
                    // el restaurante acaba de confirmar.

                    var filas = await context.Pedidos
                        .Where(p =>
                            p.Id == pedido.Id &&
                            p.Estado == "Pendiente" &&

                            // Transferencia O Tarjeta.
                            (
                                p.MetodoPago == "Transferencia" ||
                                p.MetodoPago == "Tarjeta"
                            ) &&

                            p.EstadoPago == "Verificado" &&
                            p.FechaVerificacionPago != null &&
                            p.FechaVerificacionPago <= limite)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(
                                p => p.Estado,
                                "Cancelado")
                            .SetProperty(
                                p => p.IndicacionesEntrega,
                                p => p.IndicacionesEntrega == null
                                    ? observacion
                                    : (p.IndicacionesEntrega + " | " +
                                       observacion).Substring(0, 500)));

                    if (filas == 0)
                    {
                        await transaccion.RollbackAsync();
                        continue;
                    }

                    // ==========================================
                    // REGISTRAR SOLICITUD DE REEMBOLSO
                    // ==========================================

                    context.SolicitudesReembolso.Add(
                        new SolicitudReembolso
                        {
                            PedidoId = pedido.Id,
                            Monto = pedido.Total,
                            Moneda = "GTQ",
                            Estado = "Pendiente",
                            Motivo = motivo,
                            FechaCreacion = DateTime.UtcNow
                        });

                    await context.SaveChangesAsync();

                    await transaccion.CommitAsync();

                    cancelado = true;
                }

                _logger.LogInformation(
                    "Pedido #{PedidoId} cancelado. Reembolso pendiente registrado.",
                    pedido.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al cancelar el pedido con pago verificado #{PedidoId}.",
                    pedido.Id);

                // Evitar conservar entidades pendientes
                // después de un error de base de datos.
                context.ChangeTracker.Clear();
            }

            if (!cancelado)
            {
                continue;
            }

            // ==========================================
            // NOTIFICAR DESPUÉS DE GUARDAR
            // ==========================================

            try
            {
                var tokens = await context.DispositivosPush
                    .AsNoTracking()
                    .Where(d =>
                        d.UsuarioId == pedido.UsuarioId &&
                        d.Aplicacion == "Cliente" &&
                        d.Activo)
                    .Select(d => d.ExpoPushToken)
                    .ToListAsync();

                foreach (var token in tokens)
                {
                    try
                    {
                        await expoPushService.EnviarNotificacionAsync(
                            token,
                            "Pedido cancelado",
                            $"Tu pedido #{pedido.Id} fue cancelado. " +
                            "El reembolso está pendiente de revisión administrativa.",
                            new
                            {
                                tipo = "Pedido",
                                pedidoId = pedido.Id,
                                estado = "Cancelado"
                            });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(
                            ex,
                            "Error enviando notificación del pedido #{PedidoId}.",
                            pedido.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Error consultando dispositivos del pedido #{PedidoId}.",
                    pedido.Id);
            }
        }
    }
}
