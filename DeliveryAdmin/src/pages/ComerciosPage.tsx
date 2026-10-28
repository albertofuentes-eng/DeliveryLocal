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

import AdminSidebar
  from "../components/AdminSidebar";

import {
  obtenerComerciosAdmin,
  type ComercioAdmin,
} from "../services/api";

import NuevoRestauranteForm from "../components/NuevoRestauranteForm";

type Filtro =
  | "Todos"
  | "Activos"
  | "Inactivos";

export default function ComerciosPage() {
  const navigate = useNavigate();

  const [
    comercios,
    setComercios,
  ] = useState<ComercioAdmin[]>([]);

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
    cargarComercios();
  }, []);

  async function cargarComercios() {
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
        await obtenerComerciosAdmin(
          token
        );

      setComercios(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar los comercios."
      );
    } finally {
      setCargando(false);
    }
  }

  const comerciosFiltrados =
    useMemo(() => {
      if (filtro === "Todos") {
        return comercios;
      }

      if (filtro === "Activos") {
        return comercios.filter(
          (c) => c.activo
        );
      }

      return comercios.filter(
        (c) => !c.activo
      );
    }, [
      filtro,
      comercios,
    ]);

  const totalActivos =
    comercios.filter(
      (c) => c.activo
    ).length;

  const totalInactivos =
    comercios.filter(
      (c) => !c.activo
    ).length;

  return (
    <div style={styles.page}>
      <AdminSidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.overline}>
              Administración
            </p>

            <h1 style={styles.title}>
              Comercios
            </h1>

            <p style={styles.subtitle}>
              Consulta los comercios
              registrados en
              DeliveryLocal.
            </p>
          </div>

          <button
            style={styles.refreshButton}
            onClick={cargarComercios}
          >
            ACTUALIZAR
          </button>
        </header>

        <NuevoRestauranteForm onCreado={cargarComercios} />

        <section style={styles.summaryGrid}>
          <article style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Total
            </span>

            <strong style={styles.summaryValue}>
              {comercios.length}
            </strong>
          </article>

          <article style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Activos
            </span>

            <strong style={styles.summaryValue}>
              {totalActivos}
            </strong>
          </article>

          <article style={styles.summaryCard}>
            <span style={styles.summaryLabel}>
              Inactivos
            </span>

            <strong style={styles.summaryValue}>
              {totalInactivos}
            </strong>
          </article>
        </section>

        <section style={styles.filters}>
          {(
            [
              "Todos",
              "Activos",
              "Inactivos",
            ] as Filtro[]
          ).map((opcion) => (
            <button
              key={opcion}
              style={{
                ...styles.filterButton,

                ...(filtro === opcion
                  ? styles.filterActive
                  : {}),
              }}
              onClick={() =>
                setFiltro(opcion)
              }
            >
              {opcion}
            </button>
          ))}
        </section>

        {mensaje ? (
          <section style={styles.errorCard}>
            {mensaje}
          </section>
        ) : null}

        {cargando ? (
          <section style={styles.stateCard}>
            Cargando comercios...
          </section>
        ) : comerciosFiltrados.length === 0 ? (
          <section style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              🏪
            </div>

            <h2>
              No hay comercios
              en esta categoría
            </h2>
          </section>
        ) : (
          <section style={styles.grid}>
            {comerciosFiltrados.map(
              (comercio) => (
                <article
                  key={comercio.id}
                  style={styles.card}
                >
                  <div style={styles.cardHeader}>
                    <div>
                      <p style={styles.idLabel}>
                        Comercio #{comercio.id}
                      </p>

                      <h2 style={styles.name}>
                        {comercio.nombre}
                      </h2>
                    </div>

                    <div
                      style={{
                        ...styles.statusBadge,

                        ...(comercio.activo
                          ? styles.activeBadge
                          : styles.inactiveBadge),
                      }}
                    >
                      {comercio.activo
                        ? "Activo"
                        : "Inactivo"}
                    </div>
                  </div>

                  <div style={styles.divider} />

                  <InfoRow
                    label="Dirección"
                    value={comercio.direccion}
                  />

                  <InfoRow
                    label="Municipio"
                    value={comercio.municipio || "Sin municipio"}
                  />

                  <InfoRow
                    label="Teléfono"
                    value={
                      comercio.telefono ||
                      "Sin teléfono"
                    }
                  />

                  <InfoRow
                    label="Descripción"
                    value={
                      comercio.descripcion ||
                      "Sin descripción"
                    }
                  />

                  <InfoRow
                    label="Fecha de registro"
                    value={new Date(
                      comercio.fechaCreacion
                    ).toLocaleString()}
                  />

                  <div style={styles.locationBox}>
                    <strong>
                      📍 Ubicación
                    </strong>

                    {comercio.latitud != null &&
                    comercio.longitud != null ? (
                      <>
                        <div style={styles.locationText}>
                          Latitud: {comercio.latitud}
                        </div>

                        <div style={styles.locationText}>
                          Longitud: {comercio.longitud}
                        </div>
                      </>
                    ) : (
                      <div style={styles.locationText}>
                        Sin ubicación registrada.
                      </div>
                    )}
                  </div>
                </article>
              )
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
      <span style={styles.infoLabel}>
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

  main: {
    flex: 1,
    padding: "35px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
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
    justifyContent: "space-between",
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

  activeBadge: {
    background: "#e7f7ed",
    color: "#19894a",
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
    justifyContent: "space-between",
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
};