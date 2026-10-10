using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeliveryApi.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCalificacionesFase5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalificacionesPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    EmisorUsuarioId = table.Column<int>(type: "int", nullable: false),
                    ReceptorUsuarioId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Puntuacion = table.Column<int>(type: "int", nullable: false),
                    Comentario = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalificacionesPedido", x => x.Id);
                    table.CheckConstraint("CK_CalificacionesPedido_Puntuacion", "[Puntuacion] BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_CalificacionesPedido_Tipo", "[Tipo] IN ('ClienteARepartidor', 'RepartidorACliente')");
                    table.CheckConstraint("CK_CalificacionesPedido_UsuariosDistintos", "[EmisorUsuarioId] <> [ReceptorUsuarioId]");
                    table.ForeignKey(
                        name: "FK_CalificacionesPedido_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CalificacionesPedido_Usuarios_EmisorUsuarioId",
                        column: x => x.EmisorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CalificacionesPedido_Usuarios_ReceptorUsuarioId",
                        column: x => x.ReceptorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalificacionesPedido_EmisorUsuarioId",
                table: "CalificacionesPedido",
                column: "EmisorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_CalificacionesPedido_PedidoId_Tipo",
                table: "CalificacionesPedido",
                columns: new[] { "PedidoId", "Tipo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalificacionesPedido_ReceptorUsuarioId",
                table: "CalificacionesPedido",
                column: "ReceptorUsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalificacionesPedido");
        }
    }
}
