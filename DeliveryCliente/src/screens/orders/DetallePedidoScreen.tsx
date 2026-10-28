
import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

import {
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";

import QRCode from "react-native-qrcode-svg";

import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { useAuth } from "../../context/AuthContext";

import {
  obtenerPedidoPorId,
  obtenerTokenEntregaPedido,
  obtenerCalificacionesPedido,
  crearCalificacionPedido,
  subirComprobantePedido,
} from "../../services/api";

type Detalle = {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type Pedido = {
  id: number;
  fecha: string;
  estado: string;

  comercioId: number;
  comercio: string;

  tipoEntrega: "Domicilio" | "Recoger";

  direccionEntrega?: string | null;

  latitudEntrega?: number | null;
  longitudEntrega?: number | null;

  telefonoEntrega?: string | null;
  referenciaEntrega?: string | null;
  indicacionesEntrega?: string | null;

  tipoTiempo: "Ahora" | "Despues";
  fechaProgramada?: string | null;

  subtotal: number;
  envio: number;
  total: number;

  // INFORMACIÓN DEL PAGO
  metodoPago: string;
  estadoPago: string;
  comprobantePagoUrl?: string | null;

  detalles: Detalle[];
};

type TokenEntrega = {
  disponible: boolean;
  tokenEntrega: string | null;
  mensaje: string;
};

export default function DetallePedidoScreen() {
  const route = useRoute<any>();
  const { pedidoId } = route.params;

  const { token } = useAuth();

  // ==========================================
  // COMPROBANTES DE TRANSFERENCIA
  // ==========================================

  const [imagenComprobante, setImagenComprobante] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [subiendoComprobante, setSubiendoComprobante] =
    useState(false);

  const [mensajePago, setMensajePago] =
    useState("");

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [tokenEntrega, setTokenEntrega] =
    useState<TokenEntrega | null>(null);

  const [cargandoToken, setCargandoToken] =
    useState(false);

  const [errorToken, setErrorToken] =
    useState<string | null>(null);

    // ==========================================
    // FASE 5: CALIFICACIONES
    // ==========================================

    const [estrellas, setEstrellas] = useState(5);
    const [comentarioCalificacion, setComentarioCalificacion] =
      useState("");

    const [yaCalificado, setYaCalificado] = useState(false);
    const [consultandoCalificacion, setConsultandoCalificacion] =
      useState(false);
    const [errorCalificacion, setErrorCalificacion] =
      useState<string | null>(null);
    const [enviandoCalificacion, setEnviandoCalificacion] =
      useState(false);

  // ==========================================
  // CARGAR PEDIDO Y CÓDIGO DE ENTREGA
  // ==========================================

  const cargarDatos = useCallback(
    async (mostrarCarga = true) => {
      if (!token) {
        setPedido(null);
        setTokenEntrega(null);
        setErrorToken(null);
        setCargando(false);
        setActualizando(false);
        return;
      }

      try {
        if (mostrarCarga) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        // Limpiar el código anterior antes de consultar
        // nuevamente el estado del pedido.
        setTokenEntrega(null);
        setErrorToken(null);

        const data: Pedido =
          await obtenerPedidoPorId(
            token,
            pedidoId
          );

        setPedido(data);


        // ==========================================
        // FASE 5: CONSULTAR CALIFICACIÓN EXISTENTE
        // ==========================================

        setYaCalificado(false);
        setErrorCalificacion(null);

        if (
          data.estado === "Entregado" &&
          data.tipoEntrega === "Domicilio"
        ) {
          try {
            setConsultandoCalificacion(true);

            const calificaciones =
              await obtenerCalificacionesPedido(
                token,
                pedidoId
              );

            const calificacionCliente = calificaciones.find(
              (item) => item.tipo === "ClienteARepartidor"
            );

            setYaCalificado(Boolean(calificacionCliente));
          } catch (error: any) {
            setErrorCalificacion(
              error?.message ||
                "No se pudo consultar la calificación."
            );
          } finally {
            setConsultandoCalificacion(false);
          }
        } else {
          setConsultandoCalificacion(false);
        }


        // Solo consultar el código cuando corresponda.
        const puedeMostrarCodigo =
          (data.tipoEntrega === "Recoger" &&
            data.estado === "Listo para recoger") ||
          (data.tipoEntrega === "Domicilio" &&
            data.estado === "En camino");

        if (puedeMostrarCodigo) {
          try {
            setCargandoToken(true);

            const respuesta: TokenEntrega =
              await obtenerTokenEntregaPedido(
                token,
                pedidoId
              );

            setTokenEntrega(respuesta);
          } catch (error: any) {
            setErrorToken(
              error?.message ||
                "No se pudo consultar el código de entrega."
            );
          } finally {
            setCargandoToken(false);
          }
        } else {
          setCargandoToken(false);
        }
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo cargar el pedido."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [token, pedidoId]
  );

  // Actualizar al entrar o regresar a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargar = async () => {
        if (activo) {
          await cargarDatos();
        }
      };

      cargar();

      return () => {
        activo = false;
      };
    }, [cargarDatos])
  );


  // ==========================================
  // FASE 5: ENVIAR CALIFICACIÓN DEL CLIENTE
  // ==========================================

  async function enviarCalificacion() {
    if (!token || !pedido) {
      Alert.alert(
        "Sesión inválida",
        "Inicia sesión nuevamente."
      );
      return;
    }

    if (
      pedido.estado !== "Entregado" ||
      pedido.tipoEntrega !== "Domicilio"
    ) {
      Alert.alert(
        "Calificación no disponible",
        "Solo puedes calificar entregas a domicilio finalizadas."
      );
      return;
    }

    if (
      yaCalificado ||
      consultandoCalificacion ||
      errorCalificacion ||
      enviandoCalificacion
    ) {
      return;
    }

    if (
      !Number.isInteger(estrellas) ||
      estrellas < 1 ||
      estrellas > 5
    ) {
      Alert.alert(
        "Calificación inválida",
        "Selecciona entre 1 y 5 estrellas."
      );
      return;
    }

    if (comentarioCalificacion.trim().length > 500) {
      Alert.alert(
        "Comentario demasiado largo",
        "El máximo es de 500 caracteres."
      );
      return;
    }

    try {
      setEnviandoCalificacion(true);

      await crearCalificacionPedido(token, {
        pedidoId: pedido.id,
        puntuacion: estrellas,
        comentario: comentarioCalificacion.trim() || null,
      });

      setYaCalificado(true);
      setErrorCalificacion(null);

      Alert.alert(
        "Calificación registrada",
        "Gracias por calificar a tu repartidor."
      );
    } catch (error: any) {
      Alert.alert(
        "No se pudo calificar",
        error?.message ||
          "Ocurrió un error al registrar la calificación."
      );

      // Consultar nuevamente por si el servidor
      // guardó la calificación antes del error.
      await cargarDatos(false);
    } finally {
      setEnviandoCalificacion(false);
    }
  }


  // ==========================================
  // FORMATO DEL HORARIO
  // ==========================================

  function obtenerTextoProgramacion() {
    if (!pedido) {
      return "";
    }

    if (pedido.tipoTiempo === "Ahora") {
      return "Lo antes posible";
    }

    if (!pedido.fechaProgramada) {
      return "Pedido programado";
    }

    return new Date(
      pedido.fechaProgramada
    ).toLocaleString();
  }

  // ==========================================
  // ESTADO DEL CÓDIGO DE SEGURIDAD
  // ==========================================

  function pedidoFinalizado() {
    if (!pedido) {
      return false;
    }

    return [
      "Entregado",
      "Cancelado",
      "Rechazado",
    ].includes(pedido.estado);
  }

  function codigoDeberiaEstarDisponible() {
    if (!pedido) {
      return false;
    }

    if (pedidoFinalizado()) {
      return false;
    }

    if (pedido.tipoEntrega === "Recoger") {
      return pedido.estado === "Listo para recoger";
    }

    return pedido.estado === "En camino";
  }

  // ==========================================
  // SELECCIONAR COMPROBANTE
  // ==========================================

  async function seleccionarComprobante() {
    try {
      setMensajePago("");

      if (Platform.OS !== "web") {
        const permiso =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permiso.granted) {
          setMensajePago(
            "Debes permitir el acceso a tus imágenes."
          );
          return;
        }
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.85,
        });

      if (resultado.canceled) {
        return;
      }

      const imagen = resultado.assets[0];

      const tipo =
        imagen.mimeType ||
        (Platform.OS === "web"
          ? imagen.file?.type
          : undefined);

      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!tipo || !tiposPermitidos.includes(tipo)) {
        setMensajePago(
          "Selecciona una imagen JPG, PNG o WEBP."
        );
        return;
      }

      if (
        imagen.fileSize &&
        imagen.fileSize > 5 * 1024 * 1024
      ) {
        setMensajePago(
          "La imagen no puede superar los 5 MB."
        );
        return;
      }

      setImagenComprobante(imagen);
      setMensajePago("Imagen seleccionada correctamente.");
    } catch (error: any) {
      setMensajePago(
        error?.message ||
        "No se pudo seleccionar la imagen."
      );
    }
  }

  // ==========================================
  // ENVIAR COMPROBANTE A DELIVERYAPI
  // ==========================================

  async function enviarComprobante() {
    if (!token || !pedido || !imagenComprobante) {
      setMensajePago(
        "Selecciona una imagen antes de enviarla."
      );
      return;
    }

    const pagoPendienteSinComprobante =
    pedido.estadoPago === "Pendiente" &&
    !pedido.comprobantePagoUrl;

    const comprobanteRechazado =
      pedido.estadoPago === "Rechazado";

    if (
      pedido.metodoPago !== "Transferencia" ||
      pedido.estado !== "Pendiente" ||
      (!pagoPendienteSinComprobante && !comprobanteRechazado)
    ) {
      setMensajePago(
        "Este pedido ya no admite comprobantes."
      );
      await cargarDatos(false);
      return;
    }

    try {
      setSubiendoComprobante(true);
      setMensajePago("Enviando comprobante...");

      await subirComprobantePedido(
        token,
        pedido.id,
        imagenComprobante
      );

      setImagenComprobante(null);

      setMensajePago(
        "Comprobante recibido. Pendiente de verificación administrativa."
      );

      await cargarDatos(false);
    } catch (error: any) {
      setMensajePago(
        error?.message ||
        "No se pudo enviar el comprobante."
      );

      // El pedido pudo cambiar de estado mientras
      // se enviaba el archivo.
      await cargarDatos(false);
    } finally {
      setSubiendoComprobante(false);
    }
  }

  // ==========================================
  // PANTALLA DE CARGA
  // ==========================================

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E53935"
        />

        <Text style={styles.loadingText}>
          Cargando detalle...
        </Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.loadingContainer}>
        <Text>
          No se encontró el pedido.
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => cargarDatos()}
        >
          <Text style={styles.refreshButtonText}>
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
    >
      <Text style={styles.title}>
        📦 Pedido #{pedido.id}
      </Text>

      <Text style={styles.commerceName}>
        🍕 {pedido.comercio}
      </Text>

      {/* ================================== */}
      {/* ESTADO DEL PEDIDO */}
      {/* ================================== */}

      <View style={styles.summaryCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            Estado
          </Text>

          <Text style={styles.status}>
            {pedido.estado}
          </Text>
        </View>

        <Text style={styles.date}>
          Realizado:{" "}
          {new Date(
            pedido.fecha
          ).toLocaleString()}
        </Text>

        <TouchableOpacity
          style={[
            styles.refreshButton,
            actualizando && styles.disabledButton,
          ]}
          onPress={() => cargarDatos(false)}
          disabled={actualizando}
        >
          {actualizando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.refreshButtonText}>
              🔄 Actualizar estado
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ================================== */}
      {/* FASE 3: QR Y CÓDIGO DE ENTREGA */}
      {/* ================================== */}

      <Text style={styles.sectionTitle}>
        🔐 Confirmación segura de entrega
      </Text>

      <View style={styles.securityCard}>
        {pedidoFinalizado() ? (
          <View style={styles.securityMessageBox}>
            <Text style={styles.securityMessageTitle}>
              {pedido.estado === "Entregado"
                ? "✅ Pedido entregado"
                : "Código no disponible"}
            </Text>

            <Text style={styles.securityMessage}>
              {pedido.estado === "Entregado"
                ? "La entrega ya fue confirmada. El código de seguridad dejó de estar disponible."
                : "Este pedido está finalizado y no tiene un código de entrega activo."}
            </Text>
          </View>
        ) : !codigoDeberiaEstarDisponible() ? (
          <View style={styles.securityMessageBox}>
            <Text style={styles.securityMessageTitle}>
              ⏳ Código pendiente
            </Text>

            <Text style={styles.securityMessage}>
              {pedido.tipoEntrega === "Recoger"
                ? "El código QR aparecerá cuando el comercio marque el pedido como Listo para recoger."
                : "El código QR aparecerá cuando el pedido esté En camino."}
            </Text>
          </View>
        ) : cargandoToken ? (
          <View style={styles.qrContainer}>
            <ActivityIndicator
              size="large"
              color="#E53935"
            />

            <Text style={styles.securityMessage}>
              Consultando código de seguridad...
            </Text>
          </View>
        ) : errorToken ? (
          <View style={styles.securityMessageBox}>
            <Text style={styles.securityMessageTitle}>
              No se pudo cargar el código
            </Text>

            <Text style={styles.securityMessage}>
              {errorToken}
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => cargarDatos(false)}
              disabled={actualizando}
            >
              <Text style={styles.refreshButtonText}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : tokenEntrega?.disponible &&
          tokenEntrega.tokenEntrega ? (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>
              Tu código de entrega
            </Text>

            <View style={styles.qrBox}>
              <QRCode
                value={tokenEntrega.tokenEntrega}
                size={210}
                backgroundColor="#FFFFFF"
                color="#111111"
              />
            </View>

            <Text style={styles.codeLabel}>
              Código de seguridad
            </Text>

            <Text
              style={styles.deliveryCode}
              selectable
            >
              {tokenEntrega.tokenEntrega}
            </Text>

            <Text style={styles.securityWarning}>
              🔒 Mostrá este código únicamente
              cuando recibás tu pedido.
            </Text>

            <Text style={styles.securityMessage}>
              {pedido.tipoEntrega === "Recoger"
                ? "El comercio ingresará tu código para confirmar que recibiste el pedido."
                : "El repartidor ingresará tu código para confirmar que recibiste el pedido."}
            </Text>

            <Text style={styles.securityFooter}>
              Este código es de un solo uso.
            </Text>
          </View>
        ) : (
          <View style={styles.securityMessageBox}>
            <Text style={styles.securityMessageTitle}>
              Código no disponible
            </Text>

            <Text style={styles.securityMessage}>
              {tokenEntrega?.mensaje ||
                "No se pudo obtener el código de seguridad."}
            </Text>
          </View>
        )}
      </View>

      {/* ==================================*/}
      {/* PAGOS DEL PEDIDO */}
      {/* ==================================*/}

      <Text style={styles.sectionTitle}>
        💳 Información del pago
      </Text>

      <View style={styles.card}>

        <View style={styles.row}>
          <Text style={styles.label}>
            Método de pago
          </Text>

          <Text style={styles.value}>
            {pedido.metodoPago === "Transferencia"
              ? "Transferencia bancaria"
              : pedido.metodoPago === "Efectivo"
              ? "Efectivo"
              : pedido.metodoPago || "No disponible"}
          </Text>
        </View>

        <View style={styles.row}> 
          <Text style={styles.label}>
            Estado del pago
          </Text>

          <Text style={styles.value}>
            {pedido.estadoPago === "ComprobanteSubido"
              ? "En revisión"
              : pedido.estadoPago === "Verificado"
              ? "Verificado"
              : pedido.estadoPago === "Rechazado"
              ? "Rechazado"
              : pedido.estadoPago || "Pendiente"}
          </Text>
        </View>

        {pedido.metodoPago === "Transferencia" && (
          <View style={styles.block}>

            <Text style={styles.label}>
              Comprobante bancario
            </Text>

            <Text style={styles.blockValue}>
              {pedido.estadoPago === "Rechazado"
                ? "Comprobante rechazado"
                : pedido.estadoPago === "Verificado"
                ? "Transferencia verificada"
                : pedido.estadoPago === "ComprobanteSubido"
                ? "Comprobante recibido. En revisión."
                : "Sin comprobante adjunto"}
            </Text>

            {pedido.estado === "Cancelado" ||
            pedido.estado === "Rechazado" ? (
              <Text style={styles.label}>
                Este pedido ya no admite comprobantes.
              </Text>
                ) : (
                  (pedido.estadoPago === "Pendiente" &&
                    !pedido.comprobantePagoUrl) ||
                  pedido.estadoPago === "Rechazado"
                ) ? (
              <View style={{ marginTop: 12 }}>

  <TouchableOpacity
    style={styles.refreshButton}
    onPress={seleccionarComprobante}
    disabled={subiendoComprobante}
  >
    <Text style={styles.refreshButtonText}>
      Seleccionar comprobante
    </Text>
  </TouchableOpacity>

  {imagenComprobante && (
    <>
      <Text
        style={{
          marginTop: 10,
          marginBottom: 10,
          color: "#333",
        }}
      >
        Imagen: {imagenComprobante.fileName || "Comprobante seleccionado"}
      </Text>

      <TouchableOpacity
        style={[
          styles.refreshButton,
          subiendoComprobante && styles.disabledButton,
        ]}
        onPress={enviarComprobante}
        disabled={subiendoComprobante}
      >
        {subiendoComprobante ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.refreshButtonText}>
            ENVIAR COMPROBANTE
          </Text>
        )}
      </TouchableOpacity>
    </>
  )}

</View>
            ) : null}

            {mensajePago !== "" && (
              <Text
                style={{
                  marginTop: 12,
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                {mensajePago}
              </Text>
            )}

          </View>
        )}

      </View>

      {/* ================================== */}
      {/* ENTREGA */}
      {/* ================================== */}

      <Text style={styles.sectionTitle}>
        🚚 Entrega
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>
            Tipo
          </Text>

          <Text style={styles.value}>
            {pedido.tipoEntrega}
          </Text>
        </View>

        {pedido.tipoEntrega === "Domicilio" && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>
                📍 Dirección
              </Text>

              <Text style={styles.blockValue}>
                {pedido.direccionEntrega ||
                  "No disponible"}
              </Text>
            </View>

            {pedido.telefonoEntrega && (
              <View style={styles.row}>
                <Text style={styles.label}>
                  📱 Teléfono
                </Text>

                <Text style={styles.value}>
                  {pedido.telefonoEntrega}
                </Text>
              </View>
            )}

            {pedido.referenciaEntrega && (
              <View style={styles.block}>
                <Text style={styles.label}>
                  🏠 Referencia
                </Text>

                <Text style={styles.blockValue}>
                  {pedido.referenciaEntrega}
                </Text>
              </View>
            )}

            {pedido.indicacionesEntrega && (
              <View style={styles.block}>
                <Text style={styles.label}>
                  📝 Indicaciones
                </Text>

                <Text style={styles.blockValue}>
                  {pedido.indicacionesEntrega}
                </Text>
              </View>
            )}
          </>
        )}

        {pedido.tipoEntrega === "Recoger" && (
          <View style={styles.pickupBox}>
            <Text style={styles.pickupText}>
              🏪 Este pedido se recoge directamente
              en el comercio.
            </Text>
          </View>
        )}
      </View>

      {/* ================================== */}
      {/* HORARIO */}
      {/* ================================== */}

      <Text style={styles.sectionTitle}>
        🕒 Cuándo
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>
            Modalidad
          </Text>

          <Text style={styles.value}>
            {pedido.tipoTiempo === "Ahora"
              ? "Ahora"
              : "Programado"}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.scheduleText}>
            {obtenerTextoProgramacion()}
          </Text>
        </View>
      </View>

      {/* ================================== */}
      {/* PRODUCTOS */}
      {/* ================================== */}

      <Text style={styles.sectionTitle}>
        🍽️ Productos
      </Text>

      {pedido.detalles.map((item, index) => (
        <View
          key={`${item.productoId}-${index}`}
          style={styles.productCard}
        >
          <Text style={styles.productTitle}>
            {item.producto}
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Cantidad
            </Text>

            <Text style={styles.value}>
              {item.cantidad}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Precio unitario
            </Text>

            <Text style={styles.value}>
              Q{" "}
              {Number(
                item.precioUnitario
              ).toFixed(2)}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.productSubtotalLabel}>
              Subtotal
            </Text>

            <Text style={styles.productSubtotal}>
              Q{" "}
              {Number(
                item.subtotal
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      {/* ================================== */}
      {/* TOTALES */}
      {/* ================================== */}

      <View style={styles.totalCard}>
        <View style={styles.row}>
          <Text style={styles.totalSmallLabel}>
            Subtotal
          </Text>

          <Text style={styles.totalSmallValue}>
            Q{" "}
            {Number(
              pedido.subtotal
            ).toFixed(2)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.totalSmallLabel}>
            Envío
          </Text>

          <Text style={styles.totalSmallValue}>
            Q{" "}
            {Number(
              pedido.envio
            ).toFixed(2)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalValue}>
            Q{" "}
            {Number(
              pedido.total
            ).toFixed(2)}
          </Text>
        </View>
      </View>


      {/* ==========================================
          FASE 5: CALIFICAR AL REPARTIDOR
          ========================================== */}

      {pedido.estado === "Entregado" &&
        pedido.tipoEntrega === "Domicilio" && (
          <View style={styles.calificacionCard}>
            <Text style={styles.calificacionTitulo}>
              ⭐ Califica a tu repartidor
            </Text>

            {consultandoCalificacion ? (
              <ActivityIndicator color="#E53935" />
            ) : errorCalificacion ? (
              <>
                <Text style={styles.calificacionError}>
                  {errorCalificacion}
                </Text>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => cargarDatos(false)}
                >
                  <Text style={styles.refreshButtonText}>
                    Reintentar consulta
                  </Text>
                </TouchableOpacity>
              </>
            ) : yaCalificado ? (
              <Text style={styles.calificacionExito}>
                ✅ Ya calificaste esta entrega. ¡Gracias!
              </Text>
            ) : (
              <>
                <Text style={styles.calificacionDescripcion}>
                  ¿Cómo fue tu experiencia con el repartidor?
                </Text>

                <View style={styles.estrellasFila}>
                  {[1, 2, 3, 4, 5].map((numero) => (
                    <TouchableOpacity
                      key={numero}
                      onPress={() => setEstrellas(numero)}
                      disabled={enviandoCalificacion}
                    >
                      <Text style={styles.estrella}>
                        {numero <= estrellas ? "★" : "☆"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.calificacionDescripcion}>
                  {estrellas} de 5 estrellas
                </Text>

                <TextInput
                  style={styles.comentarioInput}
                  placeholder="Escribe un comentario (opcional)"
                  multiline
                  maxLength={500}
                  value={comentarioCalificacion}
                  onChangeText={setComentarioCalificacion}
                  editable={!enviandoCalificacion}
                  textAlignVertical="top"
                />

                <Text style={styles.contadorCaracteres}>
                  {comentarioCalificacion.length}/500
                </Text>

                <TouchableOpacity
                  style={[
                    styles.refreshButton,
                    enviandoCalificacion && styles.disabledButton,
                  ]}
                  onPress={enviarCalificacion}
                  disabled={enviandoCalificacion}
                >
                  {enviandoCalificacion ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.refreshButtonText}>
                      Enviar calificación
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 45,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 20,
  },

  commerceName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 15,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  statusLabel: {
    color: "#777",
  },

  status: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E53935",
    maxWidth: "65%",
    textAlign: "right",
  },

  date: {
    color: "#777",
    fontSize: 14,
  },

  refreshButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 22,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  block: {
    marginBottom: 14,
  },

  label: {
    color: "#777",
    fontSize: 14,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  blockValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },

  pickupBox: {
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
  },

  pickupText: {
    color: "#555",
    lineHeight: 20,
  },

  scheduleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 5,
  },

  productSubtotalLabel: {
    fontWeight: "bold",
    fontSize: 15,
  },

  productSubtotal: {
    fontWeight: "bold",
    fontSize: 16,
  },

  totalCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 12,
    elevation: 3,
    marginTop: 12,
  },

  totalSmallLabel: {
    color: "#555",
    fontSize: 16,
  },

  totalSmallValue: {
    fontWeight: "600",
    fontSize: 16,
  },

  totalLabel: {
    fontSize: 21,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#E53935",
  },

  securityCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    elevation: 2,
  },

  securityMessageBox: {
    alignItems: "center",
    paddingVertical: 12,
  },

  securityMessageTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },

  securityMessage: {
    color: "#666",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  qrContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },

  qrTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },

  qrBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 18,
  },

  codeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },

  deliveryCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E53935",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 15,
  },

  securityWarning: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B71C1C",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 10,
  },

  securityFooter: {
    marginTop: 15,
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
  },

  calificacionCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginTop: 22,
    elevation: 2,
  },

  calificacionTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },

  calificacionDescripcion: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },

  estrellasFila: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },

  estrella: {
    fontSize: 38,
    color: "#E8A317",
  },

  comentarioInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  contadorCaracteres: {
    fontSize: 12,
    color: "#777777",
    textAlign: "right",
    marginTop: 6,
  },

  calificacionExito: {
    color: "#198754",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
  },

  calificacionError: {
    color: "#B71C1C",
    fontSize: 14,
    marginVertical: 10,
  },

});
