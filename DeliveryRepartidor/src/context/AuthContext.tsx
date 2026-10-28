
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import {
  login as loginApi,
  registrarTokenPush,
  type UsuarioAuth,
} from "../services/api";

import {
  obtenerExpoPushToken,
} from "../services/notificaciones";

type AuthContextType = {
  usuario: UsuarioAuth | null;
  token: string | null;
  cargandoSesion: boolean;

  iniciarSesion: (
    correo: string,
    password: string
  ) => Promise<UsuarioAuth>;

  cerrarSesion: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

const TOKEN_KEY = "deliveryrepartidor_token";
const USER_KEY = "deliveryrepartidor_usuario";

// ==========================================
// ALMACENAMIENTO COMPATIBLE CON WEB Y ANDROID
// ==========================================

async function leerDato(
  clave: string
): Promise<string | null> {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(clave);
  }

  return SecureStore.getItemAsync(clave);
}

async function guardarDato(
  clave: string,
  valor: string
): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.setItem(clave, valor);
    return;
  }

  await SecureStore.setItemAsync(clave, valor);
}

async function eliminarDato(
  clave: string
): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(clave);
    return;
  }

  await SecureStore.deleteItemAsync(clave);
}

// ==========================================
// PROVEEDOR DE AUTENTICACIÓN
// ==========================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<UsuarioAuth | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [
    cargandoSesion,
    setCargandoSesion,
  ] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  // ==========================================
  // REGISTRAR NOTIFICACIONES PUSH
  // ==========================================

  async function registrarPush(
    tokenJwt: string
  ) {
    // Las notificaciones push se registran
    // únicamente en dispositivos móviles.
    if (Platform.OS === "web") {
      return;
    }

    try {
      const expoPushToken =
        await obtenerExpoPushToken();

      if (expoPushToken) {
        await registrarTokenPush(
          tokenJwt,
          expoPushToken
        );

        console.log(
          "Token push del repartidor registrado correctamente."
        );
      }
    } catch (error) {
      console.log(
        "No se pudo registrar el token push del repartidor:",
        error
      );
    }
  }

  // ==========================================
  // RECUPERAR SESIÓN
  // ==========================================

  async function cargarSesion() {
    try {
      const tokenGuardado =
        await leerDato(TOKEN_KEY);

      const usuarioGuardado =
        await leerDato(USER_KEY);

      if (
        tokenGuardado &&
        usuarioGuardado
      ) {
        setToken(tokenGuardado);

        setUsuario(
          JSON.parse(usuarioGuardado)
        );

        await registrarPush(tokenGuardado);
      }
    } catch (error) {
      console.log(
        "No se pudo recuperar la sesión:",
        error
      );

      await cerrarSesion();
    } finally {
      setCargandoSesion(false);
    }
  }

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  async function iniciarSesion(
    correo: string,
    password: string
  ) {
    const data = await loginApi(
      correo,
      password
    );

    await guardarDato(
      TOKEN_KEY,
      data.token
    );

    await guardarDato(
      USER_KEY,
      JSON.stringify(data.usuario)
    );

    setToken(data.token);
    setUsuario(data.usuario);

    await registrarPush(data.token);

    return data.usuario;
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  async function cerrarSesion() {
    await eliminarDato(TOKEN_KEY);
    await eliminarDato(USER_KEY);

    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargandoSesion,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}
