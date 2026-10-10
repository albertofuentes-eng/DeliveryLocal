import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import AdminSidebar from "../components/AdminSidebar";

import {
  obtenerPagosAdmin,
  type PagoAdmin,
} from "../services/api";

export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

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

  useEffect(() => {
    void cargarPagos();
  }, []);

  const totalPedidos = pagos.length;

  const montoTotal = pagos.reduce(
    (suma, pago) => suma + pago.total,
    0
  );

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
        .filter((valor): valor is string => Boolean(valor))
    )
  );

  return (
    <div style={styles.layout}>
      <AdminSidebar />

      <main style={styles.contenido}>
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
            Actualizar
          </button>
        </div>

        <div style={styles.resumen}>
          <div style={styles.tarjeta}>
            <strong>{totalPedidos}</strong>
            <span>Pedidos consultados</span>
          </div>

          <div style={styles.tarjeta}>
            <strong>Q {montoTotal.toFixed(2)}</strong>
            <span>Valor total de pedidos</span>
          </div>

          <div style={styles.tarjeta}>
            <strong>
              {pagos.reduce(
                (total, pago) =>
                  total + pago.transacciones.length,
                0
              )}
            </strong>
            <span>Transacciones registradas</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.filtros}>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={styles.input}
            aria-label="Filtrar por método de pago"
          >
            <option value="Todos">Todos los métodos</option>

            {metodos.map((metodo) => (
              <option key={metodo} value={metodo}>
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

                <p>
                  <strong>Liquidación:</strong>{" "}
                  {pago.estadoLiquidacion || "Sin información"}
                </p>

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
                        {transaccion.proveedor || "No registrado"}
                      </p>

                      <p>
                        <strong>Fecha:</strong>{" "}
                        {new Date(
                          transaccion.fechaCreacion
                        ).toLocaleString("es-GT")}
                      </p>

                      {transaccion.fechaConfirmacion && (
                        <p>
                          <strong>Confirmación registrada:</strong>{" "}
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

        <p style={styles.nota}>
          Los estados mostrados provienen del sistema.
          Esta pantalla no verifica transferencias bancarias
          ni confirma pagos automáticamente.
        </p>
      </main>
    </div>
  );
}

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
  nota: {
    color: "#777",
    fontSize: "13px",
    marginTop: "24px",
  },
};