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
public class ComerciosController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public ComerciosController(DeliveryDbContext context)
    {
        _context = context;
    }

    // =========================
    // GET: api/Comercios
    // Público - Soporta filtro opcional por municipio/zona
    // =========================
    [HttpGet]
    public async Task<IActionResult> GetComercios([FromQuery] string? municipio)
    {
        var query = _context.Comercios
            .Where(c => c.Activo)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(municipio))
        {
            var municipioLimpio = municipio.Trim().ToLower();
            query = query.Where(c => c.Municipio != null && c.Municipio.ToLower() == municipioLimpio);
        }

        var comercios = await query
            .OrderBy(c => c.Nombre)
            .ToListAsync();

        return Ok(comercios);
    }

    // =========================
    // GET: api/Comercios/admin
    // Solo Administrador
    // =========================
    [Authorize]
    [HttpGet("admin")]
    public async Task<IActionResult> GetComerciosAdmin()
    {
        var rol =
            User.FindFirstValue(
                ClaimTypes.Role
            );

        if (rol != "Administrador")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede consultar todos los comercios."
                }
            );
        }

        var comercios =
            await _context.Comercios
                .OrderBy(c => c.Nombre)
                .Select(c => new
                {
                    c.Id,
                    c.Nombre,
                    c.Descripcion,
                    c.Direccion,
                    c.Municipio,
                    c.Telefono,
                    c.ImagenUrl,
                    c.Latitud,
                    c.Longitud,
                    c.Activo,
                    c.FechaCreacion
                })
                .ToListAsync();

        return Ok(comercios);
    }

    // =========================
    // GET: api/Comercios/1
    // Público
    // =========================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetComercio(int id)
    {
        var comercio = await _context.Comercios
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.Activo
            );

        if (comercio == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Comercio no encontrado."
            });
        }

        return Ok(comercio);
    }

    // =========================
    // GET: api/Comercios/mi-comercio
    // Solo usuario Comercio
    // =========================
    [Authorize]
    [HttpGet("mi-comercio")]
    public async Task<IActionResult> GetMiComercio()
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

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Comercio" ||
            usuario.ComercioId == null
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "No tienes permisos para administrar un comercio."
                }
            );
        }

        var comercio =
            await _context.Comercios
                .FirstOrDefaultAsync(c =>
                    c.Id ==
                    usuario.ComercioId.Value
                );

        if (comercio == null)
        {
            return NotFound(new
            {
                mensaje =
                    "No se encontró el comercio asociado a tu usuario."
            });
        }

        return Ok(new
        {
            comercio.Id,
            comercio.Nombre,
            comercio.Descripcion,
            comercio.Direccion,
            comercio.Municipio,
            comercio.Telefono,
            comercio.ImagenUrl,
            comercio.Activo,
            comercio.FechaCreacion
        });
    }

    // =========================
    // PUT: api/Comercios/mi-comercio
    // Solo modifica su comercio
    // =========================
    [Authorize]
    [HttpPut("mi-comercio")]
    public async Task<IActionResult> ActualizarMiComercio(
        ActualizarComercioDto dto
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

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId &&
                    u.Activo
                );

        if (
            usuario == null ||
            usuario.Rol != "Comercio" ||
            usuario.ComercioId == null
        )
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "No tienes permisos para modificar un comercio."
                }
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                dto.Nombre
            ) ||
            string.IsNullOrWhiteSpace(
                dto.Direccion
            )
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "Nombre y dirección son obligatorios."
            });
        }

        var comercio =
            await _context.Comercios
                .FirstOrDefaultAsync(c =>
                    c.Id ==
                    usuario.ComercioId.Value
                );

        if (comercio == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Comercio no encontrado."
            });
        }

        comercio.Nombre =
            dto.Nombre.Trim();

        comercio.Descripcion =
            string.IsNullOrWhiteSpace(
                dto.Descripcion
            )
                ? null
                : dto.Descripcion.Trim();

        comercio.Direccion =
            dto.Direccion.Trim();

        comercio.Telefono =
            string.IsNullOrWhiteSpace(
                dto.Telefono
            )
                ? null
                : dto.Telefono.Trim();

        comercio.ImagenUrl =
            string.IsNullOrWhiteSpace(
                dto.ImagenUrl
            )
                ? null
                : dto.ImagenUrl.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            comercio.Id,
            comercio.Nombre,
            comercio.Descripcion,
            comercio.Direccion,
            comercio.Municipio,
            comercio.Telefono,
            comercio.ImagenUrl,
            comercio.Activo,
            comercio.FechaCreacion,

            mensaje =
                "Comercio actualizado correctamente."
        });
    }

    // =========================
    // POST: api/Comercios
    // Solo Administrador
    // =========================
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CrearComercio(
        Comercio comercio
    )
    {
        var rol =
            User.FindFirstValue(
                ClaimTypes.Role
            );

        if (rol != "Administrador")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede crear comercios."
                }
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                comercio.Nombre
            ) ||
            string.IsNullOrWhiteSpace(
                comercio.Direccion
            )
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "Nombre y dirección son obligatorios."
            });
        }

        comercio.Id = 0;

        comercio.Nombre =
            comercio.Nombre.Trim();

        comercio.Direccion =
            comercio.Direccion.Trim();

        if (string.IsNullOrWhiteSpace(comercio.Municipio))
        {
            return BadRequest(new
            {
                mensaje = "Debes indicar el municipio del restaurante."
            });
        }

        comercio.Municipio = comercio.Municipio.Trim();

        comercio.Descripcion =
            comercio.Descripcion?.Trim();

        comercio.Telefono =
            comercio.Telefono?.Trim();

        comercio.ImagenUrl =
            comercio.ImagenUrl?.Trim();

        comercio.Activo = true;

        comercio.FechaCreacion =
            DateTime.UtcNow;

        _context.Comercios.Add(
            comercio
        );

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetComercio),
            new
            {
                id =
                    comercio.Id
            },
            comercio
        );
    }

    // =========================
    // PUT: api/Comercios/1
    // Solo Administrador
    // =========================
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarComercio(
        int id,
        ActualizarComercioDto dto
    )
    {
        var rol =
            User.FindFirstValue(
                ClaimTypes.Role
            );

        if (rol != "Administrador")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede modificar comercios por ID."
                }
            );
        }

        var comercio =
            await _context.Comercios
                .FirstOrDefaultAsync(c =>
                    c.Id == id
                );

        if (comercio == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Comercio no encontrado."
            });
        }

        if (
            string.IsNullOrWhiteSpace(
                dto.Nombre
            ) ||
            string.IsNullOrWhiteSpace(
                dto.Direccion
            )
        )
        {
            return BadRequest(new
            {
                mensaje =
                    "Nombre y dirección son obligatorios."
            });
        }

        comercio.Nombre =
            dto.Nombre.Trim();

        comercio.Descripcion =
            string.IsNullOrWhiteSpace(
                dto.Descripcion
            )
                ? null
                : dto.Descripcion.Trim();

        comercio.Direccion =
            dto.Direccion.Trim();

        comercio.Telefono =
            string.IsNullOrWhiteSpace(
                dto.Telefono
            )
                ? null
                : dto.Telefono.Trim();

        comercio.ImagenUrl =
            string.IsNullOrWhiteSpace(
                dto.ImagenUrl
            )
                ? null
                : dto.ImagenUrl.Trim();

        await _context.SaveChangesAsync();

        return Ok(comercio);
    }

    // =========================
    // DELETE: api/Comercios/1
    // Solo Administrador
    // =========================
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarComercio(
        int id
    )
    {
        var rol =
            User.FindFirstValue(
                ClaimTypes.Role
            );

        if (rol != "Administrador")
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    mensaje =
                        "Solo un administrador puede desactivar comercios."
                }
            );
        }

        var comercio =
            await _context.Comercios
                .FirstOrDefaultAsync(c =>
                    c.Id == id
                );

        if (comercio == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Comercio no encontrado."
            });
        }

        comercio.Activo = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Comercio desactivado correctamente."
        });
    }
}