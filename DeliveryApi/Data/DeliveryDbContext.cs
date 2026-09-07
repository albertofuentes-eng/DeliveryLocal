using DeliveryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Data;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(
        DbContextOptions<DeliveryDbContext> options
    )
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Comercio> Comercios => Set<Comercio>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<DetallePedido> DetallesPedido => Set<DetallePedido>();

    // NUEVO
    public DbSet<SolicitudRepartidor> SolicitudesRepartidor
        => Set<SolicitudRepartidor>();

    // NUEVO
    public DbSet<Repartidor> Repartidores
        => Set<Repartidor>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder
    )
    {
        base.OnModelCreating(modelBuilder);

        // =========================
        // USUARIO
        // =========================
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Nombre)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.Correo)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(u => u.Correo)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.Property(u => u.Telefono)
                .HasMaxLength(20);

            entity.Property(u => u.Rol)
                .HasMaxLength(30)
                .HasDefaultValue("Cliente");

            entity.Property(u => u.Activo)
                .HasDefaultValue(true);

            entity.HasOne(u => u.Comercio)
                .WithMany(c => c.Usuarios)
                .HasForeignKey(u => u.ComercioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Usuario 1 - 1 Repartidor
            entity.HasOne(u => u.Repartidor)
                .WithOne(r => r.Usuario)
                .HasForeignKey<Repartidor>(
                    r => r.UsuarioId
                )
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // COMERCIO
        // =========================
        modelBuilder.Entity<Comercio>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Nombre)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(c => c.Descripcion)
                .HasMaxLength(500);

            entity.Property(c => c.Direccion)
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(c => c.Telefono)
                .HasMaxLength(20);

            entity.Property(c => c.ImagenUrl)
                .HasMaxLength(500);

            entity.Property(c => c.Activo)
                .HasDefaultValue(true);
        });

        // =========================
        // CATEGORIA
        // =========================
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Nombre)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(c => c.Activo)
                .HasDefaultValue(true);

            entity.HasOne(c => c.Comercio)
                .WithMany()
                .HasForeignKey(c => c.ComercioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // PRODUCTO
        // =========================
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Nombre)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(p => p.Descripcion)
                .HasMaxLength(500);

            entity.Property(p => p.Precio)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.ImagenUrl)
                .HasMaxLength(500);

            entity.Property(p => p.Disponible)
                .HasDefaultValue(true);

            entity.HasOne(p => p.Comercio)
                .WithMany()
                .HasForeignKey(p => p.ComercioId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Categoria)
                .WithMany()
                .HasForeignKey(p => p.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // PEDIDO
        // =========================
        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Estado)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente");

            entity.Property(p => p.TipoEntrega)
                .HasMaxLength(20)
                .HasDefaultValue("Domicilio")
                .IsRequired();

            entity.Property(p => p.DireccionEntrega)
                .HasMaxLength(300);

            entity.Property(p => p.LatitudEntrega)
                .HasColumnType("decimal(10,7)");

            entity.Property(p => p.LongitudEntrega)
                .HasColumnType("decimal(10,7)");

            entity.Property(p => p.TelefonoEntrega)
                .HasMaxLength(20);

            entity.Property(p => p.ReferenciaEntrega)
                .HasMaxLength(300);

            entity.Property(p => p.IndicacionesEntrega)
                .HasMaxLength(500);

            entity.Property(p => p.TipoTiempo)
                .HasMaxLength(20)
                .HasDefaultValue("Ahora")
                .IsRequired();

            entity.Property(p => p.Subtotal)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.Envio)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.Total)
                .HasColumnType("decimal(10,2)");

            entity.HasOne(p => p.Usuario)
                .WithMany()
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Comercio)
                .WithMany()
                .HasForeignKey(p => p.ComercioId)
                .OnDelete(DeleteBehavior.Restrict);

            // NUEVO:
            // Pedido puede no tener repartidor todavía
            entity.HasOne(p => p.Repartidor)
                .WithMany(r => r.Pedidos)
                .HasForeignKey(p => p.RepartidorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // DETALLE PEDIDO
        // =========================
        modelBuilder.Entity<DetallePedido>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.PrecioUnitario)
                .HasColumnType("decimal(10,2)");

            entity.Property(d => d.Subtotal)
                .HasColumnType("decimal(10,2)");

            entity.HasOne(d => d.Pedido)
                .WithMany(p => p.Detalles)
                .HasForeignKey(d => d.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // SOLICITUD REPARTIDOR
        // =========================
        modelBuilder.Entity<SolicitudRepartidor>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.TipoVehiculo)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(s => s.Placa)
                .HasMaxLength(30);

            entity.Property(s => s.Estado)
                .HasMaxLength(20)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(s => s.Observacion)
                .HasMaxLength(500);

            // Usuario que solicita ser repartidor
            entity.HasOne(s => s.Usuario)
                .WithMany(u => u.SolicitudesRepartidor)
                .HasForeignKey(s => s.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Administrador que revisa
            entity.HasOne(s => s.RevisadoPorUsuario)
                .WithMany(
                    u => u.SolicitudesRepartidorRevisadas
                )
                .HasForeignKey(
                    s => s.RevisadoPorUsuarioId
                )
                .OnDelete(DeleteBehavior.Restrict);
        });

        // =========================
        // REPARTIDOR
        // =========================
        modelBuilder.Entity<Repartidor>(entity =>
        {
            entity.HasKey(r => r.Id);

            // Cada usuario solo puede tener
            // un perfil de repartidor
            entity.HasIndex(r => r.UsuarioId)
                .IsUnique();

            entity.Property(r => r.TipoVehiculo)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(r => r.Placa)
                .HasMaxLength(30);

            entity.Property(r => r.Disponible)
                .HasDefaultValue(false);

            entity.Property(r => r.Activo)
                .HasDefaultValue(true);

            entity.Property(r => r.LatitudActual)
                .HasColumnType("decimal(10,7)");

            entity.Property(r => r.LongitudActual)
                .HasColumnType("decimal(10,7)");
        });
    }
}