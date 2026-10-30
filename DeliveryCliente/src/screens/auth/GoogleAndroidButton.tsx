
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { useAuth } from "../../context/AuthContext";

// Debe ser el Client ID WEB, no el de Android.
GoogleSignin.configure({
  webClientId:
    "205176756159-dl1tkmrd7ig8dg70r2ee8tomf41po7ue.apps.googleusercontent.com",
});

export default function GoogleAndroidButton() {
  const { iniciarSesionGoogle } = useAuth();
  const [cargando, setCargando] = useState(false);

  async function handleGoogleLogin() {
    if (cargando) return;

    try {
      setCargando(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const respuesta = await GoogleSignin.signIn();

      if (!isSuccessResponse(respuesta)) {
        return;
      }

      const idToken = respuesta.data.idToken;

      if (!idToken) {
        throw new Error(
          "Google no devolvió el token de identidad."
        );
      }

      await iniciarSesionGoogle(idToken);
    } catch (error: unknown) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }

      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión con Google.";

      Alert.alert("Google Login", mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.boton}
      onPress={handleGoogleLogin}
      disabled={cargando}
    >
      {cargando ? (
        <ActivityIndicator color="#333" />
      ) : (
        <Text style={styles.texto}>
          Continuar con Google
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  texto: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
});
