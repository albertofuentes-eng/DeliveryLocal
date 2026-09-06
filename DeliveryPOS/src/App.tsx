import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MiComercioPage from "./pages/MiComercioPage";
import EditarProductoPage from "./pages/EditarProductoPage";
import NuevoProductoPage from "./pages/NuevoProductoPage";
import CategoriasPage from "./pages/CategoriasPage";
import ProductosPage from "./pages/ProductosPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DetallePedidoPage from "./pages/DetallePedidoPage";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />

        <Route
          path="/pedidos/:id"
          element={
            <DetallePedidoPage />
          }
        />

        <Route
          path="/productos"
          element={
            <ProductosPage />
          }
        />

        <Route
          path="/categorias"
          element={
            <CategoriasPage />
          }
        />

        <Route
          path="/productos/nuevo"
          element={
            <NuevoProductoPage />
          }
        />

        <Route
          path="/productos/:id/editar"
          element={
            <EditarProductoPage />
          }
        />

        <Route
          path="/mi-comercio"
          element={
            <MiComercioPage />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;