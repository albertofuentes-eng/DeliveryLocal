import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import { useCart } from "../../context/CartContext";
import { obtenerProductosPorComercio } from "../../services/api";
import { Producto } from "../../models/Producto";

export default function RestaurantScreen() {
  const route = useRoute<any>();

  const {
    comercioId,
    nombre,
  } = route.params;

  const { agregarProducto } = useCart();

  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function cargarProductos() {
      try {
        const data =
          await obtenerProductosPorComercio(
            comercioId
          );

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
      <Text style={styles.title}>
        {nombre}
      </Text>

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
              onPress={() =>
                agregarProducto(item)
              }
            >
              <Text style={styles.buttonText}>
                Agregar
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

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E53935",
    marginBottom: 20,
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
    padding: 10,
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