import React, { createContext, useContext, useState } from "react";
import { Producto } from "../models/Producto";

interface CartItem extends Producto {
  cantidad: number;
}

interface CartContextType {
  carrito: CartItem[];

  agregarProducto: (producto: Producto) => void;

  aumentarCantidad: (id: number) => void;

  disminuirCantidad: (id: number) => void;

  eliminarProducto: (id: number) => void;

  vaciarCarrito: () => void;

  totalItems: number;

  subtotal: number;

  envio: number;

  total: number;
}

const CartContext = createContext({} as CartContextType);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  function agregarProducto(producto: Producto) {
    const existe = carrito.find((p) => p.id === producto.id);

    if (existe) {
      setCarrito(
        carrito.map((p) =>
          p.id === producto.id
            ? {
                ...p,
                cantidad: p.cantidad + 1,
              }
            : p
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          ...producto,
          cantidad: 1,
        },
      ]);
    }
  }

  function aumentarCantidad(id: number) {
    setCarrito(
      carrito.map((p) =>
        p.id === id
          ? {
              ...p,
              cantidad: p.cantidad + 1,
            }
          : p
      )
    );
  }

  function disminuirCantidad(id: number) {
    setCarrito(
      carrito
        .map((p) =>
          p.id === id
            ? {
                ...p,
                cantidad: p.cantidad - 1,
              }
            : p
        )
        .filter((p) => p.cantidad > 0)
    );
  }

  function eliminarProducto(id: number) {
    setCarrito(carrito.filter((p) => p.id !== id));
  }

  function vaciarCarrito() {
    setCarrito([]);
  }

  const totalItems = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const subtotal = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  const envio = carrito.length > 0 ? 15 : 0;

  const total = subtotal + envio;

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarProducto,
        aumentarCantidad,
        disminuirCantidad,
        eliminarProducto,
        vaciarCarrito,
        totalItems,
        subtotal,
        envio,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}