
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
    private readonly IWebHostEnvironment _environment;

    public PagosController(
        DeliveryDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // ==========================================
    // SUBIR COMPROBANTE DE TRANSFERENCIA
    // POST: api/Pagos/pedido/5/comprobante
    // ==========================================

    [HttpPost("pedido/{pedidoId:int}/comprobante")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SubirComprobante(
        int pedidoId,
        IFormFile archivo)
    {
        var usuarioIdTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(usuarioIdTexto, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "Sesión no válida."
            });
        }

        var pedido = await _context.Pedidos
            .FirstOrDefaultAsync(p =>
                p.Id == pedidoId &&
                p.UsuarioId == usuarioId);

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        if (pedido.MetodoPago != "Transferencia")
        {
            return BadRequest(new
            {
                mensaje = "El pedido no utiliza transferencia bancaria."
            });
        }

        if (pedido.Estado == "Cancelado")
        {
            return BadRequest(new
            {
                mensaje = "No se aceptan comprobantes de pedidos cancelados."
            });
        }

            bool primerComprobante =
            pedido.EstadoPago == "Pendiente" &&
            string.IsNullOrEmpty(pedido.ComprobantePagoUrl);

        bool reenviarComprobante =
            pedido.EstadoPago == "Rechazado";

        if (!primerComprobante && !reenviarComprobante)
        {
            return Conflict(new
            {
                mensaje = "Este pedido no admite un nuevo comprobante."
            });
        }

        if (archivo == null ||
            archivo.Length == 0 ||
            archivo.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                mensaje = "Selecciona una imagen de máximo 5 MB."
            });
        }

        var extension = Path.GetExtension(
            archivo.FileName).ToLowerInvariant();

        if (extension != ".jpg" &&
            extension != ".jpeg" &&
            extension != ".png" &&
            extension != ".webp")
        {
            return BadRequest(new
            {
                mensaje = "Solo se permiten imágenes JPG, PNG o WEBP."
            });
        }

        // Verificar la firma del archivo.
        if (archivo.Length < 12)
        {
            return BadRequest(new
            {
                mensaje = "La imagen no es válida."
            });
        }

        var encabezado = new byte[12];

        await using (var lectura = archivo.OpenReadStream())
        {
            await lectura.ReadExactlyAsync(encabezado);
        }

        bool esJpeg =
            encabezado[0] == 0xFF &&
            encabezado[1] == 0xD8 &&
            encabezado[2] == 0xFF;

        bool esPng =
            encabezado.AsSpan(0, 8).SequenceEqual(
                new byte[] {
                    137, 80, 78, 71, 13, 10, 26, 10
                });

        bool esWebp =
            System.Text.Encoding.ASCII.GetString(
                encabezado, 0, 4) == "RIFF" &&
            System.Text.Encoding.ASCII.GetString(
                encabezado, 8, 4) == "WEBP";

        bool firmaValida = extension switch
        {
            ".jpg" or ".jpeg" => esJpeg,
            ".png" => esPng,
            ".webp" => esWebp,
            _ => false
        };

        if (!firmaValida)
        {
            return BadRequest(new
            {
                mensaje = "El contenido no corresponde a una imagen válida."
            });
        }

        // Almacenamiento privado para pruebas locales.
        var carpeta = Path.Combine(
            _environment.ContentRootPath,
            "ArchivosPrivados",
            "Comprobantes");

        string? rutaCompleta = null;

        try
        {
            Directory.CreateDirectory(carpeta);

            var nombreArchivo =
                $"{Guid.NewGuid():N}{extension}";

            rutaCompleta = Path.Combine(
                carpeta,
                nombreArchivo);

            await using (var stream = new FileStream(
                rutaCompleta,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true))
            {
                await archivo.CopyToAsync(stream);
            }

            pedido.ComprobantePagoUrl = nombreArchivo;
            pedido.EstadoPago = "ComprobanteSubido";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                pedidoId = pedido.Id,
                estadoPago = pedido.EstadoPago,
                mensaje = "Comprobante recibido. Pendiente de verificación."
            });
        }
        catch
        {
            if (rutaCompleta != null &&
                System.IO.File.Exists(rutaCompleta))
            {
                System.IO.File.Delete(rutaCompleta);
            }

            return StatusCode(500, new
            {
                mensaje = "No fue posible guardar el comprobante."
            });
        }
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

    // ==========================================
    // ADMIN: CONSULTAR COMPROBANTE PRIVADO
    // GET: api/Pagos/admin/pedido/19/comprobante
    // ==========================================

    [HttpGet("admin/pedido/{pedidoId:int}/comprobante")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerComprobanteAdmin(
        int pedidoId)
    {
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Where(p =>
                p.Id == pedidoId &&
                p.MetodoPago == "Transferencia")
            .Select(p => new
            {
                p.ComprobantePagoUrl
            })
            .FirstOrDefaultAsync();

        if (pedido == null ||
            string.IsNullOrWhiteSpace(pedido.ComprobantePagoUrl))
        {
            return NotFound(new
            {
                mensaje = "No se encontró un comprobante."
            });
        }

        // Evitar utilizar rutas proporcionadas por el cliente.
        var nombreArchivo = Path.GetFileName(
            pedido.ComprobantePagoUrl);

        if (nombreArchivo != pedido.ComprobantePagoUrl)
        {
            return BadRequest(new
            {
                mensaje = "Nombre de archivo no válido."
            });
        }

        var ruta = Path.Combine(
            _environment.ContentRootPath,
            "ArchivosPrivados",
            "Comprobantes",
            nombreArchivo);

        if (!System.IO.File.Exists(ruta))
        {
            return NotFound(new
            {
                mensaje = "El archivo no está disponible."
            });
        }

        var extension = Path.GetExtension(
            nombreArchivo).ToLowerInvariant();

        var tipoContenido = extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => null
        };

        if (tipoContenido == null)
        {
            return BadRequest(new
            {
                mensaje = "Formato de comprobante no permitido."
            });
        }

        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return PhysicalFile(ruta, tipoContenido);
    }

    // ==========================================
    // ADMIN: VERIFICAR TRANSFERENCIA
    // POST: api/Pagos/admin/pedido/19/verificar
    // ==========================================

    [HttpPost("admin/pedido/{pedidoId:int}/verificar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> VerificarTransferenciaAdmin(
        int pedidoId)
    {
        var pedido = await _context.Pedidos
            .FirstOrDefaultAsync(p => p.Id == pedidoId);

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "Pedido no encontrado."
            });
        }

        if (pedido.MetodoPago != "Transferencia")
        {
            return BadRequest(new
            {
                mensaje = "Este pedido no utiliza transferencia."
            });
        }

        if (pedido.Estado != "Pendiente")
        {
            return Conflict(new
            {
                mensaje = "El pedido no está pendiente."
            });
        }

        if (pedido.EstadoPago != "ComprobanteSubido" ||
            string.IsNullOrWhiteSpace(pedido.ComprobantePagoUrl))
        {
            return Conflict(new
            {
                mensaje = "El pedido no tiene un comprobante pendiente de revisión."
            });
        }

        var nombreArchivo = Path.GetFileName(
            pedido.ComprobantePagoUrl);

        if (nombreArchivo != pedido.ComprobantePagoUrl)
        {
            return Conflict(new
            {
                mensaje = "El comprobante tiene una ruta no válida."
            });
        }

        var ruta = Path.Combine(
            _environment.ContentRootPath,
            "ArchivosPrivados",
            "Comprobantes",
            nombreArchivo);

        if (!System.IO.File.Exists(ruta))
        {
            return Conflict(new
            {
                mensaje = "El comprobante no está disponible."
            });
        }

        // Registrar cuándo se verificó la transferencia.
        DateTime? fechaVerificacionUtc = DateTime.UtcNow;

        // Actualizar el pago y su fecha en una sola operación.
        // También evita verificar dos veces el mismo comprobante.
        var filasActualizadas = await _context.Pedidos
            .Where(p =>
                p.Id == pedidoId &&
                p.MetodoPago == "Transferencia" &&
                p.Estado == "Pendiente" &&
                p.EstadoPago == "ComprobanteSubido" &&
                p.ComprobantePagoUrl == nombreArchivo)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.EstadoPago, "Verificado")
                .SetProperty(p => p.FechaVerificacionPago, fechaVerificacionUtc));

        if (filasActualizadas == 0)
        {
            return Conflict(new
            {
                mensaje = "El pedido o el comprobante cambió. Actualiza la pantalla."
            });
        }

        // Mantener actualizado el objeto usado en la respuesta.
        pedido.EstadoPago = "Verificado";
        pedido.FechaVerificacionPago = fechaVerificacionUtc;
        
        return Ok(new
        {
            pedidoId = pedido.Id,
            estadoPago = pedido.EstadoPago,
            mensaje = "Transferencia marcada como verificada."
        });
    }

    // ==========================================
    // ADMIN: RECHAZAR COMPROBANTE
    // POST: api/Pagos/admin/pedido/19/rechazar
    // ==========================================

    [HttpPost("admin/pedido/{pedidoId:int}/rechazar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> RechazarTransferenciaAdmin(
        int pedidoId)
    {
        var filasActualizadas = await _context.Pedidos
            .Where(p =>
                p.Id == pedidoId &&
                p.MetodoPago == "Transferencia" &&
                p.Estado == "Pendiente" &&
                p.EstadoPago == "ComprobanteSubido" &&
                p.ComprobantePagoUrl != null &&
                p.ComprobantePagoUrl != "")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    p => p.EstadoPago,
                    "Rechazado"));

        if (filasActualizadas == 0)
        {
            return Conflict(new
            {
                mensaje = "El pedido no tiene un comprobante disponible para rechazar."
            });
        }

        return Ok(new
        {
            pedidoId,
            estadoPago = "Rechazado",
            mensaje = "Comprobante rechazado. El cliente deberá enviar uno nuevo."
        });
    }
}
