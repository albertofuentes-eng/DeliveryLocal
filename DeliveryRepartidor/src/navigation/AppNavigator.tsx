import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import RepartidorLocationTracker
  from "../components/RepartidorLocationTracker";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import MapaComercioScreen
  from "../screens/orders/MapaComercioScreen";

import MapaClienteScreen
  from "../screens/orders/MapaClienteScreen";

import {
  useAuth,
} from "../context/AuthContext";

import LoginScreen
  from "../screens/auth/LoginScreen";

import DetallePedidoScreen
  from "../screens/orders/DetallePedidoScreen";

import PedidoActivoScreen
  from "../screens/orders/PedidoActivoScreen";

import BottomTabs
  from "./BottomTabs";

export type RootStackParamList = {

  Login: undefined;

  Principal: undefined;

  DetallePedido: {
    pedidoId: number;
  };

  PedidoActivo: undefined;

    MapaComercio: {
    comercioNombre: string;
    comercioDireccion: string;
    comercioLatitud: number;
    comercioLongitud: number;
  };

    MapaCliente: {
    clienteNombre: string;
    direccionEntrega: string;
    latitudEntrega: number;
    longitudEntrega: number;
  };

  // Lo conservamos para que HomeScreen
  // siga compilando mientras migramos
  // totalmente a tabs.
  Historial: undefined;

  Home: undefined;
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const {
    token,
    usuario,
    cargandoSesion,
  } = useAuth();

  if (cargandoSesion) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color="#20a85a"
        />
      </View>
    );
  }

  const esRepartidor =
    !!token &&
    usuario?.rol ===
      "Repartidor";

  return (
  <>
    {esRepartidor ? (
      <RepartidorLocationTracker />
    ) : null}

      <NavigationContainer>
        <Stack.Navigator>
          {esRepartidor ? (
            <>
              <Stack.Screen
                name="Principal"
                component={BottomTabs}
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="MapaComercio"
                component={MapaComercioScreen}
                options={{
                  title: "Ruta al comercio",
                  headerBackTitle: "Atrás",
                }}
              />

              <Stack.Screen
                name="MapaCliente"
                component={MapaClienteScreen}
                options={{
                  title: "Ruta al cliente",
                  headerBackTitle: "Atrás",
                }}
              />

              <Stack.Screen
                name="DetallePedido"
                component={DetallePedidoScreen}
                options={{
                  title: "Detalle del pedido",
                  headerBackTitle: "Atrás",
                }}
              />

              <Stack.Screen
                name="PedidoActivo"
                component={PedidoActivoScreen}
                options={{
                  title: "Pedido en curso",
                  headerBackTitle: "Atrás",
                }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        "#ffffff",
    },
  });