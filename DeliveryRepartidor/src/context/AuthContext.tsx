import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as SecureStore
  from "expo-secure-store";

import {
  login as loginApi,
  type UsuarioAuth,
} from "../services/api";

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
  createContext<AuthContextType | null>(
    null
  );

const TOKEN_KEY =
  "deliveryrepartidor_token";

const USER_KEY =
  "deliveryrepartidor_usuario";

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

  async function cargarSesion() {
    try {
      const tokenGuardado =
        await SecureStore.getItemAsync(
          TOKEN_KEY
        );

      const usuarioGuardado =
        await SecureStore.getItemAsync(
          USER_KEY
        );

      if (
        tokenGuardado &&
        usuarioGuardado
      ) {
        setToken(tokenGuardado);

        setUsuario(
          JSON.parse(
            usuarioGuardado
          )
        );
      }
    } catch {
      await cerrarSesion();
    } finally {
      setCargandoSesion(false);
    }
  }

  async function iniciarSesion(
    correo: string,
    password: string
  ) {
    const data =
      await loginApi(
        correo,
        password
      );

    await SecureStore.setItemAsync(
      TOKEN_KEY,
      data.token
    );

    await SecureStore.setItemAsync(
      USER_KEY,
      JSON.stringify(
        data.usuario
      )
    );

    setToken(data.token);

    setUsuario(data.usuario);

    return data.usuario;
  }

  async function cerrarSesion() {
    await SecureStore.deleteItemAsync(
      TOKEN_KEY
    );

    await SecureStore.deleteItemAsync(
      USER_KEY
    );

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
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}