import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

import {
  obtenerPedidosComercio,
  type PedidoComercio,
  type UsuarioPOS,
} from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] =
    useState<PedidoComercio[]>([]);

  const [usuario, setUsuario] =
    useState<UsuarioPOS | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    const token =
      localStorage.getItem(
        "deliverypos_token"
      );

    const usuarioTexto =
      localStorage.getItem(
        "deliverypos_usuario"
      );

    if (!token || !usuarioTexto) {
      navigate("/");
      return;
    }

    try {
      const usuarioGuardado =
        JSON.parse(
          usuarioTexto
        );

      setUsuario(
        usuarioGuardado
      );

      const data =
        await obtenerPedidosComercio(
          token
        );

      setPedidos(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudieron cargar los pedidos."
      );
    } finally {
      setCargando(false);
    }
  }

  const pendientes =
    pedidos.filter(
      (p) =>
        p.estado === "Pendiente"
    ).length;

  const confirmados =
    pedidos.filter(
      (p) =>
        p.estado === "Confirmado"
    ).length;

  const preparando =
    pedidos.filter(
      (p) =>
        p.estado === "Preparando"
    ).length;

  return (
    <div className="pos-layout">
      <Sidebar />

      <main className="pos-content">
        <div className="page-header">
          <div>
            <h1>Pedidos</h1>

            <p>
              Pedidos recibidos por{" "}
              {pedidos[0]?.comercio ||
                usuario?.nombre ||
                "tu comercio"}
            </p>
          </div>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <span>
              Pendientes
            </span>

            <strong>
              {pendientes}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Confirmados
            </span>

            <strong>
              {confirmados}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Preparando
            </span>

            <strong>
              {preparando}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Total pedidos
            </span>

            <strong>
              {pedidos.length}
            </strong>
          </div>
        </section>

        {mensaje && (
          <div className="dashboard-message">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="loading-box">
            Cargando pedidos...
          </div>
        ) : pedidos.length === 0 ? (
          <div className="empty-box">
            No hay pedidos todavía.
          </div>
        ) : (
          <section className="orders-grid">
            {pedidos.map(
              (pedido) => (
                <article
                  className="order-card"
                  key={pedido.id}
                >
                  <div className="order-header">
                    <h3>
                      Pedido #{pedido.id}
                    </h3>

                    <span
                      className="status-badge"
                    >
                      {pedido.estado}
                    </span>
                  </div>

                  <div className="order-info">
                    <p>
                      <strong>
                        Cliente:
                      </strong>{" "}
                      {pedido.cliente}
                    </p>

                    <p>
                      <strong>
                        Entrega:
                      </strong>{" "}
                      {pedido.tipoEntrega}
                    </p>

                    <p>
                      <strong>
                        Productos:
                      </strong>{" "}
                      {pedido.cantidadProductos}
                    </p>

                    <p>
                      <strong>
                        Fecha:
                      </strong>{" "}
                      {new Date(
                        pedido.fecha
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="order-total">
                    <span>
                      Total
                    </span>

                    <strong>
                      Q{" "}
                      {Number(
                        pedido.total
                      ).toFixed(2)}
                    </strong>
                  </div>

                  <button
                    className="detail-button"
                    onClick={() =>
                      navigate(
                        `/pedidos/${pedido.id}`
                      )
                    }
                  >
                    VER DETALLE
                  </button>
                </article>
              )
            )}
          </section>
        )}
      </main>
    </div>
  );
}