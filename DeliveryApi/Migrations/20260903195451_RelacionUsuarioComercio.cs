using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeliveryApi.Migrations
{
    /// <inheritdoc />
    public partial class RelacionUsuarioComercio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ComercioId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ComercioId",
                table: "Usuarios",
                column: "ComercioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Comercios_ComercioId",
                table: "Usuarios",
                column: "ComercioId",
                principalTable: "Comercios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Comercios_ComercioId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_ComercioId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ComercioId",
                table: "Usuarios");
        }
    }
}
