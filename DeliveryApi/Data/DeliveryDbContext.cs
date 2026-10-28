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

    // FASE 3: Historial de transacciones de pago
    public DbSet<TransaccionPago> TransaccionesPago
        => Set<TransaccionPago>();

    // FASE 3: Liquidaciones de comercios y DeliveryLocal
    public DbSet<LiquidacionPago> LiquidacionesPago
        => Set<LiquidacionPago>();

        // Solicitudes de devolución de dinero a clientes.
    public DbSet<SolicitudReembolso> SolicitudesReembolso
        => Set<SolicitudReembolso>();

    // FASE 4: Incidencias reportadas durante las entregas
    public DbSet<IncidenciaPedido> IncidenciasPedido
        => Set<IncidenciaPedido>();

    // ==========================================
    // FASE 5: CALIFICACIONES ENTRE USUARIOS
    // ==========================================

    public DbSet<CalificacionPedido> CalificacionesPedido
        => Set<CalificacionPedido>();

    // NUEVO
    public DbSet<SolicitudRepartidor> SolicitudesRepartidor
        => Set<SolicitudRepartidor>();

    // NUEVO
    public DbSet<Repartidor> Repartidores
        => Set<Repartidor>();

    public DbSet<DispositivoPush> DispositivosPush
        => Set<DispositivoPush>();

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

        modelBuilder.Entity<Comercio>()
            .Property(c => c.Latitud)
            .HasPrecision(10, 7);

        modelBuilder.Entity<Comercio>()
            .Property(c => c.Longitud)
            .HasPrecision(10, 7);

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


            // ==========================================
            // FASE 3: PAGOS Y DISTRIBUCIÓN DE DINERO
            // ==========================================

            entity.Property(p => p.MontoComercio)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.MontoDeliveryLocal)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.ComisionPasarela)
                .HasColumnType("decimal(10,2)");

            entity.Property(p => p.MetodoPago)
                .HasMaxLength(30)
                .HasDefaultValue("Efectivo")
                .IsRequired();

            entity.Property(p => p.EstadoPago)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(p => p.ComprobantePagoUrl)
                .HasMaxLength(500);

            entity.Property(p => p.ReferenciaPagoExterno)
                .HasMaxLength(150);

            entity.Property(p => p.ProveedorPago)
                .HasMaxLength(50);

            entity.Property(p => p.EstadoLiquidacion)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(p => p.TokenEntrega)
                .HasMaxLength(100);


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

        // =========================
        // DISPOSITIVO PUSH
        // =========================
        modelBuilder.Entity<DispositivoPush>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.ExpoPushToken)
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(d => d.Aplicacion)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(d => d.Plataforma)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(d => d.Activo)
                .HasDefaultValue(true);

            entity.HasIndex(d => d.ExpoPushToken)
                .IsUnique();

            entity.HasOne(d => d.Usuario)
                .WithMany(u => u.DispositivosPush)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ==========================================
        // FASE 3: TRANSACCIONES DE PAGO
        // ==========================================

        modelBuilder.Entity<TransaccionPago>(entity =>
        {
            entity.HasKey(t => t.Id);

            // Importe de la transacción
            entity.Property(t => t.Monto)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            // Moneda: GTQ
            entity.Property(t => t.Moneda)
                .HasMaxLength(3)
                .HasDefaultValue("GTQ")
                .IsRequired();

            // Pendiente / Aprobado / Rechazado / Reembolsado
            entity.Property(t => t.Estado)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(t => t.Proveedor)
                .HasMaxLength(50);

            entity.Property(t => t.ReferenciaExterna)
                .HasMaxLength(150);

            entity.Property(t => t.ClaveIdempotencia)
                .HasMaxLength(150);

            entity.Property(t => t.Observacion)
                .HasMaxLength(500);

            // Un pedido puede tener varios intentos de pago.
            // Cada transacción pertenece a un solo pedido.
            entity.HasOne(t => t.Pedido)
                .WithMany()
                .HasForeignKey(t => t.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Consultas rápidas por pedido
            entity.HasIndex(t => t.PedidoId);

            // Evita registrar dos transacciones con
            // la misma clave de idempotencia.
            entity.HasIndex(t => t.ClaveIdempotencia)
                .IsUnique()
                .HasFilter("[ClaveIdempotencia] IS NOT NULL");

            // Una referencia externa no debe repetirse
            // dentro del mismo proveedor.
            entity.HasIndex(t => new
            {
                t.Proveedor,
                t.ReferenciaExterna
            })
            .IsUnique()
            .HasFilter(
                "[Proveedor] IS NOT NULL AND " +
                "[ReferenciaExterna] IS NOT NULL"
            );
        });


        // ==========================================
        // FASE 3: LIQUIDACIONES DE PAGOS
        // ==========================================

        modelBuilder.Entity<LiquidacionPago>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.Property(l => l.Beneficiario)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(l => l.MontoBruto)
                .HasColumnType("decimal(10,2)");

            entity.Property(l => l.Comision)
                .HasColumnType("decimal(10,2)");

            entity.Property(l => l.MontoNeto)
                .HasColumnType("decimal(10,2)");

            entity.Property(l => l.Estado)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(l => l.Proveedor)
                .HasMaxLength(50);

            entity.Property(l => l.ReferenciaExterna)
                .HasMaxLength(150);

            entity.Property(l => l.Observacion)
                .HasMaxLength(500);

            // Un pedido puede tener liquidaciones
            // para diferentes beneficiarios.
            entity.HasOne(l => l.Pedido)
                .WithMany()
                .HasForeignKey(l => l.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(l => l.PedidoId);

            // Una liquidación por beneficiario
            // para cada pedido en este diseño.
            entity.HasIndex(l => new
            {
                l.PedidoId,
                l.Beneficiario
            })
            .IsUnique();
        });

        // ==========================================
        // SOLICITUDES DE REEMBOLSO
        // ==========================================

        modelBuilder.Entity<SolicitudReembolso>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Monto)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            entity.Property(r => r.Moneda)
                .HasMaxLength(3)
                .HasDefaultValue("GTQ")
                .IsRequired();

            entity.Property(r => r.Estado)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(r => r.Motivo)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(r => r.ReferenciaDevolucion)
                .HasMaxLength(150);

            entity.Property(r => r.ObservacionAdmin)
                .HasMaxLength(1000);

            entity.HasOne(r => r.Pedido)
                .WithMany()
                .HasForeignKey(r => r.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Evitar dos solicitudes automáticas para el mismo pedido.
            entity.HasIndex(r => r.PedidoId)
                .IsUnique();
        });


        // ==========================================
        // FASE 4: INCIDENCIAS DE PEDIDOS
        // ==========================================

        modelBuilder.Entity<IncidenciaPedido>(entity =>
        {
            entity.HasKey(i => i.Id);

            entity.Property(i => i.Motivo)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(i => i.Descripcion)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(i => i.EvidenciaUrl)
                .HasMaxLength(500);

            entity.Property(i => i.Estado)
                .HasMaxLength(30)
                .HasDefaultValue("Pendiente")
                .IsRequired();

            entity.Property(i => i.Resolucion)
                .HasMaxLength(1000);

            // Relación con el pedido
            entity.HasOne(i => i.Pedido)
                .WithMany()
                .HasForeignKey(i => i.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación con el repartidor
            entity.HasOne(i => i.Repartidor)
                .WithMany()
                .HasForeignKey(i => i.RepartidorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Índices para consultar incidencias
            entity.HasIndex(i => i.PedidoId);

            entity.HasIndex(i => i.RepartidorId);

            entity.HasIndex(i => i.Estado);
        });


        // ==========================================
        // FASE 5: CALIFICACIONES DE PEDIDOS
        // ==========================================

        modelBuilder.Entity<CalificacionPedido>(entity =>
        {
            entity.HasKey(c => c.Id);

            // ClienteARepartidor / RepartidorACliente
            entity.Property(c => c.Tipo)
                .HasMaxLength(30)
                .IsRequired();

            // Calificación de 1 a 5 estrellas
            entity.Property(c => c.Puntuacion)
                .IsRequired();

            // Comentario opcional
            entity.Property(c => c.Comentario)
                .HasMaxLength(500);

            entity.Property(c => c.FechaCreacion)
                .IsRequired();

            // Relación con el pedido
            entity.HasOne(c => c.Pedido)
                .WithMany()
                .HasForeignKey(c => c.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Usuario que realiza la calificación
            entity.HasOne(c => c.EmisorUsuario)
                .WithMany()
                .HasForeignKey(c => c.EmisorUsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Usuario que recibe la calificación
            entity.HasOne(c => c.ReceptorUsuario)
                .WithMany()
                .HasForeignKey(c => c.ReceptorUsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Impide calificar dos veces en la misma
            // dirección para un mismo pedido.
            entity.HasIndex(c => new
            {
                c.PedidoId,
                c.Tipo
            })
            .IsUnique();

            // Facilita calcular reputaciones
            entity.HasIndex(c => c.ReceptorUsuarioId);

            // Validaciones a nivel de SQL Server
            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "CK_CalificacionesPedido_Puntuacion",
                    "[Puntuacion] BETWEEN 1 AND 5"
                );

                t.HasCheckConstraint(
                    "CK_CalificacionesPedido_Tipo",
                    "[Tipo] IN ('ClienteARepartidor', 'RepartidorACliente')"
                );

                t.HasCheckConstraint(
                    "CK_CalificacionesPedido_UsuariosDistintos",
                    "[EmisorUsuarioId] <> [ReceptorUsuarioId]"
                );
            });
        });
    }
}