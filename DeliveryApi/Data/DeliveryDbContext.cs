using DeliveryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DeliveryApi.Data;

public class DeliveryDbContext : DbContext
{
    public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Comercio> Comercios => Set<Comercio>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<DetallePedido> DetallesPedido => Set<DetallePedido>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
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
        });

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
        
    }
}