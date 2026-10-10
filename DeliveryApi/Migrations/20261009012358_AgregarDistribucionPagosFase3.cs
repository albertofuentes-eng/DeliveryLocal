using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeliveryApi.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDistribucionPagosFase3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TokenEntrega",
                table: "Pedidos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MetodoPago",
                table: "Pedidos",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Efectivo",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "EstadoPago",
                table: "Pedidos",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Pendiente",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "ComprobantePagoUrl",
                table: "Pedidos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ComisionPasarela",
                table: "Pedidos",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoLiquidacion",
                table: "Pedidos",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Pendiente");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaLiquidacion",
                table: "Pedidos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoComercio",
                table: "Pedidos",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MontoDeliveryLocal",
                table: "Pedidos",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ProveedorPago",
                table: "Pedidos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenciaPagoExterno",
                table: "Pedidos",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);


            // Inicializar la distribución de los pedidos existentes.
            // Esto NO significa que los pagos ya estén liquidados.

            migrationBuilder.Sql(@"
                UPDATE Pedidos
                SET
                    MontoComercio = Subtotal,
                    MontoDeliveryLocal = CASE
                        WHEN TipoEntrega = 'Recoger' THEN 0
                        ELSE Envio
                    END,
                    EstadoLiquidacion = 'Pendiente';
            ");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ComisionPasarela",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "EstadoLiquidacion",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "FechaLiquidacion",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "MontoComercio",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "MontoDeliveryLocal",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "ProveedorPago",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "ReferenciaPagoExterno",
                table: "Pedidos");

            migrationBuilder.AlterColumn<string>(
                name: "TokenEntrega",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "MetodoPago",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldDefaultValue: "Efectivo");

            migrationBuilder.AlterColumn<string>(
                name: "EstadoPago",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldDefaultValue: "Pendiente");

            migrationBuilder.AlterColumn<string>(
                name: "ComprobantePagoUrl",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
