import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  });