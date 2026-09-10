using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.DTOs;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminRepartidoresController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public AdminRepartidoresController(
        DeliveryDbContext context
    )
    {
        _context = context;
    }

    // =========================
    // AUXILIAR
    // Usuario autenticado
    // =========================
    private async Task<Usuario?> ObtenerAdministrador()
    {
        var usuarioIdTexto =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!int.TryParse(
            usuarioIdTexto,
            out var usuarioId
        ))
        {
            return null;
        }

        return await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo &&
                u.Rol == "Administrador"
            );
    }

    // =========================
    // GET:
    // api/AdminRepartidores/solicitudes-pendientes
    // =========================
    [HttpGet("solicitudes-pendientes")]
    public async Task<IActionResult> SolicitudesPendientes()
    {
        var administrador =
            await ObtenerAdministrador();

        if (administrador == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede ver las solicitudes."
                }
            );
        }

        var solicitudes =
            await _context.SolicitudesRepartidor
                .Where(s =>
                    s.Estado == "Pendiente"
                )
                .OrderBy(
                    s => s.FechaSolicitud
                )
                .Select(s => new
                {
                    s.Id,

                    s.UsuarioId,

                    Usuario = new
                    {
                        s.Usuario.Nombre,
                        s.Usuario.Correo,
                        s.Usuario.Telefono
                    },

                    s.TipoVehiculo,
                    s.Placa,
                    s.Estado,
                    s.FechaSolicitud
                })
                .ToListAsync();

        return Ok(solicitudes);
    }

    // =========================
    // GET:
    // api/AdminRepartidores/solicitudes
    // Todas las solicitudes
    // =========================
    [HttpGet("solicitudes")]
    public async Task<IActionResult> TodasLasSolicitudes()
    {
        var administrador =
            await ObtenerAdministrador();

        if (administrador == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede ver las solicitudes."
                }
            );
        }

        var solicitudes =
            await _context.SolicitudesRepartidor
                .OrderByDescending(
                    s => s.FechaSolicitud
                )
                .Select(s => new
                {
                    s.Id,
                    s.UsuarioId,

                    Usuario = new
                    {
                        s.Usuario.Nombre,
                        s.Usuario.Correo,
                        s.Usuario.Telefono
                    },

                    s.TipoVehiculo,
                    s.Placa,
                    s.Estado,
                    s.FechaSolicitud,
                    s.FechaRevision,
                    s.Observacion,

                    RevisadoPor =
                        s.RevisadoPorUsuario == null
                            ? null
                            : s.RevisadoPorUsuario.Nombre
                })
                .ToListAsync();

        return Ok(solicitudes);
    }

    // =========================
    // GET:
    // api/AdminRepartidores/repartidores
    // Lista de repartidores
    // =========================
    [HttpGet("repartidores")]
    public async Task<IActionResult> ObtenerRepartidores()
    {
        var administrador =
            await ObtenerAdministrador();

        if (administrador == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede ver los repartidores."
                }
            );
        }

        var repartidores =
            await _context.Repartidores
                .OrderBy(r =>
                    r.Usuario.Nombre
                )
                .Select(r => new
                {
                    r.Id,
                    r.UsuarioId,

                    Usuario = new
                    {
                        r.Usuario.Nombre,
                        r.Usuario.Correo,
                        r.Usuario.Telefono,
                        r.Usuario.Activo
                    },

                    r.TipoVehiculo,
                    r.Placa,

                    r.Disponible,
                    r.Activo,

                    r.LatitudActual,
                    r.LongitudActual,
                    r.UltimaActualizacionUbicacion,

                    r.FechaCreacion,

                    TotalEntregas =
                        r.Pedidos.Count(p =>
                            p.Estado == "Entregado"
                        )
                })
                .ToListAsync();

        return Ok(repartidores);
    }

    // =========================
    // PUT:
    // api/AdminRepartidores/solicitudes/5/aprobar
    // =========================
    [HttpPut("solicitudes/{id:int}/aprobar")]
    public async Task<IActionResult> AprobarSolicitud(
        int id,
        RevisarSolicitudRepartidorDto dto
    )
    {
        var administrador =
            await ObtenerAdministrador();

        if (administrador == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede aprobar solicitudes."
                }
            );
        }

        var solicitud =
            await _context.SolicitudesRepartidor
                .Include(s => s.Usuario)
                .FirstOrDefaultAsync(s =>
                    s.Id == id
                );

        if (solicitud == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Solicitud no encontrada."
            });
        }

        if (solicitud.Estado != "Pendiente")
        {
            return BadRequest(new
            {
                mensaje =
                    "La solicitud ya fue revisada."
            });
        }

        var yaTienePerfil =
            await _context.Repartidores
                .AnyAsync(r =>
                    r.UsuarioId ==
                    solicitud.UsuarioId
                );

        if (yaTienePerfil)
        {
            return BadRequest(new
            {
                mensaje =
                    "Este usuario ya tiene un perfil de repartidor."
            });
        }

        solicitud.Estado =
            "Aprobada";

        solicitud.FechaRevision =
            DateTime.UtcNow;

        solicitud.RevisadoPorUsuarioId =
            administrador.Id;

        solicitud.Observacion =
            string.IsNullOrWhiteSpace(
                dto.Observacion
            )
                ? null
                : dto.Observacion.Trim();

        solicitud.Usuario.Rol =
            "Repartidor";

        solicitud.Usuario.ComercioId =
            null;

        var repartidor =
            new Repartidor
            {
                UsuarioId =
                    solicitud.UsuarioId,

                TipoVehiculo =
                    solicitud.TipoVehiculo,

                Placa =
                    solicitud.Placa,

                Disponible =
                    false,

                Activo =
                    true,

                FechaCreacion =
                    DateTime.UtcNow
            };

        _context.Repartidores.Add(
            repartidor
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Solicitud aprobada correctamente.",

            solicitud = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaRevision
            },

            repartidor = new
            {
                repartidor.Id,
                repartidor.UsuarioId,
                repartidor.TipoVehiculo,
                repartidor.Placa,
                repartidor.Disponible,
                repartidor.Activo
            }
        });
    }

    // =========================
    // PUT:
    // api/AdminRepartidores/solicitudes/5/rechazar
    // =========================
    [HttpPut("solicitudes/{id:int}/rechazar")]
    public async Task<IActionResult> RechazarSolicitud(
        int id,
        RevisarSolicitudRepartidorDto dto
    )
    {
        var administrador =
            await ObtenerAdministrador();

        if (administrador == null)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede rechazar solicitudes."
                }
            );
        }

        var solicitud =
            await _context.SolicitudesRepartidor
                .FirstOrDefaultAsync(s =>
                    s.Id == id
                );

        if (solicitud == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Solicitud no encontrada."
            });
        }

        if (solicitud.Estado != "Pendiente")
        {
            return BadRequest(new
            {
                mensaje =
                    "La solicitud ya fue revisada."
            });
        }

        solicitud.Estado =
            "Rechazada";

        solicitud.FechaRevision =
            DateTime.UtcNow;

        solicitud.RevisadoPorUsuarioId =
            administrador.Id;

        solicitud.Observacion =
            string.IsNullOrWhiteSpace(
                dto.Observacion
            )
                ? "Solicitud rechazada."
                : dto.Observacion.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Solicitud rechazada correctamente.",

            solicitud = new
            {
                solicitud.Id,
                solicitud.Estado,
                solicitud.FechaRevision,
                solicitud.Observacion
            }
        });
    }
}