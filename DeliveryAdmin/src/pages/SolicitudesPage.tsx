import {
  useEffect,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  aprobarSolicitudRepartidor,
  obtenerSolicitudesPendientes,
  rechazarSolicitudRepartidor,
  type SolicitudRepartidorPendiente,
} from "../services/api";
export default function SolicitudesPage() {
  const navigate = useNavigate();

  const [
    solicitudes,
    setSolicitudes,
  ] = useState<
    SolicitudRepartidorPendiente[]
  >([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState<number | null>(
    null
  );

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  function obtenerToken() {
    return localStorage.getItem(
      "deliveryadmin_token"
    );
  }

  async function cargarSolicitudes() {
    const token = obtenerToken();

    if (!token) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      setCargando(true);
      setMensaje("");
      setMensajeExito("");

      const data =
        await obtenerSolicitudesPendientes(
          token
        );

      setSolicitudes(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar las solicitudes."
      );
    } finally {
      setCargando(false);
    }
  }

  async function aprobar(
    solicitud: SolicitudRepartidorPendiente
  ) {
    const confirmar =
      window.confirm(
        `¿Deseas aprobar a ${solicitud.usuario.nombre} como repartidor?`
      );

    if (!confirmar) {
      return;
    }

    const token = obtenerToken();

    if (!token) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      setProcesandoId(
        solicitud.id
      );

      setMensaje("");
      setMensajeExito("");

      await aprobarSolicitudRepartidor(
        token,
        solicitud.id
      );

      setMensajeExito(
        `${solicitud.usuario.nombre} fue aprobado como repartidor.`
      );

      await cargarSolicitudes();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo aprobar la solicitud."
      );
    } finally {
      setProcesandoId(null);
    }
  }

   async function rechazar(
   solicitud: SolicitudRepartidorPendiente
  ) {
    const motivo = window.prompt(
      `Escribe el motivo del rechazo para ${solicitud.usuario.nombre}:`
    );

    if (motivo === null) {
      return;
    }

    const motivoLimpio = motivo.trim();

    if (!motivoLimpio) {
      window.alert(
        "Debes escribir un motivo para rechazar la solicitud."
      );

      return;
    }

    const confirmar = window.confirm(
      `¿Deseas rechazar la solicitud de ${solicitud.usuario.nombre}?\n\nMotivo:\n${motivoLimpio}`
    );

    if (!confirmar) {
      return;
    }

    const token = obtenerToken();

    if (!token) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      setProcesandoId(
        solicitud.id
      );

      setMensaje("");
      setMensajeExito("");

      await rechazarSolicitudRepartidor(
        token,
        solicitud.id,
        motivoLimpio
      );

      setMensajeExito(
        `La solicitud de ${solicitud.usuario.nombre} fue rechazada.`
      );

      await cargarSolicitudes();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo rechazar la solicitud."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brand}>
            <div style={styles.logo}>
              DA
            </div>

            <div>
              <div
                style={
                  styles.brandTitle
                }
              >
                DeliveryAdmin
              </div>

              <div
                style={
                  styles.brandSubtitle
                }
              >
                DeliveryLocal
              </div>
            </div>
          </div>

          <nav style={styles.menu}>
            <button
              style={styles.menuButton}
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              🏠 Dashboard
            </button>

            <button
              style={{
                ...styles.menuButton,
                ...styles.menuActive,
              }}
            >
              🛵 Solicitudes
            </button>

            <button
              style={styles.menuButton}
            >
              👤 Repartidores
            </button>

            <button
              style={styles.menuButton}
            >
              🏪 Comercios
            </button>

            <button
              style={styles.menuButton}
            >
              👥 Clientes
            </button>

            <button
              style={styles.menuButton}
            >
              📦 Pedidos
            </button>

            <button
              style={styles.menuButton}
            >
              📊 Métricas
            </button>
          </nav>
        </div>

        <button
          style={styles.backButton}
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          ← Volver al Dashboard
        </button>
      </aside>

      <main style={styles.main}>
        <header
          style={styles.header}
        >
          <div>
            <p
              style={
                styles.overline
              }
            >
              Administración
            </p>

            <h1
              style={
                styles.title
              }
            >
              Solicitudes de repartidores
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Revisa las solicitudes
              pendientes para trabajar
              como repartidor en
              DeliveryLocal.
            </p>
          </div>

          <button
            style={
              styles.refreshButton
            }
            onClick={
              cargarSolicitudes
            }
          >
            ACTUALIZAR
          </button>
        </header>

        {mensaje ? (
          <section
            style={
              styles.errorCard
            }
          >
            {mensaje}
          </section>
        ) : null}

        {mensajeExito ? (
          <section
            style={
              styles.successCard
            }
          >
            {mensajeExito}
          </section>
        ) : null}

        {cargando ? (
          <section
            style={
              styles.stateCard
            }
          >
            Cargando solicitudes...
          </section>
        ) : solicitudes.length ===
          0 ? (
          <section
            style={
              styles.emptyCard
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              🛵
            </div>

            <h2>
              No hay solicitudes
              pendientes
            </h2>

            <p
              style={
                styles.emptyText
              }
            >
              Cuando una persona
              solicite trabajar como
              repartidor, aparecerá
              aquí.
            </p>
          </section>
        ) : (
          <section
            style={
              styles.grid
            }
          >
            {solicitudes.map(
              (solicitud) => {
                const procesando =
                  procesandoId ===
                  solicitud.id;

                return (
                  <article
                    key={
                      solicitud.id
                    }
                    style={
                      styles.card
                    }
                  >
                    <div
                      style={
                        styles.cardHeader
                      }
                    >
                      <div>
                        <p
                          style={
                            styles.requestLabel
                          }
                        >
                          Solicitud #
                          {
                            solicitud.id
                          }
                        </p>

                        <h2
                          style={
                            styles.name
                          }
                        >
                          {
                            solicitud.usuario
                              .nombre
                          }
                        </h2>
                      </div>

                      <div
                        style={
                          styles.statusBadge
                        }
                      >
                        {
                          solicitud.estado
                        }
                      </div>
                    </div>

                    <div
                      style={
                        styles.divider
                      }
                    />

                    <div
                      style={
                        styles.infoRow
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        Correo
                      </span>

                      <strong>
                        {
                          solicitud.usuario
                            .correo
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.infoRow
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        Teléfono
                      </span>

                      <strong>
                        {
                          solicitud.usuario
                            .telefono ||
                          "Sin teléfono"
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.infoRow
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        Vehículo
                      </span>

                      <strong>
                        {
                          solicitud.tipoVehiculo
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.infoRow
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        Placa
                      </span>

                      <strong>
                        {
                          solicitud.placa ||
                          "Sin placa"
                        }
                      </strong>
                    </div>

                    <div
                      style={
                        styles.infoRow
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        Fecha
                      </span>

                      <strong>
                        {new Date(
                          solicitud.fechaSolicitud
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div
                      style={
                        styles.actions
                      }
                    >
                      <button
                        style={{
                          ...styles.approveButton,
                          opacity:
                            procesando
                              ? 0.6
                              : 1,
                        }}
                        disabled={
                          procesando
                        }
                        onClick={() =>
                          aprobar(
                            solicitud
                          )
                        }
                      >
                        {procesando
                          ? "PROCESANDO..."
                          : "APROBAR"}
                      </button>

                      <button
                        style={{
                          ...styles.rejectButton,
                          opacity:
                            procesando
                              ? 0.6
                              : 1,
                        }}
                        disabled={
                          procesando
                        }
                        onClick={() =>
                          rechazar(
                            solicitud
                          )
                        }
                      >
                        {procesando
                          ? "PROCESANDO..."
                          : "RECHAZAR"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f6f5",
    color: "#202020",
    fontFamily:
      "Arial, sans-serif",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRight:
      "1px solid #e6e9e7",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent:
      "space-between",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding:
      "0 8px 25px",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    background: "#20a85a",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
  },

  brandTitle: {
    fontWeight: "900",
    fontSize: "17px",
  },

  brandSubtitle: {
    color: "#888",
    fontSize: "12px",
    marginTop: "3px",
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  menuButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#555",
    padding: "13px 14px",
    borderRadius: "10px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  menuActive: {
    background: "#e7f7ed",
    color: "#19894a",
  },

  backButton: {
    border: "none",
    background: "#eef2f0",
    color: "#444",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: "35px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  overline: {
    color: "#20a85a",
    fontWeight: "700",
    margin: 0,
  },

  title: {
    margin: "5px 0",
    fontSize: "34px",
  },

  subtitle: {
    margin: 0,
    color: "#777",
  },

  refreshButton: {
    border:
      "1px solid #20a85a",
    background: "#ffffff",
    color: "#20a85a",
    padding: "11px 16px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  stateCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.05)",
  },

  errorCard: {
    background: "#fff0f0",
    color: "#c62828",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "20px",
  },

  successCard: {
    background: "#e7f7ed",
    color: "#19894a",
    borderRadius: "16px",
    padding: "18px",
    marginBottom: "20px",
    fontWeight: "700",
  },

  emptyCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "45px",
    textAlign: "center",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.05)",
  },

  emptyIcon: {
    fontSize: "45px",
  },

  emptyText: {
    color: "#777",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  cardHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "15px",
  },

  requestLabel: {
    margin: 0,
    color: "#20a85a",
    fontSize: "12px",
    fontWeight: "800",
  },

  name: {
    margin: "5px 0 0",
    fontSize: "22px",
  },

  statusBadge: {
    background: "#fff3cd",
    color: "#9a6700",
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
  },

  divider: {
    height: "1px",
    background: "#eeeeee",
    margin: "20px 0",
  },

  infoRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "14px",
  },

  infoLabel: {
    color: "#777",
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "10px",
    marginTop: "22px",
  },

  approveButton: {
    border: "none",
    background: "#20a85a",
    color: "#ffffff",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },

  rejectButton: {
    border:
      "1px solid #d32f2f",
    background: "#ffffff",
    color: "#d32f2f",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
};