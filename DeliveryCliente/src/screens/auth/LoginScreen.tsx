import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen() {

  const navigation = useNavigation<any>();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Delivery Local</Text>

      <Text style={styles.subtitle}>
        Tu comida favorita{"\n"}
        hasta tu puerta
      </Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="email"
          size={22}
          color="#777"
        />

        <TextInput
          placeholder="Correo electrónico"
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="lock"
          size={22}
          color="#777"
        />

        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("Main")}
>

  <Text style={styles.buttonText}>
    Iniciar sesión
  </Text>
</TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.register}>
          Crear cuenta
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#E53935",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
    color: "#666",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    height: 55,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

  register: {
    textAlign: "center",
    marginTop: 25,
    color: "#E53935",
    fontWeight: "bold",
    fontSize: 16,
  },

});