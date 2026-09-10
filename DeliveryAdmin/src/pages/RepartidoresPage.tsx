import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  obtenerRepartidores,
  type RepartidorAdmin,
} from "../services/api";

type Filtro =
  | "Todos"
  | "Disponibles"
  | "Ocupados"
  | "Inactivos";

export default function RepartidoresPage() {
  const navigate = useNavigate();

  const [
    repartidores,
    setRepartidores,
  ] = useState<RepartidorAdmin[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>("Todos");

  useEffect(() => {
    cargarRepartidores();
  }, []);

  async function cargarRepartidores() {
    const token =
      localStorage.getItem(
        "deliveryadmin_token"
      );

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

      const data =
        await obtenerRepartidores(
          token
        );

      setRepartidores(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar los repartidores."
      );
    } finally {
      setCargando(false);
    }
  }

  const repartidoresFiltrados =
    useMemo(() => {
      if (filtro === "Todos") {
        return repartidores;
      }

      if (
        filtro === "Disponibles"
      ) {
        return repartidores.filter(
          (r) =>
            r.activo &&
            r.usuario.activo &&
            r.disponible
        );
      }

      if (filtro === "Ocupados") {
        return repartidores.filter(
          (r) =>
            r.activo &&
            r.usuario.activo &&
            !r.disponible
        );
      }

      return repartidores.filter(
        (r) =>
          !r.activo ||
          !r.usuario.activo
      );
    }, [
      filtro,
      repartidores,
    ]);

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
              style={styles.menuButton}
              onClick={() =>
                navigate(
                  "/solicitudes"
                )
              }
            >
              🛵 Solicitudes
            </button>

            <button
              style={{
                ...styles.menuButton,
                ...styles.menuActive,
              }}
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
        <header style={styles.header}>
          <div>
            <p
              style={
                styles.overline
              }
            >
              Administración
            </p>

            <h1 style={styles.title}>
              Repartidores
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Consulta los repartidores
              registrados en
              DeliveryLocal.
            </p>
          </div>

          <button
            style={
              styles.refreshButton
            }
            onClick={
              cargarRepartidores
            }
          >
            ACTUALIZAR
          </button>
        </header>

        <section
          style={
            styles.summaryGrid
          }
        >
          <article
            style={styles.summaryCard}
          >
            <span
              style={
                styles.summaryLabel
              }
            >
              Total
            </span>

            <strong
              style={
                styles.summaryValue
              }
            >
              {repartidores.length}
            </strong>
          </article>

          <article
            style={styles.summaryCard}
          >
            <span
              style={
                styles.summaryLabel
              }
            >
              Disponibles
            </span>

            <strong
              style={
                styles.summaryValue
              }
            >
              {
                repartidores.filter(
                  (r) =>
                    r.activo &&
                    r.usuario.activo &&
                    r.disponible
                ).length
              }
            </strong>
          </article>

          <article
            style={styles.summaryCard}
          >
            <span
              style={
                styles.summaryLabel
              }
            >
              Ocupados
            </span>

            <strong
              style={
                styles.summaryValue
              }
            >
              {
                repartidores.filter(
                  (r) =>
                    r.activo &&
                    r.usuario.activo &&
                    !r.disponible
                ).length
              }
            </strong>
          </article>
        </section>

        <section
          style={
            styles.filters
          }
        >
          {(
            [
              "Todos",
              "Disponibles",
              "Ocupados",
              "Inactivos",
            ] as Filtro[]
          ).map(
            (opcion) => (
              <button
                key={opcion}
                style={{
                  ...styles.filterButton,

                  ...(filtro ===
                  opcion
                    ? styles.filterActive
                    : {}),
                }}
                onClick={() =>
                  setFiltro(
                    opcion
                  )
                }
              >
                {opcion}
              </button>
            )
          )}
        </section>

        {mensaje ? (
          <section
            style={
              styles.errorCard
            }
          >
            {mensaje}
          </section>
        ) : null}

        {cargando ? (
          <section
            style={
              styles.stateCard
            }
          >
            Cargando repartidores...
          </section>
        ) : repartidoresFiltrados.length ===
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
              No hay repartidores
              en esta categoría
            </h2>
          </section>
        ) : (
          <section
            style={
              styles.grid
            }
          >
            {repartidoresFiltrados.map(
              (repartidor) => {
                const cuentaActiva =
                  repartidor.activo &&
                  repartidor.usuario
                    .activo;

                return (
                  <article
                    key={
                      repartidor.id
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
                            styles.idLabel
                          }
                        >
                          Repartidor #
                          {
                            repartidor.id
                          }
                        </p>

                        <h2
                          style={
                            styles.name
                          }
                        >
                          {
                            repartidor.usuario
                              .nombre
                          }
                        </h2>
                      </div>

                      <div
                        style={{
                          ...styles.statusBadge,

                          ...(cuentaActiva
                            ? repartidor.disponible
                              ? styles.availableBadge
                              : styles.busyBadge
                            : styles.inactiveBadge),
                        }}
                      >
                        {!cuentaActiva
                          ? "Inactivo"
                          : repartidor.disponible
                          ? "Disponible"
                          : "Ocupado"}
                      </div>
                    </div>

                    <div
                      style={
                        styles.divider
                      }
                    />

                    <InfoRow
                      label="Correo"
                      value={
                        repartidor.usuario
                          .correo
                      }
                    />

                    <InfoRow
                      label="Teléfono"
                      value={
                        repartidor.usuario
                          .telefono ||
                        "Sin teléfono"
                      }
                    />

                    <InfoRow
                      label="Vehículo"
                      value={
                        repartidor.tipoVehiculo
                      }
                    />

                    <InfoRow
                      label="Placa"
                      value={
                        repartidor.placa ||
                        "Sin placa"
                      }
                    />

                    <InfoRow
                      label="Entregas"
                      value={`${repartidor.totalEntregas}`}
                    />

                    <InfoRow
                      label="Fecha de registro"
                      value={
                        new Date(
                          repartidor.fechaCreacion
                        ).toLocaleString()
                      }
                    />

                    <div
                      style={
                        styles.locationBox
                      }
                    >
                      <strong>
                        📍 Última ubicación
                      </strong>

                      {repartidor.latitudActual !=
                        null &&
                      repartidor.longitudActual !=
                        null ? (
                        <>
                          <div
                            style={
                              styles.locationText
                            }
                          >
                            Latitud:{" "}
                            {
                              repartidor.latitudActual
                            }
                          </div>

                          <div
                            style={
                              styles.locationText
                            }
                          >
                            Longitud:{" "}
                            {
                              repartidor.longitudActual
                            }
                          </div>

                          <div
                            style={
                              styles.locationDate
                            }
                          >
                            {repartidor.ultimaActualizacionUbicacion
                              ? new Date(
                                  repartidor.ultimaActualizacionUbicacion
                                ).toLocaleString()
                              : "Sin fecha de actualización"}
                          </div>
                        </>
                      ) : (
                        <div
                          style={
                            styles.locationText
                          }
                        >
                          Sin ubicación registrada.
                        </div>
                      )}
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.infoRow}>
      <span
        style={
          styles.infoLabel
        }
      >
        {label}
      </span>

      <strong>
        {value}
      </strong>
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
    marginBottom: "25px",
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
    color: "#777",
    margin: 0,
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

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
  },

  summaryLabel: {
    color: "#777",
    fontSize: "13px",
  },

  summaryValue: {
    display: "block",
    fontSize: "28px",
    marginTop: "5px",
  },

  filters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  filterButton: {
    border:
      "1px solid #d9dfdc",
    background: "#ffffff",
    color: "#555",
    borderRadius: "20px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: "700",
  },

  filterActive: {
    background: "#20a85a",
    color: "#ffffff",
    borderColor: "#20a85a",
  },

  stateCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "16px",
  },

  errorCard: {
    background: "#fff0f0",
    color: "#c62828",
    padding: "18px",
    borderRadius: "14px",
    marginBottom: "20px",
  },

  emptyCard: {
    background: "#ffffff",
    padding: "45px",
    borderRadius: "16px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "42px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  cardHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  idLabel: {
    color: "#20a85a",
    fontWeight: "800",
    fontSize: "12px",
    margin: 0,
  },

  name: {
    margin: "5px 0 0",
    fontSize: "22px",
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
  },

  availableBadge: {
    background: "#e7f7ed",
    color: "#19894a",
  },

  busyBadge: {
    background: "#fff3cd",
    color: "#9a6700",
  },

  inactiveBadge: {
    background: "#f2f2f2",
    color: "#777",
  },

  divider: {
    height: "1px",
    background: "#eeeeee",
    margin: "18px 0",
  },

  infoRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "13px",
  },

  infoLabel: {
    color: "#777",
  },

  locationBox: {
    background: "#f7f9f8",
    borderRadius: "12px",
    padding: "14px",
    marginTop: "18px",
  },

  locationText: {
    color: "#555",
    marginTop: "7px",
    fontSize: "13px",
  },

  locationDate: {
    color: "#888",
    marginTop: "8px",
    fontSize: "12px",
  },
};