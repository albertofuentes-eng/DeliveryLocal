import {
  useState,
} from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useAuth,
} from "../../context/AuthContext";

export default function LoginScreen() {
  const {
    iniciarSesion,
    cerrarSesion,
  } = useAuth();

  const [correo, setCorreo] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  async function manejarLogin() {
    if (
      !correo.trim() ||
      !password
    ) {
      setMensaje(
        "Ingresa tu correo y contraseña."
      );

      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const usuario =
        await iniciarSesion(
          correo.trim(),
          password
        );

      if (
        usuario.rol !==
        "Repartidor"
      ) {
        await cerrarSesion();

        setMensaje(
          usuario.rol === "Cliente"
            ? "Esta cuenta todavía no tiene autorización como repartidor."
            : "Esta cuenta no pertenece a un repartidor."
        );
      }
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={styles.brandContainer}
        >
          <Text style={styles.logo}>
            DeliveryLocal
          </Text>

          <Text style={styles.title}>
            Repartidor
          </Text>

          <Text
            style={styles.subtitle}
          >
            Inicia sesión para comenzar
            tus entregas.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Correo
          </Text>

          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
          />

          <Text style={styles.label}>
            Contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tu contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mensaje ? (
            <Text
              style={styles.error}
            >
              {mensaje}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,

              pressed &&
                styles.buttonPressed,
            ]}
            disabled={cargando}
            onPress={manejarLogin}
          >
            {cargando ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                INICIAR SESIÓN
              </Text>
            )}
          </Pressable>
        </View>

        <Text
          style={styles.footer}
        >
          Solo repartidores autorizados
          por DeliveryLocal pueden
          ingresar.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f7f6",
    },

    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    brandContainer: {
      marginBottom: 32,
    },

    logo: {
      fontSize: 30,
      fontWeight: "800",
      color: "#20a85a",
    },

    title: {
      fontSize: 26,
      fontWeight: "700",
      color: "#151515",
      marginTop: 5,
    },

    subtitle: {
      color: "#666666",
      fontSize: 15,
      marginTop: 8,
    },

    card: {
      backgroundColor: "#ffffff",
      borderRadius: 18,
      padding: 22,

      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 7,
      color: "#333333",
    },

    input: {
      borderWidth: 1,
      borderColor: "#dddddd",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 18,
      backgroundColor: "#ffffff",
      fontSize: 15,
    },

    error: {
      color: "#c62828",
      marginBottom: 15,
      textAlign: "center",
    },

    button: {
      backgroundColor: "#20a85a",
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },

    buttonPressed: {
      opacity: 0.85,
    },

    buttonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 15,
    },

    footer: {
      textAlign: "center",
      color: "#777777",
      fontSize: 13,
      marginTop: 24,
      paddingHorizontal: 20,
    },
  });