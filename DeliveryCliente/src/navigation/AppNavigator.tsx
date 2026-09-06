import ConfirmOrderScreen from "../screens/delivery/ConfirmOrderScreen";
import DeliveryDetailsScreen from "../screens/delivery/DeliveryDetailsScreen";
import DeliveryTimeScreen from "../screens/delivery/DeliveryTimeScreen";
import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import BottomTabs from "./BottomTabs";
import RestaurantScreen from "../screens/commerce/RestaurantScreen";
import MisPedidosScreen from "../screens/orders/MisPedidosScreen";
import DetallePedidoScreen from "../screens/orders/DetallePedidoScreen";
import DeliveryLocationScreen from "../screens/delivery/DeliveryLocationScreen";

import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const {
    usuario,
    cargandoSesion,
  } = useAuth();

  if (cargandoSesion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E53935"
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {usuario ? (
          <>
            <Stack.Screen
              name="Main"
              component={BottomTabs}
            />

            <Stack.Screen
              name="Restaurant"
              component={RestaurantScreen}
            />

            <Stack.Screen
              name="MisPedidos"
              component={MisPedidosScreen}
            />

            <Stack.Screen
              name="DetallePedido"
              component={DetallePedidoScreen}
            />

            <Stack.Screen
              name="DeliveryLocation"
              component={DeliveryLocationScreen}
            />

            <Stack.Screen
              name="DeliveryTime"
              component={DeliveryTimeScreen}
            />

            <Stack.Screen
              name="DeliveryDetails"
              component={DeliveryDetailsScreen}
            />

            <Stack.Screen
              name="ConfirmOrder"
              component={ConfirmOrderScreen}
            />


          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});