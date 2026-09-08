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
  aceptarPedido,
  obtenerDetallePedido,
  type DetallePedidoRepartidor,
} from "../../services/api";

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "DetallePedido"
  >;

export default function DetallePedidoScreen({
  route,
  navigation,
}: Props) {
  const { pedidoId } =
    route.params;

  const {
    token,
  } = useAuth();

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
    aceptando,
    setAceptando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarPedido();
  }, [pedidoId]);

  async function cargarPedido() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data =
        await obtenerDetallePedido(
          token,
          pedidoId
        );

      setPedido(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

  async function confirmarAceptar() {
    if (!pedido || !token) {
      return;
    }

    Alert.alert(
      "Aceptar pedido",
      `¿Deseas tomar el pedido #${pedido.id}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },

        {
          text: "Aceptar",
          onPress:
            ejecutarAceptarPedido,
        },
      ]
    );
  }

    async function ejecutarAceptarPedido() {
    if (!pedido || !token) {
      return;
    }

    try {
      setAceptando(true);
      setMensaje("");

      await aceptarPedido(
        token,
        pedido.id
      );

      navigation.popToTop();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo aceptar el pedido."
      );
    } finally {
      setAceptando(false);
    }
  }

  if (cargando) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
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
          style={styles.errorContainer}
        >
          <Text
            style={styles.errorTitle}
          >
            No pudimos mostrar el
            pedido
          </Text>

          <Text
            style={styles.errorText}
          >
            {mensaje ||
              "El pedido ya no está disponible."}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={cargarPedido}
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              INTENTAR DE NUEVO
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
        {/* PEDIDO */}
        <View
          style={styles.orderHeader}
        >
          <View>
            <Text
              style={styles.orderLabel}
            >
              Pedido
            </Text>

            <Text
              style={styles.orderNumber}
            >
              #{pedido.id}
            </Text>
          </View>

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

        {/* RECOGER EN */}
        <Text
          style={styles.sectionTitle}
        >
          Recoger en
        </Text>

        <View style={styles.card}>
          <Text
            style={
              styles.businessName
            }
          >
            {pedido.comercio.nombre}
          </Text>

          <Text
            style={styles.infoText}
          >
            📍{" "}
            {pedido.comercio
              .direccion ||
              "Sin dirección registrada"}
          </Text>

          {pedido.comercio
            .telefono ? (
            <Text
              style={styles.infoText}
            >
              ☎{" "}
              {
                pedido.comercio
                  .telefono
              }
            </Text>
          ) : null}
        </View>

        {/* ENTREGAR A */}
        <Text
          style={styles.sectionTitle}
        >
          Entregar a
        </Text>

        <View style={styles.card}>
          <Text
            style={
              styles.clientName
            }
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
              style={
                styles.extraInfoBox
              }
            >
              <Text
                style={
                  styles.extraLabel
                }
              >
                Referencia
              </Text>

              <Text
                style={
                  styles.extraText
                }
              >
                {
                  pedido.referenciaEntrega
                }
              </Text>
            </View>
          ) : null}

          {pedido.indicacionesEntrega ? (
            <View
              style={
                styles.extraInfoBox
              }
            >
              <Text
                style={
                  styles.extraLabel
                }
              >
                Indicaciones
              </Text>

              <Text
                style={
                  styles.extraText
                }
              >
                {
                  pedido.indicacionesEntrega
                }
              </Text>
            </View>
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
                  <View
                    style={
                      styles.productInfo
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
                        styles.productPrice
                      }
                    >
                      Q
                      {Number(
                        detalle.precioUnitario
                      ).toFixed(2)}
                      {" c/u"}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.productSubtotal
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
                    style={
                      styles.divider
                    }
                  />
                ) : null}
              </View>
            )
          )}
        </View>

        {/* RESUMEN */}
        <Text
          style={styles.sectionTitle}
        >
          Resumen
        </Text>

        <View style={styles.card}>
          <View
            style={styles.priceRow}
          >
            <Text
              style={
                styles.priceLabel
              }
            >
              Subtotal
            </Text>

            <Text
              style={
                styles.priceValue
              }
            >
              Q
              {Number(
                pedido.subtotal
              ).toFixed(2)}
            </Text>
          </View>

          <View
            style={styles.priceRow}
          >
            <Text
              style={
                styles.priceLabel
              }
            >
              Envío
            </Text>

            <Text
              style={
                styles.priceValue
              }
            >
              Q
              {Number(
                pedido.envio
              ).toFixed(2)}
            </Text>
          </View>

          <View
            style={styles.totalDivider}
          />

          <View
            style={styles.priceRow}
          >
            <Text
              style={
                styles.totalLabel
              }
            >
              Total
            </Text>

            <Text
              style={
                styles.totalValue
              }
            >
              Q
              {Number(
                pedido.total
              ).toFixed(2)}
            </Text>
          </View>
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

        {/* ACEPTAR */}
        {pedido.estado ===
        "Listo para recoger" ? (
          <Pressable
            style={[
              styles.acceptButton,

              aceptando &&
                styles.buttonDisabled,
            ]}
            disabled={aceptando}
            onPress={
              confirmarAceptar
            }
          >
            {aceptando ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.acceptButtonText
                }
              >
                ACEPTAR PEDIDO
              </Text>
            )}
          </Pressable>
        ) : (
          <View
            style={
              styles.assignedBox
            }
          >
            <Text
              style={
                styles.assignedText
              }
            >
              Este pedido ya está
              asignado a ti.
            </Text>
          </View>
        )}
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
      color: "#666",
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight: "800",
      textAlign: "center",
      color: "#222",
    },

    errorText: {
      marginTop: 8,
      textAlign: "center",
      color: "#777",
      lineHeight: 20,
    },

    retryButton: {
      marginTop: 20,
      backgroundColor: "#20a85a",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 10,
    },

    retryButtonText: {
      color: "#fff",
      fontWeight: "800",
    },

    orderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 24,
    },

    orderLabel: {
      color: "#777",
      fontSize: 13,
    },

    orderNumber: {
      fontSize: 28,
      fontWeight: "900",
      color: "#222",
    },

    statusBadge: {
      backgroundColor: "#fff1d2",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },

    statusText: {
      color: "#9b6900",
      fontWeight: "700",
      fontSize: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginBottom: 10,
      marginTop: 7,
    },

    card: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 17,
      marginBottom: 19,
      elevation: 2,
    },

    businessName: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginBottom: 8,
    },

    clientName: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222",
      marginBottom: 8,
    },

    infoText: {
      color: "#555",
      lineHeight: 21,
      marginTop: 4,
    },

    extraInfoBox: {
      marginTop: 13,
      backgroundColor: "#f6f7f6",
      borderRadius: 10,
      padding: 12,
    },

    extraLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: "#555",
      marginBottom: 3,
    },

    extraText: {
      color: "#555",
      lineHeight: 19,
    },

    productRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    productInfo: {
      flex: 1,
      paddingRight: 12,
    },

    productName: {
      fontWeight: "700",
      color: "#222",
      fontSize: 15,
    },

    productPrice: {
      color: "#777",
      marginTop: 4,
      fontSize: 12,
    },

    productSubtotal: {
      fontWeight: "800",
      color: "#222",
    },

    divider: {
      height: 1,
      backgroundColor: "#eeeeee",
      marginVertical: 14,
    },

    priceRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginVertical: 6,
    },

    priceLabel: {
      color: "#666",
    },

    priceValue: {
      color: "#333",
      fontWeight: "600",
    },

    totalDivider: {
      height: 1,
      backgroundColor: "#e5e5e5",
      marginVertical: 10,
    },

    totalLabel: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
    },

    totalValue: {
      fontSize: 20,
      fontWeight: "900",
      color: "#20a85a",
    },

    messageBox: {
      backgroundColor: "#fff0f0",
      padding: 13,
      borderRadius: 10,
      marginBottom: 15,
    },

    messageText: {
      color: "#b3261e",
      textAlign: "center",
    },

    acceptButton: {
      backgroundColor: "#20a85a",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 3,
    },

    acceptButtonText: {
      color: "#ffffff",
      fontWeight: "900",
      fontSize: 15,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    assignedBox: {
      backgroundColor: "#e8f7ee",
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
    },

    assignedText: {
      color: "#19894a",
      fontWeight: "700",
    },
  });