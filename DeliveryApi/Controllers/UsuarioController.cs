using DeliveryApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuarioController : ControllerBase
{
    private readonly DeliveryDbContext _context;

    public UsuarioController(DeliveryDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("perfil")]
    public IActionResult Perfil()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var nombre = User.FindFirstValue(ClaimTypes.Name);
        var correo = User.FindFirstValue(ClaimTypes.Email);
        var rol = User.FindFirstValue(ClaimTypes.Role);

        return Ok(new
        {
            mensaje = "Token válido.",
            usuario = new
            {
                id,
                nombre,
                correo,
                rol
            }
        });
    }

    // ==========================================
    // CLIENTES PARA EL PANEL ADMINISTRADOR
    // ==========================================
    [Authorize(Roles = "Administrador")]
    [HttpGet("clientes")]
    public async Task<IActionResult> ObtenerClientes()
    {
        var clientes = await _context.Usuarios
            .AsNoTracking()
            .Where(u => u.Rol == "Cliente")
            .OrderByDescending(u => u.FechaCreacion)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Correo,
                u.Telefono,
                u.Activo,
                u.FechaCreacion
            })
            .ToListAsync();

        return Ok(clientes);
    }
}