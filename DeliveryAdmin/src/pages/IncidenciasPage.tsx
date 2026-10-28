import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import AdminSidebar from "../components/AdminSidebar";

import {
  obtenerIncidenciasAdmin,
  obtenerEvidenciaIncidenciaAdmin,
  resolverIncidenciaAdmin,
  resolverYCancelarEntregaAdmin,
  type IncidenciaAdmin,
} from "../services/api";

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<IncidenciaAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [evidenciaUrl, setEvidenciaUrl] = useState<string | null>(null);
  const evidenciaUrlRef = useRef<string | null>(null);
  const [evidenciaIncidenciaId, setEvidenciaIncidenciaId] = useState<number | null>(null);
  const [cargandoEvidencia, setCargandoEvidencia] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState<Record<number, string>>({});

  async function cargarIncidencias() {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const datos = await obtenerIncidenciasAdmin(token);
      setIncidencias(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las incidencias."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarIncidencias();
  }, []);

  useEffect(() => {
    return () => {
      if (evidenciaUrlRef.current) {
        URL.revokeObjectURL(evidenciaUrlRef.current);
        evidenciaUrlRef.current = null;
      }
    };
  }, []);

  async function resolver(
    incidencia: IncidenciaAdmin,
    estado: "Resuelta" | "Rechazada"
  ) {
    const resolucion = (observaciones[incidencia.id] || "").trim();

    if (!resolucion) {
      setError("Debes escribir una observación antes de resolver la incidencia.");
      return;
    }

    if (resolucion.length > 1000) {
      setError("La observación no puede superar los 1000 caracteres.");
      return;
    }

    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmás que querés marcar la incidencia #${incidencia.id} como ${estado}?`
    );

    if (!confirmado) return;

    try {
      setProcesandoId(incidencia.id);
      setError("");
      setMensaje("");

      await resolverIncidenciaAdmin(token, incidencia.id, {
        estado,
        resolucion,
      });

      setMensaje(`La incidencia #${incidencia.id} fue marcada como ${estado}.`);

      setObservaciones((anterior) => ({
        ...anterior,
        [incidencia.id]: "",
      }));

      await cargarIncidencias();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la incidencia."
      );
    } finally {
      setProcesandoId(null);
    }
  }

    async function cancelarEntregaPorIncidencia(
    incidencia: IncidenciaAdmin
  ) {
    if (procesandoId !== null) return;

    const resolucion = (observaciones[incidencia.id] || "").trim();

    if (!resolucion || resolucion.length > 1000) {
      setError("Escribí una observación válida antes de cancelar.");
      return;
    }

    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const confirmado = window.confirm(
      `ATENCIÓN: Vas a cancelar el pedido #${incidencia.pedidoId}.\n\n` +
      `La incidencia #${incidencia.id} será resuelta y el repartidor ` +
      `podrá quedar disponible.\n\n` +
      `Esta acción NO confirma la entrega ni realiza reembolsos.\n\n` +
      `¿Confirmás la cancelación?`
    );

    if (!confirmado) return;

    try {
      setProcesandoId(incidencia.id);
      setError("");
      setMensaje("");

      await resolverYCancelarEntregaAdmin(
        token,
        incidencia.id,
        resolucion
      );

      setMensaje(
        `Incidencia #${incidencia.id} resuelta. ` +
        `Pedido #${incidencia.pedidoId} cancelado correctamente.`
      );

      setObservaciones((anterior) => ({
        ...anterior,
        [incidencia.id]: "",
      }));

      await cargarIncidencias();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cancelar la entrega."
      );
    } finally {
      setProcesandoId(null);
    }
  }


  async function verEvidencia(incidenciaId: number) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    try {
      setError("");
      setCargandoEvidencia(incidenciaId);

      const imagen = await obtenerEvidenciaIncidenciaAdmin(
        token,
        incidenciaId
      );

      const nuevaUrl = URL.createObjectURL(imagen);

      if (evidenciaUrlRef.current) {
        URL.revokeObjectURL(evidenciaUrlRef.current);
      }

      evidenciaUrlRef.current = nuevaUrl;
      setEvidenciaUrl(nuevaUrl);
      setEvidenciaIncidenciaId(incidenciaId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo visualizar la fotografía."
      );
    } finally {
      setCargandoEvidencia(null);
    }
  }

    function cerrarEvidencia() {
    if (evidenciaUrlRef.current) {
      URL.revokeObjectURL(evidenciaUrlRef.current);
      evidenciaUrlRef.current = null;
    }

    setEvidenciaUrl(null);
    setEvidenciaIncidenciaId(null);
  }


  const incidenciasFiltradas = incidencias.filter(
    (incidencia) => filtro === "Todas" || incidencia.estado === filtro
  );

  const pendientes = incidencias.filter(
    (incidencia) =>
      incidencia.estado === "Pendiente" ||
      incidencia.estado === "EnRevision"
  ).length;

  const resueltas = incidencias.filter(
    (incidencia) => incidencia.estado === "Resuelta"
  ).length;

  const rechazadas = incidencias.filter(
    (incidencia) => incidencia.estado === "Rechazada"
  ).length;

  return (
    <div style={styles.layout}>
      <AdminSidebar />

      <main style={styles.contenido}>
        <div style={styles.encabezado}>
          <div>
            <h1 style={styles.titulo}>Incidencias de entrega</h1>
            <p style={styles.subtitulo}>
              Revisá los problemas reportados por los repartidores.
            </p>
          </div>

          <button
            type="button"
            style={styles.botonActualizar}
            onClick={() => void cargarIncidencias()}
            disabled={cargando || procesandoId !== null}
          >
            Actualizar
          </button>
        </div>

        <div style={styles.resumen}>
          <div style={styles.tarjetaResumen}>
            <strong>{incidencias.length}</strong>
            <span>Total</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{pendientes}</strong>
            <span>Pendientes</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{resueltas}</strong>
            <span>Resueltas</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong>{rechazadas}</strong>
            <span>Rechazadas</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {mensaje && <div style={styles.exito}>{mensaje}</div>}

        <div style={styles.filtros}>
          <label htmlFor="filtro-incidencias">Filtrar por estado:</label>

          <select
            id="filtro-incidencias"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            style={styles.select}
          >
            <option value="Todas">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="EnRevision">En revisión</option>
            <option value="Resuelta">Resueltas</option>
            <option value="Rechazada">Rechazadas</option>
          </select>
        </div>

        {cargando ? (
          <p>Cargando incidencias...</p>
        ) : incidenciasFiltradas.length === 0 ? (
          <div style={styles.vacio}>
            No hay incidencias para mostrar.
          </div>
        ) : (
          <div style={styles.lista}>
            {incidenciasFiltradas.map((incidencia) => {
              const puedeResolver =
                incidencia.estado === "Pendiente" ||
                incidencia.estado === "EnRevision";

              return (
                <article key={incidencia.id} style={styles.tarjeta}>
                  <div style={styles.fila}>
                    <h2 style={styles.numero}>
                      Incidencia #{incidencia.id}
                    </h2>
                    <span style={styles.estado}>
                      {incidencia.estado}
                    </span>
                  </div>

                  <p><strong>Pedido:</strong> #{incidencia.pedidoId}</p>
                  <p><strong>Repartidor:</strong> {incidencia.repartidor}</p>
                  <p><strong>Motivo:</strong> {incidencia.motivo}</p>
                  <p><strong>Descripción:</strong> {incidencia.descripcion}</p>
                  <p>
                    <strong>Fecha del reporte:</strong>{" "}
                    {new Date(incidencia.fechaReporte).toLocaleString("es-GT")}
                  </p>


                  <div style={styles.evidenciaSeccion}>
                    <strong>Evidencia:</strong>{" "}

                    {incidencia.evidenciaUrl ? (
                      <button
                        type="button"
                        style={styles.botonEvidencia}
                        disabled={cargandoEvidencia !== null}
                        onClick={() => void verEvidencia(incidencia.id)}
                      >
                        {cargandoEvidencia === incidencia.id
                          ? "Cargando fotografía..."
                          : "📷 Ver evidencia"}
                      </button>
                    ) : (
                      <span>Sin fotografía</span>
                    )}
                  </div>


                  {incidencia.resolucion && (
                    <div style={styles.resolucion}>
                      <strong>Resolución:</strong> {incidencia.resolucion}
                    </div>
                  )}

                  {puedeResolver && (
                    <div style={styles.acciones}>
                      <label htmlFor={`observacion-${incidencia.id}`}>
                        Observación administrativa
                      </label>

                      <textarea
                        id={`observacion-${incidencia.id}`}
                        rows={3}
                        maxLength={1000}
                        style={styles.textarea}
                        placeholder="Explicá la decisión sobre esta incidencia..."
                        value={observaciones[incidencia.id] || ""}
                        disabled={procesandoId !== null}
                        onChange={(evento) =>
                          setObservaciones((anterior) => ({
                            ...anterior,
                            [incidencia.id]: evento.target.value,
                          }))
                        }
                      />

                      <div style={styles.botones}>
                        <button
                          type="button"
                          style={styles.botonResolver}
                          disabled={procesandoId !== null}
                          onClick={() => void resolver(incidencia, "Resuelta")}
                        >
                          {procesandoId === incidencia.id
                            ? "Procesando..."
                            : "Resolver"}
                        </button>

                        <button
                          type="button"
                          style={styles.botonRechazar}
                          disabled={procesandoId !== null}
                          onClick={() => void resolver(incidencia, "Rechazada")}
                        >
                          Rechazar
                        </button>

                        {incidencia.motivo === "ClienteAusente" && (
                        <button
                          type="button"
                          style={styles.botonRechazar}
                          disabled={procesandoId !== null}
                          onClick={() =>
                            void cancelarEntregaPorIncidencia(incidencia)
                          }
                        >
                          {procesandoId === incidencia.id
                            ? "Procesando..."
                            : "Resolver y cancelar entrega"}
                        </button>
                      )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}


        {evidenciaUrl && (
          <div style={styles.evidenciaPanel}>
            <div style={styles.evidenciaEncabezado}>
              <h2 style={styles.evidenciaTitulo}>
                Fotografía de la incidencia #{evidenciaIncidenciaId}
              </h2>

              <button
                type="button"
                style={styles.botonCerrarEvidencia}
                onClick={cerrarEvidencia}
              >
                Cerrar
              </button>
            </div>

            <img
              src={evidenciaUrl}
              alt={`Evidencia de la incidencia ${evidenciaIncidenciaId}`}
              style={styles.evidenciaImagen}
            />
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
    padding: "32px",
    minWidth: 0,
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
    fontSize: "28px",
    margin: 0,
    color: "#1d2922",
  },
  subtitulo: {
    color: "#777",
    marginTop: "8px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  tarjetaResumen: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 2px 10px #00000008",
  },
  filtros: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  lista: {
    display: "grid",
    gap: "18px",
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
  estado: {
    padding: "7px 12px",
    borderRadius: "8px",
    background: "#eef4ef",
    fontWeight: 700,
  },
  resolucion: {
    background: "#f0f8f3",
    padding: "12px",
    borderRadius: "10px",
    marginTop: "12px",
  },
  acciones: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
    borderTop: "1px solid #eee",
    paddingTop: "18px",
  },
  textarea: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "9px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  botones: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  botonResolver: {
    background: "#20a85a",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  botonRechazar: {
    background: "#c93a3a",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    padding: "14px",
    background: "#fff0f0",
    color: "#b3261e",
    borderRadius: "10px",
    marginBottom: "18px",
  },
  exito: {
    padding: "14px",
    background: "#e7f7ed",
    color: "#19894a",
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

  evidenciaSeccion: {
    marginTop: "12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  botonEvidencia: {
    border: "1px solid #20a85a",
    background: "#e7f7ed",
    color: "#19894a",
    borderRadius: "9px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  evidenciaPanel: {
    marginTop: "24px",
    padding: "20px",
    background: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e6e9e7",
  },

  evidenciaEncabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  evidenciaTitulo: {
    margin: 0,
    fontSize: "19px",
  },

  botonCerrarEvidencia: {
    background: "#fff0f0",
    color: "#b3261e",
    border: "none",
    borderRadius: "9px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  evidenciaImagen: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "500px",
    objectFit: "contain",
    borderRadius: "12px",
    margin: "0 auto",
  },
};
