import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  activarCategoria,
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  obtenerMisCategorias,
  type CategoriaPOS,
} from "../services/api";

export default function CategoriasPage() {
  const navigate = useNavigate();

  const [categorias, setCategorias] =
    useState<CategoriaPOS[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [nombreNueva, setNombreNueva] =
    useState("");

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
      setCargando(true);

      const data =
        await obtenerMisCategorias(
          token
        );

      setCategorias(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar las categorías."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCategorias();
  }, []);

  async function crearNuevaCategoria() {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    if (!nombreNueva.trim()) {
      setMensaje(
        "Escribe un nombre para la categoría."
      );
      return;
    }

    try {
      await crearCategoria(
        token,
        nombreNueva.trim()
      );

      setNombreNueva("");

      setMensaje(
        "Categoría creada correctamente."
      );

      await cargarCategorias();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo crear la categoría."
      );
    }
  }

  async function editarCategoria(
    categoria: CategoriaPOS
  ) {
    const nuevoNombre =
      window.prompt(
        "Nuevo nombre de la categoría:",
        categoria.nombre
      );

    if (
      nuevoNombre === null ||
      !nuevoNombre.trim()
    ) {
      return;
    }

    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      await actualizarCategoria(
        token,
        categoria.id,
        nuevoNombre.trim()
      );

      setMensaje(
        "Categoría actualizada correctamente."
      );

      await cargarCategorias();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo actualizar la categoría."
      );
    }
  }

  async function desactivarCategoria(
    categoria: CategoriaPOS
  ) {
    const confirmar =
      window.confirm(
        `¿Deseas desactivar la categoría "${categoria.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      await eliminarCategoria(
        token,
        categoria.id
      );

      setMensaje(
        "Categoría desactivada correctamente."
      );

      await cargarCategorias();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo desactivar la categoría."
      );
    }
  }

  async function reactivarCategoria(
    categoria: CategoriaPOS
  ) {
    const confirmar =
      window.confirm(
        `¿Deseas activar la categoría "${categoria.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    try {
      await activarCategoria(
        token,
        categoria.id
      );

      setMensaje(
        "Categoría activada correctamente."
      );

      await cargarCategorias();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo activar la categoría."
      );
    }
  }

  return (
    <div className="pos-layout">
      <Sidebar />

      <main className="pos-content">
        <div className="page-header">
          <div>
            <h1>
              Categorías
            </h1>

            <p>
              Administra las categorías de tu comercio.
            </p>
          </div>
        </div>

        <div className="category-create-card">
          <input
            type="text"
            placeholder="Ej. Pizzas, Bebidas, Postres"
            value={nombreNueva}
            onChange={(e) =>
              setNombreNueva(
                e.target.value
              )
            }
          />

          <button
            className="primary-button"
            onClick={
              crearNuevaCategoria
            }
          >
            + NUEVA CATEGORÍA
          </button>
        </div>

        {mensaje && (
          <div className="dashboard-message">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="loading-box">
            Cargando categorías...
          </div>
        ) : categorias.length === 0 ? (
          <div className="empty-box">
            No hay categorías registradas.
          </div>
        ) : (
          <div className="products-table-card">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {categorias.map(
                  (categoria) => (
                    <tr
                      key={categoria.id}
                    >
                      <td>
                        <strong>
                          {
                            categoria.nombre
                          }
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            categoria.activo
                              ? "product-status available"
                              : "product-status unavailable"
                          }
                        >
                          {categoria.activo
                            ? "Activa"
                            : "Desactivada"}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="edit-button"
                            onClick={() =>
                              editarCategoria(
                                categoria
                              )
                            }
                          >
                            EDITAR
                          </button>

                          {categoria.activo ? (
                            <button
                              className="delete-button"
                              onClick={() =>
                                desactivarCategoria(
                                  categoria
                                )
                              }
                            >
                              DESACTIVAR
                            </button>
                          ) : (
                            <button
                              className="activate-button"
                              onClick={() =>
                                reactivarCategoria(
                                  categoria
                                )
                              }
                            >
                              ACTIVAR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}