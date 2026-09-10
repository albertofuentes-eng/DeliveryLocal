import { Producto } from "../models/Producto";

type ProductoLocal = Pick<
  Producto,
  "id" | "nombre" | "descripcion" | "precio"
> & {
  imagen: string;
  restaurante: string;
};

export const productos: ProductoLocal[] = [

  // PIZZAS

  {
    id: 1,
    nombre: "Pizza Suprema",
    descripcion: "Jamón, queso y pepperoni",
    precio: 95,
    imagen: "🍕",
    restaurante: "Pizza Hut",
  },

  {
    id: 2,
    nombre: "Pizza Hawaiana",
    descripcion: "Jamón y piña",
    precio: 85,
    imagen: "🍕",
    restaurante: "Pizza Hut",
  },

  {
    id: 3,
    nombre: "Pizza Pepperoni",
    descripcion: "Extra queso",
    precio: 90,
    imagen: "🍕",
    restaurante: "Pizza Hut",
  },

  // CAMPERO

  {
    id: 4,
    nombre: "Combo Tradicional",
    descripcion: "2 piezas + papas + bebida",
    precio: 62,
    imagen: "🍗",
    restaurante: "Pollo Campero",
  },

  {
    id: 5,
    nombre: "Camperitos",
    descripcion: "6 camperitos",
    precio: 48,
    imagen: "🍗",
    restaurante: "Pollo Campero",
  },

  {
    id: 6,
    nombre: "8 Piezas",
    descripcion: "Pollo para compartir",
    precio: 145,
    imagen: "🍗",
    restaurante: "Pollo Campero",
  },

  // MCDONALD'S

  {
    id: 7,
    nombre: "Big Mac",
    descripcion: "La clásica hamburguesa",
    precio: 45,
    imagen: "🍔",
    restaurante: "McDonald's",
  },

  {
    id: 8,
    nombre: "McNuggets",
    descripcion: "10 piezas",
    precio: 35,
    imagen: "🍟",
    restaurante: "McDonald's",
  },

  {
    id: 9,
    nombre: "Papas Grandes",
    descripcion: "Papas fritas",
    precio: 22,
    imagen: "🍟",
    restaurante: "McDonald's",
  },

];