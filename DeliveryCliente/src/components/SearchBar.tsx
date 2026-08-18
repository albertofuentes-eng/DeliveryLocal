import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name="search"
        size={24}
        color="#777"
      />

      <TextInput
        placeholder="Buscar restaurantes o comida..."
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginVertical: 15,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
});