
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IO;
using System.Linq;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidenciasController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public IncidenciasController(
        DeliveryDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // ==========================================
    // DTO: REGISTRAR INCIDENCIA
    // ==========================================

    public class CrearIncidenciaDto
    {
        public int PedidoId { get; set; }

        public string Motivo { get; set; } = string.Empty;

        public string Descripcion { get; set; } = string.Empty;
    }

    // ==========================================
    // DTO: RESOLVER INCIDENCIA
    // ==========================================

    public class ResolverIncidenciaDto
    {
        public string Estado { get; set; } = string.Empty;

        public string Resolucion { get; set; } = string.Empty;
    }

    // ==========================================
    // OBTENER USUARIO AUTENTICADO
    // ==========================================

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
    // REGISTRAR INCIDENCIA
    // POST: api/Incidencias
    // ==========================================

    [HttpPost]
    [Authorize(Roles = "Repartidor")]
    public async Task<IActionResult> CrearIncidencia(
        [FromBody] CrearIncidenciaDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized(new
            {
                mensaje = "Sesión no válida."
            });
        }

        if (dto == null || dto.PedidoId <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Debes seleccionar un pedido válido."
            });
        }

        var motivosPermitidos = new[]
        {
            "ClienteAusente",
            "DireccionIncorrecta",
            "ClienteRechaza",
            "Accidente",
            "Otro"
        };

        var motivo = dto.Motivo?.Trim();

        if (string.IsNullOrWhiteSpace(motivo) ||
            !motivosPermitidos.Contains(motivo))
        {
            return BadRequest(new
            {
                mensaje = "Selecciona un motivo válido."
            });
        }

        var descripcion = dto.Descripcion?.Trim();

        if (string.IsNullOrWhiteSpace(descripcion) ||
            descripcion.Length > 1000)
        {
            return BadRequest(new
            {
                mensaje =
                    "La descripción es obligatoria y no puede superar 1000 caracteres."
            });
        }

        // Verificar que el usuario es un repartidor activo.
        var repartidor = await _context.Repartidores
            .AsNoTracking()
            .FirstOrDefaultAsync(r =>
                r.UsuarioId == usuarioId.Value &&
                r.Activo);

        if (repartidor == null)
        {
            return StatusCode(403, new
            {
                mensaje = "No tienes permisos para reportar incidencias."
            });
        }

        // Verificar que el pedido está asignado al repartidor.
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.Id == dto.PedidoId &&
                p.RepartidorId == repartidor.Id &&
                p.TipoEntrega == "Domicilio");

        if (pedido == null)
        {
            return NotFound(new
            {
                mensaje = "No tienes un pedido asignado con ese identificador."
            });
        }

        // No aceptar incidencias en pedidos finalizados.
        if (pedido.Estado == "Entregado" ||
            pedido.Estado == "Cancelado" ||
            pedido.Estado == "Rechazado")
        {
            return BadRequest(new
            {
                mensaje = "No puedes reportar incidencias en un pedido finalizado."
            });
        }

        // La incidencia corresponde a un intento de entrega.
        if (pedido.Estado != "En camino")
        {
            return BadRequest(new
            {
                mensaje =
                    "Solo puedes reportar una incidencia cuando el pedido está en camino."
            });
        }

        // Evitar múltiples incidencias pendientes para el mismo pedido.
        var incidenciaPendiente = await _context.IncidenciasPedido
            .AnyAsync(i =>
                i.PedidoId == pedido.Id &&
                (i.Estado == "Pendiente" ||
                 i.Estado == "EnRevision"));

        if (incidenciaPendiente)
        {
            return Conflict(new
            {
                mensaje =
                    "Este pedido ya tiene una incidencia pendiente de resolución."
            });
        }

        var incidencia = new IncidenciaPedido
        {
            PedidoId = pedido.Id,
            RepartidorId = repartidor.Id,
            Motivo = motivo,
            Descripcion = descripcion,
            Estado = "Pendiente",
            FechaReporte = DateTime.UtcNow
        };

        _context.IncidenciasPedido.Add(incidencia);

        await _context.SaveChangesAsync();

        // Registrar una incidencia no entrega ni cancela el pedido.
        return Created(
            $"/api/Incidencias/{incidencia.Id}",
            new
            {
                incidencia.Id,
                incidencia.PedidoId,
                incidencia.Motivo,
                incidencia.Descripcion,
                incidencia.Estado,
                incidencia.FechaReporte,
                mensaje = "Incidencia registrada correctamente."
            }
        );
    }

    // ==========================================
    // MIS INCIDENCIAS COMO REPARTIDOR
    // GET: api/Incidencias/mis-incidencias
    // ==========================================

    [HttpGet("mis-incidencias")]
    [Authorize(Roles = "Repartidor")]
    public async Task<IActionResult> MisIncidencias()
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized();
        }

        var repartidor = await _context.Repartidores
            .AsNoTracking()
            .FirstOrDefaultAsync(r =>
                r.UsuarioId == usuarioId.Value);

        if (repartidor == null)
        {
            return NotFound(new
            {
                mensaje = "Repartidor no encontrado."
            });
        }

        var incidencias = await _context.IncidenciasPedido
            .AsNoTracking()
            .Where(i => i.RepartidorId == repartidor.Id)
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                i.Id,
                i.PedidoId,
                i.Motivo,
                i.Descripcion,
                i.EvidenciaUrl,
                i.Estado,
                i.FechaReporte,
                i.Resolucion,
                i.FechaResolucion
            })
            .ToListAsync();

        return Ok(incidencias);
    }

    // ==========================================
    // ADMINISTRADOR: LISTAR INCIDENCIAS
    // GET: api/Incidencias/admin
    // ==========================================

    [HttpGet("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerIncidenciasAdmin()
    {
        var incidencias = await _context.IncidenciasPedido
            .AsNoTracking()
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                i.Id,
                i.PedidoId,
                i.RepartidorId,
                repartidor = i.Repartidor.Usuario.Nombre,
                i.Motivo,
                i.Descripcion,
                i.EvidenciaUrl,
                i.Estado,
                i.FechaReporte,
                i.AdministradorId,
                i.Resolucion,
                i.FechaResolucion
            })
            .ToListAsync();

        return Ok(incidencias);
    }

    // ==========================================
    // ADMINISTRADOR: RESOLVER INCIDENCIA
    // PUT: api/Incidencias/{id}/resolver
    // ==========================================

    [HttpPut("{id:int}/resolver")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ResolverIncidencia(
        int id,
        [FromBody] ResolverIncidenciaDto dto)
    {
        var administradorId = ObtenerUsuarioId();

        if (administradorId == null)
        {
            return Unauthorized();
        }

        if (dto == null)
        {
            return BadRequest(new
            {
                mensaje = "Debes enviar los datos de resolución."
            });
        }

        var estadosPermitidos = new[]
        {
            "Resuelta",
            "Rechazada"
        };

        var estado = dto.Estado?.Trim();
        var resolucion = dto.Resolucion?.Trim();

        if (string.IsNullOrWhiteSpace(estado) ||
            !estadosPermitidos.Contains(estado))
        {
            return BadRequest(new
            {
                mensaje = "Estado de resolución no válido."
            });
        }

        if (string.IsNullOrWhiteSpace(resolucion) ||
            resolucion.Length > 1000)
        {
            return BadRequest(new
            {
                mensaje =
                    "La resolución es obligatoria y no puede superar 1000 caracteres."
            });
        }

        var incidencia = await _context.IncidenciasPedido
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incidencia == null)
        {
            return NotFound(new
            {
                mensaje = "Incidencia no encontrada."
            });
        }

        if (incidencia.Estado == "Resuelta" ||
            incidencia.Estado == "Rechazada")
        {
            return Conflict(new
            {
                mensaje = "Esta incidencia ya fue finalizada."
            });
        }

        incidencia.Estado = estado;
        incidencia.Resolucion = resolucion;
        incidencia.AdministradorId = administradorId.Value;
        incidencia.FechaResolucion = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Resolver una incidencia no modifica automáticamente
        // el estado del pedido ni confirma una entrega.
        return Ok(new
        {
            incidencia.Id,
            incidencia.PedidoId,
            incidencia.Estado,
            incidencia.Resolucion,
            incidencia.FechaResolucion,
            mensaje = "Incidencia actualizada correctamente."
        });
    }

    // ==========================================
