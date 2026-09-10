import {
  useEffect,
  useState,
} from "react";

import type {
  CSSProperties,
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  loginAdmin,
} from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [correo, setCorreo] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [
    mensajeSesion,
    setMensajeSesion,
  ] = useState("");

  useEffect(() => {
    const mensajeGuardado =
      sessionStorage.getItem(
        "deliveryadmin_mensaje_sesion"
      );

    if (mensajeGuardado) {
      setMensajeSesion(
        mensajeGuardado
      );

      sessionStorage.removeItem(
        "deliveryadmin_mensaje_sesion"
      );
    }
  }, []);

  async function iniciarSesion(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !correo.trim() ||
      !password.trim()
    ) {
      setMensaje(
        "Ingresa tu correo y contraseña."
      );

      return;
    }

    try {
      setCargando(true);
      setMensaje("");
      setMensajeSesion("");

      const data =
        await loginAdmin(
          correo,
          password
        );

      localStorage.setItem(
        "deliveryadmin_token",
        data.token
      );

      localStorage.setItem(
        "deliveryadmin_usuario",
        JSON.stringify(
          data.usuario
        )
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>
          DA
        </div>

        <h1 style={styles.title}>
          DeliveryAdmin
        </h1>

        <p style={styles.subtitle}>
          Panel administrativo de
          DeliveryLocal
        </p>

        {mensajeSesion ? (
          <div
            style={
              styles.sessionMessage
            }
          >
            {mensajeSesion}
          </div>
        ) : null}

        <form
          onSubmit={iniciarSesion}
          style={styles.form}
        >
          <label style={styles.label}>
            Correo electrónico
          </label>

          <input
            type="email"
            value={correo}
            onChange={(event) =>
              setCorreo(
                event.target.value
              )
            }
            placeholder="admin@deliverylocal.com"
            style={styles.input}
            disabled={cargando}
            autoComplete="email"
          />

          <label style={styles.label}>
            Contraseña
          </label>

          <div
            style={
              styles.passwordContainer
            }
          >
            <input
              type={
                mostrarPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Tu contraseña"
              style={
                styles.passwordInput
              }
              disabled={cargando}
              autoComplete="current-password"
            />

            <button
              type="button"
              style={styles.eyeButton}
              onClick={() =>
                setMostrarPassword(
                  (actual) =>
                    !actual
                )
              }
              aria-label={
                mostrarPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              title={
                mostrarPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              {mostrarPassword
                ? "🙈"
                : "👁️"}
            </button>
          </div>

          {mensaje ? (
            <div
              style={styles.message}
            >
              {mensaje}
            </div>
          ) : null}

          <button
            type="submit"
            style={{
              ...styles.button,

              opacity:
                cargando
                  ? 0.7
                  : 1,

              cursor:
                cargando
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={cargando}
          >
            {cargando
              ? "INICIANDO..."
              : "INICIAR SESIÓN"}
          </button>
        </form>

        <p style={styles.footer}>
          Acceso exclusivo para
          administradores autorizados.
        </p>
      </section>
    </main>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    background:
      "linear-gradient(135deg, #f4f7f5, #e9f5ee)",

    padding: "20px",

    fontFamily:
      "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "36px",

    boxShadow:
      "0 14px 40px rgba(0,0,0,0.10)",
  },

  logo: {
    width: "58px",
    height: "58px",
    borderRadius: "16px",

    background:
      "#20a85a",

    color: "#ffffff",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    fontWeight: "900",
    fontSize: "20px",

    marginBottom: "18px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#202020",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "22px",
    color: "#777",
  },

  sessionMessage: {
    background:
      "#fff8e1",

    color:
      "#8a6700",

    border:
      "1px solid #f0d98a",

    padding:
      "12px",

    borderRadius:
      "10px",

    marginBottom:
      "18px",

    fontSize:
      "13px",

    fontWeight:
      "700",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#333",
    marginTop: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",

    padding:
      "13px 14px",

    borderRadius: "10px",

    border:
      "1px solid #d8dedb",

    background:
      "#ffffff",

    color: "#222",

    fontSize: "15px",
    outline: "none",
  },

  passwordContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",

    border:
      "1px solid #d8dedb",

    borderRadius: "10px",

    background:
      "#ffffff",

    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,

    minWidth: 0,

    border: "none",
    outline: "none",

    background:
      "#ffffff",

    color: "#222",

    padding:
      "13px 14px",

    fontSize: "15px",
  },

  eyeButton: {
    width: "50px",
    height: "46px",

    border: "none",

    background:
      "#ffffff",

    cursor: "pointer",

    fontSize: "18px",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  message: {
    marginTop: "10px",

    background:
      "#fff1f1",

    color:
      "#c62828",

    padding: "11px",

    borderRadius: "9px",

    fontSize: "13px",
  },

  button: {
    marginTop: "18px",

    border: "none",

    background:
      "#20a85a",

    color: "#ffffff",

    fontWeight: "800",

    padding: "14px",

    borderRadius: "10px",
  },

  footer: {
    marginTop: "22px",
    marginBottom: 0,

    textAlign: "center",

    color: "#888",

    fontSize: "13px",
  },
};