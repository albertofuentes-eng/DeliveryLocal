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
  obtenerMetricas,
  type MetricasRepartidor,
} from "../../services/api";

export default function GananciasScreen() {
  const { token } = useAuth();

  const [
    metricas,
    setMetricas,
  ] =
    useState<MetricasRepartidor | null>(
      null
    );

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
      cargarMetricas();
    }, [token])
  );

  async function cargarMetricas() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data =
        await obtenerMetricas(token);

      setMetricas(data);
    } catch (error: any) {
      setMetricas(null);

      setMensaje(
        error.message ||
          "No se pudieron cargar las ganancias."
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
          Cargando ganancias...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Text
          style={styles.title}
        >
          Mis ganancias
        </Text>

        <Text
          style={styles.subtitle}
        >
          Resumen de tus entregas
          completadas.
        </Text>

        {mensaje ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={styles.messageText}
            >
              {mensaje}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={cargarMetricas}
            >
              <Text
                style={
                  styles.retryButtonText
                }
              >
                REINTENTAR
              </Text>
            </Pressable>
          </View>
        ) : null}

        {metricas ? (
          <>
            <View
              style={styles.mainCard}
            >
              <Text
                style={
                  styles.mainCardLabel
                }
              >
                GANANCIAS TOTALES
              </Text>

              <Text
                style={
                  styles.mainAmount
                }
              >
                Q
                {Number(
                  metricas.gananciasTotales
                ).toFixed(2)}
              </Text>

              <Text
                style={
                  styles.mainCardText
                }
              >
                {
                  metricas.totalEntregas
                }{" "}
                entregas completadas
              </Text>
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Resumen
            </Text>

            <View
              style={styles.card}
            >
              <View
                style={styles.cardHeader}
              >
                <View>
                  <Text
                    style={
                      styles.periodTitle
                    }
                  >
                    Hoy
                  </Text>

                  <Text
                    style={
                      styles.deliveryText
                    }
                  >
                    {
                      metricas.hoy
                        .entregas
                    }{" "}
                    entregas
                  </Text>
                </View>

                <Text
                  style={
                    styles.periodAmount
                  }
                >
                  Q
                  {Number(
                    metricas.hoy
                      .ganancias
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            <View
              style={styles.card}
            >
              <View
                style={styles.cardHeader}
              >
                <View>
                  <Text
                    style={
                      styles.periodTitle
                    }
                  >
                    Esta semana
                  </Text>

                  <Text
                    style={
                      styles.deliveryText
                    }
                  >
                    {
                      metricas.semana
                        .entregas
                    }{" "}
                    entregas
                  </Text>
                </View>

                <Text
                  style={
                    styles.periodAmount
                  }
                >
                  Q
                  {Number(
                    metricas.semana
                      .ganancias
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            <View
              style={styles.card}
            >
              <View
                style={styles.cardHeader}
              >
                <View>
                  <Text
                    style={
                      styles.periodTitle
                    }
                  >
                    Este mes
                  </Text>

                  <Text
                    style={
                      styles.deliveryText
                    }
                  >
                    {
                      metricas.mes
                        .entregas
                    }{" "}
                    entregas
                  </Text>
                </View>

                <Text
                  style={
                    styles.periodAmount
                  }
                >
                  Q
                  {Number(
                    metricas.mes
                      .ganancias
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            <View
              style={styles.infoCard}
            >
              <Text
                style={styles.infoTitle}
              >
                Cómo se calcula
              </Text>

              <Text
                style={styles.infoText}
              >
                Las ganancias se calculan
                usando el valor de envío
                de cada pedido entregado.
              </Text>
            </View>
          </>
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
      paddingBottom: 35,
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

    title: {
      fontSize: 26,
      fontWeight: "900",
      color: "#222",
    },

    subtitle: {
      color: "#777",
      marginTop: 4,
      marginBottom: 18,
    },

    mainCard: {
      backgroundColor: "#20a85a",
      borderRadius: 18,
      padding: 22,
      marginBottom: 22,
      elevation: 3,
    },

    mainCardLabel: {
      color: "#dff6e8",
      fontWeight: "800",
      fontSize: 12,
    },

    mainAmount: {
      color: "#ffffff",
      fontSize: 34,
      fontWeight: "900",
      marginTop: 6,
    },

    mainCardText: {
      color: "#eaf9ef",
      marginTop: 5,
      fontWeight: "600",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#222",
      marginBottom: 10,
    },

    card: {
      backgroundColor: "#ffffff",
      borderRadius: 15,
      padding: 17,
      marginBottom: 12,
      elevation: 2,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    periodTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#222",
    },

    deliveryText: {
      color: "#777",
      marginTop: 4,
    },

    periodAmount: {
      fontSize: 20,
      fontWeight: "900",
      color: "#20a85a",
    },

    infoCard: {
      backgroundColor: "#ffffff",
      borderRadius: 15,
      padding: 17,
      marginTop: 10,
      elevation: 1,
    },

    infoTitle: {
      fontWeight: "800",
      color: "#222",
    },

    infoText: {
      color: "#666",
      marginTop: 5,
      lineHeight: 20,
    },

    messageBox: {
      backgroundColor: "#fff0f0",
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
    },

    messageText: {
      color: "#b3261e",
      textAlign: "center",
    },

    retryButton: {
      alignSelf: "center",
      backgroundColor: "#20a85a",
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 9,
      marginTop: 12,
    },

    retryButtonText: {
      color: "#ffffff",
      fontWeight: "900",
    },
  });