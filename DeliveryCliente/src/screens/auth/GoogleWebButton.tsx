
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "205176756159-dl1tkmrd7ig8dg70r2ee8tomf41po7ue.apps.googleusercontent.com";

export default function GoogleWebButton() {
  const { iniciarSesionGoogle } = useAuth();
  const [cargando, setCargando] = useState(false);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: WEB_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
    });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params.id_token;

      if (!idToken) {
        Alert.alert("Google", "Google no devolvió un token de identidad.");
        return;
      }

      setCargando(true);

      iniciarSesionGoogle(idToken)
        .catch((error) => {
          const mensaje =
            error instanceof Error
              ? error.message
              : "No se pudo iniciar sesión con Google.";

          if (Platform.OS === "web") {
            window.alert(mensaje);
          } else {
            Alert.alert("Google", mensaje);
          }
        })
        .finally(() => setCargando(false));
    }
  }, [response, iniciarSesionGoogle]);

  return (
    <Pressable
      style={styles.boton}
      disabled={!request || cargando}
      onPress={() => promptAsync()}
    >
      {cargando ? (
        <ActivityIndicator color="#333" />
      ) : (
        <Text style={styles.texto}>
          Continuar con Google
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 16,
    alignItems: "center",
  },
  texto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
});
