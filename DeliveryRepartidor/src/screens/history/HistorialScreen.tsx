import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  obtenerHistorial,
  obtenerCalificacionesPedido,
  crearCalificacionPedido,
  type PedidoHistorial,
} from "../../services/api";

export default function HistorialScreen() {
  const {
    token,
  } = useAuth();

  const [
    pedidos,
    setPedidos,
  ] =
    useState<PedidoHistorial[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    mensaje,
    setMensaje,
  ] = useState("");


  // ==========================================
  // FASE 5: CALIFICACIONES
  // ==========================================

  const [pedidoCalificando, setPedidoCalificando] =
    useState<number | null>(null);

  const [estrellas, setEstrellas] = useState(5);

  const [comentario, setComentario] = useState("");

  const [calificados, setCalificados] = useState<number[]>([]);

  const [consultandoId, setConsultandoId] =
    useState<number | null>(null);

  const [enviando, setEnviando] = useState(false);


  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [token])
  );

  async function cargarHistorial() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data =
        await obtenerHistorial(
          token
        );

      setPedidos(data);
    } catch (error: any) {
      setPedidos([]);

      setMensaje(
        error.message ||
          "No se pudo cargar el historial."
      );
    } finally {
      setCargando(false);
    }
  }


  // ==========================================
  // FASE 5: ABRIR FORMULARIO
  // ==========================================

  async function abrirCalificacion(pedidoId: number) {
    if (!token || consultandoId !== null) {
      return;
    }

    try {
      setConsultandoId(pedidoId);

      const calificaciones =
        await obtenerCalificacionesPedido(token, pedidoId);

      const yaExiste = calificaciones.some(
        (c) => c.tipo === "RepartidorACliente"
      );

      if (yaExiste) {
        setCalificados((anteriores) =>
          anteriores.includes(pedidoId)
            ? anteriores
            : [...anteriores, pedidoId]
        );

        Alert.alert(
          "Pedido calificado",
          "Ya calificaste al cliente de esta entrega."
        );

        return;
      }

      setPedidoCalificando(pedidoId);
      setEstrellas(5);
      setComentario("");
    } catch (error: any) {
      Alert.alert(
        "No se pudo consultar",
        error?.message ||
          "No fue posible verificar la calificación."
      );
    } finally {
      setConsultandoId(null);
    }
  }

  // ==========================================
  // FASE 5: GUARDAR CALIFICACIÓN
  // ==========================================

  async function enviarCalificacion(pedidoId: number) {
    if (
      !token ||
      enviando ||
      pedidoCalificando !== pedidoId
    ) {
      return;
    }

    if (estrellas < 1 || estrellas > 5) {
      Alert.alert(
        "Calificación inválida",
        "Selecciona entre 1 y 5 estrellas."
      );
      return;
    }

    if (comentario.trim().length > 500) {
      Alert.alert(
        "Comentario demasiado largo",
        "El comentario no puede superar 500 caracteres."
      );
      return;
    }

    try {
      setEnviando(true);

      await crearCalificacionPedido(token, {
        pedidoId,
        puntuacion: estrellas,
        comentario: comentario.trim() || null,
      });

      setCalificados((anteriores) =>
        anteriores.includes(pedidoId)
          ? anteriores
          : [...anteriores, pedidoId]
      );

      setPedidoCalificando(null);
      setComentario("");

      Alert.alert(
        "Calificación registrada",
        "Gracias por calificar a tu cliente."
      );
    } catch (error: any) {
      Alert.alert(
        "No se pudo registrar",
        error?.message ||
          "Ocurrió un error al guardar la calificación."
      );

      // Si el servidor guardó la calificación antes
      // de perderse la conexión, la próxima consulta
      // detectará el registro existente.
      setPedidoCalificando(null);
    } finally {
      setEnviando(false);
    }
  }


  if (cargando) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#20a85a"
        />

        <Text
          style={styles.loadingText}
        >
          Cargando historial...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={styles.header}
        >
          <View>
            <Text
              style={styles.title}
            >
              Historial
            </Text>

            <Text
              style={styles.subtitle}
            >
              Tus entregas completadas.
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={cargarHistorial}
          >
            <Text
              style={
                styles.refreshText
              }
            >
              ACTUALIZAR
            </Text>
          </Pressable>
        </View>

        {mensaje ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={
                styles.messageText
              }
            >
              {mensaje}
            </Text>
          </View>
        ) : null}

        {pedidos.length === 0 ? (
          <View
            style={styles.emptyCard}
          >
            <Text
              style={styles.emptyIcon}
            >
              📦
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              Aún no tienes entregas
            </Text>

            <Text
              style={styles.emptyText}
            >
              Los pedidos entregados
              aparecerán aquí.
            </Text>
          </View>
        ) : (
          pedidos.map(
            (pedido) => (
              <View
                key={pedido.id}
                style={
                  styles.orderCard
                }
              >
                <View
                  style={
                    styles.orderHeader
                  }
                >
                  <Text
                    style={
                      styles.orderNumber
                    }
                  >
                    Pedido #{pedido.id}
                  </Text>

                  <View
                    style={
                      styles.statusBadge
                    }
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      Entregado
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.businessName
                  }
                >
                  {
                    pedido.comercio
                      .nombre
                  }
                </Text>

                <Text
                  style={
                    styles.address
                  }
                >
                  📍{" "}
                  {pedido.direccionEntrega ||
                    "Sin dirección"}
                </Text>

                <View
                  style={
                    styles.divider
                  }
                />

                <View
                  style={
                    styles.bottomRow
                  }
                >
                  <Text
                    style={
                      styles.dateText
                    }
                  >
                    {formatearFecha(
                      pedido.fecha
                    )}
                  </Text>

                  <Text
                    style={
                      styles.totalText
                    }
                  >
                    Q
                    {Number(
                      pedido.total
                    ).toFixed(2)}
                  </Text>
                </View>
                {/* ==========================================
                    FASE 5: CALIFICAR CLIENTE
                    ========================================== */}

                <View style={styles.calificacionSection}>
                  {calificados.includes(pedido.id) ? (
                    <Text style={styles.calificadoText}>
                      ✓ Ya calificaste a este cliente
                    </Text>
                  ) : pedidoCalificando === pedido.id ? (
                    <>
                      <Text style={styles.calificacionTitulo}>
                        ¿Cómo fue tu experiencia con el cliente?
                      </Text>

                      <View style={styles.estrellasRow}>
                        {[1, 2, 3, 4, 5].map((numero) => (
                          <Pressable
                            key={numero}
                            onPress={() => setEstrellas(numero)}
                            disabled={enviando}
                          >
                            <Text style={styles.estrella}>
                              {numero <= estrellas ? "★" : "☆"}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={styles.estrellasTexto}>
                        {estrellas} de 5 estrellas
                      </Text>

                      <TextInput
                        style={styles.comentarioInput}
                        placeholder="Comentario opcional"
                        multiline
                        maxLength={500}
                        value={comentario}
                        onChangeText={setComentario}
                        editable={!enviando}
                        textAlignVertical="top"
                      />

                      <Text style={styles.contadorTexto}>
                        {comentario.length}/500
                      </Text>

                      <Pressable
                        style={styles.enviarButton}
                        disabled={enviando}
                        onPress={() => enviarCalificacion(pedido.id)}
                      >
                        {enviando ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.enviarButtonText}>
                            Enviar calificación
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.cancelarButton}
                        disabled={enviando}
                        onPress={() => setPedidoCalificando(null)}
                      >
                        <Text style={styles.cancelarText}>
                          Cancelar
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={styles.calificarButton}
                      disabled={consultandoId !== null}
                      onPress={() => abrirCalificacion(pedido.id)}
                    >
                      <Text style={styles.calificarButtonText}>
                        {consultandoId === pedido.id
                          ? "Consultando..."
                          : "★ Calificar cliente"}
                      </Text>
                    </Pressable>
                  )}
                </View>

              </View>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatearFecha(
  fecha: string
) {
  const date =
    new Date(fecha);

  return date.toLocaleString(
    "es-GT",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f7f6",
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f7f6",
    },

    loadingText: {
      marginTop: 12,
      color: "#777",
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    title: {
      fontSize: 28,
      fontWeight: "900",
      color: "#222",
    },

    subtitle: {
      color: "#777",
      marginTop: 3,
    },

    refreshButton: {
      borderWidth: 1,
      borderColor: "#20a85a",
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    refreshText: {
      color: "#20a85a",
      fontWeight: "800",
      fontSize: 11,
    },

    messageBox: {
      backgroundColor: "#fff0f0",
      borderRadius: 10,
      padding: 12,
      marginBottom: 15,
    },

    messageText: {
      color: "#b3261e",
      textAlign: "center",
    },

    emptyCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 30,
      alignItems: "center",
      elevation: 2,
    },

    emptyIcon: {
      fontSize: 42,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginTop: 10,
    },

    emptyText: {
      color: "#777",
      textAlign: "center",
      marginTop: 6,
    },

    orderCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 15,
      elevation: 2,
    },

    orderHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    orderNumber: {
      fontSize: 18,
      fontWeight: "900",
      color: "#222",
    },

    statusBadge: {
      backgroundColor: "#e8f7ee",
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    statusText: {
      color: "#19894a",
      fontWeight: "800",
      fontSize: 11,
    },

    businessName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#222",
      marginTop: 14,
    },

    address: {
      color: "#666",
      marginTop: 6,
      lineHeight: 19,
    },

    divider: {
      height: 1,
      backgroundColor: "#eee",
      marginVertical: 14,
    },

    bottomRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    dateText: {
      color: "#777",
      fontSize: 12,
    },

    totalText: {
      color: "#20a85a",
      fontWeight: "900",
      fontSize: 18,
    },

    // ==========================================
    // FASE 5: ESTILOS DE CALIFICACIONES
    // ==========================================

    calificacionSection: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: "#EEEEEE",
    },

    calificacionTitulo: {
      fontSize: 15,
      fontWeight: "800",
      color: "#222222",
      marginBottom: 12,
    },

    calificarButton: {
      backgroundColor: "#E8F7EE",
      borderRadius: 10,
      padding: 13,
      alignItems: "center",
    },

    calificarButtonText: {
      color: "#19894A",
      fontWeight: "800",
    },

    calificadoText: {
      color: "#19894A",
      fontWeight: "700",
      textAlign: "center",
      paddingVertical: 10,
    },

    estrellasRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginVertical: 10,
    },

    estrella: {
      fontSize: 38,
      color: "#E8A317",
    },

    estrellasTexto: {
      textAlign: "center",
      color: "#666666",
      marginBottom: 14,
    },

    comentarioInput: {
      minHeight: 95,
      borderWidth: 1,
      borderColor: "#DDDDDD",
      borderRadius: 10,
      padding: 12,
      backgroundColor: "#FAFAFA",
      fontSize: 14,
    },

    contadorTexto: {
      textAlign: "right",
      color: "#777777",
      fontSize: 12,
      marginTop: 5,
    },

    enviarButton: {
      backgroundColor: "#20A85A",
      borderRadius: 10,
      padding: 13,
      alignItems: "center",
      marginTop: 12,
    },

    enviarButtonText: {
      color: "#FFFFFF",
      fontWeight: "800",
    },

    cancelarButton: {
      padding: 12,
      alignItems: "center",
    },

    cancelarText: {
      color: "#777777",
      fontWeight: "600",
    },

  });