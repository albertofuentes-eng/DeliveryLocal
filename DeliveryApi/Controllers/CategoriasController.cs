using DeliveryApi.DTOs;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public CategoriasController(
        DeliveryDbContext context
    )
    {
        _context = context;
    }

    // =========================
    // GET: api/Categorias
    // Público
    // =========================
    [HttpGet]
    public async Task<IActionResult> GetCategorias()
    {
        var categorias =
            await _context.Categorias
                .Where(c =>
                    c.Activo)
                .OrderBy(c =>
                    c.Nombre)
                .ToListAsync();

        return Ok(categorias);
    }

    // =========================
    // GET: api/Categorias/1
    // Público
    // =========================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCategoria(
        int id
    )
    {
        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.Activo);

        if (categoria == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Categoría no encontrada."
            });
        }

        return Ok(categoria);
    }

    // =========================
    // GET: api/Categorias/mi-comercio
    // POS
    // =========================
    [Authorize]
    [HttpGet("mi-comercio")]
    public async Task<IActionResult> MisCategorias()
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
                    u.Activo);

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
                        "No tienes permisos para administrar categorías."
                }
            );
        }

        var categorias =
            await _context.Categorias
                .Where(c =>
                    c.ComercioId ==
                    usuario.ComercioId.Value)
                .OrderByDescending(c =>
                    c.Activo)
                .ThenBy(c =>
                    c.Nombre)
                .Select(c => new
                {
                    c.Id,
                    c.Nombre,
                    c.ComercioId,
                    c.Activo
                })
                .ToListAsync();

        return Ok(categorias);
    }

    // =========================
    // POST: api/Categorias
    // POS
    // =========================
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CrearCategoria(
        CrearCategoriaDto dto
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
                    u.Activo);

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
                        "No tienes permisos para crear categorías."
                }
            );
        }

        if (string.IsNullOrWhiteSpace(
            dto.Nombre
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El nombre de la categoría es obligatorio."
            });
        }

        var nombre =
            dto.Nombre.Trim();

        var existe =
            await _context.Categorias
                .AnyAsync(c =>
                    c.ComercioId ==
                    usuario.ComercioId.Value &&
                    c.Nombre == nombre &&
                    c.Activo);

        if (existe)
        {
            return BadRequest(new
            {
                mensaje =
                    "Ya existe una categoría activa con ese nombre."
            });
        }

        var categoria =
            new Categoria
            {
                Nombre =
                    nombre,

                ComercioId =
                    usuario.ComercioId.Value,

                Activo = true
            };

        _context.Categorias.Add(
            categoria
        );

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCategoria),
            new
            {
                id = categoria.Id
            },
            new
            {
                categoria.Id,
                categoria.Nombre,
                categoria.ComercioId,
                categoria.Activo
            }
        );
    }

    // =========================
    // PUT: api/Categorias/1
    // POS
    // =========================
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarCategoria(
        int id,
        ActualizarCategoriaDto dto
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
                    u.Activo);

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
                        "No tienes permisos para editar categorías."
                }
            );
        }

        if (string.IsNullOrWhiteSpace(
            dto.Nombre
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El nombre de la categoría es obligatorio."
            });
        }

        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.ComercioId ==
                    usuario.ComercioId.Value);

        if (categoria == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Categoría no encontrada para tu comercio."
            });
        }

        var nuevoNombre =
            dto.Nombre.Trim();

        var nombreExiste =
            await _context.Categorias
                .AnyAsync(c =>
                    c.Id != id &&
                    c.ComercioId ==
                        usuario.ComercioId.Value &&
                    c.Nombre == nuevoNombre &&
                    c.Activo);

        if (nombreExiste)
        {
            return BadRequest(new
            {
                mensaje =
                    "Ya existe otra categoría activa con ese nombre."
            });
        }

        categoria.Nombre =
            nuevoNombre;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            categoria.Id,
            categoria.Nombre,
            categoria.ComercioId,
            categoria.Activo
        });
    }

    // =========================
    // DELETE: api/Categorias/1
    // Desactiva
    // =========================
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarCategoria(
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

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId &&
                    u.Activo);

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
                        "No tienes permisos para desactivar categorías."
                }
            );
        }

        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.ComercioId ==
                    usuario.ComercioId.Value);

        if (categoria == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Categoría no encontrada para tu comercio."
            });
        }

        categoria.Activo = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Categoría desactivada correctamente."
        });
    }

    // =========================
    // PUT: api/Categorias/1/activar
    // =========================
    [Authorize]
    [HttpPut("{id:int}/activar")]
    public async Task<IActionResult> ActivarCategoria(
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

        var usuario =
            await _context.Usuarios
                .FirstOrDefaultAsync(u =>
                    u.Id == usuarioId &&
                    u.Activo);

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
                        "No tienes permisos para activar categorías."
                }
            );
        }

        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == id &&
                    c.ComercioId ==
                        usuario.ComercioId.Value);

        if (categoria == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Categoría no encontrada para tu comercio."
            });
        }

        categoria.Activo = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            categoria.Id,
            categoria.Nombre,
            categoria.Activo,

            mensaje =
                "Categoría activada correctamente."
        });
    }

}