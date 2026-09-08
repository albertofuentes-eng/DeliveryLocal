import {
  Text,
} from "react-native";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import HomeScreen
  from "../screens/home/HomeScreen";

import HistorialScreen
  from "../screens/history/HistorialScreen";

import GananciasScreen
  from "../screens/earnings/GananciasScreen";

export type BottomTabParamList = {
  Inicio: undefined;
  Historial: undefined;
  Ganancias: undefined;
};

const Tab =
  createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:
          "#20a85a",

        tabBarInactiveTintColor:
          "#777777",

        tabBarStyle: {
          height: 65,
          paddingTop: 5,
          paddingBottom: 7,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },

        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 21,
                color,
              }}
            >
              🏠
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Historial"
        component={HistorialScreen}
        options={{
          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 21,
                color,
              }}
            >
              📦
            </Text>
          ),
        }}
      />

      <Tab.Screen
        name="Ganancias"
        component={GananciasScreen}
        options={{
          tabBarIcon: ({
            color,
          }) => (
            <Text
              style={{
                fontSize: 21,
                color,
              }}
            >
              💰
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}