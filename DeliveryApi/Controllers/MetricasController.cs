using DeliveryApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class MetricasController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public MetricasController(DeliveryDbContext context)
    {
        _context = context;
    }

    // GET: api/Metricas/admin
    // Obtiene las métricas generales para el panel administrativo.
    [HttpGet("admin")]
    public async Task<IActionResult> ObtenerMetricasAdmin()
    {
        // =========================
        // PEDIDOS
        // =========================

        var totalPedidos = await _context.Pedidos
            .AsNoTracking()
            .CountAsync();

        var pedidosPendientes = await _context.Pedidos
            .AsNoTracking()
            .CountAsync(p => p.Estado == "Pendiente");

        var pedidosEntregados = await _context.Pedidos
            .AsNoTracking()
            .CountAsync(p => p.Estado == "Entregado");

        var pedidosRechazados = await _context.Pedidos
            .AsNoTracking()
            .CountAsync(p => p.Estado == "Rechazado");

        var pedidosEnProceso = await _context.Pedidos
            .AsNoTracking()
            .CountAsync(p =>
                p.Estado != "Pendiente" &&
                p.Estado != "Entregado" &&
                p.Estado != "Rechazado"
            );

        // =========================
        // DINERO
        // =========================

        var ventasTotales = await _context.Pedidos
            .AsNoTracking()
            .SumAsync(p => (decimal?)p.Total) ?? 0;

        var subtotalTotal = await _context.Pedidos
            .AsNoTracking()
            .SumAsync(p => (decimal?)p.Subtotal) ?? 0;

        var enviosTotales = await _context.Pedidos
            .AsNoTracking()
            .SumAsync(p => (decimal?)p.Envio) ?? 0;

        // =========================
        // USUARIOS
        // =========================

        var totalClientes = await _context.Usuarios
            .AsNoTracking()
            .CountAsync(u => u.Rol == "Cliente");

        var clientesActivos = await _context.Usuarios
            .AsNoTracking()
            .CountAsync(u =>
                u.Rol == "Cliente" &&
                u.Activo
            );

        // =========================
        // COMERCIOS
        // =========================

        var totalComercios = await _context.Comercios
            .AsNoTracking()
            .CountAsync();

        var comerciosActivos = await _context.Comercios
            .AsNoTracking()
            .CountAsync(c => c.Activo);

        // =========================
        // REPARTIDORES
        // =========================

        var totalRepartidores = await _context.Repartidores
            .AsNoTracking()
            .CountAsync();

        var repartidoresActivos = await _context.Repartidores
            .AsNoTracking()
            .CountAsync(r => r.Activo);

        var repartidoresDisponibles = await _context.Repartidores
            .AsNoTracking()
            .CountAsync(r =>
                r.Activo &&
                r.Disponible
            );

        // =========================
        // PEDIDOS POR ESTADO
        // =========================

        var pedidosPorEstado = await _context.Pedidos
            .AsNoTracking()
            .GroupBy(p => p.Estado)
            .Select(g => new
            {
                estado = g.Key,
                cantidad = g.Count()
            })
            .OrderByDescending(x => x.cantidad)
            .ToListAsync();

        // =========================
        // PEDIDOS POR COMERCIO
        // =========================

        var pedidosPorComercio = await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.Comercio)
            .GroupBy(p => new
            {
                p.ComercioId,
                nombre = p.Comercio.Nombre
            })
            .Select(g => new
            {
                comercioId = g.Key.ComercioId,
                comercio = g.Key.nombre,
                pedidos = g.Count(),
                ventas = g.Sum(p => p.Total)
            })
            .OrderByDescending(x => x.pedidos)
            .ToListAsync();

        // =========================
        // PEDIDOS POR REPARTIDOR
        // =========================

        var pedidosPorRepartidor = await _context.Pedidos
            .AsNoTracking()
            .Where(p => p.RepartidorId != null)
            .Include(p => p.Repartidor!)
                .ThenInclude(r => r.Usuario)
            .GroupBy(p => new
            {
                repartidorId = p.RepartidorId!.Value,
                nombre = p.Repartidor!.Usuario.Nombre
            })
            .Select(g => new
            {
                repartidorId = g.Key.repartidorId,
                repartidor = g.Key.nombre,
                pedidos = g.Count(),
                entregados = g.Count(p => p.Estado == "Entregado")
            })
            .OrderByDescending(x => x.pedidos)
            .ToListAsync();

        // =========================
        // RESPUESTA
        // =========================

        return Ok(new
        {
            resumen = new
            {
                totalPedidos,
                pedidosPendientes,
                pedidosEnProceso,
                pedidosEntregados,
                pedidosRechazados
            },

            ventas = new
            {
                ventasTotales,
                subtotalTotal,
                enviosTotales
            },

            clientes = new
            {
                totalClientes,
                clientesActivos
            },

            comercios = new
            {
                totalComercios,
                comerciosActivos
            },

            repartidores = new
            {
                totalRepartidores,
                repartidoresActivos,
                repartidoresDisponibles
            },

            pedidosPorEstado,

            pedidosPorComercio,

            pedidosPorRepartidor
        });
    }
}