import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  actualizarMiComercio,
  obtenerMiComercio,
} from "../services/api";

export default function MiComercioPage() {
  const navigate = useNavigate();

  const [nombre, setNombre] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [direccion, setDireccion] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [imagenUrl, setImagenUrl] =
    useState("");

  const [activo, setActivo] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarComercio();
  }, []);

  async function cargarComercio() {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      setCargando(true);

      const comercio =
        await obtenerMiComercio(
          token
        );

      setNombre(
        comercio.nombre
      );

      setDescripcion(
        comercio.descripcion || ""
      );

      setDireccion(
        comercio.direccion
      );

      setTelefono(
        comercio.telefono || ""
      );

      setImagenUrl(
        comercio.imagenUrl || ""
      );

      setActivo(
        comercio.activo
      );
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cargar el comercio."
      );
    } finally {
      setCargando(false);
    }
  }

  async function guardarCambios(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    if (!nombre.trim()) {
      setMensaje(
        "El nombre del comercio es obligatorio."
      );
      return;
    }

    if (!direccion.trim()) {
      setMensaje(
        "La dirección es obligatoria."
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      await actualizarMiComercio(
        token,
        {
          nombre:
            nombre.trim(),

          descripcion:
            descripcion.trim() ||
            null,

          direccion:
            direccion.trim(),

          telefono:
            telefono.trim() ||
            null,

          imagenUrl:
            imagenUrl.trim() ||
            null,
        }
      );

      setMensaje(
        "Comercio actualizado correctamente."
      );

      await cargarComercio();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo actualizar el comercio."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="pos-layout">
        <Sidebar />

        <main className="pos-content">
          <div className="loading-box">
            Cargando comercio...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      <Sidebar />

      <main className="pos-content">
        <div className="page-header">
          <div>
            <h1>
              Mi comercio
            </h1>

            <p>
              Administra la información de tu comercio.
            </p>
          </div>
        </div>

        <form
          className="product-form-card"
          onSubmit={
            guardarCambios
          }
        >
          <div className="commerce-status-row">
            <span>
              Estado del comercio
            </span>

            <strong
              className={
                activo
                  ? "product-status available"
                  : "product-status unavailable"
              }
            >
              {activo
                ? "Activo"
                : "Desactivado"}
            </strong>
          </div>

          <div className="form-group">
            <label>
              Nombre
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(e) =>
                setNombre(
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>
              Descripción
            </label>

            <textarea
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
              placeholder="Describe tu comercio"
            />
          </div>

          <div className="form-group">
            <label>
              Dirección
            </label>

            <input
              type="text"
              value={direccion}
              onChange={(e) =>
                setDireccion(
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>
              Teléfono
            </label>

            <input
              type="text"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value
                )
              }
              placeholder="Ej. 5555-5555"
            />
          </div>

          <div className="form-group">
            <label>
              Imagen URL
            </label>

            <input
              type="text"
              value={imagenUrl}
              onChange={(e) =>
                setImagenUrl(
                  e.target.value
                )
              }
              placeholder="Opcional"
            />
          </div>

          {imagenUrl && (
            <div className="commerce-image-preview">
              <p>
                Vista previa
              </p>

              <img
                src={imagenUrl}
                alt={nombre}
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />
            </div>
          )}

          {mensaje && (
            <div className="dashboard-message">
              {mensaje}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={guardando}
            >
              {guardando
                ? "GUARDANDO..."
                : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}