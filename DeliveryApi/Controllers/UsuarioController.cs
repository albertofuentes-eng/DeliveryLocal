using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DeliveryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuarioController : ControllerBase
{
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
}