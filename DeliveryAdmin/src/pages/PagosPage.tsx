
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import AdminSidebar from "../components/AdminSidebar";

import {
  obtenerPagosAdmin,
  obtenerComprobanteAdmin,
  verificarTransferenciaAdmin,
  rechazarTransferenciaAdmin,
  type PagoAdmin,
} from "../services/api";

export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [pedidoComprobante, setPedidoComprobante] =
    useState<number | null>(null);

  const [cargandoComprobante, setCargandoComprobante] =
    useState<number | null>(null);

  const [verificandoPedido, setVerificandoPedido] =
    useState<number | null>(null);

  const [rechazandoPedido, setRechazandoPedido] =
    useState<number | null>(null);

  const [mensaje, setMensaje] = useState("");

  // ==========================================
  // CARGAR PAGOS
  // ==========================================

  async function cargarPagos() {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const datos = await obtenerPagosAdmin(token);
      setPagos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los pagos."
      );
    } finally {
      setCargando(false);
    }
  }

  // ==========================================
  // VISUALIZAR COMPROBANTE
  // ==========================================

  async function verComprobante(pedidoId: number) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    try {
      setError("");
      setCargandoComprobante(pedidoId);

      const archivo = await obtenerComprobanteAdmin(
        token,
        pedidoId
      );

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(archivo.type)
      ) {
        throw new Error(
          "El servidor devolvió un formato de imagen no válido."
        );
      }

      const url = URL.createObjectURL(archivo);

      setComprobanteUrl(url);
      setPedidoComprobante(pedidoId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo visualizar el comprobante."
      );
    } finally {
      setCargandoComprobante(null);
    }
  }

  function cerrarComprobante() {
    setPedidoComprobante(null);
    setComprobanteUrl("");
  }

  // ==========================================
  // VERIFICAR TRANSFERENCIA
  // ==========================================

  async function verificarPago(pedidoId: number) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    if (
      verificandoPedido !== null ||
      rechazandoPedido !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `Pedido #${pedidoId}\n\n` +
        "¿Confirmas que revisaste el comprobante y comprobaste " +
        "que el dinero fue recibido en la cuenta bancaria?\n\n" +
        "Esta acción marcará la transferencia como verificada."
    );

    if (!confirmado) return;

    try {
      setError("");
      setMensaje("");
      setVerificandoPedido(pedidoId);

      await verificarTransferenciaAdmin(token, pedidoId);

      setMensaje(
        `Pedido #${pedidoId}: transferencia marcada como verificada.`
      );

      await cargarPagos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo verificar la transferencia."
      );
    } finally {
      setVerificandoPedido(null);
    }
  }

  // ==========================================
  // RECHAZAR COMPROBANTE
  // ==========================================

  async function rechazarPago(pedidoId: number) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    if (
      verificandoPedido !== null ||
      rechazandoPedido !== null
    ) {
      return;
    }

    const confirmado = window.confirm(
      `¿Rechazar el comprobante del pedido #${pedidoId}?\n\n` +
        "El cliente podrá enviar un nuevo comprobante."
    );

    if (!confirmado) return;

    try {
      setError("");
      setMensaje("");
      setRechazandoPedido(pedidoId);

      await rechazarTransferenciaAdmin(token, pedidoId);

      setMensaje(
        `Pedido #${pedidoId}: comprobante rechazado correctamente.`
      );

      await cargarPagos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo rechazar el comprobante."
      );
    } finally {
      setRechazandoPedido(null);
    }
  }

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    void cargarPagos();
  }, []);

  useEffect(() => {
    return () => {
      if (comprobanteUrl) {
        URL.revokeObjectURL(comprobanteUrl);
      }
    };
  }, [comprobanteUrl]);

  // ==========================================
  // RESUMEN
  // ==========================================

  const totalPedidos = pagos.length;

  const montoTotal = pagos.reduce(
    (suma, pago) => suma + pago.total,
    0
  );

  const totalTransacciones = pagos.reduce(
    (total, pago) => total + pago.transacciones.length,
    0
  );

  // ==========================================
  // FILTROS
  // ==========================================

  const pagosFiltrados = pagos.filter((pago) => {
    const coincideMetodo =
      filtro === "Todos" ||
      pago.metodoPago === filtro;

    const coincideBusqueda =
      !busqueda.trim() ||
      String(pago.pedidoId).includes(busqueda.trim()) ||
      String(pago.clienteId).includes(busqueda.trim());

    return coincideMetodo && coincideBusqueda;
  });

  const metodos = Array.from(
    new Set(
      pagos
        .map((pago) => pago.metodoPago)
        .filter(
          (valor): valor is string => Boolean(valor)
        )
    )
  );

  const procesandoPago =
    verificandoPedido !== null ||
    rechazandoPedido !== null;

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div style={styles.layout}>
      <AdminSidebar />

      <main style={styles.contenido}>
        {/* ENCABEZADO */}

        <div style={styles.encabezado}>
          <div>
            <h1 style={styles.titulo}>Pagos</h1>

            <p style={styles.subtitulo}>
              Consulta de pagos, métodos y transacciones
              de los pedidos.
            </p>
          </div>

          <button
            type="button"
            style={styles.boton}
            onClick={() => void cargarPagos()}
            disabled={cargando}
          >
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {/* RESUMEN */}

        <div style={styles.resumen}>
          <div style={styles.tarjeta}>
            <strong>{totalPedidos}</strong>
            <span>Pedidos consultados</span>
          </div>

          <div style={styles.tarjeta}>
            <strong>
              Q {montoTotal.toFixed(2)}
            </strong>
            <span>Valor total de pedidos</span>
          </div>

          <div style={styles.tarjeta}>
            <strong>{totalTransacciones}</strong>
            <span>Transacciones registradas</span>
          </div>
        </div>

        {/* MENSAJES */}

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        {mensaje && (
          <div role="status" style={styles.exito}>
            {mensaje}
          </div>
        )}

        {/* FILTROS */}

        <div style={styles.filtros}>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={styles.input}
            aria-label="Filtrar por método de pago"
          >
            <option value="Todos">
              Todos los métodos
            </option>

            {metodos.map((metodo) => (
              <option
                key={metodo}
                value={metodo}
              >
                {metodo}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Buscar pedido o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* LISTADO DE PAGOS */}

        {cargando ? (
          <p>Cargando pagos...</p>
        ) : pagosFiltrados.length === 0 ? (
          <div style={styles.tarjeta}>
            No hay registros para mostrar.
          </div>
        ) : (
          <div style={styles.lista}>
            {pagosFiltrados.map((pago) => (
              <article
                key={pago.pedidoId}
                style={styles.tarjeta}
              >
                <h2 style={styles.pedido}>
                  Pedido #{pago.pedidoId}
                </h2>

                <p>
                  <strong>Cliente ID:</strong>{" "}
                  {pago.clienteId}
                </p>

                <p>
                  <strong>Total:</strong>{" "}
                  Q {pago.total.toFixed(2)}
                </p>

                <p>
                  <strong>Método:</strong>{" "}
                  {pago.metodoPago || "Sin especificar"}
                </p>

                <p>
                  <strong>Estado del pago:</strong>{" "}
                  {pago.estadoPago || "Sin información"}
                </p>

                {/* ACCIONES DE TRANSFERENCIA */}

                {pago.metodoPago === "Transferencia" &&
                  (pago.estadoPago === "ComprobanteSubido" ||
                    pago.estadoPago === "Verificado") && (
                    <div style={styles.accionesPago}>
                      {/* VER COMPROBANTE */}

                      <button
                        type="button"
                        style={styles.boton}
                        disabled={
                          cargandoComprobante === pago.pedidoId
                        }
                        onClick={() =>
                          void verComprobante(pago.pedidoId)
                        }
                      >
                        {cargandoComprobante === pago.pedidoId
                          ? "Cargando imagen..."
                          : "Ver comprobante"}
                      </button>

                      {/* VERIFICAR O RECHAZAR */}

                      {pago.estadoPago === "ComprobanteSubido" && (
                        <>
                          <button
                            type="button"
                            style={{
                              ...styles.boton,
                              background: "#1769aa",
                            }}
                            disabled={procesandoPago}
                            onClick={() =>
                              void verificarPago(pago.pedidoId)
                            }
                          >
                            {verificandoPedido === pago.pedidoId
                              ? "Verificando..."
                              : "Verificar transferencia"}
                          </button>

                          <button
                            type="button"
                            style={{
                              ...styles.boton,
                              background: "#dc3545",
                            }}
                            disabled={procesandoPago}
                            onClick={() =>
                              void rechazarPago(pago.pedidoId)
                            }
                          >
                            {rechazandoPedido === pago.pedidoId
                              ? "Rechazando..."
                              : "Rechazar comprobante"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                {/* ESTADO RECHAZADO */}

                {pago.metodoPago === "Transferencia" &&
                  pago.estadoPago === "Rechazado" && (
                    <div style={styles.avisoRechazo}>
                      Comprobante rechazado. El cliente debe
                      enviar uno nuevo.
                    </div>
                  )}

                <p>
                  <strong>Liquidación:</strong>{" "}
                  {pago.estadoLiquidacion ||
                    "Sin información"}
                </p>

                {/* TRANSACCIONES */}

                <h3>Transacciones</h3>

                {pago.transacciones.length === 0 ? (
                  <p>Sin transacciones registradas.</p>
                ) : (
                  pago.transacciones.map((transaccion) => (
                    <div
                      key={transaccion.id}
                      style={styles.transaccion}
                    >
                      <p>
                        <strong>Transacción:</strong>{" "}
                        #{transaccion.id}
                      </p>

                      <p>
                        <strong>Monto:</strong>{" "}
                        {transaccion.moneda}{" "}
                        {transaccion.monto.toFixed(2)}
                      </p>

                      <p>
                        <strong>Estado:</strong>{" "}
                        {transaccion.estado}
                      </p>

                      <p>
                        <strong>Proveedor:</strong>{" "}
                        {transaccion.proveedor ||
                          "No registrado"}
                      </p>

                      <p>
                        <strong>Fecha:</strong>{" "}
                        {new Date(
                          transaccion.fechaCreacion
                        ).toLocaleString("es-GT")}
                      </p>

                      {transaccion.fechaConfirmacion && (
                        <p>
                          <strong>
                            Confirmación registrada:
                          </strong>{" "}
                          {new Date(
                            transaccion.fechaConfirmacion
                          ).toLocaleString("es-GT")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </article>
            ))}
          </div>
        )}

        {/* NOTA DE SEGURIDAD */}

        <p style={styles.nota}>
          Los comprobantes bancarios deben revisarse
          manualmente. Antes de verificar una transferencia,
          el administrador debe confirmar que el dinero
          realmente fue recibido en la cuenta bancaria.
          El sistema no confirma transferencias
          automáticamente.
        </p>

        {/* VISOR PRIVADO DE COMPROBANTES */}

        {pedidoComprobante !== null &&
          comprobanteUrl && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Comprobante del pedido ${pedidoComprobante}`}
              style={styles.fondoModal}
            >
              <div style={styles.modal}>
                <h2>
                  Comprobante del pedido #
                  {pedidoComprobante}
                </h2>

                <img
                  src={comprobanteUrl}
                  alt={`Comprobante bancario del pedido ${pedidoComprobante}`}
                  style={styles.imagenComprobante}
                />

                <p style={styles.nota}>
                  La imagen no confirma por sí sola
                  que el dinero haya sido recibido.
                </p>

                <button
                  type="button"
                  style={styles.boton}
                  onClick={cerrarComprobante}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles: Record<string, CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7f6",
  },

  contenido: {
    flex: 1,
    padding: "32px",
    minWidth: 0,
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },

  titulo: {
    margin: 0,
    fontSize: "28px",
  },

  subtitulo: {
    color: "#777",
  },

  boton: {
    background: "#20a85a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
  },

  resumen: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },

  tarjeta: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px #00000008",
  },

  lista: {
    display: "grid",
    gap: "16px",
  },

  pedido: {
    marginTop: 0,
    fontSize: "20px",
  },

  filtros: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  input: {
    padding: "11px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    minWidth: "220px",
  },

  accionesPago: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "14px",
    marginBottom: "14px",
  },

  transaccion: {
    padding: "14px",
    background: "#f4f8f5",
    borderRadius: "10px",
    marginTop: "10px",
  },

  error: {
    background: "#fff0f0",
    color: "#b3261e",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  exito: {
    background: "#e7f6eb",
    color: "#176a35",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  avisoRechazo: {
    background: "#fff1f0",
    color: "#a52a24",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "12px",
    marginBottom: "12px",
  },

  nota: {
    color: "#777",
    fontSize: "13px",
    marginTop: "24px",
  },

  fondoModal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.78)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },

  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    maxWidth: "720px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  },

  imagenComprobante: {
    width: "100%",
    maxHeight: "65vh",
    objectFit: "contain",
    borderRadius: "10px",
  },
};
