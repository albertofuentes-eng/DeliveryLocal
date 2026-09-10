using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DeliveryApi.DTOs;

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

    
    [HttpPost("solicitud")]
    public async Task<IActionResult> CrearSolicitud(
        CrearSolicitudRepartidorDto solicitud
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

        if (
            string.IsNullOrWhiteSpace(
                solicitud.TipoVehiculo
            )
        )
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
                        p.Comercio.Telefono,
                        p.Comercio.Latitud,
                        p.Comercio.Longitud
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

    [HttpGet("mi-pedido")]
    public async Task<IActionResult> MiPedido()
    {
        var usuarioId = ObtenerUsuarioId();

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
                        "Solo un repartidor puede consultar su pedido activo."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId == usuarioId.Value &&
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
                    p.RepartidorId == repartidor.Id &&
                    (
                        p.Estado == "Asignado a repartidor" ||
                        p.Estado == "Recogido" ||
                        p.Estado == "En camino"
                    )
                )
                .OrderByDescending(p =>
                    p.Fecha
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,

                    p.TipoEntrega,

                    p.Subtotal,
                    p.Envio,
                    p.Total,

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
                    p.Comercio.Telefono,
                    p.Comercio.Latitud,
                    p.Comercio.Longitud
                },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,

                        Telefono =
                            p.TelefonoEntrega
                    },

                    Detalles =
                        p.Detalles.Select(d =>
                            new
                            {
                                d.ProductoId,

                                Producto =
                                    d.Producto.Nombre,

                                d.Cantidad,
                                d.PrecioUnitario,
                                d.Subtotal
                            }
                        )
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


    [HttpGet("pedidos/{id:int}")]
    public async Task<IActionResult> DetallePedido(
        int id
    )
    {
        var usuarioId = ObtenerUsuarioId();

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
                        "Solo un repartidor puede consultar este pedido."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId == usuarioId.Value &&
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
                    p.TipoEntrega == "Domicilio" &&
                    (
                        // Pedido todavía disponible
                        (
                            p.Estado == "Listo para recoger" &&
                            p.RepartidorId == null &&
                            repartidor.Disponible
                        )

                        ||

                        // O pedido que ya pertenece
                        // a este repartidor
                        p.RepartidorId == repartidor.Id
                    )
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,

                    p.TipoEntrega,

                    p.Subtotal,
                    p.Envio,
                    p.Total,

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
                    p.Comercio.Telefono,
                    p.Comercio.Latitud,
                    p.Comercio.Longitud
                },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,

                        Telefono =
                            p.TelefonoEntrega
                    },

                    Detalles =
                        p.Detalles.Select(d =>
                            new
                            {
                                d.ProductoId,

                                Producto =
                                    d.Producto.Nombre,

                                d.Cantidad,
                                d.PrecioUnitario,
                                d.Subtotal
                            }
                        )
                })
                .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "El pedido no está disponible o no pertenece a este repartidor."
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

        pedido.FechaEntrega =
            DateTime.UtcNow;

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

    [HttpGet("historial")]
    public async Task<IActionResult> Historial()
    {
        var usuarioId = ObtenerUsuarioId();

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
                        "Solo un repartidor puede consultar su historial."
                }
            );
        }

        var repartidor =
            await _context.Repartidores
                .FirstOrDefaultAsync(r =>
                    r.UsuarioId == usuarioId.Value &&
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

        var pedidos =
            await _context.Pedidos
                .Where(p =>
                    p.RepartidorId == repartidor.Id &&
                    p.Estado == "Entregado"
                )
                .OrderByDescending(p =>
                    p.Fecha
                )
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,

                    p.Total,
                    p.Envio,

                    p.DireccionEntrega,

                    Comercio = new
                {
                    p.Comercio.Id,
                    p.Comercio.Nombre,
                    p.Comercio.Direccion,
                    p.Comercio.Telefono,
                    p.Comercio.Latitud,
                    p.Comercio.Longitud
                },

                    Cliente = new
                    {
                        p.Usuario.Id,
                        p.Usuario.Nombre,

                        Telefono =
                            p.TelefonoEntrega
                    }
                })
                .ToListAsync();

        return Ok(pedidos);
    }

    // =========================
    // GET:
    // api/Repartidores/metricas
    // =========================
    [HttpGet("metricas")]
    public async Task<IActionResult> Metricas()
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
                        "Solo un repartidor puede consultar sus métricas."
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

        var ahora =
            DateTime.UtcNow;

        var inicioHoy =
            ahora.Date;

        var inicioSemana =
            inicioHoy.AddDays(
                -(
                    (
                        7 +
                        (int)inicioHoy.DayOfWeek -
                        (int)DayOfWeek.Monday
                    ) % 7
                )
            );

        var inicioMes =
            new DateTime(
                ahora.Year,
                ahora.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc
            );

        var pedidosEntregados =
            _context.Pedidos
                .Where(p =>
                    p.RepartidorId ==
                        repartidor.Id &&
                    p.Estado ==
                        "Entregado"
                );

        var totalEntregas =
            await pedidosEntregados
                .CountAsync();

        var gananciasTotales =
            await pedidosEntregados
                .SumAsync(p =>
                    (decimal?)p.Envio
                ) ?? 0;

        var entregasHoy =
            await pedidosEntregados
                .CountAsync(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioHoy
                );

        var gananciasHoy =
            await pedidosEntregados
                .Where(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioHoy
                )
                .SumAsync(p =>
                    (decimal?)p.Envio
                ) ?? 0;

        var entregasSemana =
            await pedidosEntregados
                .CountAsync(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioSemana
                );

        var gananciasSemana =
            await pedidosEntregados
                .Where(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioSemana
                )
                .SumAsync(p =>
                    (decimal?)p.Envio
                ) ?? 0;

        var entregasMes =
            await pedidosEntregados
                .CountAsync(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioMes
                );

        var gananciasMes =
            await pedidosEntregados
                .Where(p =>
                    p.FechaEntrega != null &&
                    p.FechaEntrega >= inicioMes
                )
                .SumAsync(p =>
                    (decimal?)p.Envio
                ) ?? 0;

        return Ok(new
        {
            totalEntregas,
            gananciasTotales,

            hoy = new
            {
                entregas =
                    entregasHoy,

                ganancias =
                    gananciasHoy
            },

            semana = new
            {
                entregas =
                    entregasSemana,

                ganancias =
                    gananciasSemana
            },

            mes = new
            {
                entregas =
                    entregasMes,

                ganancias =
                    gananciasMes
            }
        });
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