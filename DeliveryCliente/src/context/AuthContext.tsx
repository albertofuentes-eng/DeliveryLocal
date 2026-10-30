
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  iniciarSesion as loginApi,
  iniciarSesionGoogle as loginGoogleApi,
  registrarTokenPush,
} from "../services/api";

import {
  obtenerExpoPushToken,
} from "../services/notificaciones";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  cargandoSesion: boolean;

  iniciarSesion: (
    correo: string,
    password: string
  ) => Promise<void>;

  iniciarSesionGoogle: (
    idToken: string
  ) => Promise<void>;

  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextType);

const TOKEN_KEY = "deliverylocal_token";
const USER_KEY = "deliverylocal_usuario";

// Almacenamiento compatible con Android y navegador.
const almacenamiento = {
  async obtener(clave: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return window.localStorage.getItem(clave);
    }

    return SecureStore.getItemAsync(clave);
  },

  async guardar(
    clave: string,
    valor: string
  ): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.setItem(clave, valor);
      return;
    }

    await SecureStore.setItemAsync(clave, valor);
  },

  async eliminar(clave: string): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(clave);
      return;
    }

    await SecureStore.deleteItemAsync(clave);
  },
};

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [cargandoSesion, setCargandoSesion] =
    useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  async function registrarPush(tokenJwt: string) {
    // Las notificaciones push se mantienen en Android.
    // En Chrome se omite su registro.
    if (Platform.OS === "web") return;

    try {
      const expoPushToken =
        await obtenerExpoPushToken();

      if (expoPushToken) {
        await registrarTokenPush(
          tokenJwt,
          expoPushToken
        );

        console.log(
          "Token push registrado correctamente."
        );
      }
    } catch (error) {
      console.log(
        "No se pudo registrar el token push:",
        error
      );
    }
  }

  async function cargarSesion() {
    try {
      const tokenGuardado =
        await almacenamiento.obtener(TOKEN_KEY);

      const usuarioGuardado =
        await almacenamiento.obtener(USER_KEY);

      if (tokenGuardado && usuarioGuardado) {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));

        await registrarPush(tokenGuardado);
      }
    } catch (error) {
      console.log("Error cargando sesión:", error);
    } finally {
      setCargandoSesion(false);
    }
  }

  async function iniciarSesion(
    correo: string,
    password: string
  ) {
    const data = await loginApi(
      correo,
      password
    );

    await almacenamiento.guardar(
      TOKEN_KEY,
      data.token
    );

    await almacenamiento.guardar(
      USER_KEY,
      JSON.stringify(data.usuario)
    );

    setToken(data.token);
    setUsuario(data.usuario);

    await registrarPush(data.token);
  }

    async function iniciarSesionGoogle(
    idToken: string
  ) {
    const data = await loginGoogleApi(idToken);

    await almacenamiento.guardar(
      TOKEN_KEY,
      data.token
    );

    await almacenamiento.guardar(
      USER_KEY,
      JSON.stringify(data.usuario)
    );

    setToken(data.token);
    setUsuario(data.usuario);

    await registrarPush(data.token);
  }

  async function cerrarSesion() {
    await almacenamiento.eliminar(TOKEN_KEY);
    await almacenamiento.eliminar(USER_KEY);

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
        iniciarSesionGoogle,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
