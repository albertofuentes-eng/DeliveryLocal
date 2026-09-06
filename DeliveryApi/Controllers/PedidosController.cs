using DeliveryApi.Data;
using DeliveryApi.DTOs;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PedidosController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public PedidosController(DeliveryDbContext context)
    {
        _context = context;
    }

    // =========================
    // POST: api/Pedidos
    // =========================
    [HttpPost]
    public async Task<IActionResult> CrearPedido(
        CrearPedidoDto dto
    )
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        if (dto.Productos == null ||
            dto.Productos.Count == 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "El pedido debe contener productos."
            });
        }

        var tiposEntregaPermitidos = new[]
        {
            "Domicilio",
            "Recoger"
        };

        if (!tiposEntregaPermitidos.Contains(
            dto.TipoEntrega
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El tipo de entrega no es válido."
            });
        }

        var tiposTiempoPermitidos = new[]
        {
            "Ahora",
            "Despues"
        };

        if (!tiposTiempoPermitidos.Contains(
            dto.TipoTiempo
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El tipo de tiempo no es válido."
            });
        }

        if (dto.TipoEntrega == "Domicilio")
        {
            if (string.IsNullOrWhiteSpace(
                dto.DireccionEntrega
            ))
            {
                return BadRequest(new
                {
                    mensaje =
                        "La dirección de entrega es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(
                dto.TelefonoEntrega
            ))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El teléfono de entrega es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(
                dto.ReferenciaEntrega
            ))
            {
                return BadRequest(new
                {
                    mensaje =
                        "La referencia de entrega es obligatoria."
                });
            }
        }

        if (dto.TipoTiempo == "Despues")
        {
            if (dto.FechaProgramada == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Debes indicar la fecha y hora programada."
                });
            }

            if (dto.FechaProgramada <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La fecha programada debe ser futura."
                });
            }
        }

        var comercio = await _context.Comercios
            .FirstOrDefaultAsync(c =>
                c.Id == dto.ComercioId &&
                c.Activo);

        if (comercio == null)
        {
            return BadRequest(new
            {
                mensaje =
                    "El comercio indicado no existe."
            });
        }

        var pedido = new Pedido
        {
            UsuarioId = usuarioId,
            ComercioId = dto.ComercioId,

            Fecha = DateTime.UtcNow,
            Estado = "Pendiente",

            TipoEntrega =
                dto.TipoEntrega,

            TipoTiempo =
                dto.TipoTiempo,

            FechaProgramada =
                dto.TipoTiempo == "Despues"
                    ? dto.FechaProgramada
                    : null,

            Envio =
                dto.TipoEntrega == "Domicilio"
                    ? 15
                    : 0
        };

        if (dto.TipoEntrega == "Domicilio")
        {
            pedido.DireccionEntrega =
                dto.DireccionEntrega?.Trim();

            pedido.LatitudEntrega =
                dto.LatitudEntrega;

            pedido.LongitudEntrega =
                dto.LongitudEntrega;

            pedido.TelefonoEntrega =
                dto.TelefonoEntrega?.Trim();

            pedido.ReferenciaEntrega =
                dto.ReferenciaEntrega?.Trim();

            pedido.IndicacionesEntrega =
                dto.IndicacionesEntrega?.Trim();
        }

        decimal subtotal = 0;

        foreach (var itemDto in dto.Productos)
        {
            if (itemDto.Cantidad <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cantidad debe ser mayor que cero."
                });
            }

            var producto = await _context.Productos
                .FirstOrDefaultAsync(p =>
                    p.Id == itemDto.ProductoId &&
                    p.Disponible);

            if (producto == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        $"El producto {itemDto.ProductoId} no existe o no está disponible."
                });
            }

            if (producto.ComercioId != dto.ComercioId)
            {
                return BadRequest(new
                {
                    mensaje =
                        $"El producto {producto.Nombre} no pertenece al comercio indicado."
                });
            }

            var subtotalDetalle =
                producto.Precio *
                itemDto.Cantidad;

            subtotal += subtotalDetalle;

            pedido.Detalles.Add(
                new DetallePedido
                {
                    ProductoId =
                        producto.Id,

                    Cantidad =
                        itemDto.Cantidad,

                    PrecioUnitario =
                        producto.Precio,

                    Subtotal =
                        subtotalDetalle
                }
            );
        }

        pedido.Subtotal = subtotal;

        pedido.Total =
            subtotal +
            pedido.Envio;

        _context.Pedidos.Add(pedido);

        await _context.SaveChangesAsync();

        var pedidoCreado =
            await _context.Pedidos
                .Where(p =>
                    p.Id == pedido.Id &&
                    p.UsuarioId == usuarioId)
                .Select(p => new
                {
                    p.Id,
                    p.UsuarioId,
                    p.ComercioId,

                    comercio =
                        p.Comercio.Nombre,

                    p.Fecha,
                    p.Estado,

                    p.TipoEntrega,
                    p.DireccionEntrega,
                    p.LatitudEntrega,
                    p.LongitudEntrega,
                    p.TelefonoEntrega,
                    p.ReferenciaEntrega,
                    p.IndicacionesEntrega,

                    p.TipoTiempo,
                    p.FechaProgramada,

                    p.Subtotal,
                    p.Envio,
                    p.Total,

                    detalles =
                        p.Detalles.Select(d =>
                            new
                            {
                                d.ProductoId,

                                producto =
                                    d.Producto.Nombre,

                                d.Cantidad,
                                d.PrecioUnitario,
                                d.Subtotal
                            }
                        )
                })
                .FirstAsync();

        return CreatedAtAction(
            nameof(GetPedido),
            new
            {
                id = pedido.Id
            },
            pedidoCreado
        );
    }

    // =========================
    // GET: api/Pedidos/5
    // =========================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPedido(
        int id
    )
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
            return Unauthorized();
        }

        var pedido =
            await _context.Pedidos
                .Where(p =>
                    p.Id == id &&
                    p.UsuarioId == usuarioId)
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,

                    p.TipoEntrega,
                    p.DireccionEntrega,
                    p.LatitudEntrega,
                    p.LongitudEntrega,
                    p.TelefonoEntrega,
                    p.ReferenciaEntrega,
                    p.IndicacionesEntrega,

                    p.TipoTiempo,
                    p.FechaProgramada,

                    p.Subtotal,
                    p.Envio,
                    p.Total,

                    p.ComercioId,

                    comercio =
                        p.Comercio.Nombre,

                    detalles =
                        p.Detalles.Select(d =>
                            new
                            {
                                d.ProductoId,

                                producto =
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
                    "Pedido no encontrado."
            });
        }

        return Ok(pedido);
    }

    // =========================
    // GET: api/Pedidos/mis-pedidos
    // =========================
    [HttpGet("mis-pedidos")]
    public async Task<IActionResult> MisPedidos()
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
            return Unauthorized();
        }

        var pedidos =
            await _context.Pedidos
                .Where(p =>
                    p.UsuarioId == usuarioId)
                .OrderByDescending(p =>
                    p.Fecha)
                .Select(p => new
                {
                    p.Id,
                    p.Fecha,
                    p.Estado,

                    p.TipoEntrega,
                    p.TipoTiempo,
                    p.FechaProgramada,

                    p.Subtotal,
                    p.Envio,
                    p.Total,

                    p.ComercioId,

                    comercio =
                        p.Comercio.Nombre
                })
                .ToListAsync();

        return Ok(pedidos);
    }

        // =========================
    // GET: api/Pedidos/comercio
    // =========================
    [HttpGet("comercio")]
    public async Task<IActionResult> PedidosComercio()
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        if (usuario.Rol != "Comercio")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "No tienes permisos para consultar pedidos de comercio."
                }
            );
        }

        if (usuario.ComercioId == null)
        {
            return BadRequest(new
            {
                mensaje =
                    "El usuario de comercio no está asociado a ningún comercio."
            });
        }

        var pedidos = await _context.Pedidos
            .Where(p =>
                p.ComercioId ==
                usuario.ComercioId.Value)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new
            {
                p.Id,

                p.Fecha,
                p.Estado,

                p.TipoEntrega,
                p.TipoTiempo,
                p.FechaProgramada,

                p.Subtotal,
                p.Envio,
                p.Total,

                p.UsuarioId,

                cliente = p.Usuario.Nombre,

                telefonoCliente =
                    p.Usuario.Telefono,

                p.DireccionEntrega,
                p.TelefonoEntrega,
                p.ReferenciaEntrega,
                p.IndicacionesEntrega,

                p.LatitudEntrega,
                p.LongitudEntrega,

                p.ComercioId,

                comercio =
                    p.Comercio.Nombre,

                cantidadProductos =
                    p.Detalles.Sum(d =>
                        d.Cantidad)
            })
            .ToListAsync();

        return Ok(pedidos);
    }

    // =========================
    // GET: api/Pedidos/comercio/5
    // =========================
    [HttpGet("comercio/{id:int}")]
    public async Task<IActionResult> DetallePedidoComercio(int id)
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        if (usuario.Rol != "Comercio")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "No tienes permisos para consultar pedidos de comercio."
                }
            );
        }

        if (usuario.ComercioId == null)
        {
            return BadRequest(new
            {
                mensaje =
                    "El usuario no está asociado a un comercio."
            });
        }

        var pedido = await _context.Pedidos
            .Where(p =>
                p.Id == id &&
                p.ComercioId ==
                usuario.ComercioId.Value)
            .Select(p => new
            {
                p.Id,
                p.Fecha,
                p.Estado,

                p.UsuarioId,

                cliente =
                    p.Usuario.Nombre,

                correoCliente =
                    p.Usuario.Correo,

                telefonoCliente =
                    p.Usuario.Telefono,

                p.TipoEntrega,
                p.DireccionEntrega,
                p.TelefonoEntrega,
                p.ReferenciaEntrega,
                p.IndicacionesEntrega,

                p.LatitudEntrega,
                p.LongitudEntrega,

                p.TipoTiempo,
                p.FechaProgramada,

                p.Subtotal,
                p.Envio,
                p.Total,

                p.ComercioId,

                comercio =
                    p.Comercio.Nombre,

                detalles =
                    p.Detalles.Select(d =>
                        new
                        {
                            d.ProductoId,

                            producto =
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
                    "Pedido no encontrado para este comercio."
            });
        }

        return Ok(pedido);
    }

    // =========================
    // PUT: api/Pedidos/5/estado
    // =========================
    [HttpPut("{id:int}/estado")]
    public async Task<IActionResult> ActualizarEstado(
        int id,
        ActualizarEstadoPedidoDto dto
    )
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId &&
                    u.Activo);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        // Solo Comercio y Administrador
        // pueden cambiar estados.
        if (
            usuario.Rol != "Comercio" &&
            usuario.Rol != "Administrador"
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "No tienes permisos para cambiar el estado del pedido."
                }
            );
        }

        var estadosPermitidos = new[]
        {
            "Pendiente",
            "Confirmado",
            "Preparando",
            "Listo para recoger",
            "Asignado a repartidor",
            "En camino",
            "Entregado",
            "Cancelado",
            "Rechazado"
        };

        if (!estadosPermitidos.Contains(
            dto.Estado
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "Estado no válido."
            });
        }

        Pedido? pedido;

        // Si es usuario de Comercio,
        // solo puede modificar pedidos
        // de SU propio comercio.
        if (usuario.Rol == "Comercio")
        {
            if (usuario.ComercioId == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El usuario no está asociado a ningún comercio."
                });
            }

            pedido =
                await _context.Pedidos
                    .FirstOrDefaultAsync(p =>
                        p.Id == id &&
                        p.ComercioId ==
                        usuario.ComercioId.Value);
        }
        else
        {
            // Administrador de DeliveryLocal
            // puede consultar cualquier pedido.
            pedido =
                await _context.Pedidos
                    .FirstOrDefaultAsync(p =>
                        p.Id == id);
        }

        if (pedido == null)
{
    return NotFound(new
    {
        mensaje =
            "Pedido no encontrado o no pertenece a este comercio."
    });
}

            var transicionesPermitidas = new Dictionary<string, string[]>
            {
                {
                    "Pendiente",
                    new[]
                    {
                        "Confirmado",
                        "Rechazado"
                    }
                },
                {
                    "Confirmado",
                    new[]
                    {
                        "Preparando",
                        "Rechazado"
                    }
                },
                {
                    "Preparando",
                    new[]
                    {
                        "Listo para recoger"
                    }
                },
                {
                    "Listo para recoger",
                    pedido.TipoEntrega == "Recoger"
                        ? new[]
                        {
                            "Entregado"
                        }
                        : new[]
                        {
                            "Asignado a repartidor"
                        }
                },
                {
                    "Asignado a repartidor",
                    new[]
                    {
                        "En camino"
                    }
                },
                {
                    "En camino",
                    new[]
                    {
                        "Entregado"
                    }
                },
                {
                    "Entregado",
                    Array.Empty<string>()
                },
                {
                    "Rechazado",
                    Array.Empty<string>()
                },
                {
                    "Cancelado",
                    Array.Empty<string>()
                }
            };

            if (!transicionesPermitidas.TryGetValue(
                pedido.Estado,
                out var siguientesEstados
            ))
            {
                return BadRequest(new
                {
                    mensaje =
                        $"El estado actual '{pedido.Estado}' no es válido."
                });
            }

            if (!siguientesEstados.Contains(dto.Estado))
            {
                return BadRequest(new
                {
                    mensaje =
                        $"No se puede cambiar de '{pedido.Estado}' a '{dto.Estado}'."
                });
            }

            pedido.Estado =
                dto.Estado;

            await _context.SaveChangesAsync();

        return Ok(new
        {
            pedido.Id,
            pedido.Estado,

            mensaje =
                "Estado del pedido actualizado correctamente."
        });
    }



    
}