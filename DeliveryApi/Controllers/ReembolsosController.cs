
using DeliveryApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class ReembolsosController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly DeliveryApi.Services.RecurrenteService _recurrente;

    public ReembolsosController(DeliveryDbContext context, DeliveryApi.Services.RecurrenteService recurrente)
    {
        _context = context;
        _recurrente = recurrente;
    }

    // ==========================================
    // 1. REEMBOLSOS PENDIENTES
    // GET: api/Reembolsos/pendientes
    // ==========================================

    [HttpGet("pendientes")]
    public async Task<IActionResult> ObtenerPendientes()
    {
        var reembolsos = await _context.SolicitudesReembolso
            .AsNoTracking()
            .Where(r => r.Estado == "Pendiente")
            .OrderByDescending(r => r.FechaCreacion)
            .Select(r => new
            {
                r.Id,
                r.PedidoId,
                r.Monto,
                r.Moneda,
                r.Estado,
                r.Motivo,
                r.FechaCreacion,
                r.ReferenciaDevolucion,
                r.ObservacionAdmin,

                EstadoPedido = r.Pedido.Estado,
                EstadoPago = r.Pedido.EstadoPago,
                MetodoPago = r.Pedido.MetodoPago
            })
            .ToListAsync();

        return Ok(new
        {
            total = reembolsos.Count,
            reembolsos
        });
    }

    // ==========================================
    // 2. GUARDAR OBSERVACIÓN
    // PUT: api/Reembolsos/{id}/observacion
    // ==========================================

    [HttpPut("{id:int}/observacion")]
    public async Task<IActionResult> RegistrarObservacion(
        int id,
        [FromBody] ObservacionReembolsoDto dto)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El ID del reembolso no es válido."
            });
        }

        if (dto == null ||
            string.IsNullOrWhiteSpace(dto.Observacion))
        {
            return BadRequest(new
            {
                mensaje = "Debes escribir una observación."
            });
        }

        string observacion = dto.Observacion.Trim();

        if (observacion.Length > 1000)
        {
            return BadRequest(new
            {
                mensaje = "La observación no puede superar 1000 caracteres."
            });
        }

        var filasActualizadas = await _context.SolicitudesReembolso
            .Where(r =>
                r.Id == id &&
                r.Estado == "Pendiente")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    r => r.ObservacionAdmin,
                    observacion));

        if (filasActualizadas != 1)
        {
            return Conflict(new
            {
                mensaje =
                    "No existe un reembolso pendiente con ese ID."
            });
        }

        return Ok(new
        {
            reembolsoId = id,
            observacionAdmin = observacion,
            mensaje = "Observación guardada correctamente."
        });
    }

    // ==========================================
    // 3. CERRAR REEMBOLSO QUE NO PROCEDE
    // PUT: api/Reembolsos/{id}/no-procede
    // ==========================================

    [HttpPut("{id:int}/no-procede")]
    public async Task<IActionResult> MarcarNoProcede(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El ID del reembolso no es válido."
            });
        }

        var ahora = DateTime.UtcNow;

        var filasActualizadas = await _context.SolicitudesReembolso
            .Where(r =>
                r.Id == id &&
                r.Estado == "Pendiente" &&
                r.ObservacionAdmin != null &&
                r.ObservacionAdmin != "")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    r => r.Estado,
                    "No procede")
                .SetProperty(
                    r => r.FechaResolucion,
                    (DateTime?)ahora));

        if (filasActualizadas != 1)
        {
            return Conflict(new
            {
                mensaje =
                    "No se pudo cerrar la solicitud. " +
                    "Verifica que siga pendiente y tenga una observación."
            });
        }

        return Ok(new
        {
            reembolsoId = id,
            estado = "No procede",
            fechaResolucion = ahora,
            mensaje =
                "Solicitud cerrada correctamente. " +
                "No se realizó ninguna devolución bancaria."
        });
    }

    // ==========================================
    // 4. HISTORIAL DE REEMBOLSOS
    // GET: api/Reembolsos/historial
    // ==========================================

    [HttpGet("historial")]
    public async Task<IActionResult> ObtenerHistorialReembolsos()
    {
        var historial = await _context.SolicitudesReembolso
            .AsNoTracking()
            .Where(r => r.Estado != "Pendiente")
            .OrderByDescending(r => r.FechaResolucion)
            .ThenByDescending(r => r.Id)
            .Select(r => new
            {
                id = r.Id,
                pedidoId = r.PedidoId,
                monto = r.Monto,
                moneda = r.Moneda,
                estado = r.Estado,
                motivo = r.Motivo,
                fechaCreacion = r.FechaCreacion,
                fechaResolucion = r.FechaResolucion,
                observacionAdmin = r.ObservacionAdmin,
                referenciaDevolucion = r.ReferenciaDevolucion
            })
            .ToListAsync();

        return Ok(historial);
    }

    // ==========================================
    // 5. REGISTRAR DEVOLUCIÓN BANCARIA REAL
    // PUT: api/Reembolsos/{id}/confirmar-devolucion
    // ==========================================

    [HttpPut("{id:int}/confirmar-devolucion")]
    public async Task<IActionResult> ConfirmarDevolucion(
        int id,
        [FromBody] ConfirmarDevolucionDto dto)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "El ID del reembolso no es válido."
            });
        }

        if (dto == null)
        {
            return BadRequest(new
            {
                mensaje = "Debes proporcionar los datos de la devolución."
            });
        }

        if (!dto.ConfirmoDevolucionReal)
        {
            return BadRequest(new
            {
                mensaje =
                    "Debes confirmar que el dinero ya fue " +
                    "devuelto realmente al cliente."
            });
        }

        if (string.IsNullOrWhiteSpace(dto.ReferenciaDevolucion))
        {
            return BadRequest(new
            {
                mensaje =
                    "La referencia bancaria de devolución es obligatoria."
            });
        }

        var referencia = dto.ReferenciaDevolucion.Trim();

        if (referencia.Length < 5 || referencia.Length > 80)
        {
            return BadRequest(new
            {
                mensaje =
                    "La referencia debe contener entre " +
                    "5 y 80 caracteres."
            });
        }

        // Verificar que no exista ya esa referencia
        // en otro reembolso registrado.
        var referenciaExistente =
            await _context.SolicitudesReembolso
                .AsNoTracking()
                .AnyAsync(r =>
                    r.ReferenciaDevolucion == referencia &&
                    r.Id != id);

        if (referenciaExistente)
        {
            return Conflict(new
            {
                mensaje =
                    "Esta referencia ya está registrada " +
                    "en otro reembolso."
            });
        }

        var ahora = DateTime.UtcNow;

        // Actualización condicional en SQL Server.
        // Impide completar dos veces el mismo reembolso.
        // También comprueba nuevamente el estado del pedido.
        var filasActualizadas =
            await _context.SolicitudesReembolso
                .Where(r =>
                    r.Id == id &&
                    r.Estado == "Pendiente" &&
                    r.Monto > 0 &&
                    r.ReferenciaDevolucion == null &&
                    r.ObservacionAdmin != null &&
                    r.ObservacionAdmin != "" &&
                    r.Pedido.Estado == "Cancelado" &&
                    r.Pedido.MetodoPago == "Transferencia" &&
                    r.Pedido.EstadoPago == "Verificado")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(
                        r => r.Estado,
                        "Reembolsado")
                    .SetProperty(
                        r => r.ReferenciaDevolucion,
                        referencia)
                    .SetProperty(
                        r => r.FechaResolucion,
                        (DateTime?)ahora));

        if (filasActualizadas != 1)
        {
            return Conflict(new
            {
                mensaje =
                    "No se puede registrar esta devolución. " +
                    "Verifica que la solicitud esté pendiente, " +
                    "tenga observación y corresponda a una " +
                    "transferencia verificada de un pedido cancelado."
            });
        }

        return Ok(new
        {
            reembolsoId = id,
            estado = "Reembolsado",
            referenciaDevolucion = referencia,
            fechaResolucion = ahora,
            mensaje =
                "La devolución bancaria realizada " +
                "fue registrada correctamente. " +
                "DeliveryLocal no ejecutó una transferencia."
        });
    }

    // ==========================================
    // DEVOLUCION DE TARJETA - SOLO RECURRENTE SANDBOX
    [HttpPost("{id:int}/solicitar-tarjeta")]
    public async Task<IActionResult> SolicitarReembolsoTarjeta(
        int id,
        [FromBody] ConfirmacionTarjetaDto confirmacion,
        CancellationToken cancellationToken)
    {
        if (confirmacion?.Confirmacion != "CONFIRMAR_REEMBOLSO_SANDBOX")
        {
            return BadRequest(new
            {
                mensaje = "Se requiere confirmación explícita de reembolso Sandbox."
            });
        }
        var solicitud = await _context.SolicitudesReembolso
            .AsNoTracking()
            .Include(r => r.Pedido)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (solicitud == null)
            return NotFound(new { mensaje = "Solicitud no encontrada." });

        var pedido = solicitud.Pedido;

        if (solicitud.Estado != "Pendiente" ||
            solicitud.ReferenciaDevolucion != null ||
            solicitud.Monto <= 0 ||
            solicitud.Monto != pedido.Total ||
            solicitud.Moneda != "GTQ" ||
            pedido.Estado != "Cancelado" ||
            pedido.EstadoPago != "Verificado" ||
            pedido.MetodoPago != "Tarjeta" ||
            pedido.ProveedorPago != "Recurrente")
        {
            return Conflict(new
            {
                mensaje = "El reembolso no cumple las condiciones."
            });
        }

        var transaccion = await _context
            .Set<DeliveryApi.Models.TransaccionPago>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.PedidoId == pedido.Id &&
                t.Estado == "Aprobado" &&
                t.Proveedor == "Recurrente" &&
                t.ReferenciaExterna == pedido.ReferenciaPagoExterno &&
                t.Monto == solicitud.Monto &&
                t.Moneda == "GTQ",
                cancellationToken);

        if (transaccion == null ||
            string.IsNullOrWhiteSpace(transaccion.ReferenciaExterna))
        {
            return Conflict(new
            {
                mensaje = "No se encontro una transaccion aprobada."
            });
        }

        string intentId;

        try
        {
            intentId = await _recurrente.ObtenerIntentCheckoutAsync(
                transaccion.ReferenciaExterna, cancellationToken);
        }
        catch (Exception)
        {
            return StatusCode(502, new
            {
                mensaje = "No se pudo verificar el pago con Recurrente. No se solicito una devolucion."
            });
        }

        // Bloqueo persistente: solamente una llamada puede reservar
        // la solicitud antes de contactar a Recurrente.
        int reservadas = await _context.SolicitudesReembolso
            .Where(r =>
                r.Id == id &&
                r.Estado == "Pendiente" &&
                r.ReferenciaDevolucion == null &&
                r.Pedido.Estado == "Cancelado" &&
                r.Pedido.EstadoPago == "Verificado" &&
                r.Pedido.MetodoPago == "Tarjeta")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(r => r.Estado, "EnProceso")
                .SetProperty(r => r.ObservacionAdmin,
                    "Reembolso reservado. Pendiente de conciliacion."),
                cancellationToken);

        if (reservadas != 1)
            return Conflict(new
            {
                mensaje = "La solicitud ya fue tomada o resuelta."
            });

        string clave = $"deliverylocal-sandbox-refund-{id}";

        try
        {
            var resultado = await _recurrente.SolicitarReembolsoAsync(
                intentId, clave, cancellationToken);

            bool completado = resultado.Estado == "succeeded";
            DateTime? fecha = completado ? DateTime.UtcNow : null;

            int actualizadas = await _context.SolicitudesReembolso
                .Where(r => r.Id == id && r.Estado == "EnProceso")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(r => r.Estado,
                        completado ? "Reembolsado" : "EnProceso")
                    .SetProperty(r => r.ReferenciaDevolucion, resultado.Id)
                    .SetProperty(r => r.ObservacionAdmin,
                        $"Recurrente: {resultado.Estado}")
                    .SetProperty(r => r.FechaResolucion, fecha),
                    cancellationToken);

            if (actualizadas != 1)
                return StatusCode(500, new
                {
                    mensaje = "Recurrente respondio, pero fallo el registro local. Requiere conciliacion."
                });

            return Ok(new
            {
                solicitudId = id,
                referencia = resultado.Id,
                estadoProveedor = resultado.Estado,
                confirmado = completado,
                mensaje = completado
                    ? "Devolucion confirmada por Recurrente."
                    : "Reembolso pendiente de conciliacion."
            });
        }
        catch (Exception)
        {
            // No regresar a Pendiente:
            // el proveedor pudo recibir la solicitud.
            return StatusCode(502, new
            {
                solicitudId = id,
                estado = "EnProceso",
                mensaje = "Resultado incierto. Revisar Recurrente antes de reintentar."
            });
        }
    }
    public class ConfirmacionTarjetaDto
    {
        public string Confirmacion { get; set; } = string.Empty;
    }
    // DTO: OBSERVACIÓN
    // ==========================================

    public class ObservacionReembolsoDto
    {
        public string Observacion { get; set; } =
            string.Empty;
    }

    // ==========================================
    // DTO: CONFIRMACIÓN DE DEVOLUCIÓN
    // ==========================================

    public class ConfirmarDevolucionDto
    {
        public string ReferenciaDevolucion { get; set; } =
            string.Empty;

        public bool ConfirmoDevolucionReal { get; set; }
    }
}
