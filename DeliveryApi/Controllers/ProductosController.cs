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
public class ProductosController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public ProductosController(DeliveryDbContext context)
    {
        _context = context;
    }

    // =========================
    // GET: api/Productos
    // Público - usado por clientes
    // =========================
    [HttpGet]
    public async Task<IActionResult> GetProductos()
    {
        var productos = await _context.Productos
            .Where(p => p.Disponible)
            .OrderBy(p => p.Nombre)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.ImagenUrl,
                p.Disponible,
                p.ComercioId,
                p.CategoriaId
            })
            .ToListAsync();

        return Ok(productos);
    }

    // =========================
    // GET: api/Productos/1
    // Público
    // =========================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProducto(int id)
    {
        var producto = await _context.Productos
            .Where(p =>
                p.Id == id &&
                p.Disponible)
            .Select(p => new
            {
                p.Id,
                p.Nombre,
                p.Descripcion,
                p.Precio,
                p.ImagenUrl,
                p.Disponible,
                p.ComercioId,
                p.CategoriaId
            })
            .FirstOrDefaultAsync();

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado."
            });
        }

        return Ok(producto);
    }

    // =========================
    // GET: api/Productos/comercio/1
    // Público - usado por DeliveryCliente
    // =========================
    [HttpGet("comercio/{comercioId:int}")]
    public async Task<IActionResult> GetProductosPorComercio(
        int comercioId
    )
    {
        var comercioExiste =
            await _context.Comercios
                .AnyAsync(c =>
                    c.Id == comercioId &&
                    c.Activo);

        if (!comercioExiste)
        {
            return NotFound(new
            {
                mensaje =
                    "Comercio no encontrado."
            });
        }

        var productos =
            await _context.Productos
                .Where(p =>
                    p.ComercioId == comercioId &&
                    p.Disponible)
                .OrderBy(p => p.Nombre)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    p.Precio,
                    p.ImagenUrl,
                    p.Disponible,
                    p.ComercioId,
                    p.CategoriaId
                })
                .ToListAsync();

        return Ok(productos);
    }

    // =========================
    // GET: api/Productos/categoria/1
    // Público
    // =========================
    [HttpGet("categoria/{categoriaId:int}")]
    public async Task<IActionResult> GetProductosPorCategoria(
        int categoriaId
    )
    {
        var categoriaExiste =
            await _context.Categorias
                .AnyAsync(c =>
                    c.Id == categoriaId &&
                    c.Activo);

        if (!categoriaExiste)
        {
            return NotFound(new
            {
                mensaje =
                    "Categoría no encontrada."
            });
        }

        var productos =
            await _context.Productos
                .Where(p =>
                    p.CategoriaId == categoriaId &&
                    p.Disponible)
                .OrderBy(p => p.Nombre)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    p.Precio,
                    p.ImagenUrl,
                    p.Disponible,
                    p.ComercioId,
                    p.CategoriaId
                })
                .ToListAsync();

        return Ok(productos);
    }

    // =========================
    // GET: api/Productos/mi-comercio
    // POS
    // Incluye disponibles y desactivados
    // =========================
    [Authorize]
    [HttpGet("mi-comercio")]
    public async Task<IActionResult> MisProductosComercio()
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

        if (usuario == null)
        {
            return Unauthorized();
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
                        "No tienes permisos para administrar productos."
                }
            );
        }

        var productos =
            await _context.Productos
                .Where(p =>
                    p.ComercioId ==
                    usuario.ComercioId.Value)
                .OrderByDescending(p =>
                    p.Disponible)
                .ThenBy(p =>
                    p.Nombre)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    p.Precio,
                    p.ImagenUrl,
                    p.Disponible,

                    p.ComercioId,
                    p.CategoriaId,

                    categoria =
                        p.Categoria.Nombre
                })
                .ToListAsync();

        return Ok(productos);
    }

    // =========================
    // POST: api/Productos
    // POS
    // =========================
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CrearProducto(
        CrearProductoDto dto
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
                        "No tienes permisos para crear productos."
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
                    "El nombre del producto es obligatorio."
            });
        }

        if (dto.Precio <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "El precio debe ser mayor que cero."
            });
        }

        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == dto.CategoriaId &&
                    c.Activo &&
                    c.ComercioId ==
                    usuario.ComercioId.Value);

        if (categoria == null)
        {
            return BadRequest(new
            {
                mensaje =
                    "La categoría no existe o no pertenece a tu comercio."
            });
        }

        var producto = new Producto
        {
            Nombre =
                dto.Nombre.Trim(),

            Descripcion =
                dto.Descripcion?.Trim(),

            Precio =
                dto.Precio,

            ImagenUrl =
                dto.ImagenUrl?.Trim(),

            // IMPORTANTE:
            // NO confiamos en dto.ComercioId.
            ComercioId =
                usuario.ComercioId.Value,

            CategoriaId =
                categoria.Id,

            Disponible = true
        };

        _context.Productos.Add(producto);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetProducto),
            new
            {
                id = producto.Id
            },
            new
            {
                producto.Id,
                producto.Nombre,
                producto.Descripcion,
                producto.Precio,
                producto.ImagenUrl,
                producto.Disponible,
                producto.ComercioId,
                producto.CategoriaId
            }
        );
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> ActualizarProducto(
        int id,
        ActualizarProductoDto dto
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
                        "No tienes permisos para editar productos."
                }
            );
        }

        var producto =
            await _context.Productos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.ComercioId ==
                        usuario.ComercioId.Value);

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado para tu comercio."
            });
        }

        if (string.IsNullOrWhiteSpace(
            dto.Nombre
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El nombre del producto es obligatorio."
            });
        }

        if (dto.Precio <= 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "El precio debe ser mayor que cero."
            });
        }

        var categoria =
            await _context.Categorias
                .FirstOrDefaultAsync(c =>
                    c.Id == dto.CategoriaId &&
                    c.ComercioId ==
                        usuario.ComercioId.Value &&
                    c.Activo);

        if (categoria == null)
        {
            return BadRequest(new
            {
                mensaje =
                    "La categoría seleccionada no es válida."
            });
        }

        producto.Nombre =
            dto.Nombre.Trim();

        producto.Descripcion =
            string.IsNullOrWhiteSpace(
                dto.Descripcion
            )
                ? null
                : dto.Descripcion.Trim();

        producto.Precio =
            dto.Precio;

        producto.ImagenUrl =
            string.IsNullOrWhiteSpace(
                dto.ImagenUrl
            )
                ? null
                : dto.ImagenUrl.Trim();

        producto.CategoriaId =
            dto.CategoriaId;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            producto.Id,
            producto.Nombre,
            producto.Descripcion,
            producto.Precio,
            producto.ImagenUrl,
            producto.Disponible,
            producto.CategoriaId,
            producto.ComercioId,

            mensaje =
                "Producto actualizado correctamente."
        });
    }

    // =========================
    // DELETE: api/Productos/1
    // En realidad desactiva
    // =========================
    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarProducto(
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
                        "No tienes permisos para desactivar productos."
                }
            );
        }

        var producto =
            await _context.Productos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.ComercioId ==
                    usuario.ComercioId.Value);

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado para tu comercio."
            });
        }

        producto.Disponible = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Producto desactivado correctamente."
        });
    }

    // =========================
    // PUT: api/Productos/1/activar
    // =========================
    [Authorize]
    [HttpPut("{id:int}/activar")]
    public async Task<IActionResult> ActivarProducto(
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
                        "No tienes permisos para activar productos."
                }
            );
        }

        var producto =
            await _context.Productos
                .FirstOrDefaultAsync(p =>
                    p.Id == id &&
                    p.ComercioId ==
                        usuario.ComercioId.Value);

        if (producto == null)
        {
            return NotFound(new
            {
                mensaje =
                    "Producto no encontrado para tu comercio."
            });
        }

        producto.Disponible = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            producto.Id,
            producto.Nombre,
            producto.Disponible,

            mensaje =
                "Producto activado correctamente."
        });
    }
}

