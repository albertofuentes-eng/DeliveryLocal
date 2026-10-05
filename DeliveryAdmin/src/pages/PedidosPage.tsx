import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import {
  obtenerPedidosAdmin,
  type PedidoAdmin,
} from "../services/api";

function obtenerToken(): string | null {
  return localStorage.getItem("deliveryadmin_token");
}

function formatoFecha(fecha: string | null) {
  if (!fecha) return "—";

  return new Date(fecha).toLocaleString("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
  });
}

function colorEstado(estado: string) {
  switch (estado) {
    case "Entregado":
      return "bg-green-100 text-green-700";

    case "Cancelado":
    case "Rechazado":
      return "bg-red-100 text-red-700";

    case "En camino":
    case "Asignado a repartidor":
      return "bg-blue-100 text-blue-700";

    case "Preparando":
    case "Listo para recoger":
      return "bg-yellow-100 text-yellow-700";

    case "Confirmado":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function iconoEstado(estado: string) {
  if (estado === "Entregado") {
    return <CheckCircle size={15} />;
  }

  if (
    estado === "En camino" ||
    estado === "Asignado a repartidor"
  ) {
    return <Truck size={15} />;
  }

  if (
    estado === "Cancelado" ||
    estado === "Rechazado"
  ) {
    return <XCircle size={15} />;
  }

  return <Clock size={15} />;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<PedidoAdmin | null>(null);

  async function cargarPedidos() {
    const token = obtenerToken();

    if (!token) {
      setError("No hay sesión de administrador.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const data = await obtenerPedidosAdmin(token);

      setPedidos(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los pedidos."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return pedidos;
    }

    return pedidos.filter((pedido) =>
      [
        pedido.id.toString(),
        pedido.estado,
        pedido.cliente.nombre,
        pedido.cliente.correo,
        pedido.comercio.nombre,
        pedido.repartidor?.nombre ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [pedidos, busqueda]);

  const totalPedidos = pedidos.length;

  const pedidosPendientes = pedidos.filter(
    (pedido) =>
      pedido.estado === "Pendiente"
  ).length;

  const pedidosEnProceso = pedidos.filter(
    (pedido) =>
      [
        "Confirmado",
        "Preparando",
        "Listo para recoger",
        "Asignado a repartidor",
        "Recogido",
        "En camino",
      ].includes(pedido.estado)
  ).length;

  const pedidosEntregados = pedidos.filter(
    (pedido) => pedido.estado === "Entregado"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Package
                  size={30}
                  className="text-blue-600"
                />

                <h1 className="text-3xl font-bold text-slate-800">
                  Pedidos
                </h1>
              </div>

              <p className="text-slate-500 mt-1">
                Gestión de pedidos realizados por los clientes
              </p>
            </div>

            <button
              onClick={cargarPedidos}
              disabled={cargando}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={cargando ? "animate-spin" : ""}
              />

              Actualizar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">
                Total de pedidos
              </p>

              <p className="text-3xl font-bold text-slate-800 mt-1">
                {totalPedidos}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">
                Pendientes
              </p>

              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {pedidosPendientes}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">
                En proceso
              </p>

              <p className="text-3xl font-bold text-blue-600 mt-1">
                {pedidosEnProceso}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">
                Entregados
              </p>

              <p className="text-3xl font-bold text-green-600 mt-1">
                {pedidosEntregados}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por pedido, cliente, comercio, repartidor o estado..."
                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {cargando ? (
              <div className="p-10 text-center text-slate-500">
                Cargando pedidos...
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                No se encontraron pedidos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Pedido
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Cliente
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Comercio
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Repartidor
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Estado
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Total
                      </th>

                      <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">
                        Fecha
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pedidosFiltrados.map((pedido) => (
                      <tr
                        key={pedido.id}
                        onClick={() =>
                          setPedidoSeleccionado(pedido)
                        }
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800">
                            #{pedido.id}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800">
                            {pedido.cliente.nombre}
                          </div>

                          <div className="text-sm text-slate-500">
                            {pedido.cliente.correo}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800">
                            {pedido.comercio.nombre}
                          </div>

                          <div className="text-sm text-slate-500">
                            {pedido.tipoEntrega}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {pedido.repartidor?.nombre ??
                            "Sin asignar"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(
                              pedido.estado
                            )}`}
                          >
                            {iconoEstado(pedido.estado)}
                            {pedido.estado}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatoMoneda(pedido.total)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatoFecha(pedido.fecha)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {pedidoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setPedidoSeleccionado(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Pedido #{pedidoSeleccionado.id}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {formatoFecha(pedidoSeleccionado.fecha)}
                </p>
              </div>

              <button
                onClick={() => setPedidoSeleccionado(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Cliente
                  </p>

                  <p className="font-semibold text-slate-800">
                    {pedidoSeleccionado.cliente.nombre}
                  </p>

                  <p className="text-sm text-slate-500">
                    {pedidoSeleccionado.cliente.telefono ??
                      "Sin teléfono"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Comercio
                  </p>

                  <p className="font-semibold text-slate-800">
                    {pedidoSeleccionado.comercio.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Repartidor
                  </p>

                  <p className="font-semibold text-slate-800">
                    {pedidoSeleccionado.repartidor?.nombre ??
                      "Sin asignar"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-slate-800 mb-3">
                  Estado y entrega
                </h3>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Estado:
                    </span>{" "}
                    <strong>
                      {pedidoSeleccionado.estado}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Tipo:
                    </span>{" "}
                    <strong>
                      {pedidoSeleccionado.tipoEntrega}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Tiempo:
                    </span>{" "}
                    <strong>
                      {pedidoSeleccionado.tipoTiempo}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Programado:
                    </span>{" "}
                    <strong>
                      {formatoFecha(
                        pedidoSeleccionado.fechaProgramada
                      )}
                    </strong>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-slate-500">
                      Dirección:
                    </span>{" "}
                    <strong>
                      {pedidoSeleccionado.direccionEntrega ??
                        "No aplica"}
                    </strong>
                  </div>

                  {pedidoSeleccionado.referenciaEntrega && (
                    <div className="md:col-span-2">
                      <span className="text-slate-500">
                        Referencia:
                      </span>{" "}
                      <strong>
                        {pedidoSeleccionado.referenciaEntrega}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-slate-800 mb-3">
                  Productos
                </h3>

                <div className="space-y-2">
                  {pedidoSeleccionado.detalles.map(
                    (detalle) => (
                      <div
                        key={detalle.id}
                        className="flex justify-between items-center bg-slate-50 rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {detalle.producto}
                          </p>

                          <p className="text-sm text-slate-500">
                            {detalle.cantidad} ×{" "}
                            {formatoMoneda(
                              detalle.precioUnitario
                            )}
                          </p>
                        </div>

                        <p className="font-semibold text-slate-800">
                          {formatoMoneda(detalle.subtotal)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="max-w-sm ml-auto space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>
                      {formatoMoneda(
                        pedidoSeleccionado.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Envío</span>
                    <span>
                      {formatoMoneda(
                        pedidoSeleccionado.envio
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-2">
                    <span>Total</span>
                    <span>
                      {formatoMoneda(
                        pedidoSeleccionado.total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}