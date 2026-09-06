import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";
import { iniciarSesion as loginApi } from "../services/api";

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

  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextType);

const TOKEN_KEY = "deliverylocal_token";
const USER_KEY = "deliverylocal_usuario";

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

  async function cargarSesion() {
    try {
      const tokenGuardado =
        await SecureStore.getItemAsync(TOKEN_KEY);

      const usuarioGuardado =
        await SecureStore.getItemAsync(USER_KEY);

      if (tokenGuardado && usuarioGuardado) {
        setToken(tokenGuardado);
        setUsuario(JSON.parse(usuarioGuardado));
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
    const data = await loginApi(correo, password);

    await SecureStore.setItemAsync(
      TOKEN_KEY,
      data.token
    );

    await SecureStore.setItemAsync(
      USER_KEY,
      JSON.stringify(data.usuario)
    );

    setToken(data.token);
    setUsuario(data.usuario);
  }

  async function cerrarSesion() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

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
  return useContext(AuthContext);
}