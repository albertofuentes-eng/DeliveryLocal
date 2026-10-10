import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import AdminSidebar from "../components/AdminSidebar";

import {
  obtenerCalificacionesAdmin,
  type CalificacionAdmin,
} from "../services/api";

function obtenerNombre(
  nombre: string | { nombre?: string } | null | undefined,
  nombreAlternativo: string | null | undefined,
  usuarioId: number
): string {
  if (typeof nombre === "string" && nombre.trim()) {
    return nombre;
  }

  if (
    nombre &&
    typeof nombre === "object" &&
    typeof nombre.nombre === "string"
  ) {
    return nombre.nombre;
  }

  return nombreAlternativo || `Usuario #${usuarioId}`;
}

export default function CalificacionesPage() {
  const [calificaciones, setCalificaciones] =
    useState<CalificacionAdmin[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  async function cargarCalificaciones() {
    const token = localStorage.getItem(
      "deliveryadmin_token"
    );

    if (!token) {
      setError("Debes iniciar sesión como administrador.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const datos = await obtenerCalificacionesAdmin(token);

      setCalificaciones(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las calificaciones."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarCalificaciones();
  }, []);

  const total = calificaciones.length;

  const promedio = total
    ? calificaciones.reduce(
        (suma, item) => suma + item.puntuacion,
        0
      ) / total
    : 0;

  const clienteARepartidor = calificaciones.filter(
    (item) => item.tipo === "ClienteARepartidor"
  ).length;

  const repartidorACliente = calificaciones.filter(
    (item) => item.tipo === "RepartidorACliente"
  ).length;

  const filtradas = calificaciones.filter((item) => {
    const coincideTipo =
      filtro === "Todas" || item.tipo === filtro;

    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      !texto ||
      String(item.pedidoId).includes(texto) ||
      String(item.emisorUsuarioId).includes(texto) ||
      String(item.receptorUsuarioId).includes(texto) ||
      (item.comentario || "").toLowerCase().includes(texto);

    return coincideTipo && coincideBusqueda;
  });

  return (
    <div style={styles.layout}>
      <AdminSidebar />

      <main style={styles.contenido}>
        <div style={styles.encabezado}>
          <div>
            <h1 style={styles.titulo}>
              Calificaciones
            </h1>

            <p style={styles.subtitulo}>
              Supervisión de las valoraciones entre clientes
              y repartidores.
            </p>
          </div>

          <button
            type="button"
            style={styles.botonActualizar}
            disabled={cargando}
            onClick={() => void cargarCalificaciones()}
          >
            {cargando ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <div style={styles.resumen}>
          <div style={styles.tarjetaResumen}>
            <strong>{total}</strong>
            <span>Calificaciones</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{promedio.toFixed(1)} / 5</strong>
            <span>Promedio general</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{clienteARepartidor}</strong>
            <span>Clientes a repartidores</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{repartidorACliente}</strong>
            <span>Repartidores a clientes</span>
          </div>
        </div>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        <div style={styles.filtros}>
          <label htmlFor="filtro-calificaciones">
            Tipo:
          </label>

          <select
            id="filtro-calificaciones"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={styles.input}
          >
            <option value="Todas">Todas</option>
            <option value="ClienteARepartidor">
              Cliente a repartidor
            </option>
            <option value="RepartidorACliente">
              Repartidor a cliente
            </option>
          </select>

          <input
            type="search"
            placeholder="Buscar pedido, usuario o comentario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.buscador}
          />
        </div>

        {cargando ? (
          <p>Cargando calificaciones...</p>
        ) : filtradas.length === 0 ? (
          <div style={styles.vacio}>
            No hay calificaciones para mostrar.
          </div>
        ) : (
          <div style={styles.lista}>
            {filtradas.map((item) => {
              const emisor = obtenerNombre(
                item.emisor,
                item.emisorNombre,
                item.emisorUsuarioId
              );

              const receptor = obtenerNombre(
                item.receptor,
                item.receptorNombre,
                item.receptorUsuarioId
              );

              return (
                <article key={item.id} style={styles.tarjeta}>
                  <div style={styles.fila}>
                    <h2 style={styles.numero}>
                      Pedido #{item.pedidoId}
                    </h2>

                    <span style={styles.estrellas}>
                      {"★".repeat(
                        Math.max(
                          0,
                          Math.min(5, item.puntuacion)
                        )
                      )}
                      {"☆".repeat(
                        5 -
                        Math.max(
                          0,
                          Math.min(5, item.puntuacion)
                        )
                      )}
                    </span>
                  </div>

                  <p>
                    <strong>Tipo:</strong>{" "}
                    {item.tipo === "ClienteARepartidor"
                      ? "Cliente a repartidor"
                      : item.tipo === "RepartidorACliente"
                      ? "Repartidor a cliente"
                      : item.tipo}
                  </p>

                  <p>
                    <strong>Emisor:</strong> {emisor}
                  </p>

                  <p>
                    <strong>Receptor:</strong> {receptor}
                  </p>

                  <p>
                    <strong>Puntuación:</strong>{" "}
                    {item.puntuacion} de 5
                  </p>

                  <p>
                    <strong>Comentario:</strong>{" "}
                    {item.comentario || "Sin comentario"}
                  </p>

                  <p style={styles.fecha}>
                    <strong>Fecha:</strong>{" "}
                    {new Date(
                      item.fechaCreacion
                    ).toLocaleString("es-GT")}
                  </p>
                </article>
              );
            })}
          </div>
        )}
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
    minWidth: 0,
    padding: "32px",
  },
  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  titulo: {
    margin: 0,
    fontSize: "28px",
    color: "#1d2922",
  },
  subtitulo: {
    marginTop: "8px",
    color: "#777",
  },
  botonActualizar: {
    background: "#20a85a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  resumen: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  tarjetaResumen: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px #00000008",
  },
  filtros: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  input: {
    padding: "11px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  buscador: {
    padding: "11px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    flex: "1",
    minWidth: "220px",
  },
  lista: {
    display: "grid",
    gap: "16px",
  },
  tarjeta: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px #00000008",
  },
  fila: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  numero: {
    margin: 0,
    fontSize: "19px",
  },
  estrellas: {
    color: "#e7a300",
    fontSize: "23px",
    letterSpacing: "2px",
  },
  fecha: {
    color: "#777",
    fontSize: "13px",
  },
  error: {
    padding: "14px",
    background: "#fff0f0",
    color: "#b3261e",
    borderRadius: "10px",
    marginBottom: "18px",
  },
  vacio: {
    background: "#fff",
    padding: "28px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#777",
  },
};