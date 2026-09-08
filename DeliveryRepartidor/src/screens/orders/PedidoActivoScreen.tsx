import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  marcarPedidoEnCamino,
  marcarPedidoEntregado,
  marcarPedidoRecogido,
  obtenerMiPedido,
  type DetallePedidoRepartidor,
} from "../../services/api";

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "PedidoActivo"
  >;

export default function PedidoActivoScreen({
  navigation,
}: Props) {
  const { token } = useAuth();

  const [
    pedido,
    setPedido,
  ] =
    useState<DetallePedidoRepartidor | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarPedido();
  }, []);

  async function cargarPedido() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data =
        await obtenerMiPedido(token);

      setPedido(data);

      if (!data) {
        setMensaje(
          "No tienes un pedido activo."
        );
      }
    } catch (error: any) {
      setPedido(null);

      setMensaje(
        error.message ||
          "No se pudo cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

  function confirmarAccion() {
    if (!pedido) {
      return;
    }

    if (
      pedido.estado ===
      "Asignado a repartidor"
    ) {
      Alert.alert(
        "Confirmar recogida",
        "¿Ya recibiste el pedido del comercio?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            onPress:
              ejecutarRecogido,
          },
        ]
      );

      return;
    }

    if (
      pedido.estado === "Recogido"
    ) {
      Alert.alert(
        "Iniciar entrega",
        "¿Deseas comenzar el recorrido hacia el cliente?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Iniciar",
            onPress:
              ejecutarEnCamino,
          },
        ]
      );

      return;
    }

    if (
      pedido.estado === "En camino"
    ) {
      Alert.alert(
        "Confirmar entrega",
        "¿Ya entregaste el pedido al cliente?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            onPress:
              ejecutarEntregado,
          },
        ]
      );
    }
  }

  async function ejecutarRecogido() {
    if (!token || !pedido) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoRecogido(
        token,
        pedido.id
      );

      await cargarPedido();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo marcar como recogido."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function ejecutarEnCamino() {
    if (!token || !pedido) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoEnCamino(
        token,
        pedido.id
      );

      await cargarPedido();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo iniciar la entrega."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function ejecutarEntregado() {
    if (!token || !pedido) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoEntregado(
        token,
        pedido.id
      );

      // Ya no habrá pedido activo.
      // Volvemos al Home.
      navigation.popToTop();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo completar la entrega."
      );
    } finally {
      setProcesando(false);
    }
  }

  function textoBoton() {
    if (!pedido) {
      return "";
    }

    switch (pedido.estado) {
      case "Asignado a repartidor":
        return "CONFIRMAR RECOGIDA";

      case "Recogido":
        return "INICIAR ENTREGA";

      case "En camino":
        return "CONFIRMAR ENTREGA";

      default:
        return "";
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
          Cargando pedido...
        </Text>
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.emptyContainer}
        >
          <Text style={styles.emptyIcon}>
            🛵
          </Text>

          <Text style={styles.emptyTitle}>
            No tienes un pedido activo
          </Text>

          <Text style={styles.emptyText}>
            Cuando aceptes un pedido,
            aparecerá aquí.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              navigation.popToTop()
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              VOLVER AL INICIO
            </Text>
          </Pressable>
        </View>
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
        {/* ESTADO */}
        <View style={styles.topCard}>
          <Text
            style={styles.activeLabel}
          >
            PEDIDO EN CURSO
          </Text>

          <Text
            style={styles.orderNumber}
          >
            Pedido #{pedido.id}
          </Text>

          <View
            style={styles.statusBadge}
          >
            <Text
              style={styles.statusText}
            >
              {pedido.estado}
            </Text>
          </View>
        </View>

        {/* PROGRESO */}
        <View
          style={styles.progressCard}
        >
          <View
            style={styles.stepRow}
          >
            <View
              style={[
                styles.stepCircle,
                styles.stepComplete,
              ]}
            >
              <Text
                style={styles.stepNumber}
              >
                ✓
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.stepTitle}
              >
                Pedido aceptado
              </Text>

              <Text
                style={styles.stepText}
              >
                El pedido está asignado
                a ti.
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View
            style={styles.stepRow}
          >
            <View
              style={[
                styles.stepCircle,

                pedido.estado ===
                  "Recogido" ||
                pedido.estado ===
                  "En camino"
                  ? styles.stepComplete
                  : styles.stepPending,
              ]}
            >
              <Text
                style={styles.stepNumber}
              >
                {pedido.estado ===
                  "Recogido" ||
                pedido.estado ===
                  "En camino"
                  ? "✓"
                  : "2"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.stepTitle}
              >
                Recoger pedido
              </Text>

              <Text
                style={styles.stepText}
              >
                Recibir el pedido en el
                comercio.
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          
          <View
            style={styles.stepRow}
          >
            <View
              style={[
                styles.stepCircle,

                pedido.estado === "En camino"
                  ? styles.stepCurrent
                  : styles.stepPending,
              ]}
            >
              <Text
                style={styles.stepNumber}
              >
                3
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.stepTitle}
              >
                Entregar al cliente
              </Text>

              <Text
                style={styles.stepText}
              >
                Llevar el pedido hasta
                la dirección indicada.
              </Text>
            </View>
          </View>  
          
        </View>

        
        {/* COMERCIO */}
        <Text
          style={styles.sectionTitle}
        >
          Recoger en
        </Text>

        <View style={styles.card}>
          <Text
            style={styles.businessName}
          >
            {pedido.comercio.nombre}
          </Text>

          <Text
            style={styles.infoText}
          >
            📍{" "}
            {pedido.comercio.direccion ||
              "Sin dirección registrada"}
          </Text>

          {pedido.comercio.telefono ? (
            <Text
              style={styles.infoText}
            >
              ☎{" "}
              {pedido.comercio.telefono}
            </Text>
          ) : null}

          {pedido.estado ===
            "Asignado a repartidor" &&
          pedido.comercio.latitud != null &&
          pedido.comercio.longitud != null ? (
            <Pressable
              style={styles.mapButton}
              onPress={() =>
                navigation.navigate(
                  "MapaComercio",
                  {
                    comercioNombre:
                      pedido.comercio.nombre,

                    comercioDireccion:
                      pedido.comercio.direccion,

                    comercioLatitud:
                      pedido.comercio.latitud!,

                    comercioLongitud:
                      pedido.comercio.longitud!,
                  }
                )
              }
            >
              <Text
                style={styles.mapButtonText}
              >
                🗺️ VER RUTA AL COMERCIO
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* CLIENTE */}
        <Text
          style={styles.sectionTitle}
        >
          Entregar a
        </Text>

        <View style={styles.card}>
          <Text
            style={styles.clientName}
          >
            {pedido.cliente.nombre}
          </Text>

          <Text
            style={styles.infoText}
          >
            📍{" "}
            {pedido.direccionEntrega ||
              "Sin dirección registrada"}
          </Text>

          {pedido.telefonoEntrega ? (
            <Text
              style={styles.infoText}
            >
              ☎{" "}
              {pedido.telefonoEntrega}
            </Text>
          ) : null}

          {pedido.referenciaEntrega ? (
            <View
              style={styles.infoBox}
            >
              <Text
                style={styles.infoLabel}
              >
                Referencia
              </Text>

              <Text
                style={styles.infoValue}
              >
                {
                  pedido.referenciaEntrega
                }
              </Text>
            </View>
          ) : null}

          {pedido.indicacionesEntrega ? (
            <View
              style={styles.infoBox}
            >
              <Text
                style={styles.infoLabel}
              >
                Indicaciones
              </Text>

              <Text
                style={styles.infoValue}
              >
                {
                  pedido.indicacionesEntrega
                }
              </Text>
            </View>
          ) : null}

          {(
            pedido.estado === "Recogido" ||
            pedido.estado === "En camino"
          ) &&
          pedido.latitudEntrega != null &&
          pedido.longitudEntrega != null ? (
            <Pressable
              style={styles.mapButton}
              onPress={() =>
                navigation.navigate(
                  "MapaCliente",
                  {
                    clienteNombre:
                      pedido.cliente.nombre,

                    direccionEntrega:
                      pedido.direccionEntrega ||
                      "Sin dirección registrada",

                    latitudEntrega:
                      pedido.latitudEntrega!,

                    longitudEntrega:
                      pedido.longitudEntrega!,
                  }
                )
              }
            >
              <Text
                style={styles.mapButtonText}
              >
                🗺️ VER RUTA AL CLIENTE
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* PRODUCTOS */}
        <Text
          style={styles.sectionTitle}
        >
          Productos
        </Text>

        <View style={styles.card}>
          {pedido.detalles.map(
            (detalle, index) => (
              <View
                key={`${detalle.productoId}-${index}`}
              >
                <View
                  style={
                    styles.productRow
                  }
                >
                  <Text
                    style={
                      styles.productName
                    }
                  >
                    {detalle.cantidad} ×{" "}
                    {detalle.producto}
                  </Text>

                  <Text
                    style={
                      styles.productTotal
                    }
                  >
                    Q
                    {Number(
                      detalle.subtotal
                    ).toFixed(2)}
                  </Text>
                </View>

                {index <
                pedido.detalles.length -
                  1 ? (
                  <View
                    style={styles.divider}
                  />
                ) : null}
              </View>
            )
          )}
        </View>

        {/* TOTAL */}
        <View style={styles.totalCard}>
          <Text
            style={styles.totalLabel}
          >
            Total del pedido
          </Text>

          <Text
            style={styles.totalValue}
          >
            Q
            {Number(
              pedido.total
            ).toFixed(2)}
          </Text>
        </View>

        {mensaje ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={styles.messageText}
            >
              {mensaje}
            </Text>
          </View>
        ) : null}

        {/* BOTÓN ESTADO */}
        {textoBoton() ? (
          <Pressable
            style={[
              styles.actionButton,

              procesando &&
                styles.disabledButton,
            ]}
            disabled={procesando}
            onPress={confirmarAccion}
          >
            {procesando ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.actionButtonText
                }
              >
                {textoBoton()}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f7f6",
    },

    content: {
      padding: 18,
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

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
    },

    emptyIcon: {
      fontSize: 45,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#222",
      marginTop: 12,
    },

    emptyText: {
      color: "#777",
      marginTop: 6,
      textAlign: "center",
    },

    backButton: {
      backgroundColor: "#20a85a",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 10,
      marginTop: 20,
    },

    backButtonText: {
      color: "#fff",
      fontWeight: "800",
    },

    topCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 17,
      elevation: 2,
    },

    activeLabel: {
      color: "#20a85a",
      fontWeight: "800",
      fontSize: 12,
    },

    orderNumber: {
      fontSize: 25,
      fontWeight: "900",
      color: "#222",
      marginTop: 5,
    },

    statusBadge: {
      alignSelf: "flex-start",
      marginTop: 12,
      backgroundColor: "#e8f7ee",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },

    statusText: {
      color: "#19894a",
      fontWeight: "800",
      fontSize: 12,
    },

    progressCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 20,
      elevation: 2,
    },

    stepRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    stepCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    stepComplete: {
      backgroundColor: "#20a85a",
    },

    stepCurrent: {
      backgroundColor: "#20a85a",
      borderWidth: 3,
      borderColor: "#bde8cc",
    },

    stepPending: {
      backgroundColor: "#d5d5d5",
    },

    stepNumber: {
      color: "#fff",
      fontWeight: "900",
    },

    stepTitle: {
      fontWeight: "800",
      color: "#222",
    },

    stepText: {
      color: "#777",
      fontSize: 12,
      marginTop: 2,
    },

    stepLine: {
      width: 2,
      height: 22,
      backgroundColor: "#ddd",
      marginLeft: 16,
      marginVertical: 4,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginBottom: 10,
    },

    card: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 17,
      marginBottom: 20,
      elevation: 2,
    },

    businessName: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
    },

    clientName: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222",
    },

    infoText: {
      color: "#555",
      marginTop: 8,
      lineHeight: 20,
    },

    mapButton: {
      backgroundColor: "#e8f7ee",
      borderWidth: 1,
      borderColor: "#20a85a",
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 14,
      alignItems: "center",
      marginTop: 16,
    },

    mapButtonText: {
      color: "#19894a",
      fontWeight: "900",
      fontSize: 13,
    },

    infoBox: {
      backgroundColor: "#f5f5f5",
      borderRadius: 10,
      padding: 11,
      marginTop: 12,
    },

    infoLabel: {
      fontWeight: "800",
      fontSize: 12,
      color: "#555",
    },

    infoValue: {
      marginTop: 3,
      color: "#555",
    },

    productRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    productName: {
      flex: 1,
      fontWeight: "700",
      color: "#222",
      paddingRight: 12,
    },

    productTotal: {
      fontWeight: "800",
      color: "#222",
    },

    divider: {
      height: 1,
      backgroundColor: "#eee",
      marginVertical: 14,
    },

    totalCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 18,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 18,
      elevation: 2,
    },

    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: "#555",
    },

    totalValue: {
      fontSize: 22,
      fontWeight: "900",
      color: "#20a85a",
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

    actionButton: {
      backgroundColor: "#20a85a",
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },

    actionButtonText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 15,
    },

    disabledButton: {
      opacity: 0.6,
    },
  });