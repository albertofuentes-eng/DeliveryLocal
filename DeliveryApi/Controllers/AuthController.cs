using DeliveryApi.Services;
using DeliveryApi.Data;
using DeliveryApi.DTOs;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly DeliveryDbContext _context;
private readonly JwtService _jwtService;

public AuthController(
    DeliveryDbContext context,
    JwtService jwtService)
{
    _context = context;
    _jwtService = jwtService;
}

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var correo = dto.Correo.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(dto.Nombre) ||
            string.IsNullOrWhiteSpace(correo) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new
            {
                mensaje = "Nombre, correo y contraseña son obligatorios."
            });
        }

        if (dto.Password.Length < 8)
        {
            return BadRequest(new
            {
                mensaje = "La contraseña debe tener al menos 8 caracteres."
            });
        }

        var correoExiste = await _context.Usuarios
            .AnyAsync(u => u.Correo == correo);

        if (correoExiste)
        {
            return Conflict(new
            {
                mensaje = "Ya existe un usuario con ese correo."
            });
        }

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Correo = correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Telefono = dto.Telefono?.Trim(),
            Rol = "Cliente",
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Usuario registrado correctamente.",
            usuario = new
            {
                usuario.Id,
                usuario.Nombre,
                usuario.Correo,
                usuario.Telefono,
                usuario.Rol
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var correo = dto.Correo.Trim().ToLower();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == correo);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Correo o contraseña incorrectos."
            });
        }

        if (!usuario.Activo)
        {
            return Unauthorized(new
            {
                mensaje = "El usuario está inactivo."
            });
        }

        var passwordCorrecto =
    BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash);

if (!passwordCorrecto)
{
    return Unauthorized(new
    {
        mensaje = "Correo o contraseña incorrectos."
    });
}

var token = _jwtService.GenerarToken(usuario);

return Ok(new
{
    mensaje = "Inicio de sesión correcto.",
    token,
    usuario = new
    {
        usuario.Id,
        usuario.Nombre,
        usuario.Correo,
        usuario.Telefono,
        usuario.Rol
    }
});
    }
}