import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

type Props = {
  emoji: string;
  nombre: string;
};

export default function CategoryCard({
  emoji,
  nombre,
}: Props) {
  return (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>

      <Text style={styles.nombre}>
        {nombre}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 85,
    height: 85,
    backgroundColor: "#FFF5F5",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  emoji: {
    fontSize: 28,
  },

  nombre: {
    marginTop: 8,
    fontWeight: "600",
  },
});