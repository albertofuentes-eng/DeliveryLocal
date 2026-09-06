import {
  NavLink,
  useNavigate,
} from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  function cerrarSesion() {
    localStorage.removeItem(
      "deliverypos_token"
    );

    localStorage.removeItem(
      "deliverypos_usuario"
    );

    navigate("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>DeliveryPOS</h2>
        <p>Panel del comercio</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          📦 Pedidos
        </NavLink>

        <NavLink
          to="/productos"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          🍕 Productos
        </NavLink>

        <NavLink
          to="/categorias"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          📂 Categorías
        </NavLink>

        <NavLink
          to="/mi-comercio"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          🏪 Mi comercio
        </NavLink>
      </nav>

      <button
        className="sidebar-logout"
        onClick={cerrarSesion}
      >
        🚪 Cerrar sesión
      </button>
    </aside>
  );
}