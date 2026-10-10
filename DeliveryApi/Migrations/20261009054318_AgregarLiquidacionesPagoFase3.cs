using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeliveryApi.Migrations
{
    /// <inheritdoc />
    public partial class AgregarLiquidacionesPagoFase3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LiquidacionesPago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    Beneficiario = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    MontoBruto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Comision = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    MontoNeto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Pendiente"),
                    Proveedor = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ReferenciaExterna = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaLiquidacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Observacion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiquidacionesPago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiquidacionesPago_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesPago_PedidoId",
                table: "LiquidacionesPago",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_LiquidacionesPago_PedidoId_Beneficiario",
                table: "LiquidacionesPago",
                columns: new[] { "PedidoId", "Beneficiario" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LiquidacionesPago");
        }
    }
}
