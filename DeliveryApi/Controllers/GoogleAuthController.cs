using DeliveryApi.Data;
using DeliveryApi.Models;
using DeliveryApi.Services;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/Auth")]
public class GoogleAuthController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly JwtService _jwt;
    private readonly IConfiguration _configuration;

    public GoogleAuthController(
        DeliveryDbContext context,
        JwtService jwt,
        IConfiguration configuration)
    {
        _context = context;
        _jwt = jwt;
        _configuration = configuration;
    }

    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = string.Empty;
    }

    [HttpPost("google")]
    public async Task<IActionResult> LoginGoogle(
        [FromBody] GoogleLoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken) ||
            dto.IdToken.Length > 10000)
        {
            return BadRequest(new { mensaje = "Token inválido." });
        }

        string[] audiencias = new[]
        {
            _configuration["GoogleAuth:WebClientId"],
            _configuration["GoogleAuth:AndroidClientId"]
        }
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .Select(x => x!)
        .Distinct()
        .ToArray();

        if (audiencias.Length == 0)
        {
            return StatusCode(503, new
            {
                mensaje = "Google Login no está configurado."
            });
        }

        GoogleJsonWebSignature.Payload identidad;

        try
        {
            identidad = await GoogleJsonWebSignature.ValidateAsync(
                dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = audiencias
                });
        }
        catch (Google.Apis.Auth.InvalidJwtException ex)
        {
            Console.WriteLine(
                "GOOGLE LOGIN - ERROR DE VALIDACION: " + ex.Message
            );

            return Unauthorized(new
            {
                mensaje = "Google rechazó el token."
            });
        }

        if (!identidad.EmailVerified ||
            string.IsNullOrWhiteSpace(identidad.Subject) ||
            string.IsNullOrWhiteSpace(identidad.Email))
        {
            return Unauthorized(new
            {
                mensaje = "La identidad de Google no está verificada."
            });
        }

        string correo = identidad.Email.Trim().ToLowerInvariant();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.GoogleSub == identidad.Subject);

        if (usuario == null)
        {
            bool correoExistente = await _context.Usuarios
                .AnyAsync(u => u.Correo == correo);

            if (correoExistente)
            {
                return Conflict(new
                {
                    mensaje = "Este correo ya pertenece a una cuenta de DeliveryLocal. Se requiere vinculación segura."
                });
            }

            string nombre = string.IsNullOrWhiteSpace(identidad.Name)
                ? correo.Split('@')[0]
                : identidad.Name.Trim();

            usuario = new Usuario
            {
                Nombre = nombre.Length > 100
                    ? nombre[..100]
                    : nombre,
                Correo = correo,
                GoogleSub = identidad.Subject,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                    Guid.NewGuid().ToString("N") +
                    Guid.NewGuid().ToString("N")),
                Rol = "Cliente",
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    mensaje = "La cuenta fue registrada simultáneamente. Intentá iniciar sesión nuevamente."
                });
            }
        }

        if (!usuario.Activo)
        {
            return Unauthorized(new
            {
                mensaje = "La cuenta está inactiva."
            });
        }

        return Ok(new
        {
            mensaje = "Inicio de sesión con Google correcto.",
            token = _jwt.GenerarToken(usuario),
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
