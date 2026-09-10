import type {
  CSSProperties,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

type UsuarioAdmin = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

export default function DashboardPage() {
  const navigate = useNavigate();

  let usuario: UsuarioAdmin | null =
    null;

  const usuarioGuardado =
    localStorage.getItem(
      "deliveryadmin_usuario"
    );

  if (usuarioGuardado) {
    try {
      usuario =
        JSON.parse(
          usuarioGuardado
        );
    } catch {
      usuario = null;
    }
  }

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
    <div style={styles.page}>
      {/* SIDEBAR */}

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
              style={{
                ...styles.menuButton,
                ...styles.menuActive,
              }}
            >
              🏠 Dashboard
            </button>

            <button
              style={styles.menuButton}
            >
              🛵 Solicitudes
            </button>

            <button
              style={styles.menuButton}
              onClick={() =>
                navigate("/repartidores")
              }
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
          style={styles.logoutButton}
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO */}

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p
              style={
                styles.welcome
              }
            >
              Panel administrativo
            </p>

            <h1
              style={
                styles.title
              }
            >
              Dashboard
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Control general de
              DeliveryLocal.
            </p>
          </div>

          <div style={styles.adminBox}>
            <div
              style={
                styles.adminAvatar
              }
            >
              A
            </div>

            <div>
              <strong>
                {usuario?.nombre ||
                  "Administrador"}
              </strong>

              <div
                style={
                  styles.adminRole
                }
              >
                {usuario?.rol ||
                  "Administrador"}
              </div>
            </div>
          </div>
        </header>

        {/* TARJETAS */}

        <section
          style={
            styles.cardsGrid
          }
        >
          <article style={styles.card}>
            <div style={styles.cardIcon}>
              🛵
            </div>

            <div>
              <p
                style={
                  styles.cardLabel
                }
              >
                Solicitudes pendientes
              </p>

              <h2
                style={
                  styles.cardValue
                }
              >
                —
              </h2>

              <p
                style={
                  styles.cardNote
                }
              >
                Repartidores por revisar
              </p>
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardIcon}>
              👤
            </div>

            <div>
              <p
                style={
                  styles.cardLabel
                }
              >
                Repartidores
              </p>

              <h2
                style={
                  styles.cardValue
                }
              >
                —
              </h2>

              <p
                style={
                  styles.cardNote
                }
              >
                Registrados en la plataforma
              </p>
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardIcon}>
              🏪
            </div>

            <div>
              <p
                style={
                  styles.cardLabel
                }
              >
                Comercios
              </p>

              <h2
                style={
                  styles.cardValue
                }
              >
                —
              </h2>

              <p
                style={
                  styles.cardNote
                }
              >
                Comercios registrados
              </p>
            </div>
          </article>

          <article style={styles.card}>
            <div style={styles.cardIcon}>
              📦
            </div>

            <div>
              <p
                style={
                  styles.cardLabel
                }
              >
                Pedidos
              </p>

              <h2
                style={
                  styles.cardValue
                }
              >
                —
              </h2>

              <p
                style={
                  styles.cardNote
                }
              >
                Pedidos de DeliveryLocal
              </p>
            </div>
          </article>
        </section>

        {/* PRIMER MÓDULO */}

        <section
          style={
            styles.sectionCard
          }
        >
          <div
            style={
              styles.sectionHeader
            }
          >
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Solicitudes de repartidores
              </h2>

              <p
                style={
                  styles.sectionText
                }
              >
                Revisa las personas que
                desean trabajar como
                repartidores de
                DeliveryLocal.
              </p>
            </div>

            <button
              style={
                styles.primaryButton
              }
              onClick={() =>
                navigate(
                  "/solicitudes"
                )
              }
            >
              VER SOLICITUDES
            </button>
          </div>
        </section>

        <section
          style={
            styles.infoSection
          }
        >
          <h2
            style={
              styles.sectionTitle
            }
          >
            Administración de la plataforma
          </h2>

          <p
            style={
              styles.sectionText
            }
          >
            Desde este panel podrás
            administrar repartidores,
            comercios, clientes, pedidos
            y métricas generales de
            DeliveryLocal.
          </p>
        </section>
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

    background:
      "#f4f6f5",

    color:
      "#202020",

    fontFamily:
      "Arial, sans-serif",
  },

  sidebar: {
    width: "250px",

    minHeight: "100vh",

    boxSizing:
      "border-box",

    background:
      "#ffffff",

    borderRight:
      "1px solid #e6e9e7",

    padding:
      "24px 18px",

    display: "flex",

    flexDirection:
      "column",

    justifyContent:
      "space-between",
  },

  brand: {
    display: "flex",

    alignItems:
      "center",

    gap: "12px",

    padding:
      "0 8px 25px",
  },

  logo: {
    width: "46px",

    height: "46px",

    borderRadius:
      "13px",

    background:
      "#20a85a",

    color:
      "#ffffff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontWeight:
      "900",
  },

  brandTitle: {
    fontWeight:
      "900",

    fontSize:
      "17px",
  },

  brandSubtitle: {
    color:
      "#888",

    fontSize:
      "12px",

    marginTop:
      "3px",
  },

  menu: {
    display: "flex",

    flexDirection:
      "column",

    gap: "7px",
  },

  menuButton: {
    width:
      "100%",

    border:
      "none",

    background:
      "transparent",

    color:
      "#555",

    padding:
      "13px 14px",

    borderRadius:
      "10px",

    textAlign:
      "left",

    fontSize:
      "14px",

    fontWeight:
      "700",

    cursor:
      "pointer",
  },

  menuActive: {
    background:
      "#e7f7ed",

    color:
      "#19894a",
  },

  logoutButton: {
    border:
      "none",

    background:
      "#fff0f0",

    color:
      "#d32f2f",

    borderRadius:
      "10px",

    padding:
      "12px",

    fontWeight:
      "700",

    cursor:
      "pointer",
  },

  main: {
    flex:
      1,

    padding:
      "35px",

    maxWidth:
      "1400px",

    boxSizing:
      "border-box",
  },

  header: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    marginBottom:
      "30px",
  },

  welcome: {
    color:
      "#20a85a",

    fontWeight:
      "700",

    margin:
      0,
  },

  title: {
    fontSize:
      "34px",

    margin:
      "5px 0",
  },

  subtitle: {
    color:
      "#777",

    margin:
      0,
  },

  adminBox: {
    background:
      "#ffffff",

    borderRadius:
      "14px",

    padding:
      "12px 16px",

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
  },

  adminAvatar: {
    width:
      "40px",

    height:
      "40px",

    borderRadius:
      "50%",

    background:
      "#20a85a",

    color:
      "#ffffff",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    fontWeight:
      "900",
  },

  adminRole: {
    color:
      "#777",

    fontSize:
      "12px",

    marginTop:
      "3px",
  },

  cardsGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",

    gap:
      "18px",

    marginBottom:
      "25px",
  },

  card: {
    background:
      "#ffffff",

    borderRadius:
      "16px",

    padding:
      "20px",

    display:
      "flex",

    gap:
      "15px",

    alignItems:
      "flex-start",

    boxShadow:
      "0 5px 18px rgba(0,0,0,0.05)",
  },

  cardIcon: {
    width:
      "45px",

    height:
      "45px",

    borderRadius:
      "12px",

    background:
      "#e7f7ed",

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    fontSize:
      "20px",
  },

  cardLabel: {
    margin:
      0,

    color:
      "#777",

    fontSize:
      "13px",
  },

  cardValue: {
    margin:
      "5px 0",

    fontSize:
      "28px",
  },

  cardNote: {
    margin:
      0,

    color:
      "#999",

    fontSize:
      "12px",
  },

  sectionCard: {
    background:
      "#ffffff",

    borderRadius:
      "16px",

    padding:
      "24px",

    marginBottom:
      "20px",

    boxShadow:
      "0 5px 18px rgba(0,0,0,0.05)",
  },

  sectionHeader: {
    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    gap:
      "20px",
  },

  sectionTitle: {
    margin:
      "0 0 7px",

    fontSize:
      "20px",
  },

  sectionText: {
    margin:
      0,

    color:
      "#777",

    lineHeight:
      "1.6",
  },

  primaryButton: {
    border:
      "none",

    background:
      "#20a85a",

    color:
      "#ffffff",

    padding:
      "12px 17px",

    borderRadius:
      "10px",

    fontWeight:
      "800",

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  },

  infoSection: {
    background:
      "#e7f7ed",

    borderRadius:
      "16px",

    padding:
      "24px",
  },
};