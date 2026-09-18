using System.Security.Claims;
using DeliveryApi.Data;
using DeliveryApi.DTOs;
using DeliveryApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DeliveryApi.Services;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly DeliveryDbContext _context;
    private readonly ExpoPushService _expoPushService;

    public NotificacionesController(
        DeliveryDbContext context,
        ExpoPushService expoPushService
    )
    {
        _context = context;
        _expoPushService = expoPushService;
    }

    // =========================
    // POST:
    // api/Notificaciones/registrar-token
    // =========================
    [HttpPost("registrar-token")]
    public async Task<IActionResult> RegistrarToken(
        RegistrarDispositivoPushDto dto
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        if (string.IsNullOrWhiteSpace(
            dto.ExpoPushToken
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "El token de notificaciones es obligatorio."
            });
        }

        var aplicacionesPermitidas = new[]
        {
            "Cliente",
            "Repartidor"
        };

        if (!aplicacionesPermitidas.Contains(
            dto.Aplicacion
        ))
        {
            return BadRequest(new
            {
                mensaje =
                    "La aplicación indicada no es válida."
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

        var dispositivoExistente =
            await _context.DispositivosPush
                .FirstOrDefaultAsync(d =>
                    d.ExpoPushToken ==
                    dto.ExpoPushToken
                );

        if (dispositivoExistente != null)
        {
            dispositivoExistente.UsuarioId =
                usuarioId;

            dispositivoExistente.Aplicacion =
                dto.Aplicacion;

            dispositivoExistente.Plataforma =
                string.IsNullOrWhiteSpace(
                    dto.Plataforma
                )
                    ? "Android"
                    : dto.Plataforma;

            dispositivoExistente.Activo = true;

            dispositivoExistente.FechaActualizacion =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Token actualizado correctamente."
            });
        }

        var dispositivo =
            new DispositivoPush
            {
                UsuarioId = usuarioId,

                ExpoPushToken =
                    dto.ExpoPushToken.Trim(),

                Aplicacion =
                    dto.Aplicacion.Trim(),

                Plataforma =
                    string.IsNullOrWhiteSpace(
                        dto.Plataforma
                    )
                        ? "Android"
                        : dto.Plataforma.Trim(),

                Activo = true,

                FechaRegistro =
                    DateTime.UtcNow,

                FechaActualizacion =
                    DateTime.UtcNow
            };

        _context.DispositivosPush.Add(
            dispositivo
        );

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje =
                "Token registrado correctamente."
        });
    }

    // =========================
    // POST:
    // api/Notificaciones/prueba
    // =========================
    [HttpPost("prueba")]
    public async Task<IActionResult> EnviarPrueba()
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
            return Unauthorized(new
            {
                mensaje = "Usuario no válido."
            });
        }

        var dispositivos =
            await _context.DispositivosPush
                .Where(d =>
                    d.UsuarioId == usuarioId &&
                    d.Activo
                )
                .ToListAsync();

        if (dispositivos.Count == 0)
        {
            return NotFound(new
            {
                mensaje =
                    "No hay dispositivos registrados para este usuario."
            });
        }

        foreach (var dispositivo in dispositivos)
        {
            await _expoPushService
                .EnviarNotificacionAsync(
                    dispositivo.ExpoPushToken,
                    "DeliveryLocal",
                    "Las notificaciones push están funcionando.",
                    new
                    {
                        tipo = "Prueba"
                    }
                );
        }

        return Ok(new
        {
            mensaje =
                "Notificación de prueba enviada.",
            dispositivos =
                dispositivos.Count
        });
    }
}