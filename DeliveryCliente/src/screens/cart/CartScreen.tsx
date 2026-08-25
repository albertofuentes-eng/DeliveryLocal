import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useCart } from "../../context/CartContext";

export default function CartScreen() {
  const {
    carrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarProducto,
    vaciarCarrito,
    subtotal,
    envio,
    total,
  } = useCart();

  function realizarPedido() {
    if (carrito.length === 0) {
      Alert.alert(
        "Carrito vacío",
        "Agrega al menos un producto antes de realizar el pedido."
      );
      return;
    }

    Alert.alert(
      "Realizar pedido",
      `Tu pedido tiene un total de Q ${total.toFixed(2)}.\n\n¿Deseas continuar?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Continuar",
          onPress: () => {
            Alert.alert(
              "Pedido preparado",
              "El pedido está listo para enviarse al servidor."
            );
          },
        },
      ]
    );
  }

  function confirmarVaciarCarrito() {
    if (carrito.length === 0) {
      return;
    }

    Alert.alert(
      "Vaciar carrito",
      "¿Estás seguro de que deseas eliminar todos los productos?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Vaciar",
          style: "destructive",
          onPress: vaciarCarrito,
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Mi carrito</Text>

      <FlatList
        data={carrito}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          carrito.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay productos en el carrito.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.productInfo}>
              <Text style={styles.name}>
                {item.imagen} {item.nombre}
              </Text>

              <Text style={styles.price}>
                Q {item.precio.toFixed(2)}
              </Text>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => disminuirCantidad(item.id)}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>

              <Text style={styles.quantity}>
                {item.cantidad}
              </Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => aumentarCantidad(item.id)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarProducto(item.id)}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemTotalContainer}>
              <Text style={styles.itemTotalLabel}>
                Total del producto
              </Text>

              <Text style={styles.itemTotal}>
                Q {(item.precio * item.cantidad).toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      />

      {carrito.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>

            <Text style={styles.summaryValue}>
              Q {subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Envío</Text>

            <Text style={styles.summaryValue}>
              Q {envio.toFixed(2)}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>

            <Text style={styles.totalValue}>
              Q {total.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={confirmarVaciarCarrito}
          >
            <Text style={styles.clearButtonText}>
              🧹 Vaciar carrito
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={realizarPedido}
          >
            <Text style={styles.orderButtonText}>
              REALIZAR PEDIDO
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginTop: 20,
    marginBottom: 20,
    color: "#E53935",
  },

  list: {
    paddingBottom: 20,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  empty: {
    textAlign: "center",
    fontSize: 18,
    color: "#777",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  productInfo: {
    marginBottom: 15,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  price: {
    fontSize: 16,
    color: "#555",
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
  },

  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },

  quantity: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 18,
    minWidth: 25,
    textAlign: "center",
  },

  deleteButton: {
    marginLeft: "auto",
    padding: 8,
  },

  deleteText: {
    fontSize: 22,
  },

  itemTotalContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  itemTotalLabel: {
    color: "#666",
  },

  itemTotal: {
    fontWeight: "bold",
    fontSize: 16,
  },

  footer: {
    borderTopWidth: 1,
    borderColor: "#DDD",
    paddingTop: 15,
    backgroundColor: "#F5F5F5",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 16,
    color: "#555",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
  },

  separator: {
    height: 1,
    backgroundColor: "#DDD",
    marginVertical: 8,
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

  clearButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E53935",
  },

  clearButtonText: {
    textAlign: "center",
    color: "#E53935",
    fontWeight: "bold",
    fontSize: 16,
  },

  orderButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  orderButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});