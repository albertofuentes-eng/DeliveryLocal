import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const {
    usuario,
    cerrarSesion,
  } = useAuth();

  async function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar tu sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await cerrarSesion();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <MaterialIcons
          name="person"
          size={65}
          color="#E53935"
        />
      </View>

      <Text style={styles.title}>
        Mi perfil
      </Text>

      {usuario ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>
              Nombre
            </Text>

            <Text style={styles.value}>
              {usuario.nombre}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Correo
            </Text>

            <Text style={styles.value}>
              {usuario.correo}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Teléfono
            </Text>

            <Text style={styles.value}>
              {usuario.telefono || "No registrado"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>
              Rol
            </Text>

            <Text style={styles.value}>
              {usuario.rol}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() =>
              navigation.navigate("MisPedidos")
            }
          >
            <MaterialIcons
              name="receipt-long"
              size={22}
              color="#E53935"
            />

            <Text style={styles.ordersText}>
              Mis pedidos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={22}
              color="#fff"
            />

            <Text style={styles.logoutText}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.noUser}>
          No hay una sesión activa.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
  },

  avatar: {
    alignSelf: "center",
    marginTop: 35,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FDECEC",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginBottom: 5,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
  },

  ordersButton: {
    borderWidth: 1,
    borderColor: "#E53935",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
  },

  ordersText: {
    color: "#E53935",
    fontSize: 17,
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    borderRadius: 10,
    padding: 15,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  noUser: {
    textAlign: "center",
    color: "#777",
  },
});