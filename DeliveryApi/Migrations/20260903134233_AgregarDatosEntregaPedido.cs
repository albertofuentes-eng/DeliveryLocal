using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeliveryApi.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDatosEntregaPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DireccionEntrega",
                table: "Pedidos",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaProgramada",
                table: "Pedidos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndicacionesEntrega",
                table: "Pedidos",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LatitudEntrega",
                table: "Pedidos",
                type: "decimal(10,7)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LongitudEntrega",
                table: "Pedidos",
                type: "decimal(10,7)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenciaEntrega",
                table: "Pedidos",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoEntrega",
                table: "Pedidos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoEntrega",
                table: "Pedidos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Domicilio");

            migrationBuilder.AddColumn<string>(
                name: "TipoTiempo",
                table: "Pedidos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Ahora");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DireccionEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "FechaProgramada",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "IndicacionesEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "LatitudEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "LongitudEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "ReferenciaEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "TelefonoEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "TipoEntrega",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "TipoTiempo",
                table: "Pedidos");
        }
    }
}
