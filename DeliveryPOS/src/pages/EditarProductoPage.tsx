import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  actualizarProducto,
  obtenerMisCategorias,
  obtenerProductoPOS,
  type CategoriaPOS,
} from "../services/api";

export default function EditarProductoPage() {
  const navigate = useNavigate();

  const { id } = useParams();

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
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    if (!id) {
      setMensaje(
        "Producto no válido."
      );

      setCargando(false);
      return;
    }

    try {
      setCargando(true);

      const [
        producto,
        categoriasData,
      ] = await Promise.all([
        obtenerProductoPOS(
          token,
          Number(id)
        ),

        obtenerMisCategorias(
          token
        ),
      ]);

      setNombre(
        producto.nombre
      );

      setDescripcion(
        producto.descripcion || ""
      );

      setPrecio(
        String(producto.precio)
      );

      setImagenUrl(
        producto.imagenUrl || ""
      );

      setCategoriaId(
        String(
          producto.categoriaId
        )
      );

      setCategorias(
        categoriasData.filter(
          (c) => c.activo
        )
      );
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cargar el producto."
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

    if (!id) {
      return;
    }

    if (!nombre.trim()) {
      setMensaje(
        "El nombre es obligatorio."
      );

      return;
    }

    const precioNumero =
      Number(precio);

    if (
      Number.isNaN(
        precioNumero
      ) ||
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
      setGuardando(true);
      setMensaje("");

      await actualizarProducto(
        token,
        Number(id),
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

      navigate(
        "/productos"
      );
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo actualizar el producto."
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
            Cargando producto...
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
              Editar producto
            </h1>

            <p>
              Modifica los datos del producto.
            </p>
          </div>
        </div>

        <form
          className="product-form-card"
          onSubmit={
            guardarCambios
          }
        >
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
                value={
                  categoriaId
                }
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
                      key={
                        categoria.id
                      }
                      value={
                        categoria.id
                      }
                    >
                      {
                        categoria.nombre
                      }
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
              value={imagenUrl}
              onChange={(e) =>
                setImagenUrl(
                  e.target.value
                )
              }
              placeholder="Opcional"
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
                navigate(
                  "/productos"
                )
              }
            >
              CANCELAR
            </button>

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