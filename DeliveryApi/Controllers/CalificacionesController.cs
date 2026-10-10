
using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

public class CrearCalificacionDto
{
    public int PedidoId { get; set; }
    public int Puntuacion { get; set; }
    public string? Comentario { get; set; }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalificacionesController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public CalificacionesController(DeliveryDbContext context)
    {
        _context = context;
    }

    private int? ObtenerUsuarioId()
    {
        var texto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        return int.TryParse(texto, out var id)
            ? id
            : null;
    }

    // ==========================================
    // FASE 5: REGISTRAR CALIFICACIÓN
    // POST: api/Calificaciones
    // ==========================================

    [HttpPost]
    [Authorize(Roles = "Cliente,Repartidor")]
    public async Task<IActionResult> Crear(
        [FromBody] CrearCalificacionDto dto
    )
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized(new
            {
                mensaje = "Sesión inválida."
            });
        }

        if (dto.PedidoId <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Pedido inválido."
            });
        }

        if (dto.Puntuacion < 1 || dto.Puntuacion > 5)
        {
            return BadRequest(new
            {
                mensaje = "La calificación debe estar entre 1 y 5 estrellas."
            });
        }

        var comentario = dto.Comentario?.Trim();

        if (comentario?.Length > 500)
        {
            return BadRequest(new
            {
                mensaje = "El comentario no puede superar los 500 caracteres."
            });
        }

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.Repartidor)
            .FirstOrDefaultAsync(p => p.Id == dto.PedidoId);

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        if (pedido.Estado != "Entregado")
        {
            return BadRequest(new
            {
                mensaje = "Solo se pueden calificar pedidos entregados."
            });
        }

        if (pedido.TipoEntrega != "Domicilio" ||
            pedido.Repartidor == null)
        {
            return BadRequest(new
            {
                mensaje = "Este pedido no tiene una entrega con repartidor."
            });
        }

        var esCliente = pedido.UsuarioId == usuarioId.Value;

        var esRepartidor =
            pedido.Repartidor.UsuarioId == usuarioId.Value;

        if (!esCliente && !esRepartidor)
        {
            return Forbid();
        }

        var tipo = esCliente
            ? "ClienteARepartidor"
            : "RepartidorACliente";

        var receptorUsuarioId = esCliente
            ? pedido.Repartidor.UsuarioId
            : pedido.UsuarioId;

        if (receptorUsuarioId == usuarioId.Value)
        {
            return BadRequest(new
            {
                mensaje = "No puedes calificarte a ti mismo."
            });
        }

        var existe = await _context.CalificacionesPedido
            .AnyAsync(c =>
                c.PedidoId == dto.PedidoId &&
                c.Tipo == tipo
            );

        if (existe)
        {
            return Conflict(new
            {
                mensaje = "Ya calificaste esta entrega."
            });
        }

        var calificacion = new CalificacionPedido
        {
            PedidoId = dto.PedidoId,
            EmisorUsuarioId = usuarioId.Value,
            ReceptorUsuarioId = receptorUsuarioId,
            Tipo = tipo,
            Puntuacion = dto.Puntuacion,
            Comentario = string.IsNullOrWhiteSpace(comentario)
                ? null
                : comentario,
            FechaCreacion = DateTime.UtcNow
        };

        _context.CalificacionesPedido.Add(calificacion);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // El índice único de SQL Server impide
            // registrar dos calificaciones del mismo
            // tipo para un mismo pedido.
            var duplicada = await _context.CalificacionesPedido
                .AsNoTracking()
                .AnyAsync(c =>
                    c.PedidoId == dto.PedidoId &&
                    c.Tipo == tipo
                );

            if (duplicada)
            {
                return Conflict(new
                {
                    mensaje = "Esta entrega ya fue calificada."
                });
            }

            throw;
        }

        return Created(
            $"/api/Calificaciones/{calificacion.Id}",
            new
            {
                calificacion.Id,
                calificacion.PedidoId,
                calificacion.Tipo,
                calificacion.Puntuacion,
                calificacion.Comentario,
                calificacion.FechaCreacion,
                mensaje = "Calificación registrada correctamente."
            }
        );
    }

    // ==========================================
    // CONSULTAR CALIFICACIONES DE UN PEDIDO
    // GET: api/Calificaciones/pedido/{pedidoId}
    // ==========================================

    [HttpGet("pedido/{pedidoId:int}")]
    public async Task<IActionResult> PorPedido(int pedidoId)
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
            return Unauthorized();

        if (pedidoId <= 0)
            return BadRequest(new { mensaje = "Pedido inválido." });

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Where(p => p.Id == pedidoId)
            .Select(p => new
            {
                p.UsuarioId,
                RepartidorUsuarioId = p.Repartidor != null
                    ? (int?)p.Repartidor.UsuarioId
                    : null
            })
            .FirstOrDefaultAsync();

        if (pedido == null)
            return NotFound(new { mensaje = "Pedido no encontrado." });

        var esAdministrador = User.IsInRole("Administrador");

        if (!esAdministrador &&
            pedido.UsuarioId != usuarioId.Value &&
            pedido.RepartidorUsuarioId != usuarioId.Value)
        {
            return Forbid();
        }

        var calificaciones = await _context.CalificacionesPedido
            .AsNoTracking()
            .Where(c => c.PedidoId == pedidoId)
            .OrderBy(c => c.FechaCreacion)
            .Select(c => new
            {
                c.Id,
                c.PedidoId,
                c.Tipo,
                c.Puntuacion,
                c.Comentario,
                c.FechaCreacion,
                c.EmisorUsuarioId,
                c.ReceptorUsuarioId
            })
            .ToListAsync();

        return Ok(calificaciones);
    }

    // ==========================================
    // CONSULTAR MI REPUTACIÓN
    // GET: api/Calificaciones/mi-reputacion
    // ==========================================

    [HttpGet("mi-reputacion")]
    [Authorize(Roles = "Cliente,Repartidor")]
    public async Task<IActionResult> MiReputacion()
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
            return Unauthorized();

        var datos = await _context.CalificacionesPedido
            .AsNoTracking()
            .Where(c => c.ReceptorUsuarioId == usuarioId.Value)
            .GroupBy(c => c.ReceptorUsuarioId)
            .Select(g => new
            {
                totalCalificaciones = g.Count(),
                promedio = g.Average(c => (double)c.Puntuacion)
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            usuarioId,
            totalCalificaciones = datos?.totalCalificaciones ?? 0,
            promedio = datos == null
                ? 0
                : Math.Round(datos.promedio, 2)
        });
    }

    // ==========================================
    // ADMINISTRADOR: TODAS LAS CALIFICACIONES
    // GET: api/Calificaciones/admin
    // ==========================================

    [HttpGet("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Admin()
    {
        var calificaciones = await _context.CalificacionesPedido
            .AsNoTracking()
            .OrderByDescending(c => c.FechaCreacion)
            .Select(c => new
            {
                c.Id,
                c.PedidoId,
                c.Tipo,
                c.Puntuacion,
                c.Comentario,
                c.FechaCreacion,
                emisorUsuarioId = c.EmisorUsuarioId,
                emisor = c.EmisorUsuario.Nombre,
                receptorUsuarioId = c.ReceptorUsuarioId,
                receptor = c.ReceptorUsuario.Nombre
            })
            .ToListAsync();

        return Ok(calificaciones);
    }
}
