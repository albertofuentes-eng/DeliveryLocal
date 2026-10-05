import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Users,
  Store,
  Bike,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

import { obtenerMetricasAdmin, type MetricasAdmin } from "../services/api";

export default function MetricasPage() {
  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarMetricas() {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem("deliveryadmin_token");

      if (!token) {
        throw new Error("No hay una sesión activa.");
      }

      const data = await obtenerMetricasAdmin(token);
      setMetricas(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las métricas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarMetricas();
  }, []);

  function formatoMoneda(valor: number) {
    return valor.toLocaleString("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    });
  }

  if (cargando) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-600">Cargando métricas de la plataforma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/60">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Métricas</h1>
              <p className="text-sm text-slate-500 font-medium">Resumen general de DeliveryLocal</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            onClick={cargarMetricas}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-rose-700 text-sm font-medium">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metricas) {
    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/60 shadow-sm">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Métricas de la Plataforma</h1>
            <p className="text-sm text-slate-500 font-medium">Resumen general de pedidos, ventas y operación.</p>
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          onClick={cargarMetricas}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* =========================
          RESUMEN PRINCIPAL (TARJETAS)
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total de pedidos</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{metricas.resumen.totalPedidos}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Ventas totales</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {formatoMoneda(metricas.ventas.ventasTotales)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pedidos entregados</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{metricas.resumen.pedidosEntregados}</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pedidos pendientes</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{metricas.resumen.pedidosPendientes}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================
          OPERACIÓN (2 COLUMNAS)
      ========================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pedidos por estado */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Pedidos por estado
          </h2>

          <div className="divide-y divide-slate-100">
            {metricas.pedidosPorEstado.map((item) => (
              <div key={item.estado} className="py-3 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600">{item.estado}</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen operativo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Resumen operativo
          </h2>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">En proceso</span>
              <span className="font-bold text-blue-600">{metricas.resumen.pedidosEnProceso}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Rechazados</span>
              <span className="font-bold text-rose-600">{metricas.resumen.pedidosRechazados}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Clientes activos</span>
              <span className="font-bold text-slate-900">{metricas.clientes.clientesActivos}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Comercios activos</span>
              <span className="font-bold text-slate-900">{metricas.comercios.comerciosActivos}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Repartidores disponibles</span>
              <span className="font-bold text-emerald-600">{metricas.repartidores.repartidoresDisponibles}</span>
            </div>
          </div>
        </div>

      </div>

      {/* =========================
          RESUMEN DE VENTAS
      ========================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Resumen de ventas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatoMoneda(metricas.ventas.ventasTotales)}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subtotal</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatoMoneda(metricas.ventas.subtotalTotal)}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/80 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Envíos</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatoMoneda(metricas.ventas.enviosTotales)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          COMERCIOS (TABLA)
      ========================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-purple-600" />
          Pedidos por comercio
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Comercio</th>
                <th className="pb-3 text-center">Pedidos</th>
                <th className="pb-3 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metricas.pedidosPorComercio.map((item) => (
                <tr key={item.comercioId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-semibold text-slate-800">{item.comercio}</td>
                  <td className="py-3 text-center font-medium text-slate-600">{item.pedidos}</td>
                  <td className="py-3 text-right font-bold text-emerald-600">{formatoMoneda(item.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          REPARTIDORES (TABLA)
      ========================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bike className="w-5 h-5 text-blue-600" />
          Pedidos por repartidor
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Repartidor</th>
                <th className="pb-3 text-center">Pedidos</th>
                <th className="pb-3 text-right">Entregados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metricas.pedidosPorRepartidor.map((item) => (
                <tr key={item.repartidorId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-semibold text-slate-800">{item.repartidor}</td>
                  <td className="py-3 text-center font-medium text-slate-600">{item.pedidos}</td>
                  <td className="py-3 text-right font-bold text-emerald-600">{item.entregados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          RESUMEN DE PERSONAS
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clientes Totales</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metricas.clientes.totalClientes}</p>
          </div>
          <Users className="w-6 h-6 text-indigo-500" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Comercios Totales</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metricas.comercios.totalComercios}</p>
          </div>
          <Store className="w-6 h-6 text-purple-500" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repartidores Totales</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metricas.repartidores.totalRepartidores}</p>
          </div>
          <Bike className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

    </div>
  );
}