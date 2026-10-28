
using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/AdminComercios")]
[Authorize]
public class AdminComerciosController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public AdminComerciosController(DeliveryDbContext context)
    {
        _context = context;
    }

    // POST: api/AdminComercios
    // Crea restaurante y cuenta POS en una transacción.
    [HttpPost]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistrarRestauranteDto dto)
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);

        if (rol != "Administrador")
        {
            return Forbid();
        }

        if (
            string.IsNullOrWhiteSpace(dto.Nombre) ||
            string.IsNullOrWhiteSpace(dto.Direccion) ||
            string.IsNullOrWhiteSpace(dto.Municipio) ||
            string.IsNullOrWhiteSpace(dto.EncargadoNombre) ||
            string.IsNullOrWhiteSpace(dto.EncargadoCorreo) ||
            string.IsNullOrWhiteSpace(dto.EncargadoPassword)
        )
        {
            return BadRequest(new
            {
                mensaje = "Completa los datos del restaurante y su encargado."
            });
        }

        if (dto.EncargadoPassword.Length < 8)
        {
            return BadRequest(new
            {
                mensaje = "La contraseña debe tener al menos 8 caracteres."
            });
        }

        var correo = dto.EncargadoCorreo.Trim().ToLowerInvariant();

        var existeCorreo = await _context.Usuarios
            .AnyAsync(u => u.Correo == correo);

        if (existeCorreo)
        {
            return Conflict(new
            {
                mensaje = "Ya existe una cuenta con ese correo."
            });
        }

        await using var transaccion =
            await _context.Database.BeginTransactionAsync();

        var comercio = new Comercio
        {
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Direccion = dto.Direccion.Trim(),
            Municipio = dto.Municipio.Trim(),
            Telefono = dto.Telefono?.Trim(),
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Comercios.Add(comercio);
        await _context.SaveChangesAsync();

        var encargado = new Usuario
        {
            Nombre = dto.EncargadoNombre.Trim(),
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                dto.EncargadoPassword
            ),
            Rol = "Comercio",
            ComercioId = comercio.Id,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Usuarios.Add(encargado);
        await _context.SaveChangesAsync();

        await transaccion.CommitAsync();

        return Ok(new
        {
            mensaje = "Restaurante y cuenta POS registrados correctamente.",
            restaurante = new
            {
                comercio.Id,
                comercio.Nombre,
                comercio.Municipio,
                comercio.Direccion
            },
            encargado = new
            {
                encargado.Id,
                encargado.Nombre,
                encargado.Correo,
                encargado.Rol,
                encargado.ComercioId
            }
        });
    }
}

public class RegistrarRestauranteDto
{
    public string Nombre { get; set; } = string.Empty;

    public string Direccion { get; set; } = string.Empty;

    public string Municipio { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Telefono { get; set; }

    public string EncargadoNombre { get; set; } = string.Empty;

    public string EncargadoCorreo { get; set; } = string.Empty;

    public string EncargadoPassword { get; set; } = string.Empty;
}
