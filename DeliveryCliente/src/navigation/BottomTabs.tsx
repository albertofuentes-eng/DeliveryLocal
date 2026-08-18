import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/home/HomeScreen";

import { View, Text } from "react-native";

import { useCart } from "../context/CartContext";

import CartScreen from "../screens/cart/CartScreen";

const Tab = createBottomTabNavigator();

function CarritoScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Carrito</Text>
    </View>
  );
}

function PerfilScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Perfil</Text>
    </View>
  );
}

export default function BottomTabs() {

const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#E53935",

        tabBarInactiveTintColor: "gray",

        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === "Inicio") {
            iconName = "home";
          } else if (route.name === "Carrito") {
            iconName = "shopping-cart";
          } else {
            iconName = "person";
          }

          return (
            <MaterialIcons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
      />

   <Tab.Screen
  name="Carrito"
  component={CartScreen}
/>

      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
      />
    </Tab.Navigator>
  );
}