// ADMINISTRADOR: RESOLVER INCIDENCIA
// Y CANCELAR ENTREGA
// PUT: api/Incidencias/{id}/resolver-y-cancelar
// ==========================================

[HttpPut("{id:int}/resolver-y-cancelar")]
[Authorize(Roles = "Administrador")]
public async Task<IActionResult> ResolverYCancelarEntrega(
    int id,
    [FromBody] ResolverIncidenciaDto dto)
{
    var administradorId = ObtenerUsuarioId();

    if (administradorId == null)
        return Unauthorized();

    if (dto == null ||
        dto.Estado?.Trim() != "Resuelta" ||
        string.IsNullOrWhiteSpace(dto.Resolucion) ||
        dto.Resolucion.Trim().Length > 1000)
    {
        return BadRequest(new
        {
            mensaje = "Debes indicar el estado Resuelta y una resolución válida."
        });
    }

    var incidencia = await _context.IncidenciasPedido
        .AsNoTracking()
        .FirstOrDefaultAsync(i => i.Id == id);

    if (incidencia == null)
        return NotFound(new { mensaje = "Incidencia no encontrada." });

    if (incidencia.Estado != "Pendiente")
        return Conflict(new { mensaje = "La incidencia ya fue procesada." });

    var pedido = await _context.Pedidos
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == incidencia.PedidoId);

    if (pedido == null)
        return NotFound(new { mensaje = "Pedido no encontrado." });

    if (pedido.TipoEntrega != "Domicilio" ||
        pedido.Estado != "En camino" ||
        pedido.RepartidorId == null ||
        pedido.RepartidorId != incidencia.RepartidorId)
    {
        return Conflict(new
        {
            mensaje = "El pedido no cumple las condiciones para cancelar esta entrega."
        });
    }

    var repartidorId = pedido.RepartidorId.Value;
    var ahora = DateTime.UtcNow;

    await using var transaccion =
        await _context.Database.BeginTransactionAsync();

    // Cancelar solamente si el pedido sigue en camino.
    var pedidosActualizados = await _context.Pedidos
        .Where(p =>
            p.Id == pedido.Id &&
            p.Estado == "En camino" &&
            p.RepartidorId == repartidorId)
        .ExecuteUpdateAsync(setters => setters
            .SetProperty(p => p.Estado, "Cancelado")
        );

    if (pedidosActualizados != 1)
    {
        await transaccion.RollbackAsync();

        return Conflict(new
        {
            mensaje = "El pedido cambió de estado. Actualiza la información."
        });
    }

    // Resolver únicamente una incidencia pendiente.
    var incidenciasActualizadas = await _context.IncidenciasPedido
        .Where(i =>
            i.Id == id &&
            i.Estado == "Pendiente")
        .ExecuteUpdateAsync(setters => setters
            .SetProperty(i => i.Estado, "Resuelta")
            .SetProperty(i => i.Resolucion, dto.Resolucion.Trim())
            .SetProperty(i => i.AdministradorId, administradorId.Value)
            .SetProperty(i => i.FechaResolucion, ahora)
        );

    if (incidenciasActualizadas != 1)
    {
        await transaccion.RollbackAsync();

        return Conflict(new
        {
            mensaje = "La incidencia cambió de estado. Actualiza la información."
        });
    }

    // No liberar al repartidor si tiene otra entrega activa.
    var tieneOtraEntregaActiva = await _context.Pedidos
        .AnyAsync(p =>
            p.RepartidorId == repartidorId &&
            p.Id != pedido.Id &&
            p.Estado != "Entregado" &&
            p.Estado != "Cancelado");

    var repartidorLiberado = false;

    if (!tieneOtraEntregaActiva)
    {
        var repartidor = await _context.Repartidores
            .FirstOrDefaultAsync(r => r.Id == repartidorId);

        if (repartidor != null)
        {
            repartidor.Disponible = true;
            repartidorLiberado = true;
        }
    }

    await _context.SaveChangesAsync();
    await transaccion.CommitAsync();

    return Ok(new
    {
        incidenciaId = id,
        pedidoId = pedido.Id,
        estadoIncidencia = "Resuelta",
        estadoPedido = "Cancelado",
        repartidorId,
        repartidorLiberado,
        mensaje = "Incidencia resuelta y entrega cancelada correctamente."
    });
}


    // ==========================================
    // FASE 4: SUBIR EVIDENCIA FOTOGRÁFICA
    // POST: api/Incidencias/{id}/evidencia
    // ==========================================

    [HttpPost("{id:int}/evidencia")]
    [Authorize(Roles = "Repartidor")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SubirEvidencia(
        int id,
        IFormFile archivo)
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId == null)
        {
            return Unauthorized(new
            {
                mensaje = "Sesión no válida."
            });
        }

        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Identificador de incidencia inválido."
            });
        }

        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest(new
            {
                mensaje = "Debes seleccionar una fotografía."
            });
        }

        const long maximoBytes = 5 * 1024 * 1024;

        if (archivo.Length > maximoBytes)
        {
            return BadRequest(new
            {
                mensaje = "La fotografía no puede superar 5 MB."
            });
        }

        var repartidor = await _context.Repartidores
            .AsNoTracking()
            .FirstOrDefaultAsync(r =>
                r.UsuarioId == usuarioId.Value);

        if (repartidor == null)
        {
            return StatusCode(403, new
            {
                mensaje = "No tienes permisos de repartidor."
            });
        }

        var incidencia = await _context.IncidenciasPedido
            .FirstOrDefaultAsync(i =>
                i.Id == id &&
                i.RepartidorId == repartidor.Id);

        if (incidencia == null)
        {
            return NotFound(new
            {
                mensaje = "Incidencia no encontrada."
            });
        }

        if (incidencia.Estado != "Pendiente" &&
            incidencia.Estado != "EnRevision")
        {
            return Conflict(new
            {
                mensaje =
                    "No puedes modificar una incidencia finalizada."
            });
        }

        if (!string.IsNullOrWhiteSpace(incidencia.EvidenciaUrl))
        {
            return Conflict(new
            {
                mensaje =
                    "Esta incidencia ya tiene una fotografía registrada."
            });
        }

        // Validar extensión y tipo de contenido.
        var extension = Path
            .GetExtension(archivo.FileName)
            .ToLowerInvariant();

        var tiposPermitidos = new Dictionary<string, string>
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp"
        };

        if (!tiposPermitidos.TryGetValue(
                extension,
                out var tipoEsperado) ||
            !string.Equals(
                archivo.ContentType,
                tipoEsperado,
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                mensaje = "Solo se permiten imágenes JPG, PNG y WEBP."
            });
        }

        // Verificar la firma real del archivo.
        var encabezado = new byte[12];
        int leidos;

        using (var stream = archivo.OpenReadStream())
        {
            leidos = await stream.ReadAsync(
                encabezado.AsMemory(0, encabezado.Length));
        }

        bool esJpeg =
            leidos >= 3 &&
            encabezado[0] == 0xFF &&
            encabezado[1] == 0xD8 &&
            encabezado[2] == 0xFF;

        bool esPng =
            leidos >= 8 &&
            encabezado.Take(8).SequenceEqual(
                new byte[]
                {
                    0x89, 0x50, 0x4E, 0x47,
                    0x0D, 0x0A, 0x1A, 0x0A
                });

        bool esWebp =
            leidos >= 12 &&
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
                mensaje = "El archivo no contiene una imagen válida."
            });
        }

        // Guardar con nombre aleatorio, nunca con el nombre
        // proporcionado por el usuario.
        var carpetaRaiz = _environment.ContentRootPath;

        var carpetaEvidencias = Path.Combine(
            carpetaRaiz,
            "ArchivosPrivados",
            "Incidencias"
        );

        Directory.CreateDirectory(carpetaEvidencias);

        var nombreArchivo =
            $"{Guid.NewGuid():N}{extension}";

        var rutaCompleta = Path.Combine(
            carpetaEvidencias,
            nombreArchivo
        );

        try
        {
            await using (var stream = new FileStream(
                rutaCompleta,
                FileMode.CreateNew))
            {
                await archivo.CopyToAsync(stream);
            }

            // Guardamos una referencia interna.
            // No publicamos la carpeta como contenido estático.
            incidencia.EvidenciaUrl = nombreArchivo;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                incidencia.Id,
                incidencia.PedidoId,
                incidencia.EvidenciaUrl,
                mensaje = "Evidencia guardada correctamente."
            });
        }
        catch
        {
            // Si falla la base de datos o la escritura,
            // intentamos eliminar el archivo huérfano.
            if (System.IO.File.Exists(rutaCompleta))
            {
                System.IO.File.Delete(rutaCompleta);
            }

            return StatusCode(500, new
            {
                mensaje =
                    "No se pudo guardar la evidencia. Intenta nuevamente."
            });
        }
    }


    // ==========================================
    // FASE 4: CONSULTAR EVIDENCIA FOTOGRÁFICA
    // GET: api/Incidencias/{id}/evidencia
    // Solo administrador
    // ==========================================

    [HttpGet("{id:int}/evidencia")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ObtenerEvidencia(int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Identificador de incidencia inválido."
            });
        }

        var incidencia = await _context.IncidenciasPedido
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incidencia == null)
        {
            return NotFound(new
            {
                mensaje = "Incidencia no encontrada."
            });
        }

        if (string.IsNullOrWhiteSpace(incidencia.EvidenciaUrl))
        {
            return NotFound(new
            {
                mensaje = "Esta incidencia no tiene fotografía."
            });
        }

        // La referencia guardada debe ser únicamente
        // un nombre de archivo, nunca una ruta externa.
        var nombreArchivo = incidencia.EvidenciaUrl;

        if (nombreArchivo != Path.GetFileName(nombreArchivo) ||
            nombreArchivo.Contains('/') ||
            nombreArchivo.Contains('\\'))
        {
            return BadRequest(new
            {
                mensaje = "Referencia de evidencia inválida."
            });
        }

        var extension = Path
            .GetExtension(nombreArchivo)
            .ToLowerInvariant();

        var tiposPermitidos = new Dictionary<string, string>
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp"
        };

        if (!tiposPermitidos.TryGetValue(
                extension,
                out var tipoContenido))
        {
            return BadRequest(new
            {
                mensaje = "Formato de evidencia no permitido."
            });
        }

        var rutaCompleta = Path.Combine(
            _environment.ContentRootPath,
            "ArchivosPrivados",
            "Incidencias",
            nombreArchivo
        );

        if (!System.IO.File.Exists(rutaCompleta))
        {
            return NotFound(new
            {
                mensaje = "El archivo de evidencia no está disponible."
            });
        }

        var stream = new FileStream(
            rutaCompleta,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read
        );

        Response.Headers["Cache-Control"] = "no-store";

        return File(stream, tipoContenido);
    }
}
