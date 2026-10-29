
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import AdminSidebar from "../components/AdminSidebar";

import {
  obtenerReembolsosPendientes,
  guardarObservacionReembolso,
  marcarReembolsoNoProcede,
  obtenerHistorialReembolsos,
  confirmarDevolucionReembolso,
  solicitarReembolsoTarjeta,
  type ReembolsoAdmin,
  type ReembolsoHistorial,
} from "../services/api";

export default function ReembolsosPage() {
  const [reembolsos, setReembolsos] = useState<ReembolsoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [observaciones, setObservaciones] = useState<
    Record<number, string>
  >({});

  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [cerrandoId, setCerrandoId] = useState<number | null>(null);

  // ==========================================
  // CONTROL DE DEVOLUCIONES BANCARIAS
  // ==========================================

  const [referenciasDevolucion, setReferenciasDevolucion] =
    useState<Record<number, string>>({});

  const [confirmacionesDevolucion, setConfirmacionesDevolucion] =
    useState<Record<number, boolean>>({});

  const [procesandoDevolucionId, setProcesandoDevolucionId] =
    useState<number | null>(null);

  // ==========================================
  // HISTORIAL DE REEMBOLSOS
  // ==========================================

  const [historial, setHistorial] = useState<
    ReembolsoHistorial[]
  >([]);

  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  const [errorHistorial, setErrorHistorial] = useState("");

  // ==========================================
  // CONSULTAR HISTORIAL DESDE SQL SERVER
  // ==========================================

  async function cargarHistorial() {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setErrorHistorial("Debes iniciar sesión.");
      setCargandoHistorial(false);
      return;
    }

    try {
      setCargandoHistorial(true);
      setErrorHistorial("");

      const datos = await obtenerHistorialReembolsos(token);

      setHistorial(datos);
    } catch (err) {
      setErrorHistorial(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial."
      );
    } finally {
      setCargandoHistorial(false);
    }
  }

  // ==========================================
  // CARGAR REEMBOLSOS PENDIENTES
  // ==========================================

  async function cargarReembolsos() {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const datos = await obtenerReembolsosPendientes(token);

      setReembolsos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los reembolsos."
      );
    } finally {
      setCargando(false);
    }
  }

  // ==========================================
  // REGISTRAR DEVOLUCIÓN YA REALIZADA
  // ==========================================

  async function devolverTarjeta(reembolso: ReembolsoAdmin) {
    if (
      reembolso.metodoPago !== "Tarjeta" ||
      reembolso.estadoPedido !== "Cancelado" ||
      reembolso.estadoPago !== "Verificado" ||
      procesandoDevolucionId !== null
    ) {
      return;
    }

    const token = localStorage.getItem("deliveryadmin_token");
    if (!token) {
      setError("Debes iniciar sesion nuevamente.");
      return;
    }

    const confirmado = window.confirm(
      `¿Solicitar el reembolso SANDBOX de Q ${Number(reembolso.monto).toFixed(2)} ` +
      `del pedido #${reembolso.pedidoId}?\n\n` +
      "Esta accion contactara a Recurrente. No es solo un registro."
    );
    if (!confirmado) return;

    const frase = window.prompt(
      "Para confirmar la solicitud, escribi DEVOLVER:"
    );
    if (frase !== "DEVOLVER") return;

    try {
      setProcesandoDevolucionId(reembolso.id);
      setError("");
      setMensaje("");

      const resultado = await solicitarReembolsoTarjeta(
        token, reembolso.id
      );

      setMensaje(
        resultado.confirmado
          ? `Reembolso #${reembolso.id} confirmado por Recurrente Sandbox.`
          : `Reembolso #${reembolso.id} en estado ${resultado.estadoProveedor}. Requiere conciliacion.`
      );

      await Promise.all([cargarReembolsos(), cargarHistorial()]);
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : "Error inesperado.") +
        " No repitas la solicitud sin revisar su estado."
      );
      await Promise.all([cargarReembolsos(), cargarHistorial()]);
    } finally {
      setProcesandoDevolucionId(null);
    }
  }
  async function registrarDevolucion(
    reembolso: ReembolsoAdmin
  ) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const referencia = (
      referenciasDevolucion[reembolso.id] ?? ""
    ).trim();

    if (referencia.length < 5 || referencia.length > 80) {
      setError(
        "La referencia bancaria debe contener entre 5 y 80 caracteres."
      );
      return;
    }

    if (!confirmacionesDevolucion[reembolso.id]) {
      setError(
        "Debes confirmar que el dinero ya fue devuelto realmente."
      );
      return;
    }

    if (
      !reembolso.observacionAdmin?.trim() ||
      reembolso.estadoPedido !== "Cancelado" ||
      reembolso.metodoPago !== "Transferencia" ||
      reembolso.estadoPago !== "Verificado"
    ) {
      setError(
        "La solicitud debe tener observación y corresponder " +
        "a una transferencia verificada de un pedido cancelado."
      );
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmás que el dinero del pedido #${reembolso.pedidoId} ` +
      `por ${formatearMonto(reembolso.monto)} ya fue devuelto ` +
      `realmente al cliente?\n\n` +
      `Referencia: ${referencia}\n\n` +
      `Esta acción registrará la devolución como REEMBOLSADA.`
    );

    if (!confirmado) {
      return;
    }

    try {
      setProcesandoDevolucionId(reembolso.id);
      setError("");
      setMensaje("");

      await confirmarDevolucionReembolso(
        token,
        reembolso.id,
        referencia
      );

      setReembolsos((anteriores) =>
        anteriores.filter(
          (item) => item.id !== reembolso.id
        )
      );

      setReferenciasDevolucion((anteriores) => {
        const nuevos = { ...anteriores };
        delete nuevos[reembolso.id];
        return nuevos;
      });

      setConfirmacionesDevolucion((anteriores) => {
        const nuevos = { ...anteriores };
        delete nuevos[reembolso.id];
        return nuevos;
      });

      setMensaje(
        `Reembolso #${reembolso.id} registrado como ` +
        `"Reembolsado". La operación bancaria fue ` +
        `declarada por el administrador.`
      );

      await Promise.all([
        cargarReembolsos(),
        cargarHistorial(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la devolución."
      );
    } finally {
      setProcesandoDevolucionId(null);
    }
  }

  // ==========================================
  // GUARDAR OBSERVACIÓN ADMINISTRATIVA
  // ==========================================

  async function guardarObservacion(reembolso: ReembolsoAdmin) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const observacion = (
      observaciones[reembolso.id] ??
      reembolso.observacionAdmin ??
      ""
    ).trim();

    if (!observacion) {
      setError("Debes escribir una observación.");
      return;
    }

    if (observacion.length > 1000) {
      setError("La observación no puede superar 1000 caracteres.");
      return;
    }

    try {
      setGuardandoId(reembolso.id);
      setError("");
      setMensaje("");

      await guardarObservacionReembolso(
        token,
        reembolso.id,
        observacion
      );

      setReembolsos((anteriores) =>
        anteriores.map((item) =>
          item.id === reembolso.id
            ? { ...item, observacionAdmin: observacion }
            : item
        )
      );

      setObservaciones((anteriores) => ({
        ...anteriores,
        [reembolso.id]: observacion,
      }));

      setMensaje(
        `Observación del reembolso #${reembolso.id} guardada correctamente.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar la observación."
      );
    } finally {
      setGuardandoId(null);
    }
  }

  // ==========================================
  // CERRAR REEMBOLSO COMO NO PROCEDE
  // ==========================================

  async function cerrarReembolsoNoProcede(
    reembolso: ReembolsoAdmin
  ) {
    const token = localStorage.getItem("deliveryadmin_token");

    if (!token) {
      setError("Debes iniciar sesión.");
      return;
    }

    const observacionGuardada = (
      reembolso.observacionAdmin ?? ""
    ).trim();

    const observacionActual = (
      observaciones[reembolso.id] ??
      reembolso.observacionAdmin ??
      ""
    ).trim();

    // No permitir cerrar sin justificación.
    if (!observacionGuardada) {
      setError(
        `Primero debes guardar una observación para el reembolso #${reembolso.id}.`
      );
      return;
    }

    // Evitar cerrar cuando hay cambios sin guardar.
    if (observacionActual !== observacionGuardada) {
      setError(
        "Tienes cambios en la observación. Guárdalos antes de cerrar el reembolso."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmas cerrar el reembolso #${reembolso.id} ` +
        `del pedido #${reembolso.pedidoId} como "No procede"?\n\n` +
        `Monto: ${formatearMonto(reembolso.monto)}\n\n` +
        "Esta acción cerrará la solicitud pendiente.\n" +
        "No se realizará ninguna devolución bancaria."
    );

    if (!confirmar) {
      return;
    }

    try {
      setCerrandoId(reembolso.id);
      setError("");
      setMensaje("");

      await marcarReembolsoNoProcede(
        token,
        reembolso.id
      );

      // Quitar el registro de la lista de pendientes.
      // La solicitud permanece almacenada en SQL Server.
      setReembolsos((anteriores) =>
        anteriores.filter(
          (item) => item.id !== reembolso.id
        )
      );

      setObservaciones((anteriores) => {
        const nuevas = { ...anteriores };
        delete nuevas[reembolso.id];
        return nuevas;
      });

      void cargarHistorial();

      setMensaje(
        `Reembolso #${reembolso.id} cerrado como "No procede". ` +
        "No se realizó ninguna devolución bancaria."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar el reembolso."
      );
    } finally {
      setCerrandoId(null);
    }
  }

  // ==========================================
  // CARGA INICIAL
  // ==========================================

  useEffect(() => {
    void cargarReembolsos();
    void cargarHistorial();
  }, []);

  // ==========================================
  // TOTALES Y FORMATOS
  // ==========================================

  const totalPendiente = reembolsos.reduce(
    (acumulado, reembolso) =>
      acumulado + reembolso.monto,
    0
  );

  function formatearMonto(monto: number) {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(monto);
  }

  function formatearFecha(fecha: string) {
    const tieneZonaHoraria =
      /(?:Z|[+-]\d{2}:\d{2})$/i.test(fecha);

    const fechaNormalizada = tieneZonaHoraria
      ? fecha
      : `${fecha}Z`;

    return new Date(fechaNormalizada).toLocaleString("es-GT");
  }

  const procesando =
    guardandoId !== null || cerrandoId !== null;

  return (
    <div style={styles.contenedor}>
      <AdminSidebar />

      <main style={styles.contenido}>
        {/* ENCABEZADO */}

        <div style={styles.encabezado}>
          <div>
            <h1 style={styles.titulo}>Reembolsos</h1>

            <p style={styles.subtitulo}>
              Solicitudes de devolución pendientes
              de revisión administrativa.
            </p>
          </div>

          <button
            type="button"
            style={styles.boton}
            onClick={() => {
              void cargarReembolsos();
              void cargarHistorial();
            }}
            disabled={cargando || procesando}
          >
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {/* RESUMEN */}

        <div style={styles.resumen}>
          <div style={styles.tarjeta}>
            <span style={styles.etiqueta}>
              Solicitudes pendientes
            </span>

            <strong style={styles.valor}>
              {reembolsos.length}
            </strong>
          </div>

          <div style={styles.tarjeta}>
            <span style={styles.etiqueta}>
              Monto pendiente de revisión
            </span>

            <strong style={styles.valor}>
              {formatearMonto(totalPendiente)}
            </strong>
          </div>
        </div>

        {/* AVISO */}

        <div style={styles.aviso}>
          Los reembolsos registrados no representan
          devoluciones bancarias realizadas.
          Un administrador debe verificar cada caso.
        </div>

        {/* ERRORES */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* CONFIRMACIÓN */}

        {mensaje && (
          <div style={styles.exito}>
            {mensaje}
          </div>
        )}

        {/* TABLA */}

        <section style={styles.panel}>
          <h2 style={styles.seccionTitulo}>
            Solicitudes pendientes
          </h2>

          {cargando ? (
            <p>Cargando reembolsos...</p>
          ) : reembolsos.length === 0 ? (
            <p style={styles.vacio}>
              No hay solicitudes de reembolso pendientes.
            </p>
          ) : (
            <div style={styles.tablaContenedor}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.celda}>ID</th>
                    <th style={styles.celda}>Pedido</th>
                    <th style={styles.celda}>Monto</th>
                    <th style={styles.celda}>Estado</th>
                    <th style={styles.celda}>Fecha</th>
                    <th style={styles.celda}>Motivo y acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {reembolsos.map((reembolso) => (
                    <tr key={reembolso.id}>
                      <td style={styles.celda}>
                        #{reembolso.id}
                      </td>

                      <td style={styles.celda}>
                        #{reembolso.pedidoId}
                      </td>

                      <td style={styles.celda}>
                        <strong>
                          {formatearMonto(reembolso.monto)}
                        </strong>
                      </td>

                      <td style={styles.celda}>
                        <span style={styles.estado}>
                          {reembolso.estado}
                        </span>
                      </td>

                      <td style={styles.celda}>
                        {formatearFecha(
                          reembolso.fechaCreacion
                        )}
                      </td>

                      <td style={styles.celda}>
                        <p style={styles.motivo}>
                          {reembolso.motivo}
                        </p>

                        <div style={styles.formulario}>
                          <label style={styles.label}>
                            Observación administrativa
                          </label>

                          <textarea
                            value={
                              observaciones[reembolso.id] ??
                              reembolso.observacionAdmin ??
                              ""
                            }
                            onChange={(e) =>
                              setObservaciones((anteriores) => ({
                                ...anteriores,
                                [reembolso.id]: e.target.value,
                              }))
                            }
                            maxLength={1000}
                            rows={3}
                            placeholder="Escribí una observación..."
                            style={styles.textarea}
                            disabled={procesando}
                          />

                          <div style={styles.acciones}>
                            {/* GUARDAR OBSERVACIÓN */}

                            <button
                              type="button"
                              disabled={procesando}
                              onClick={() =>
                                void guardarObservacion(reembolso)
                              }
                              style={{
                                ...styles.botonGuardar,
                                opacity: procesando ? 0.6 : 1,
                              }}
                            >
                              {guardandoId === reembolso.id
                                ? "Guardando..."
                                : "Guardar observación"}
                            </button>

                            {/* MARCAR COMO NO PROCEDE */}

                            <button
                              type="button"
                              disabled={procesando}
                              onClick={() =>
                                void cerrarReembolsoNoProcede(
                                  reembolso
                                )
                              }
                              style={{
                                ...styles.botonNoProcede,
                                opacity: procesando ? 0.6 : 1,
                              }}
                            >
                              {cerrandoId === reembolso.id
                                ? "Cerrando..."
                                : "Marcar como No procede"}
                            </button>
                          </div>

                        {/* ========================================== */}
                        {reembolso.metodoPago === "Tarjeta" &&
                          reembolso.estadoPedido === "Cancelado" &&
                          reembolso.estadoPago === "Verificado" && (
                            <div style={{ marginTop: 16 }}>
                              <button
                                type="button"
                                disabled={procesando}
                                onClick={() => void devolverTarjeta(reembolso)}
                                style={{
                                  padding: "12px 16px",
                                  borderRadius: 8,
                                  border: 0,
                                  background: "#166534",
                                  color: "#fff",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  opacity: procesando ? 0.5 : 1,
                                }}
                              >
                                {procesandoDevolucionId === reembolso.id
                                  ? "Procesando en Recurrente..."
                                  : "Solicitar reembolso con tarjeta (Sandbox)"}
                              </button>
                            </div>
                          )}
                        {/* REGISTRAR DEVOLUCIÓN REALIZADA */}
                        {/* ========================================== */}

                        {reembolso.metodoPago === "Transferencia" && (
                        <div
                          style={{
                            marginTop: "22px",
                            paddingTop: "18px",
                            borderTop: "1px solid #e5e7eb",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "15px",
                              marginBottom: "10px",
                              color: "#263238",
                            }}
                          >
                            Registrar devolución bancaria
                          </h3>

                          <p
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              lineHeight: 1.5,
                            }}
                          >
                            Registrá esta operación únicamente
                            cuando hayas comprobado que el dinero
                            fue devuelto realmente al cliente.
                          </p>

                          <label
                            style={{
                              display: "block",
                              fontWeight: 700,
                              marginBottom: "8px",
                            }}
                          >
                            Referencia bancaria de devolución
                          </label>

                          <input
                            type="text"
                            maxLength={80}
                            placeholder="Referencia de la devolución"
                            value={
                              referenciasDevolucion[reembolso.id] ?? ""
                            }
                            onChange={(e) =>
                              setReferenciasDevolucion((anteriores) => ({
                                ...anteriores,
                                [reembolso.id]: e.target.value,
                              }))
                            }
                            disabled={procesando}
                            style={{
                              width: "100%",
                              minWidth: "240px",
                              padding: "11px",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                            }}
                          />

                          <label
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "flex-start",
                              marginTop: "14px",
                              fontSize: "13px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                confirmacionesDevolucion[reembolso.id] ??
                                false
                              }
                              disabled={procesando}
                              onChange={(e) =>
                                setConfirmacionesDevolucion(
                                  (anteriores) => ({
                                    ...anteriores,
                                    [reembolso.id]: e.target.checked,
                                  })
                                )
                              }
                            />

                            <span>
                              Confirmo que verifiqué la operación
                              bancaria y que el dinero ya fue
                              devuelto realmente al cliente.
                            </span>
                          </label>

                          <button
                            type="button"
                            disabled={
                              procesando ||
                              !confirmacionesDevolucion[reembolso.id] ||
                              !referenciasDevolucion[
                                reembolso.id
                              ]?.trim()
                            }
                            onClick={() =>
                              void registrarDevolucion(reembolso)
                            }
                            style={{
                              marginTop: "14px",
                              background: "#166534",
                              color: "#fff",
                              border: "none",
                              padding: "11px 15px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              opacity:
                                procesando ||
                                !confirmacionesDevolucion[
                                  reembolso.id
                                ] ||
                                !referenciasDevolucion[
                                  reembolso.id
                                ]?.trim()
                                  ? 0.6
                                  : 1,
                              cursor: "pointer",
                            }}
                          >
                            {procesandoDevolucionId === reembolso.id
                              ? "Registrando..."
                              : "Registrar devolución realizada"}
                          </button>
                        </div>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {/* ========================================== */}
        {/* HISTORIAL DE REEMBOLSOS */}
        {/* ========================================== */}

        <section
          style={{
            ...styles.panel,
            marginTop: "24px",
          }}
        >
          <div style={styles.encabezado}>
            <div>
              <h2 style={styles.seccionTitulo}>
                Historial de reembolsos
              </h2>

              <p style={styles.subtitulo}>
                Solicitudes resueltas y registradas en SQL Server.
              </p>
            </div>

            <button
              type="button"
              style={styles.boton}
              disabled={cargandoHistorial}
              onClick={() => void cargarHistorial()}
            >
              {cargandoHistorial
                ? "Cargando..."
                : "Actualizar historial"}
            </button>
          </div>

          {errorHistorial && (
            <div style={styles.error}>
              {errorHistorial}
            </div>
          )}

          {cargandoHistorial ? (
            <p>Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p style={styles.vacio}>
              Todavía no existen reembolsos resueltos.
            </p>
          ) : (
            <div style={styles.tablaContenedor}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.celda}>ID</th>
                    <th style={styles.celda}>Pedido</th>
                    <th style={styles.celda}>Monto</th>
                    <th style={styles.celda}>Estado</th>
                    <th style={styles.celda}>Resolución</th>
                    <th style={styles.celda}>Observación</th>
                    <th style={styles.celda}>Referencia</th>
                  </tr>
                </thead>

                <tbody>
                  {historial.map((reembolso) => (
                    <tr key={reembolso.id}>
                      <td style={styles.celda}>
                        #{reembolso.id}
                      </td>

                      <td style={styles.celda}>
                        #{reembolso.pedidoId}
                      </td>

                      <td style={styles.celda}>
                        <strong>
                          {formatearMonto(reembolso.monto)}
                        </strong>
                      </td>

                      <td style={styles.celda}>
                        <span
                          style={{
                            ...styles.estado,
                            background:
                              reembolso.estado === "No procede"
                                ? "#e9edf1"
                                : "#e7f7ed",
                            color:
                              reembolso.estado === "No procede"
                                ? "#485563"
                                : "#19894a",
                          }}
                        >
                          {reembolso.estado}
                        </span>
                      </td>

                      <td style={styles.celda}>
                        {reembolso.fechaResolucion
                          ? formatearFecha(
                              reembolso.fechaResolucion
                            )
                          : "Sin fecha"}
                      </td>

                      <td style={styles.celda}>
                        {reembolso.observacionAdmin ||
                          "Sin observaciones"}
                      </td>

                      <td style={styles.celda}>
                        {reembolso.referenciaDevolucion ||
                          "No aplica"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles: Record<string, CSSProperties> = {
  contenedor: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7f6",
    fontFamily: "Arial, sans-serif",
  },

  contenido: {
    flex: 1,
    padding: "32px",
    minWidth: 0,
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
  },

  titulo: {
    fontSize: "28px",
    fontWeight: 800,
    margin: 0,
    color: "#202c25",
  },

  subtitulo: {
    color: "#777",
    marginTop: "10px",
  },

  boton: {
    background: "#20a85a",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  resumen: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  tarjeta: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid #e8ece9",
  },

  etiqueta: {
    color: "#777",
    fontSize: "14px",
  },

  valor: {
    fontSize: "27px",
    fontWeight: 800,
    color: "#19894a",
  },

  aviso: {
    padding: "16px",
    borderRadius: "10px",
    background: "#fff8e7",
    color: "#815d16",
    marginBottom: "20px",
    fontSize: "14px",
  },

  error: {
    background: "#ffe8e8",
    color: "#b42318",
    padding: "14px",
    borderRadius: "9px",
    marginBottom: "20px",
  },

  exito: {
    background: "#e7f7ed",
    color: "#19894a",
    padding: "14px",
    borderRadius: "9px",
    marginBottom: "20px",
  },

  panel: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    border: "1px solid #e8ece9",
  },

  seccionTitulo: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "19px",
  },

  tablaContenedor: {
    overflowX: "auto",
  },

  tabla: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  celda: {
    padding: "14px",
    borderBottom: "1px solid #edf0ee",
    textAlign: "left",
    verticalAlign: "top",
  },

  estado: {
    background: "#fff3d6",
    color: "#926100",
    borderRadius: "20px",
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: "12px",
  },

  motivo: {
    marginTop: 0,
    lineHeight: 1.5,
  },

  formulario: {
    marginTop: "12px",
  },

  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: "8px",
  },

  textarea: {
    width: "100%",
    minWidth: "240px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "14px",
  },

  acciones: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
  },

  botonGuardar: {
    background: "#20a85a",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },

  botonNoProcede: {
    background: "#fff4e5",
    color: "#a65b00",
    border: "1px solid #f2c078",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
  },

  vacio: {
    color: "#888",
    padding: "20px 0",
  },
};
