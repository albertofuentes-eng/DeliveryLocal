import * as Notifications from "expo-notifications";

import AppNavigator from "./src/navigation/AppNavigator";
import { CartProvider } from "./src/context/CartContext";
import { AuthProvider } from "./src/context/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}