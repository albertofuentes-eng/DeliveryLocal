import type {
  CSSProperties,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

type MenuItem = {
  texto: string;
  icono: string;
  ruta: string;
  disponible: boolean;
};

const opciones: MenuItem[] = [
  {
    texto: "Dashboard",
    icono: "🏠",
    ruta: "/dashboard",
    disponible: true,
  },
  {
    texto: "Solicitudes",
    icono: "🛵",
    ruta: "/solicitudes",
    disponible: true,
  },
  {
    texto: "Repartidores",
    icono: "👤",
    ruta: "/repartidores",
    disponible: true,
  },
  {
    texto: "Comercios",
    icono: "🏪",
    ruta: "/comercios",
    disponible: true,
  },
  {
    texto: "Clientes",
    icono: "👥",
    ruta: "/clientes",
    disponible: true,
  },
  {
    texto: "Pedidos",
    icono: "📦",
    ruta: "/pedidos",
    disponible: true,
  },

  {
    texto: "Pagos",
    icono: "💳",
    ruta: "/pagos",
    disponible: true,
  },

  {
    texto: "Calificaciones",
    icono: "⭐",
    ruta: "/calificaciones",
    disponible: true,
  },

  {
    texto: "Incidencias",
    icono: "⚠️",
    ruta: "/incidencias",
    disponible: true,
  },

  {
    texto: "Métricas",
    icono: "📊",
    ruta: "/metricas",
    disponible: true,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  function cerrarSesion() {
    localStorage.removeItem(
      "deliveryadmin_token"
    );

    localStorage.removeItem(
      "deliveryadmin_usuario"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }

  return (
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
          {opciones.map(
            (opcion) => {
              const activa =
                location.pathname ===
                opcion.ruta;

              return (
                <button
                  key={opcion.ruta}
                  type="button"
                  disabled={
                    !opcion.disponible
                  }
                  title={
                    opcion.disponible
                      ? opcion.texto
                      : "Módulo pendiente"
                  }
                  style={{
                    ...styles.menuButton,

                    ...(activa
                      ? styles.menuActive
                      : {}),

                    ...(!opcion.disponible
                      ? styles.menuDisabled
                      : {}),
                  }}
                  onClick={() => {
                    if (
                      opcion.disponible
                    ) {
                      navigate(
                        opcion.ruta
                      );
                    }
                  }}
                >
                  {opcion.icono}{" "}
                  {opcion.texto}
                </button>
              );
            }
          )}
        </nav>
      </div>

      <button
        type="button"
        style={styles.logoutButton}
        onClick={cerrarSesion}
      >
        Cerrar sesión
      </button>
    </aside>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
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
    flexShrink: 0,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 8px 25px",
  },

  logo: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    background: "#20a85a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

  menuDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  logoutButton: {
    border: "none",
    background: "#fff0f0",
    color: "#d32f2f",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
};