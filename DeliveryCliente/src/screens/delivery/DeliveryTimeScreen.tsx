import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

export default function DeliveryTimeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    tipoEntrega,
    direccion,
    latitude,
    longitude,
  } = route.params || {};

  const [tipoTiempo, setTipoTiempo] =
    useState<"Ahora" | "Despues">("Ahora");

  const [fecha, setFecha] =
    useState("");

  const [hora, setHora] =
    useState("");

  function continuar() {
    if (tipoTiempo === "Despues") {
      if (!fecha.trim() || !hora.trim()) {
        Alert.alert(
          "Datos incompletos",
          "Ingresa la fecha y hora en la que deseas recibir tu pedido."
        );

        return;
      }
    }

    navigation.navigate(
      "DeliveryDetails",
      {
        tipoEntrega,
        direccion,
        latitude,
        longitude,

        tipoTiempo,

        fechaProgramada:
          tipoTiempo === "Despues"
            ? fecha.trim()
            : null,

        horaProgramada:
          tipoTiempo === "Despues"
            ? hora.trim()
            : null,
      }
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        🕒 ¿Cuándo deseas tu pedido?
      </Text>

      <Text style={styles.subtitle}>
        Selecciona cuándo deseas recibirlo.
      </Text>

      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            tipoTiempo === "Ahora" &&
              styles.optionActive,
          ]}
          onPress={() =>
            setTipoTiempo("Ahora")
          }
        >
          <Text
            style={[
              styles.optionText,
              tipoTiempo === "Ahora" &&
                styles.optionTextActive,
            ]}
          >
            AHORA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            tipoTiempo === "Despues" &&
              styles.optionActive,
          ]}
          onPress={() =>
            setTipoTiempo("Despues")
          }
        >
          <Text
            style={[
              styles.optionText,
              tipoTiempo === "Despues" &&
                styles.optionTextActive,
            ]}
          >
            DESPUÉS
          </Text>
        </TouchableOpacity>
      </View>

      {tipoTiempo === "Ahora" ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Lo antes posible
          </Text>

          <Text style={styles.infoText}>
            El comercio comenzará a procesar tu pedido
            inmediatamente.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Programar pedido
            </Text>

            <Text style={styles.infoText}>
              Selecciona la fecha y hora en la que deseas
              recibir tu pedido.
            </Text>
          </View>

          <Text style={styles.label}>
            Fecha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. 03/09/2026"
            value={fecha}
            onChangeText={setFecha}
          />

          <Text style={styles.label}>
            Hora
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. 18:30"
            value={hora}
            onChangeText={setHora}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={continuar}
      >
        <Text style={styles.continueButtonText}>
          CONTINUAR
        </Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 35,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 30,
  },

  selectorContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E53935",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  optionButton: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },

  optionActive: {
    backgroundColor: "#E53935",
  },

  optionText: {
    color: "#E53935",
    fontWeight: "bold",
    fontSize: 16,
  },

  optionTextActive: {
    color: "#FFFFFF",
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 25,
    padding: 18,
    borderRadius: 12,
    elevation: 2,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 21,
  },

  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginTop: 20,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  continueButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
  },

  continueButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
  },
});