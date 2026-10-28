
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";

import { useCart } from "../../context/CartContext";
import { obtenerProductosPorComercio } from "../../services/api";
import { Producto } from "../../models/Producto";

export default function RestaurantScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const { comercioId, nombre } = route.params;

  const { agregarProducto, totalItems } = useCart();

  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  // Regresar sin recargar la aplicación.
  function regresar() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  useEffect(() => {
    async function cargarProductos() {
      try {
        const data =
          await obtenerProductosPorComercio(comercioId);

        setProductos(data);
      } catch (error) {
        console.log(error);

        setError(
          "No se pudieron cargar los productos."
        );
      } finally {
        setCargando(false);
      }
    }

    cargarProductos();
  }, [comercioId]);

  return (
    <View style={styles.container}>

      {/* Botón para regresar */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={regresar}
      >
        <Text style={styles.backButtonText}>
          ← Volver a restaurantes
        </Text>
      </TouchableOpacity>

      {/* Nombre del restaurante */}
      <Text style={styles.title}>
        {nombre}
      </Text>

      {/* Indicador del carrito */}
      <View style={styles.cartInfo}>
        <Text style={styles.cartInfoText}>
          🛒 Productos en carrito: {totalItems}
        </Text>
      </View>

      {cargando && (
        <ActivityIndicator size="large" />
      )}

      {error !== "" && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      <FlatList
        data={productos}
        keyExtractor={(item) =>
          item.id.toString()
        }
        ListEmptyComponent={
          !cargando && error === "" ? (
            <Text style={styles.empty}>
              Este comercio todavía no tiene productos.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>

            <Text style={styles.nombre}>
              {item.nombre}
            </Text>

            <Text style={styles.descripcion}>
              {item.descripcion}
            </Text>

            <Text style={styles.precio}>
              Q {item.precio.toFixed(2)}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => agregarProducto(item)}
            >
              <Text style={styles.buttonText}>
                Agregar al carrito
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
    backgroundColor: "#fff",
    padding: 20,
  },

  backButton: {
    marginBottom: 18,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },

  backButtonText: {
    color: "#E53935",
    fontSize: 16,
    fontWeight: "bold",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E53935",
    marginBottom: 15,
  },

  cartInfo: {
    backgroundColor: "#FFF3F3",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },

  cartInfoText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#E53935",
  },

  card: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
  },

  nombre: {
    fontSize: 18,
    fontWeight: "bold",
  },

  descripcion: {
    marginTop: 5,
    color: "#666",
  },

  precio: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
  },

  button: {
    backgroundColor: "#E53935",
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  error: {
    color: "#E53935",
    marginBottom: 15,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
  },
});
