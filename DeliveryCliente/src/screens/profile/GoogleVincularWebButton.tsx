
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { useAuth } from "../../context/AuthContext";
import { vincularCuentaGoogle } from "../../services/api";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "205176756159-dl1tkmrd7ig8dg70r2ee8tomf41po7ue.apps.googleusercontent.com";

export default function GoogleVincularWebButton() {
  const { token, usuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: WEB_CLIENT_ID,
      scopes: ["openid", "email", "profile"],
    });

  const idToken =
    response?.type === "success"
      ? response.params.id_token
      : undefined;

  useEffect(() => {
    if (!idToken || !token) return;

    let activo = true;

    async function vincular() {
      setCargando(true);
      setMensaje("");

      try {
        const resultado = await vincularCuentaGoogle(
          token!,
          idToken!
        );

        if (activo) {
          setMensaje(resultado.mensaje);
        }
      } catch (error) {
        if (activo) {
          setMensaje(
            error instanceof Error
              ? error.message
              : "No se pudo vincular Google."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    vincular();

    return () => {
      activo = false;
    };
  }, [idToken, token]);

  return (
    <>
      <Pressable
        style={styles.boton}
        disabled={!request || cargando || !token}
        onPress={() => {
          setMensaje("");
          promptAsync();
        }}
      >
        {cargando ? (
          <ActivityIndicator color="#333" />
        ) : (
          <Text style={styles.texto}>
            Vincular mi cuenta de Google
          </Text>
        )}
      </Pressable>

      <Text style={styles.ayuda}>
        Google debe utilizar el mismo correo de tu cuenta:
        {"\n"}
        {usuario?.correo}
      </Text>

      {!!mensaje && (
        <Text style={styles.mensaje}>{mensaje}</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DADCE0",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  texto: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  ayuda: {
    textAlign: "center",
    color: "#777",
    marginTop: 8,
    fontSize: 12,
  },
  mensaje: {
    marginTop: 10,
    textAlign: "center",
    color: "#333",
  },
});
