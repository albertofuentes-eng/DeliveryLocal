import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  activarProducto,
  desactivarProducto,
  obtenerMisProductos,
  type ProductoPOS,
} from "../services/api";

export default function ProductosPage() {
  const navigate = useNavigate();

  const [productos, setProductos] =
    useState<ProductoPOS[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
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
        await obtenerMisProductos(
          token
        );

      setProductos(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar los productos."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cambiarDisponibilidad(
    producto: ProductoPOS
  ) {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    if (!token) {
      navigate("/");
      return;
    }

    const accion =
      producto.disponible
        ? "desactivar"
        : "activar";

    const confirmar =
      window.confirm(
        `¿Deseas ${accion} "${producto.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      if (producto.disponible) {
        await desactivarProducto(
          token,
          producto.id
        );
      } else {
        await activarProducto(
          token,
          producto.id
        );
      }

      setMensaje(
        producto.disponible
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente."
      );

      await cargarProductos();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cambiar el estado del producto."
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
              Productos
            </h1>

            <p>
              Administra los productos de tu comercio.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                "/productos/nuevo"
              )
            }
          >
            + NUEVO PRODUCTO
          </button>
        </div>

        {mensaje && (
          <div className="dashboard-message">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="loading-box">
            Cargando productos...
          </div>
        ) : productos.length === 0 ? (
          <div className="empty-box">
            No hay productos registrados.
          </div>
        ) : (
          <div className="products-table-card">
            <table className="products-table">
              <thead>
                <tr>
                  <th>
                    Producto
                  </th>

                  <th>
                    Categoría
                  </th>

                  <th>
                    Precio
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {productos.map(
                  (producto) => (
                    <tr
                      key={
                        producto.id
                      }
                    >
                      <td>
                        <div className="product-name-cell">
                          <strong>
                            {
                              producto.nombre
                            }
                          </strong>

                          {producto.descripcion && (
                            <span>
                              {
                                producto.descripcion
                              }
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {
                          producto.categoria
                        }
                      </td>

                      <td>
                        Q{" "}
                        {Number(
                          producto.precio
                        ).toFixed(2)}
                      </td>

                      <td>
                        <span
                          className={
                            producto.disponible
                              ? "product-status available"
                              : "product-status unavailable"
                          }
                        >
                          {producto.disponible
                            ? "Disponible"
                            : "Desactivado"}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="edit-button"
                            onClick={() =>
                              navigate(
                                `/productos/${producto.id}/editar`
                              )
                            }
                          >
                            EDITAR
                          </button>

                          <button
                            className={
                              producto.disponible
                                ? "delete-button"
                                : "activate-button"
                            }
                            onClick={() =>
                              cambiarDisponibilidad(
                                producto
                              )
                            }
                          >
                            {producto.disponible
                              ? "DESACTIVAR"
                              : "ACTIVAR"}
                          </button>
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