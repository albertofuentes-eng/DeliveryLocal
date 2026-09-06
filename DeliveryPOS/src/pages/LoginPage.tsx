import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  loginComercio,
} from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [correo, setCorreo] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    const usuarioTexto =
      localStorage.getItem(
        "deliverypos_usuario"
      );

    if (token && usuarioTexto) {
      navigate("/dashboard");
    }
  }, [navigate]);

  async function iniciarSesion(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

    if (!correo.trim() ||
        !password.trim()) {
      setMensaje(
        "Ingresa correo y contraseña."
      );

      return;
    }

    try {
      setCargando(true);

      const data =
        await loginComercio(
          correo.trim(),
          password
        );

      if (
        data.usuario?.rol !==
        "Comercio"
      ) {
        setMensaje(
          "Esta cuenta no pertenece a un comercio."
        );

        return;
      }

      localStorage.setItem(
        "deliverypos_token",
        data.token
      );

      localStorage.setItem(
        "deliverypos_usuario",
        JSON.stringify(
          data.usuario
        )
      );

      navigate("/dashboard");
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo conectar con DeliveryApi."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon">
            🍽️
          </div>

          <h1>
            DeliveryPOS
          </h1>

          <p>
            Panel para comercios de DeliveryLocal
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={
            iniciarSesion
          }
        >
          <label>
            Correo
          </label>

          <input
            type="email"
            placeholder="correo@comercio.com"
            value={correo}
            onChange={(e) =>
              setCorreo(
                e.target.value
              )
            }
          />

          <label>
            Contraseña
          </label>

          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          {mensaje && (
            <div className="message">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? "INGRESANDO..."
              : "INICIAR SESIÓN"}
          </button>
        </form>
      </div>
    </div>
  );
}