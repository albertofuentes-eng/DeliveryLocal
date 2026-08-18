import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  nombre: string;
  estrellas: string;
  tiempo: string;
};

export default function RestaurantCard({
  nombre,
  estrellas,
  tiempo,
}: Props) {
  return (
    <View style={styles.card}>

      <Text style={styles.nombre}>
        🍽 {nombre}
      </Text>

      <Text style={styles.info}>
        ⭐ {estrellas} • 🛵 {tiempo}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },

  nombre: {
    fontSize: 18,
    fontWeight: "bold",
  },

  info: {
    marginTop: 8,
    color: "#666",
  },
});