import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import type {
  ReactNode,
} from "react";

import RepartidoresPage
  from "./pages/RepartidoresPage";

import LoginPage
  from "./pages/LoginPage";

import DashboardPage
  from "./pages/DashboardPage";

import SolicitudesPage
  from "./pages/SolicitudesPage";

function RutaAdministrador({
  children,
}: {
  children: ReactNode;
}) {
  const token =
    localStorage.getItem(
      "deliveryadmin_token"
    );

  const usuarioGuardado =
    localStorage.getItem(
      "deliveryadmin_usuario"
    );

  if (
    !token ||
    !usuarioGuardado
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const usuario =
      JSON.parse(
        usuarioGuardado
      );

    if (
      usuario.rol !==
      "Administrador"
    ) {
      localStorage.removeItem(
        "deliveryadmin_token"
      );

      localStorage.removeItem(
        "deliveryadmin_usuario"
      );

      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
  } catch {
    localStorage.removeItem(
      "deliveryadmin_token"
    );

    localStorage.removeItem(
      "deliveryadmin_usuario"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/dashboard"
        element={
          <RutaAdministrador>
            <DashboardPage />
          </RutaAdministrador>
        }
      />

      <Route
        path="/repartidores"
        element={
          <RutaAdministrador>
            <RepartidoresPage />
          </RutaAdministrador>
        }
      />

      <Route
        path="/solicitudes"
        element={
          <RutaAdministrador>
            <SolicitudesPage />
          </RutaAdministrador>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;