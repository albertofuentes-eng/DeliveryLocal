import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";

export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { usuario } = useAuth();

  const {
    tipoEntrega,
    direccion,
    latitude,
    longitude,
    tipoTiempo,
    fechaProgramada,
    horaProgramada,
  } = route.params || {};

  const [telefono, setTelefono] =
    useState(usuario?.telefono || "");

  const [referencia, setReferencia] =
    useState("");

  const [indicaciones, setIndicaciones] =
    useState("");

  function continuar() {
    if (
      tipoEntrega === "Domicilio" &&
      !telefono.trim()
    ) {
      Alert.alert(
        "Teléfono requerido",
        "Ingresa un número de teléfono para la entrega."
      );

      return;
    }

    if (
      tipoEntrega === "Domicilio" &&
      !referencia.trim()
    ) {
      Alert.alert(
        "Referencia requerida",
        "Ingresa una referencia para ayudar al repartidor a encontrar el lugar."
      );

      return;
    }

      navigation.navigate(
      "ConfirmOrder",
      {
        tipoEntrega,
        direccion,
        latitude,
        longitude,
        tipoTiempo,
        fechaProgramada,
        horaProgramada,
        telefono: telefono.trim(),
        referencia: referencia.trim(),
        indicaciones: indicaciones.trim(),
      }
    );

    /*
      En el siguiente paso cambiaremos este Alert
      por:

      navigation.navigate("ConfirmOrder", {
        tipoEntrega,
        direccion,
        latitude,
        longitude,
        tipoTiempo,
        fechaProgramada,
        horaProgramada,
        telefono,
        referencia,
        indicaciones,
      });
    */
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
        📦 Datos de entrega
      </Text>

      <Text style={styles.subtitle}>
        Confirma la información necesaria para tu pedido.
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Tipo de pedido
          </Text>

          <Text style={styles.summaryValue}>
            {tipoEntrega || "No definido"}
          </Text>
        </View>

        {tipoEntrega === "Domicilio" && (
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>
              Dirección
            </Text>

            <Text style={styles.addressValue}>
              {direccion ||
                "Dirección no disponible"}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Entrega
          </Text>

          <Text style={styles.summaryValue}>
            {tipoTiempo === "Ahora"
              ? "Lo antes posible"
              : "Programado"}
          </Text>
        </View>

        {tipoTiempo === "Despues" && (
          <View style={styles.programmedContainer}>
            <Text style={styles.programmedText}>
              📅 {fechaProgramada || "-"}
            </Text>

            <Text style={styles.programmedText}>
              🕒 {horaProgramada || "-"}
            </Text>
          </View>
        )}
      </View>

      {tipoEntrega === "Domicilio" && (
        <>
          <Text style={styles.label}>
            Teléfono
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. 5555-5555"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />

          <Text style={styles.label}>
            Referencia del lugar
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Ej. Casa de dos niveles, portón negro..."
            value={referencia}
            onChangeText={setReferencia}
            multiline
          />

          <Text style={styles.label}>
            Indicaciones para el repartidor
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Ej. Llamar al llegar, tocar el timbre..."
            value={indicaciones}
            onChangeText={setIndicaciones}
            multiline
          />
        </>
      )}

      {tipoEntrega === "Recoger" && (
        <View style={styles.pickupCard}>
          <Text style={styles.pickupTitle}>
            🏪 Pedido para recoger
          </Text>

          <Text style={styles.pickupText}>
            No necesitamos una dirección de entrega ni datos para repartidor.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.continueButton}
        onPress={continuar}
      >
        <Text style={styles.continueButtonText}>
          CONTINUAR AL RESUMEN
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
    marginBottom: 25,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  summaryBlock: {
    marginBottom: 12,
  },

  summaryLabel: {
    color: "#777",
    fontSize: 14,
  },

  summaryValue: {
    fontWeight: "bold",
    fontSize: 15,
  },

  addressValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
    lineHeight: 21,
  },

  programmedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  programmedText: {
    fontWeight: "600",
    color: "#444",
  },

  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginTop: 16,
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

  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  pickupCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    elevation: 2,
  },

  pickupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  pickupText: {
    color: "#666",
    lineHeight: 21,
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