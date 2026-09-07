using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RepartidoresController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public RepartidoresController(
        DeliveryDbContext context
    )
    {
        _context = context;
    }

    // =========================
    // AUXILIAR
    // Obtener UsuarioId del JWT
    // =========================
    private int? ObtenerUsuarioId()
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

        return usuarioId;
    }

    // =========================
    // POST:
    // api/Repartidores/solicitud
    // =========================
    [HttpPost("solicitud")]
    public async Task<IActionResult> CrearSolicitud(
        SolicitudRepartidor solicitud
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId.Value &&
                    u.Activo
                );

        if (usuario == null)
        {
            return Unauthorized();
        }

        if (
            usuario.Rol == "Repartidor" ||
            usuario.Rol == "Administrador" ||
            usuario.Rol == "Comercio"
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "Este usuario no puede solicitar ser repartidor."
            });
        }

        var yaEsRepartidor =
            await _context.Repartidores
                .AnyAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (yaEsRepartidor)
        {
            return BadRequest(new
            {
                mensaje =
                    "Este usuario ya es repartidor."
            });
        }

        var solicitudPendiente =
            await _context.SolicitudesRepartidor
                .AnyAsync(s =>
                    s.UsuarioId ==
                        usuarioId.Value &&
                    s.Estado == "Pendiente"
                );

        if (solicitudPendiente)
        {
            return BadRequest(new
            {
                mensaje =
                    "Ya tienes una solicitud pendiente."
            });
        }

        if (string.IsNullOrWhiteSpace(
            solicitud.TipoVehiculo
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El tipo de vehículo es obligatorio."
            });
        }

        var nuevaSolicitud =
            new SolicitudRepartidor
            {
                UsuarioId =
                    usuarioId.Value,

                TipoVehiculo =
                    solicitud.TipoVehiculo.Trim(),

                Placa =
                    string.IsNullOrWhiteSpace(
                        solicitud.Placa
                    )
                        ? null
                        : solicitud.Placa.Trim(),

                Estado =
                    "Pendiente",

                FechaSolicitud =
                    DateTime.UtcNow
            };

        _context.SolicitudesRepartidor.Add(
            nuevaSolicitud
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Solicitud enviada correctamente.",

            solicitud = new
            {
                nuevaSolicitud.Id,
                nuevaSolicitud.TipoVehiculo,
                nuevaSolicitud.Placa,
                nuevaSolicitud.Estado,
                nuevaSolicitud.FechaSolicitud
            }
        });
    }

    // =========================
    // GET:
    // api/Repartidores/mi-solicitud
    // =========================
    [HttpGet("mi-solicitud")]
    public async Task<IActionResult> MiSolicitud()
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var solicitud =
            await _context.SolicitudesRepartidor
                .Where(s =>
                    s.UsuarioId ==
                    usuarioId.Value
                )
                .OrderByDescending(
                    s => s.FechaSolicitud
                )
                .Select(s => new
                {
                    s.Id,
                    s.TipoVehiculo,
                    s.Placa,
                    s.Estado,
                    s.FechaSolicitud,
                    s.FechaRevision,
                    s.Observacion
                })
                .FirstOrDefaultAsync();

        if (solicitud == null)
        {
            return NotFound(new
            {
                mensaje =
                    "No tienes solicitudes de repartidor."
            });
        }

        return Ok(solicitud);
    }

    // =========================
    // GET:
    // api/Repartidores/mi-perfil
    // =========================
    [HttpGet("mi-perfil")]
    public async Task<IActionResult> MiPerfil()
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .Where(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                )
                .Select(r => new
                {
                    r.Id,
                    r.UsuarioId,

                    Usuario = new
                    {
                        r.Usuario.Nombre,
                        r.Usuario.Correo,
                        r.Usuario.Telefono
                    },

                    r.TipoVehiculo,
                    r.Placa,
                    r.Disponible,
                    r.LatitudActual,
                    r.LongitudActual,
                    r.UltimaActualizacionUbicacion,
                    r.Activo,
                    r.FechaCreacion
                })
                .FirstOrDefaultAsync();

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        return Ok(repartidor);
    }

    // =========================
    // PUT:
    // api/Repartidores/disponibilidad
    // =========================
    [HttpPut("disponibilidad")]
    public async Task<IActionResult> ActualizarDisponibilidad(
        [FromBody] bool disponible
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id ==
                        usuarioId.Value &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Repartidor"
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un repartidor puede cambiar su disponibilidad."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var tienePedidoActivo =
            await _context.Pedidos
                .AnyAsync(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    (
                        p.Estado ==
                            "Asignado a repartidor" ||
                        p.Estado ==
                            "Recogido" ||
                        p.Estado ==
                            "En camino"
                    )
                );

        if (
            !disponible &&
            tienePedidoActivo
        )
        {
            // Sí permitimos ponerse no disponible
            // mientras entrega, porque ya tiene
            // el pedido asignado.
        }

        if (
            disponible &&
            tienePedidoActivo
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "No puedes marcarte disponible mientras tienes un pedido activo."
            });
        }

        repartidor.Disponible =
            disponible;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            repartidor.Id,
            repartidor.Disponible,

            mensaje =
                disponible
                    ? "Ahora estás disponible."
                    : "Ahora estás no disponible."
        });
    }

    // =========================
    // PUT:
    // api/Repartidores/ubicacion
    // =========================
    [HttpPut("ubicacion")]
    public async Task<IActionResult> ActualizarUbicacion(
        [FromBody] ActualizarUbicacionDto dto
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id ==
                        usuarioId.Value &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Repartidor"
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un repartidor puede actualizar ubicación."
                }
            );
        }

        if (
            dto.Latitud < -90 ||
            dto.Latitud > 90 ||
            dto.Longitud < -180 ||
            dto.Longitud > 180
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "La ubicación enviada no es válida."
            });
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        repartidor.LatitudActual =
            dto.Latitud;

        repartidor.LongitudActual =
            dto.Longitud;

        repartidor.UltimaActualizacionUbicacion =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Ubicación actualizada correctamente.",

            repartidor.LatitudActual,
            repartidor.LongitudActual,
            repartidor.UltimaActualizacionUbicacion
        });
    }

    // =========================
    // GET:
    // api/Repartidores/pedidos-disponibles
    // =========================
    [HttpGet("pedidos-disponibles")]
    public async Task<IActionResult> PedidosDisponibles()
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id ==
                        usuarioId.Value &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Repartidor"
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un repartidor puede ver pedidos disponibles."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        if (!repartidor.Disponible)
        {
            return BadRequest(new
            {
                mensaje =
                    "Debes estar disponible para ver pedidos."
            });
        }

        var tienePedidoActivo =
            await _context.Pedidos
                .AnyAsync(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    (
                        p.Estado ==
                            "Asignado a repartidor" ||
                        p.Estado ==
                            "Recogido" ||
                        p.Estado ==
                            "En camino"
                    )
                );

        if (tienePedidoActivo)
        {
            return BadRequest(new
            {
                mensaje =
                    "Ya tienes un pedido activo."
            });
        }

        var pedidos =
            await _context.Pedidos
                .Where(p =>
                    p.TipoEntrega ==
                        "Domicilio" &&
                    p.Estado ==
                        "Listo para recoger" &&
                    p.RepartidorId == null
                )
                .OrderBy(p => p.Fecha)
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Total,
                    p.Envio,

                    p.DireccionEntrega,
                    p.LatitudEntrega,
                    p.LongitudEntrega,

                    Comercio = new
                    {
                        p.Comercio.Id,
                        p.Comercio.Nombre,
                        p.Comercio.Direccion,
                        p.Comercio.Telefono
                    },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,
                        p.TelefonoEntrega
                    }
                })
                .ToListAsync();

        return Ok(pedidos);
    }

    // =========================
    // POST:
    // api/Repartidores/pedidos/5/aceptar
    // =========================
    [HttpPost("pedidos/{pedidoId:int}/aceptar")]
    public async Task<IActionResult> AceptarPedido(
        int pedidoId
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id ==
                        usuarioId.Value &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Repartidor"
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un repartidor puede aceptar pedidos."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        if (!repartidor.Disponible)
        {
            return BadRequest(new
            {
                mensaje =
                    "Debes estar disponible para aceptar pedidos."
            });
        }

        var tienePedidoActivo =
            await _context.Pedidos
                .AnyAsync(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    (
                        p.Estado ==
                            "Asignado a repartidor" ||
                        p.Estado ==
                            "Recogido" ||
                        p.Estado ==
                            "En camino"
                    )
                );

        if (tienePedidoActivo)
        {
            return BadRequest(new
            {
                mensaje =
                    "Ya tienes un pedido activo."
            });
        }

        // Reserva segura:
        // solo un repartidor puede tomarlo.
        var filasActualizadas =
            await _context.Database
                .ExecuteSqlInterpolatedAsync(
                    $"""
                    UPDATE Pedidos
                    SET RepartidorId = {repartidor.Id},
                        Estado = {"Asignado a repartidor"}
                    WHERE Id = {pedidoId}
                      AND RepartidorId IS NULL
                      AND Estado = {"Listo para recoger"}
                      AND TipoEntrega = {"Domicilio"}
                    """
                );

        if (filasActualizadas == 0)
        {
            return Conflict(new
            {
                mensaje =
                    "Este pedido ya fue tomado por otro repartidor o ya no está disponible."
            });
        }

        // Al aceptar un pedido deja de
        // estar disponible para tomar otro.
        repartidor.Disponible =
            false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            pedidoId,

            repartidorId =
                repartidor.Id,

            estado =
                "Asignado a repartidor",

            repartidor.Disponible,

            mensaje =
                "Pedido aceptado correctamente."
        });
    }

    // =========================
    // GET:
    // api/Repartidores/mi-pedido
    // =========================
    [HttpGet("mi-pedido")]
    public async Task<IActionResult> MiPedido()
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedido =
            await _context.Pedidos
                .Where(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    (
                        p.Estado ==
                            "Asignado a repartidor" ||
                        p.Estado ==
                            "Recogido" ||
                        p.Estado ==
                            "En camino"
                    )
                )
                .OrderByDescending(
                    p => p.Fecha
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,
                    p.Total,
                    p.Envio,

                    p.DireccionEntrega,
                    p.LatitudEntrega,
                    p.LongitudEntrega,
                    p.TelefonoEntrega,
                    p.ReferenciaEntrega,
                    p.IndicacionesEntrega,

                    Comercio = new
                    {
                        p.Comercio.Id,
                        p.Comercio.Nombre,
                        p.Comercio.Direccion,
                        p.Comercio.Telefono
                    },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,
                        p.Usuario.Telefono
                    }
                })
                .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "No tienes un pedido activo."
            });
        }

        return Ok(pedido);
    }

    // =========================
    // GET:
    // api/Repartidores/pedidos/5
    // =========================
    [HttpGet("pedidos/{id:int}")]
    public async Task<IActionResult> DetallePedido(
        int id
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedido =
            await _context.Pedidos
                .Where(p =>
                    p.Id == id &&
                    p.RepartidorId ==
                        repartidor.Id
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,
                    p.TipoEntrega,
                    p.Total,
                    p.Envio,

                    p.DireccionEntrega,
                    p.LatitudEntrega,
                    p.LongitudEntrega,
                    p.TelefonoEntrega,
                    p.ReferenciaEntrega,
                    p.IndicacionesEntrega,

                    Comercio = new
                    {
                        p.Comercio.Id,
                        p.Comercio.Nombre,
                        p.Comercio.Direccion,
                        p.Comercio.Telefono
                    },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,
                        p.Usuario.Telefono
                    },

                    Detalles =
                        p.Detalles.Select(d => new
                        {
                            d.ProductoId,

                            Producto =
                                d.Producto.Nombre,

                            d.Cantidad,
                            d.PrecioUnitario,
                            d.Subtotal
                        })
                })
                .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Pedido no encontrado o no está asignado a este repartidor."
            });
        }

        return Ok(pedido);
    }

    // =========================
    // PUT:
    // api/Repartidores/pedidos/5/recogido
    // =========================
    [HttpPut("pedidos/{id:int}/recogido")]
    public async Task<IActionResult> MarcarRecogido(
        int id
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedido =
            await _context.Pedidos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.RepartidorId ==
                        repartidor.Id
                );

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Pedido no encontrado."
            });
        }

        if (
            pedido.Estado !=
            "Asignado a repartidor"
        )
        {
            return BadRequest(new
            {
                mensaje =
                    $"No se puede marcar como recogido desde el estado '{pedido.Estado}'."
            });
        }

        pedido.Estado =
            "Recogido";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            pedido.Id,
            pedido.Estado,

            mensaje =
                "Pedido marcado como recogido."
        });
    }

    // =========================
    // PUT:
    // api/Repartidores/pedidos/5/en-camino
    // =========================
    [HttpPut("pedidos/{id:int}/en-camino")]
    public async Task<IActionResult> MarcarEnCamino(
        int id
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedido =
            await _context.Pedidos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.RepartidorId ==
                        repartidor.Id
                );

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Pedido no encontrado."
            });
        }

        if (
            pedido.Estado !=
            "Recogido"
        )
        {
            return BadRequest(new
            {
                mensaje =
                    $"No se puede poner en camino desde el estado '{pedido.Estado}'."
            });
        }

        pedido.Estado =
            "En camino";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            pedido.Id,
            pedido.Estado,

            mensaje =
                "Pedido en camino."
        });
    }

    // =========================
    // PUT:
    // api/Repartidores/pedidos/5/entregado
    // =========================
    [HttpPut("pedidos/{id:int}/entregado")]
    public async Task<IActionResult> MarcarEntregado(
        int id
    )
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value &&
                    r.Activo
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedido =
            await _context.Pedidos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.RepartidorId ==
                        repartidor.Id
                );

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Pedido no encontrado."
            });
        }

        if (
            pedido.Estado !=
            "En camino"
        )
        {
            return BadRequest(new
            {
                mensaje =
                    $"No se puede entregar desde el estado '{pedido.Estado}'."
            });
        }

        pedido.Estado =
            "Entregado";

        // Al terminar vuelve a quedar
        // disponible para otro pedido.
        repartidor.Disponible =
            true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            pedido.Id,
            pedido.Estado,
            repartidor.Disponible,

            mensaje =
                "Pedido entregado correctamente."
        });
    }

    // =========================
    // GET:
    // api/Repartidores/historial
    // =========================
    [HttpGet("historial")]
    public async Task<IActionResult> Historial()
    {
        var usuarioId =
            ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId ==
                        usuarioId.Value
                );

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Perfil de repartidor no encontrado."
            });
        }

        var pedidos =
            await _context.Pedidos
                .Where(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    p.Estado ==
                        "Entregado"
                )
                .OrderByDescending(
                    p => p.Fecha
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Total,
                    p.Envio,

                    Comercio =
                        p.Comercio.Nombre,

                    Cliente =
                        p.Usuario.Nombre,

                    p.DireccionEntrega
                })
                .ToListAsync();

        return Ok(pedidos);
    }
}

// =========================
// DTO temporal para GPS
// =========================
public class ActualizarUbicacionDto
{
    public decimal Latitud { get; set; }

    public decimal Longitud { get; set; }
}