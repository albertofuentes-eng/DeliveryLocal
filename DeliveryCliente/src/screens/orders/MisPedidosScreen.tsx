import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { obtenerMisPedidos } from "../../services/api";

type Pedido = {
  id: number;
  fecha: string;
  estado: string;
  subtotal: number;
  envio: number;
  total: number;
  comercioId: number;
};

export default function MisPedidosScreen() {
  const navigation = useNavigation<any>();

  const { token } = useAuth();

  const [pedidos, setPedidos] =
    useState<Pedido[]>([]);

  const [cargando, setCargando] =
    useState(true);

  async function cargarPedidos() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);

      const data =
        await obtenerMisPedidos(token);

      setPedidos(data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          "No se pudieron cargar tus pedidos."
      );
    } finally {
      setCargando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [token])
  );

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleString();
  }

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E53935"
        />

        <Text style={styles.loadingText}>
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        📦 Mis pedidos
      </Text>

      <FlatList
        data={pedidos}
        keyExtractor={(item) =>
          item.id.toString()
        }
        contentContainerStyle={
          pedidos.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Todavía no has realizado pedidos.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.orderNumber}>
                Pedido #{item.id}
              </Text>

              <Text
                style={[
                  styles.status,
                  item.estado === "Pendiente" &&
                    styles.pendingStatus,
                ]}
              >
                {item.estado}
              </Text>
            </View>

            <Text style={styles.date}>
              {formatearFecha(item.fecha)}
            </Text>

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>
                Subtotal
              </Text>

              <Text style={styles.value}>
                Q {Number(item.subtotal).toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>
                Envío
              </Text>

              <Text style={styles.value}>
                Q {Number(item.envio).toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalValue}>
                Q {Number(item.total).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.detailButton}
              onPress={() =>
                navigation.navigate(
                  "DetallePedido",
                  {
                    pedidoId: item.id,
                  }
                )
              }
            >
              <Text
                style={styles.detailButtonText}
              >
                VER DETALLE
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 20,
    marginBottom: 20,
  },

  list: {
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 18,
    color: "#777",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderNumber: {
    fontSize: 19,
    fontWeight: "bold",
  },

  status: {
    fontWeight: "bold",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  pendingStatus: {
    backgroundColor: "#FFF3CD",
    color: "#856404",
  },

  date: {
    marginTop: 7,
    color: "#777",
    fontSize: 14,
  },

  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    color: "#666",
    fontSize: 16,
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E53935",
  },

  detailButton: {
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 9,
    marginTop: 12,
  },

  detailButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
  },
});