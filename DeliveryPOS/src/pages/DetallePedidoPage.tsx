
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  actualizarEstadoPedido,
  obtenerDetallePedidoComercio,
  confirmarRecogidaPedido,
  type DetallePedidoComercio,
} from "../services/api";

export default function DetallePedidoPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pedido, setPedido] =
    useState<DetallePedidoComercio | null>(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // FASE 3: verificación de entrega en comercio
  const [codigoEntrega, setCodigoEntrega] = useState("");
  const [mostrarFormularioCodigo, setMostrarFormularioCodigo] =
    useState(false);

  useEffect(() => {
    void cargarPedido();
  }, [id]);

  async function cargarPedido() {
    const token = localStorage.getItem("deliverypos_token");

    if (!token) {
      navigate("/");
      return;
    }

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      setMensaje("No se indicó un pedido válido.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data = await obtenerDetallePedidoComercio(
        token,
        Number(id)
      );

      setPedido(data);
    } catch (error: unknown) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(nuevoEstado: string) {
    if (!pedido || actualizando) return;

    // No permitir que la pantalla omita la validación.
    if (nuevoEstado === "Entregado") {
      setMensaje(
        "Para entregar el pedido debes verificar el código del cliente."
      );
      return;
    }

    const token = localStorage.getItem("deliverypos_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setActualizando(true);
      setMensaje("");

      await actualizarEstadoPedido(
        token,
        pedido.id,
        nuevoEstado
      );

      setPedido({
        ...pedido,
        estado: nuevoEstado,
      });

      setMensaje(`Estado actualizado a "${nuevoEstado}".`);
    } catch (error: unknown) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado."
      );
    } finally {
      setActualizando(false);
    }
  }

  async function verificarEntrega() {
    if (!pedido || actualizando) return;

    if (
      pedido.tipoEntrega !== "Recoger" ||
      pedido.estado !== "Listo para recoger"
    ) {
      setMensaje(
        "Este pedido no está disponible para confirmar su recogida."
      );
      return;
    }

    const codigo = codigoEntrega.trim().toUpperCase();

    if (!codigo) {
      setMensaje("Ingresá el código de entrega del cliente.");
      return;
    }

    if (codigo.length > 35) {
      setMensaje("El código de entrega no es válido.");
      return;
    }

    const token = localStorage.getItem("deliverypos_token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setActualizando(true);
      setMensaje("");

      await confirmarRecogidaPedido(
        token,
        pedido.id,
        codigo
      );

      setPedido({
        ...pedido,
        estado: "Entregado",
      });

      setCodigoEntrega("");
      setMostrarFormularioCodigo(false);

      setMensaje(
        "Pedido entregado correctamente. El código de seguridad fue utilizado."
      );
    } catch (error: unknown) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo verificar el código."
      );
    } finally {
      setActualizando(false);
    }
  }

  if (cargando) {
    return (
      <div className="detail-page">
        <div className="loading-box">
          Cargando pedido...
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="detail-page">
        <div className="empty-box">
          {mensaje || "Pedido no encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-container">
        <div className="detail-topbar">
          <div>
            <button
              className="back-link"
              onClick={() => navigate("/dashboard")}
            >
              ← Volver a pedidos
            </button>

            <h1>Pedido #{pedido.id}</h1>
            <p>{pedido.comercio}</p>
          </div>

          <span className="detail-status">
            {pedido.estado}
          </span>
        </div>

        {mensaje && (
          <div className="detail-message" role="status">
            {mensaje}
          </div>
        )}

        <div className="detail-grid">
          <section className="detail-card">
            <h2>Cliente</h2>

            <p>
              <strong>Nombre:</strong> {pedido.cliente}
            </p>

            <p>
              <strong>Correo:</strong>{" "}
              {pedido.correoCliente || "No disponible"}
            </p>

            <p>
              <strong>Teléfono:</strong>{" "}
              {pedido.telefonoEntrega ||
                pedido.telefonoCliente ||
                "No disponible"}
            </p>
          </section>

          <section className="detail-card">
            <h2>Entrega</h2>

            <p>
              <strong>Tipo:</strong> {pedido.tipoEntrega}
            </p>

            {pedido.tipoEntrega === "Domicilio" ? (
              <>
                <p>
                  <strong>Dirección:</strong>{" "}
                  {pedido.direccionEntrega || "No disponible"}
                </p>

                <p>
                  <strong>Referencia:</strong>{" "}
                  {pedido.referenciaEntrega || "No disponible"}
                </p>

                <p>
                  <strong>Indicaciones:</strong>{" "}
                  {pedido.indicacionesEntrega ||
                    "Sin indicaciones"}
                </p>
              </>
            ) : (
              <p>
                El cliente recogerá el pedido en el comercio.
              </p>
            )}
          </section>

          <section className="detail-card">
            <h2>Horario</h2>

            <p>
              <strong>Modalidad:</strong>{" "}
              {pedido.tipoTiempo === "Ahora"
                ? "Lo antes posible"
                : "Programado"}
            </p>

            {pedido.fechaProgramada && (
              <p>
                <strong>Fecha programada:</strong>{" "}
                {new Date(
                  pedido.fechaProgramada
                ).toLocaleString()}
              </p>
            )}

            <p>
              <strong>Pedido realizado:</strong>{" "}
              {new Date(pedido.fecha).toLocaleString()}
            </p>
          </section>
        </div>

        <section className="detail-card products-section">
          <h2>Productos</h2>

          {pedido.detalles.map((item, index) => (
            <div
              className="detail-product"
              key={`${item.productoId}-${index}`}
            >
              <div>
                <strong>{item.producto}</strong>

                <p>
                  {item.cantidad} x Q{" "}
                  {Number(item.precioUnitario).toFixed(2)}
                </p>
              </div>

              <strong>
                Q {Number(item.subtotal).toFixed(2)}
              </strong>
            </div>
          ))}
        </section>

        <section className="detail-card totals-section">
          <div>
            <span>Subtotal</span>
            <strong>
              Q {Number(pedido.subtotal).toFixed(2)}
            </strong>
          </div>

          <div>
            <span>Envío</span>
            <strong>
              Q {Number(pedido.envio).toFixed(2)}
            </strong>
          </div>

          <div className="grand-total">
            <span>Total</span>
            <strong>
              Q {Number(pedido.total).toFixed(2)}
            </strong>
          </div>
        </section>

        <section className="status-actions">
          <h2>Cambiar estado</h2>

          <div className="status-buttons">
            {pedido.estado === "Pendiente" && (
              <>
                <button
                  disabled={actualizando}
                  onClick={() => cambiarEstado("Confirmado")}
                >
                  CONFIRMAR
                </button>

                <button
                  className="reject-button"
                  disabled={actualizando}
                  onClick={() => cambiarEstado("Rechazado")}
                >
                  RECHAZAR
                </button>
              </>
            )}

            {pedido.estado === "Confirmado" && (
              <>
                <button
                  disabled={actualizando}
                  onClick={() => cambiarEstado("Preparando")}
                >
                  PREPARANDO
                </button>

                <button
                  className="reject-button"
                  disabled={actualizando}
                  onClick={() => cambiarEstado("Rechazado")}
                >
                  RECHAZAR
                </button>
              </>
            )}

            {pedido.estado === "Preparando" && (
              <button
                disabled={actualizando}
                onClick={() =>
                  cambiarEstado("Listo para recoger")
                }
              >
                LISTO PARA RECOGER
              </button>
            )}

            {pedido.estado === "Listo para recoger" &&
              pedido.tipoEntrega === "Recoger" && (
                <div
                  className="detail-card"
                  style={{
                    width: "100%",
                    padding: 20,
                    marginTop: 12,
                  }}
                >
                  <h3>Confirmar recogida con código</h3>

                  <p>
                    Solicitá al cliente el código de seguridad
                    que aparece en su aplicación.
                  </p>

                  {!mostrarFormularioCodigo ? (
                    <button
                      disabled={actualizando}
                      onClick={() => {
                        setMensaje("");
                        setMostrarFormularioCodigo(true);
                      }}
                    >
                      VERIFICAR CÓDIGO DE ENTREGA
                    </button>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void verificarEntrega();
                      }}
                    >
                      <label
                        htmlFor="codigo-entrega"
                        style={{
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Código del cliente
                      </label>

                      <input
                        id="codigo-entrega"
                        type="text"
                        value={codigoEntrega}
                        onChange={(event) =>
                          setCodigoEntrega(
                            event.target.value.toUpperCase()
                          )
                        }
                        placeholder="DL-..."
                        maxLength={35}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={actualizando}
                        autoFocus
                        style={{
                          display: "block",
                          width: "100%",
                          maxWidth: 420,
                          padding: 12,
                          marginBottom: 14,
                          border: "1px solid #aaa",
                          borderRadius: 8,
                          boxSizing: "border-box",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="submit"
                          disabled={
                            actualizando ||
                            !codigoEntrega.trim()
                          }
                        >
                          {actualizando
                            ? "VERIFICANDO..."
                            : "CONFIRMAR ENTREGA"}
                        </button>

                        <button
                          type="button"
                          className="reject-button"
                          disabled={actualizando}
                          onClick={() => {
                            setCodigoEntrega("");
                            setMostrarFormularioCodigo(false);
                            setMensaje("");
                          }}
                        >
                          CANCELAR
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            {pedido.estado === "Listo para recoger" &&
              pedido.tipoEntrega === "Domicilio" && (
                <div className="status-info">
                  Este pedido ya está listo. El siguiente
                  paso será asignar un repartidor.
                </div>
              )}

            {pedido.estado === "Rechazado" && (
              <div className="status-info">
                Este pedido fue rechazado.
              </div>
            )}

            {pedido.estado === "Cancelado" && (
              <div className="status-info">
                Este pedido fue cancelado.
              </div>
            )}

            {pedido.estado === "Entregado" && (
              <div className="status-info">
                Pedido entregado correctamente.
              </div>
            )}

            {pedido.estado === "Asignado a repartidor" && (
              <div className="status-info">
                Pedido asignado a un repartidor.
              </div>
            )}

            {pedido.estado === "Recogido" && (
              <div className="status-info">
                El repartidor recogió el pedido.
              </div>
            )}

            {pedido.estado === "En camino" && (
              <div className="status-info">
                El pedido está en camino.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
