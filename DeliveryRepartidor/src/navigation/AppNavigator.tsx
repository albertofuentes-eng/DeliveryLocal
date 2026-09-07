import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  useAuth,
} from "../context/AuthContext";

import LoginScreen
  from "../screens/auth/LoginScreen";

import HomeScreen
  from "../screens/home/HomeScreen";

const Stack =
  createNativeStackNavigator();

export default function AppNavigator() {
  const {
    usuario,
    token,
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

  const sesionRepartidor =
    token &&
    usuario?.rol ===
      "Repartidor";

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {sesionRepartidor ? (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
    },
  });