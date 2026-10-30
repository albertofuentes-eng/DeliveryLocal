
using System.Security.Claims;
using DeliveryApi.Data;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/Auth/google")]
public class GoogleVinculacionController : ControllerBase
{
    private readonly DeliveryDbContext _db;
    private readonly IConfiguration _config;

    public GoogleVinculacionController(
        DeliveryDbContext db,
        IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public class VincularGoogleDto
    {
        public string IdToken { get; set; } = string.Empty;
    }

    [Authorize]
    [HttpPost("vincular")]
    public async Task<IActionResult> Vincular(
        [FromBody] VincularGoogleDto dto)
    {
        // El usuario debe tener una sesión válida de DeliveryLocal.
        var idTexto = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(idTexto, out int usuarioId))
            return Unauthorized();

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null || !usuario.Activo)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.IdToken) ||
            dto.IdToken.Length > 10000)
        {
            return BadRequest(new
            {
                mensaje = "Token de Google inválido."
            });
        }

        var audiencias = new[]
        {
            _config["GoogleAuth:WebClientId"],
            _config["GoogleAuth:AndroidClientId"]
        }
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .Select(x => x!)
        .Distinct()
        .ToArray();

        if (audiencias.Length == 0)
            return StatusCode(503, new
            {
                mensaje = "Google no está configurado."
            });

        GoogleJsonWebSignature.Payload google;

        try
        {
            google = await GoogleJsonWebSignature.ValidateAsync(
                dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = audiencias
                });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized(new
            {
                mensaje = "Google rechazó la identidad."
            });
        }

        if (!google.EmailVerified ||
            string.IsNullOrWhiteSpace(google.Subject) ||
            string.IsNullOrWhiteSpace(google.Email))
        {
            return Unauthorized(new
            {
                mensaje = "El correo de Google no está verificado."
            });
        }

        // Evitar vincular el Google de otra persona.
        if (!string.Equals(
            usuario.Correo.Trim(),
            google.Email.Trim(),
            StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new
            {
                mensaje = "El correo de Google debe coincidir con el de tu cuenta de DeliveryLocal."
            });
        }

        // No permitir reemplazar una identidad Google existente.
        if (!string.IsNullOrEmpty(usuario.GoogleSub))
        {
            if (usuario.GoogleSub == google.Subject)
                return Ok(new
                {
                    mensaje = "Google ya está vinculado a tu cuenta."
                });

            return Conflict(new
            {
                mensaje = "Esta cuenta ya tiene otro Google vinculado."
            });
        }

        bool ocupado = await _db.Usuarios.AnyAsync(
            u => u.GoogleSub == google.Subject &&
                 u.Id != usuarioId);

        if (ocupado)
            return Conflict(new
            {
                mensaje = "Esta cuenta de Google ya está vinculada."
            });

        usuario.GoogleSub = google.Subject;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                mensaje = "No se pudo completar la vinculación."
            });
        }

        return Ok(new
        {
            mensaje = "Cuenta de Google vinculada correctamente.",
            usuarioId = usuario.Id
        });
    }
}
