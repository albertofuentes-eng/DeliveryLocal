import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";

import AdminSidebar from "../components/AdminSidebar";
import {
  obtenerClientesAdmin,
  type ClienteAdmin,
} from "../services/api";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarClientes() {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem(
        "deliveryadmin_token"
      );

      if (!token) {
        throw new Error(
          "No hay una sesión de administrador activa."
        );
      }

      const data =
        await obtenerClientesAdmin(token);

      setClientes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  const clientesFiltrados =
    clientes.filter((cliente) => {
      const texto =
        busqueda.toLowerCase().trim();

      if (!texto) {
        return true;
      }

      return (
        cliente.nombre
          .toLowerCase()
          .includes(texto) ||
        cliente.correo
          .toLowerCase()
          .includes(texto) ||
        (cliente.telefono ?? "")
          .toLowerCase()
          .includes(texto)
      );
    });

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* ENCABEZADO */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Users size={23} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Clientes
                  </h1>

                  <p className="text-sm text-slate-500">
                    Gestión de clientes registrados
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarClientes}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <RefreshCw
                size={17}
                className={
                  cargando
                    ? "animate-spin"
                    : ""
                }
              />

              Actualizar
            </button>
          </div>

          {/* RESUMEN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Total de clientes
                  </p>

                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {clientes.length}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Users size={22} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Clientes activos
                  </p>

                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {
                      clientes.filter(
                        (cliente) =>
                          cliente.activo
                      ).length
                    }
                  </p>
                </div>

                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <UserCheck size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* BARRA DE BÚSQUEDA */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                  placeholder="Buscar por nombre, correo o teléfono..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* CARGANDO */}
            {cargando && (
              <div className="p-10 text-center">
                <RefreshCw
                  size={24}
                  className="animate-spin mx-auto text-slate-500"
                />

                <p className="text-sm text-slate-500 mt-3">
                  Cargando clientes...
                </p>
              </div>
            )}

            {/* TABLA */}
            {!cargando &&
              !error && (
                <>
                  {clientesFiltrados.length ===
                  0 ? (
                    <div className="p-10 text-center">
                      <Users
                        size={32}
                        className="mx-auto text-slate-300"
                      />

                      <p className="text-slate-600 font-medium mt-3">
                        No se encontraron clientes.
                      </p>

                      {busqueda && (
                        <p className="text-sm text-slate-400 mt-1">
                          Intente con otro criterio
                          de búsqueda.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                              Cliente
                            </th>

                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                              Correo
                            </th>

                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                              Teléfono
                            </th>

                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                              Registro
                            </th>

                            <th className="text-center px-5 py-3 font-semibold text-slate-600">
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {clientesFiltrados.map(
                            (cliente) => (
                              <tr
                                key={
                                  cliente.id
                                }
                                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                      <Users
                                        size={
                                          17
                                        }
                                      />
                                    </div>

                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {
                                          cliente.nombre
                                        }
                                      </p>

                                      <p className="text-xs text-slate-400">
                                        ID #
                                        {
                                          cliente.id
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-slate-600">
                                  {
                                    cliente.correo
                                  }
                                </td>

                                <td className="px-5 py-4 text-slate-600">
                                  {cliente.telefono ||
                                    "No registrado"}
                                </td>

                                <td className="px-5 py-4 text-slate-600">
                                  {new Date(
                                    cliente.fechaCreacion
                                  ).toLocaleDateString(
                                    "es-GT",
                                    {
                                      year: "numeric",
                                      month:
                                        "2-digit",
                                      day: "2-digit",
                                    }
                                  )}
                                </td>

                                <td className="px-5 py-4 text-center">
                                  {cliente.activo ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                      <UserCheck
                                        size={
                                          14
                                        }
                                      />
                                      Activo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                      <UserX
                                        size={
                                          14
                                        }
                                      />
                                      Inactivo
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}