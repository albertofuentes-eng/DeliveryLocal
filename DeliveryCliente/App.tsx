import AppNavigator from "./src/navigation/AppNavigator";
import { CartProvider } from "./src/context/CartContext";

export default function App() {
  return (
    <CartProvider>
      <AppNavigator />
    </CartProvider>
  );
}