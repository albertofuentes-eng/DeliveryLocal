
import { useState } from "react";
import type { FormEvent } from "react";

import {
  registrarRestauranteAdmin,
  type NuevoRestaurante,
} from "../services/api";

type Props = {
  onCreado: () => Promise<void>;
};

const formularioVacio: NuevoRestaurante = {
  nombre: "",
  descripcion: "",
  direccion: "",
  municipio: "",
  telefono: "",
  encargadoNombre: "",
  encargadoCorreo: "",
  encargadoPassword: "",
};

const campos: {
  clave: keyof NuevoRestaurante;
  etiqueta: string;
  requerido?: boolean;
  tipo?: string;
}[] = [
  {
    clave: "nombre",
    etiqueta: "Nombre del restaurante",
    requerido: true,
  },
  {
    clave: "municipio",
    etiqueta: "Municipio",
    requerido: true,
  },
  {
    clave: "direccion",
    etiqueta: "Dirección",
    requerido: true,
  },
  {
    clave: "telefono",
    etiqueta: "Teléfono",
  },
  {
    clave: "descripcion",
    etiqueta: "Descripción",
  },
  {
    clave: "encargadoNombre",
    etiqueta: "Nombre del encargado",
    requerido: true,
  },
  {
    clave: "encargadoCorreo",
    etiqueta: "Correo del encargado",
    tipo: "email",
    requerido: true,
  },
  {
    clave: "encargadoPassword",
    etiqueta: "Contraseña POS",
    tipo: "password",
    requerido: true,
  },
];

function IconoOjo({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A11 11 0 0 1 12 5c5 0 9 4 10 7a13 13 0 0 1-4 5.2" />
      <path d="M6.2 6.2A13 13 0 0 0 2 12c1 3 5 7 10 7a11 11 0 0 0 4-.8" />
    </svg>
  ) : (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function NuevoRestauranteForm({
  onCreado,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  const [datos, setDatos] = useState<NuevoRestaurante>({
    ...formularioVacio,
  });

  const [guardando, setGuardando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setExito("");

    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión como administrador.");
      return;
    }

    if (datos.encargadoPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setGuardando(true);

      const resultado = await registrarRestauranteAdmin(
        token,
        datos
      );

      setExito(
        `${resultado.restaurante.nombre} registrado correctamente. ` +
        `La cuenta POS es ${resultado.encargado.correo}.`
      );

      setDatos({ ...formularioVacio });
      setMostrarPassword(false);
      setAbierto(false);

      try {
        await onCreado();
      } catch {
        setError(
          "El restaurante se registró, pero no se pudo actualizar " +
          "la lista. Presiona Actualizar."
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar el restaurante."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            Gestión de restaurantes
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: 0,
            }}
          >
            Registra restaurantes y crea sus accesos a DeliveryPOS.
          </p>
        </div>

        <button
          type="button"
          disabled={guardando}
          onClick={() => {
            setAbierto(!abierto);
            setError("");
            setMostrarPassword(false);
          }}
          style={{
            padding: "12px 18px",
            border: "none",
            borderRadius: 10,
            background: "#16a34a",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {abierto
            ? "Cerrar formulario"
            : "+ Nuevo restaurante"}
        </button>
      </div>

      {exito && (
        <p
          role="status"
          style={{
            color: "#15803d",
            fontWeight: 600,
          }}
        >
          {exito}
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            color: "#dc2626",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      {abierto && (
        <form
          onSubmit={guardar}
          style={{ marginTop: 24 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 16,
            }}
          >
            {campos.map((campo) => {
              const esPassword =
                campo.clave === "encargadoPassword";

              const inputId = `restaurante-${campo.clave}`;

              return (
                <div
                  key={campo.clave}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  <label
                    htmlFor={inputId}
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#0f172a",
                    }}
                  >
                    {campo.etiqueta}
                  </label>

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                    }}
                  >
                    <input
                      id={inputId}
                      type={
                        esPassword
                          ? mostrarPassword
                            ? "text"
                            : "password"
                          : campo.tipo || "text"
                      }
                      required={campo.requerido}
                      minLength={
                        esPassword ? 8 : undefined
                      }
                      value={datos[campo.clave]}
                      onChange={(e) =>
                        setDatos((anterior) => ({
                          ...anterior,
                          [campo.clave]: e.target.value,
                        }))
                      }
                      autoComplete={
                        esPassword
                          ? "new-password"
                          : "off"
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        paddingRight: esPassword
                          ? 48
                          : 12,
                        borderRadius: 9,
                        border: "1px solid #cbd5e1",
                        fontSize: 14,
                        background: "#ffffff",
                        color: "#0f172a",
                        outlineColor: "#16a34a",
                      }}
                    />

                    {esPassword && (
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPassword(
                            (anterior) => !anterior
                          )
                        }
                        aria-label={
                          mostrarPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        aria-pressed={mostrarPassword}
                        title={
                          mostrarPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          padding: 0,
                          background: "transparent",
                          border: "none",
                          borderRadius: 6,
                          color: "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        <IconoOjo
                          visible={mostrarPassword}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={guardando}
            style={{
              marginTop: 22,
              padding: "13px 24px",
              background: guardando
                ? "#94a3b8"
                : "#15803d",
              border: "none",
              borderRadius: 10,
              color: "#ffffff",
              fontWeight: 700,
              cursor: guardando
                ? "wait"
                : "pointer",
            }}
          >
            {guardando
              ? "Registrando..."
              : "Registrar restaurante y encargado"}
          </button>
        </form>
      )}
    </section>
  );
}
