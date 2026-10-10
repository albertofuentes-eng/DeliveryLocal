
using DeliveryApi.Data;
using DeliveryApi.DTOs;
using DeliveryApi.Models;
using DeliveryApi.Services;
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
    private readonly ExpoPushService _expoPushService;

    public PedidosController(
        DeliveryDbContext context,
        ExpoPushService expoPushService)
    {
        _context = context;
        _expoPushService = expoPushService;
    }

    // ==========================================
    // DISPONIBILIDAD DE ENTREGA
    // GET: api/Pedidos/disponibilidad-entrega
    // ==========================================

    [HttpGet("disponibilidad-entrega")]
    public async Task<IActionResult> DisponibilidadEntrega()
    {
        var hayRepartidores = await _context.Repartidores
            .AnyAsync(r => r.Activo);

        var hayDisponibles = await _context.Repartidores
            .AnyAsync(r => r.Activo && r.Disponible);

        return Ok(new
        {
            hayRepartidores,
            hayDisponibles
        });
    }

    // ==========================================
    // CREAR PEDIDO
    // POST: api/Pedidos
    // ==========================================

    [HttpPost]
    public async Task<IActionResult> CrearPedido(CrearPedidoDto dto)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        if (dto.Productos == null || dto.Productos.Count == 0)
        {
            return BadRequest(new
            {
                mensaje = "El pedido debe contener productos."
            });
        }

        var tiposEntregaPermitidos = new[]
        {
            "Domicilio",
            "Recoger"
        };

        if (!tiposEntregaPermitidos.Contains(dto.TipoEntrega))
        {
            return BadRequest(new
            {
                mensaje = "El tipo de entrega no es válido."
            });
        }

        var tiposTiempoPermitidos = new[]
        {
            "Ahora",
            "Despues"
        };

        if (!tiposTiempoPermitidos.Contains(dto.TipoTiempo))
        {
            return BadRequest(new
            {
                mensaje = "El tipo de tiempo no es válido."
            });
        }

        // ==========================================
        // FASE 3: VALIDACIÓN DEL MÉTODO DE PAGO
        // ==========================================

        var metodosPagoPermitidos = new[]
        {
            "Efectivo",
            "Transferencia"
        };

        var metodoPago = dto.MetodoPago?.Trim();

        if (string.IsNullOrWhiteSpace(metodoPago) ||
            !metodosPagoPermitidos.Contains(metodoPago))
        {
            return BadRequest(new
            {
                mensaje = "Selecciona un método de pago válido: Efectivo o Transferencia."
            });
        }

        if (dto.TipoEntrega == "Domicilio")
        {
            var existenRepartidores = await _context.Repartidores
                .AnyAsync(r => r.Activo);

            if (!existenRepartidores)
            {
                return BadRequest(new
                {
                    mensaje = "Entrega a domicilio no disponible por el momento."
                });
            }

            if (dto.TipoTiempo == "Ahora")
            {
                var hayRepartidoresDisponibles =
                    await _context.Repartidores.AnyAsync(
                        r => r.Activo && r.Disponible
                    );

                if (!hayRepartidoresDisponibles)
                {
                    return BadRequest(new
                    {
                        mensaje = "No hay repartidores disponibles en este momento."
                    });
                }
            }

            if (string.IsNullOrWhiteSpace(dto.DireccionEntrega))
            {
                return BadRequest(new
                {
                    mensaje = "La dirección de entrega es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.TelefonoEntrega))
            {
                return BadRequest(new
                {
                    mensaje = "El teléfono de entrega es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.ReferenciaEntrega))
            {
                return BadRequest(new
                {
                    mensaje = "La referencia de entrega es obligatoria."
                });
            }
        }

        if (dto.TipoTiempo == "Despues")
        {
            if (dto.FechaProgramada == null)
            {
                return BadRequest(new
                {
                    mensaje = "Debes indicar la fecha y hora programada."
                });
            }

            if (dto.FechaProgramada <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    mensaje = "La fecha programada debe ser futura."
                });
            }
        }

        var comercio = await _context.Comercios
            .FirstOrDefaultAsync(c =>
                c.Id == dto.ComercioId &&
                c.Activo
            );

        if (comercio == null)
        {
            return BadRequest(new
            {
                mensaje = "El comercio indicado no existe."
            });
        }

        var pedido = new Pedido
        {
            UsuarioId = usuarioId,
            ComercioId = dto.ComercioId,
            Fecha = DateTime.UtcNow,
            Estado = "Pendiente",
            TipoEntrega = dto.TipoEntrega,
            TipoTiempo = dto.TipoTiempo,
            FechaProgramada = dto.TipoTiempo == "Despues"
                ? dto.FechaProgramada
                : null,
            Envio = dto.TipoEntrega == "Domicilio"
                ? 15
                : 0,

            // FASE 3: MÉTODO Y ESTADO INICIAL DEL PAGO
            MetodoPago = metodoPago,
            EstadoPago = "Pendiente"
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
                    mensaje = "La cantidad debe ser mayor que cero."
                });
            }

            var producto = await _context.Productos
                .FirstOrDefaultAsync(p =>
                    p.Id == itemDto.ProductoId &&
                    p.Disponible
                );

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
                producto.Precio * itemDto.Cantidad;

            subtotal += subtotalDetalle;

            pedido.Detalles.Add(new DetallePedido
            {
                ProductoId = producto.Id,
                Cantidad = itemDto.Cantidad,
                PrecioUnitario = producto.Precio,
                Subtotal = subtotalDetalle
            });
        }


        // ==========================================
        // IMPORTES DEL PEDIDO
        // ==========================================

        pedido.Subtotal = subtotal;
        pedido.Total = subtotal + pedido.Envio;

        // ==========================================
        // FASE 3: DISTRIBUCIÓN DEL DINERO
        // ==========================================

        // El comercio recibe el importe de sus productos.
        pedido.MontoComercio = subtotal;

        // DeliveryLocal obtiene el ingreso bruto del envío.
        // Si el cliente recoge su pedido, el envío es Q0.
        pedido.MontoDeliveryLocal = pedido.Envio;

        // Todavía no se ha procesado ningún pago.
        pedido.EstadoPago = "Pendiente";

        // Todavía no se ha distribuido el dinero.
        pedido.EstadoLiquidacion = "Pendiente";

        // Estos valores se registrarán cuando exista
        // una operación real con la pasarela.
        pedido.ComisionPasarela = null;
        pedido.ReferenciaPagoExterno = null;
        pedido.ProveedorPago = null;
        pedido.FechaLiquidacion = null;


        // ==========================================
        // FASE 3: TOKEN ÚNICO DE ENTREGA
        // ==========================================

        pedido.TokenEntrega = "DL-" +
            Convert.ToHexString(
                System.Security.Cryptography.RandomNumberGenerator
                    .GetBytes(16)
            );

        pedido.TokenUsado = false;


        // ==========================================
        // FASE 3: GUARDAR PEDIDO Y LIQUIDACIONES
        // ==========================================

        // Crear las liquidaciones relacionadas con
        // el pedido antes de guardar los cambios.
        // EF Core asignará el PedidoId automáticamente.

        var liquidacionComercio = new LiquidacionPago
        {
            Pedido = pedido,
            Beneficiario = "Comercio",
            MontoBruto = pedido.MontoComercio,
            Comision = 0m,
            MontoNeto = pedido.MontoComercio,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        var liquidacionDeliveryLocal = new LiquidacionPago
        {
            Pedido = pedido,
            Beneficiario = "DeliveryLocal",
            MontoBruto = pedido.MontoDeliveryLocal,
            Comision = 0m,
            MontoNeto = pedido.MontoDeliveryLocal,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        _context.Pedidos.Add(pedido);

        _context.LiquidacionesPago.AddRange(
            liquidacionComercio,
            liquidacionDeliveryLocal
        );

        // EF Core guarda el pedido y sus liquidaciones
        // en una misma operación transaccional.
        await _context.SaveChangesAsync();


        var pedidoCreado = await _context.Pedidos
            .Where(p =>
                p.Id == pedido.Id &&
                p.UsuarioId == usuarioId
            )
            .Select(p => new
            {
                p.Id,
                p.UsuarioId,
                p.ComercioId,
                comercio = p.Comercio.Nombre,
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
                p.TokenEntrega,
                p.MetodoPago,
                p.EstadoPago,
                detalles = p.Detalles.Select(d => new
                {
                    d.ProductoId,
                    producto = d.Producto.Nombre,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.Subtotal
                })
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetPedido),
            new { id = pedido.Id },
            pedidoCreado
        );
    }


    // ==========================================
    // DETALLE DE PEDIDO DEL CLIENTE
    // GET: api/Pedidos/{id}
    // ==========================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPedido(int id)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized();
        }

        var pedido = await _context.Pedidos
            .Where(p =>
                p.Id == id &&
                p.UsuarioId == usuarioId
            )
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
                comercio = p.Comercio.Nombre,
                detalles = p.Detalles.Select(d => new
                {
                    d.ProductoId,
                    producto = d.Producto.Nombre,
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
                mensaje = "Pedido no encontrado."
            });
        }

        return Ok(pedido);
    }

    // ==========================================
    // FASE 3: CÓDIGO DE ENTREGA DEL CLIENTE
    // GET: api/Pedidos/{id}/token-entrega
    // NUEVO MÉTODO
    // ==========================================

    [HttpGet("{id:int}/token-entrega")]
    public async Task<IActionResult> ObtenerTokenEntregaCliente(int id)
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

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo
            );

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        // Solo el propietario puede consultar este código.
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Where(p =>
                p.Id == id &&
                p.UsuarioId == usuarioId
            )
            .Select(p => new
            {
                p.Id,
                p.Estado,
                p.TipoEntrega,
                p.TokenEntrega,
                p.TokenUsado
            })
            .FirstOrDefaultAsync();

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        // Un código utilizado o de un pedido finalizado
        // no debe volver a mostrarse.
        if (
            pedido.Estado == "Cancelado" ||
            pedido.Estado == "Rechazado" ||
            pedido.Estado == "Entregado" ||
            pedido.TokenUsado
        )
        {
            return Ok(new
            {
                disponible = false,
                tokenEntrega = (string?)null,
                mensaje = "El código ya no está disponible."
            });
        }

        // El código aparece únicamente cuando se
        // necesita confirmar la entrega física.
        bool puedeMostrar =
            pedido.TipoEntrega == "Recoger"
                ? pedido.Estado == "Listo para recoger"
                : pedido.TipoEntrega == "Domicilio" &&
                  pedido.Estado == "En camino";

        if (!puedeMostrar)
        {
            return Ok(new
            {
                disponible = false,
                tokenEntrega = (string?)null,
                mensaje =
                    "El código aparecerá cuando el pedido esté listo para entregarse."
            });
        }

        if (string.IsNullOrWhiteSpace(pedido.TokenEntrega))
        {
            return Ok(new
            {
                disponible = false,
                tokenEntrega = (string?)null,
                mensaje =
                    "Este pedido todavía no tiene un código de seguridad."
            });
        }

        return Ok(new
        {
            disponible = true,
            tokenEntrega = pedido.TokenEntrega,
            mensaje = "Código de entrega disponible."
        });
    }

    // ==========================================
    // LISTA DE PEDIDOS DEL CLIENTE
    // GET: api/Pedidos/mis-pedidos
    // ==========================================

    [HttpGet("mis-pedidos")]
    public async Task<IActionResult> MisPedidos()
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized();
        }

        var pedidos = await _context.Pedidos
            .Where(p => p.UsuarioId == usuarioId)
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
                p.ComercioId,
                comercio = p.Comercio.Nombre
            })
            .ToListAsync();

        return Ok(pedidos);
    }

    // ==========================================
    // PEDIDOS DEL ADMINISTRADOR
    // GET: api/Pedidos/admin
    // ==========================================

    [HttpGet("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerPedidosAdmin()
    {
        var pedidos = await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Include(p => p.Comercio)
            .Include(p => p.Repartidor)
                .ThenInclude(r => r!.Usuario)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .OrderByDescending(p => p.Fecha)
            .Select(p => new
            {
                id = p.Id,
                fecha = p.Fecha,
                fechaEntrega = p.FechaEntrega,
                fechaProgramada = p.FechaProgramada,
                estado = p.Estado,
                tipoEntrega = p.TipoEntrega,
                tipoTiempo = p.TipoTiempo,
                direccionEntrega = p.DireccionEntrega,
                latitudEntrega = p.LatitudEntrega,
                longitudEntrega = p.LongitudEntrega,
                telefonoEntrega = p.TelefonoEntrega,
                referenciaEntrega = p.ReferenciaEntrega,
                indicacionesEntrega = p.IndicacionesEntrega,
                subtotal = p.Subtotal,
                envio = p.Envio,
                total = p.Total,

                cliente = new
                {
                    id = p.Usuario.Id,
                    nombre = p.Usuario.Nombre,
                    correo = p.Usuario.Correo,
                    telefono = p.Usuario.Telefono
                },

                comercio = new
                {
                    id = p.Comercio.Id,
                    nombre = p.Comercio.Nombre,
                    direccion = p.Comercio.Direccion,
                    telefono = p.Comercio.Telefono
                },

                repartidor = p.Repartidor == null
                    ? null
                    : new
                    {
                        id = p.Repartidor.Id,
                        nombre = p.Repartidor.Usuario.Nombre,
                        telefono = p.Repartidor.Usuario.Telefono,
                        tipoVehiculo = p.Repartidor.TipoVehiculo,
                        placa = p.Repartidor.Placa
                    },

                detalles = p.Detalles.Select(d => new
                {
                    id = d.Id,
                    productoId = d.ProductoId,
                    producto = d.Producto.Nombre,
                    cantidad = d.Cantidad,
                    precioUnitario = d.PrecioUnitario,
                    subtotal = d.Subtotal
                }).ToList()
            })
            .ToListAsync();

        return Ok(pedidos);
    }

    // ==========================================
    // PEDIDOS DEL COMERCIO
    // GET: api/Pedidos/comercio
    // ==========================================

    [HttpGet("comercio")]
    public async Task<IActionResult> PedidosComercio()
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo
            );

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
                p.ComercioId == usuario.ComercioId.Value
            )
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
                telefonoCliente = p.Usuario.Telefono,
                p.DireccionEntrega,
                p.TelefonoEntrega,
                p.ReferenciaEntrega,
                p.IndicacionesEntrega,
                p.LatitudEntrega,
                p.LongitudEntrega,
                p.ComercioId,
                comercio = p.Comercio.Nombre,
                cantidadProductos = p.Detalles.Sum(
                    d => d.Cantidad
                )
            })
            .ToListAsync();

        return Ok(pedidos);
    }

    // ==========================================
    // DETALLE DEL PEDIDO PARA EL COMERCIO
    // GET: api/Pedidos/comercio/{id}
    // ==========================================

    [HttpGet("comercio/{id:int}")]
    public async Task<IActionResult> DetallePedidoComercio(int id)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo
            );

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
                p.ComercioId == usuario.ComercioId.Value
            )
            .Select(p => new
            {
                p.Id,
                p.Fecha,
                p.Estado,
                p.UsuarioId,
                cliente = p.Usuario.Nombre,
                correoCliente = p.Usuario.Correo,
                telefonoCliente = p.Usuario.Telefono,
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
                comercio = p.Comercio.Nombre,
                detalles = p.Detalles.Select(d => new
                {
                    d.ProductoId,
                    producto = d.Producto.Nombre,
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
                mensaje = "Pedido no encontrado para este comercio."
            });
        }

        return Ok(pedido);
    }

    // ==========================================
    // FASE 3: CONFIRMAR RECOGIDA EN COMERCIO
    // PUT: api/Pedidos/{id}/confirmar-recogida
    // ==========================================

    [HttpPut("{id:int}/confirmar-recogida")]
    public async Task<IActionResult> ConfirmarRecogida(
        int id,
        [FromBody] ConfirmarEntregaComercioDto dto)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        if (
            dto == null ||
            string.IsNullOrWhiteSpace(dto.TokenEntrega)
        )
        {
            return BadRequest(new
            {
                mensaje = "Debes ingresar el código del cliente."
            });
        }

        var codigo = dto.TokenEntrega
            .Trim()
            .ToUpperInvariant();

        if (codigo.Length > 35)
        {
            return BadRequest(new
            {
                mensaje = "Código de entrega no válido."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo
            );

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        if (
            usuario.Rol != "Comercio" ||
            usuario.ComercioId == null
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo el comercio responsable puede confirmar la recogida."
                }
            );
        }

        var pedido = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.Id == id &&
                p.ComercioId == usuario.ComercioId.Value
            );

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Pedido no encontrado para este comercio."
            });
        }

        if (pedido.TipoEntrega != "Recoger")
        {
            return BadRequest(new
            {
                mensaje =
                    "Este pedido no es para recoger en el comercio."
            });
        }

        if (pedido.Estado != "Listo para recoger")
        {
            return BadRequest(new
            {
                mensaje =
                    "El pedido debe estar listo para recoger."
            });
        }

        if (pedido.TokenUsado)
        {
            return BadRequest(new
            {
                mensaje = "Este código ya fue utilizado."
            });
        }

        if (string.IsNullOrWhiteSpace(pedido.TokenEntrega))
        {
            return BadRequest(new
            {
                mensaje =
                    "El pedido no tiene código de seguridad."
            });
        }

        var ahora = DateTime.UtcNow;

        // Actualización atómica: el token solo puede usarse una vez.
        var filasActualizadas = await _context.Pedidos
            .Where(p =>
                p.Id == id &&
                p.ComercioId == usuario.ComercioId.Value &&
                p.TipoEntrega == "Recoger" &&
                p.Estado == "Listo para recoger" &&
                !p.TokenUsado &&
                p.TokenEntrega == codigo
            )
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    p => p.Estado,
                    "Entregado"
                )
                .SetProperty(
                    p => p.TokenUsado,
                    true
                )
                .SetProperty(
                    p => p.FechaEntrega,
                    ahora
                )
                .SetProperty(
                    p => p.FechaConfirmacionEntrega,
                    ahora
                )
            );

        if (filasActualizadas != 1)
        {
            return BadRequest(new
            {
                mensaje =
                    "Código incorrecto, utilizado o pedido no disponible."
            });
        }

        // Confirmar la entrega no verifica el pago.
        return Ok(new
        {
            pedidoId = id,
            estado = "Entregado",
            tokenUsado = true,
            mensaje =
                "Pedido entregado correctamente mediante el código del cliente."
        });
    }

    // ==========================================
    // DTO DE LA RUTA ANTIGUA
    // ==========================================

    public class ConfirmarEntregaTokenDto
    {
        public int PedidoId { get; set; }

        public string TokenInput { get; set; } =
            string.Empty;
    }

    // ==========================================
    // FASE 3: RUTA ANTIGUA DESHABILITADA
    // POST: api/Pedidos/confirmar-entrega
    // ==========================================

    [HttpPost("confirmar-entrega")]
    public IActionResult ConfirmarEntregaConToken(
        [FromBody] ConfirmarEntregaTokenDto dto)
    {
        return StatusCode(
            StatusCodes.Status410Gone,
            new
            {
                mensaje =
                    "Esta ruta de confirmación fue deshabilitada por seguridad. " +
                    "El repartidor debe confirmar la entrega utilizando " +
                    "el código del cliente desde su aplicación."
            }
        );
    }
}
