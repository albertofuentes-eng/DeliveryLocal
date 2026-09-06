import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  crearProducto,
  obtenerMisCategorias,
  type CategoriaPOS,
} from "../services/api";

export default function NuevoProductoPage() {
  const navigate = useNavigate();

  const [nombre, setNombre] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [precio, setPrecio] =
    useState("");

  const [imagenUrl, setImagenUrl] =
    useState("");

  const [categoriaId, setCategoriaId] =
    useState("");

  const [categorias, setCategorias] =
    useState<CategoriaPOS[]>([]);

  const [cargando, setCargando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const data =
        await obtenerMisCategorias(
          token
        );

      setCategorias(
        data.filter(
          (categoria) =>
            categoria.activo
        )
      );
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar las categorías."
      );
    }
  }

  async function guardarProducto(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMensaje("");

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
        "El nombre del producto es obligatorio."
      );
      return;
    }

    const precioNumero =
      Number(precio);

    if (
      !precio ||
      Number.isNaN(precioNumero) ||
      precioNumero <= 0
    ) {
      setMensaje(
        "Ingresa un precio válido."
      );
      return;
    }

    if (!categoriaId) {
      setMensaje(
        "Selecciona una categoría."
      );
      return;
    }

    try {
      setCargando(true);

      await crearProducto(
        token,
        {
          nombre:
            nombre.trim(),

          descripcion:
            descripcion.trim() ||
            null,

          precio:
            precioNumero,

          imagenUrl:
            imagenUrl.trim() ||
            null,

          categoriaId:
            Number(categoriaId),
        }
      );

      navigate("/productos");
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo crear el producto."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pos-layout">
      <Sidebar />

      <main className="pos-content">
        <div className="page-header">
          <div>
            <h1>
              Nuevo producto
            </h1>

            <p>
              Agrega un producto al menú de tu comercio.
            </p>
          </div>
        </div>

        <form
          className="product-form-card"
          onSubmit={guardarProducto}
        >
          <div className="form-group">
            <label>
              Nombre
            </label>

            <input
              type="text"
              placeholder="Ej. Pizza Hawaiana"
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
              placeholder="Ej. Jamón, queso y piña"
              value={descripcion}
              onChange={(e) =>
                setDescripcion(
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Precio
              </label>

              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej. 85.00"
                value={precio}
                onChange={(e) =>
                  setPrecio(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Categoría
              </label>

              <select
                value={categoriaId}
                onChange={(e) =>
                  setCategoriaId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Selecciona una categoría
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={categoria.id}
                      value={categoria.id}
                    >
                      {categoria.nombre}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>
              Imagen URL
            </label>

            <input
              type="text"
              placeholder="Opcional"
              value={imagenUrl}
              onChange={(e) =>
                setImagenUrl(
                  e.target.value
                )
              }
            />
          </div>

          {mensaje && (
            <div className="dashboard-message">
              {mensaje}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/productos")
              }
            >
              CANCELAR
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={cargando}
            >
              {cargando
                ? "GUARDANDO..."
                : "GUARDAR PRODUCTO"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}