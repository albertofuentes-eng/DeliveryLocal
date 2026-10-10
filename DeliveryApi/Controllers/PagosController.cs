
using DeliveryApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PagosController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public PagosController(DeliveryDbContext context)
    {
        _context = context;
    }

    // ==========================================
    // CONSULTAR PAGOS DE UN PEDIDO
    // GET: api/Pagos/pedido/5
    // ==========================================

    [HttpGet("pedido/{pedidoId:int}")]
    public async Task<IActionResult> ObtenerPagosPedido(
        int pedidoId)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Sesión no válida."
            });
        }

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Where(p =>
                p.Id == pedidoId &&
                p.UsuarioId == usuarioId)
            .Select(p => new
            {
                p.Id,
                p.Total,
                p.MetodoPago,
                p.EstadoPago,
                p.EstadoLiquidacion
            })
            .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        var transacciones = await _context.TransaccionesPago
            .AsNoTracking()
            .Where(t => t.PedidoId == pedidoId)
            .OrderByDescending(t => t.FechaCreacion)
            .Select(t => new
            {
                t.Id,
                t.Monto,
                t.Moneda,
                t.Estado,
                t.Proveedor,
                t.FechaCreacion,
                t.FechaConfirmacion
            })
            .ToListAsync();

        return Ok(new
        {
            pedidoId = pedido.Id,
            total = pedido.Total,
            metodoPago = pedido.MetodoPago,
            estadoPago = pedido.EstadoPago,
            estadoLiquidacion = pedido.EstadoLiquidacion,
            transacciones
        });
    }

        // ==========================================
    // FASE 6: CONSULTAR PAGOS - ADMINISTRADOR
    // GET: api/Pagos/admin
    // ==========================================

    [HttpGet("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerPagosAdmin()
    {
        var pedidos = await _context.Pedidos
            .AsNoTracking()
            .OrderByDescending(p => p.Id)
            .Select(p => new
            {
                pedidoId = p.Id,
                clienteId = p.UsuarioId,
                total = p.Total,
                metodoPago = p.MetodoPago,
                estadoPago = p.EstadoPago,
                estadoLiquidacion = p.EstadoLiquidacion,

                transacciones = _context.TransaccionesPago
                    .Where(t => t.PedidoId == p.Id)
                    .OrderByDescending(t => t.FechaCreacion)
                    .Select(t => new
                    {
                        id = t.Id,
                        monto = t.Monto,
                        moneda = t.Moneda,
                        estado = t.Estado,
                        proveedor = t.Proveedor,
                        fechaCreacion = t.FechaCreacion,
                        fechaConfirmacion = t.FechaConfirmacion
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(pedidos);
    }
}
