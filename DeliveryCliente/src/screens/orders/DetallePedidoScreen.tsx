import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";

import {
  useRoute,
} from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { obtenerPedidoPorId } from "../../services/api";

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

  detalles: Detalle[];
};

export default function DetallePedidoScreen() {
  const route = useRoute<any>();

  const { pedidoId } = route.params;

  const { token } = useAuth();

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    cargarPedido();
  }, [pedidoId]);

  async function cargarPedido() {
    if (!token) {
      setCargando(false);

      return;
    }

    try {
      setCargando(true);

      const data =
        await obtenerPedidoPorId(
          token,
          pedidoId
        );

      setPedido(data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          "No se pudo cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

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
      </View>

      {/* ========================= */}
      {/* ENTREGA */}
      {/* ========================= */}

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

        {pedido.tipoEntrega ===
          "Domicilio" && (
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
                  {
                    pedido.telefonoEntrega
                  }
                </Text>
              </View>
            )}

            {pedido.referenciaEntrega && (
              <View style={styles.block}>
                <Text style={styles.label}>
                  🏠 Referencia
                </Text>

                <Text style={styles.blockValue}>
                  {
                    pedido.referenciaEntrega
                  }
                </Text>
              </View>
            )}

            {pedido.indicacionesEntrega && (
              <View style={styles.block}>
                <Text style={styles.label}>
                  📝 Indicaciones
                </Text>

                <Text style={styles.blockValue}>
                  {
                    pedido.indicacionesEntrega
                  }
                </Text>
              </View>
            )}
          </>
        )}

        {pedido.tipoEntrega ===
          "Recoger" && (
          <View style={styles.pickupBox}>
            <Text style={styles.pickupText}>
              🏪 Este pedido se recoge directamente
              en el comercio.
            </Text>
          </View>
        )}
      </View>

      {/* ========================= */}
      {/* HORARIO */}
      {/* ========================= */}

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

      {/* ========================= */}
      {/* PRODUCTOS */}
      {/* ========================= */}

      <Text style={styles.sectionTitle}>
        🍽️ Productos
      </Text>

      {pedido.detalles.map((item) => (
        <View
          key={item.productoId}
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

      {/* ========================= */}
      {/* TOTALES */}
      {/* ========================= */}

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
  },

  date: {
    color: "#777",
    fontSize: 14,
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
});