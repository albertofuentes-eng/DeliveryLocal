import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import SearchBar from "../../components/SearchBar";
import CategoryCard from "../../components/CategoryCard";
import RestaurantCard from "../../components/RestaurantCard";
import { obtenerComercios } from "../../services/api";

type Comercio = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  direccion: string;
  telefono?: string | null;
  imagenUrl?: string | null;
  activo: boolean;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarComercios() {
      try {
        const data = await obtenerComercios();
        setComercios(data);
      } catch (error) {
        console.log(error);
        setError("No se pudieron cargar los comercios.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercios();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.location}>
        📍 Entregar en
      </Text>

      <Text style={styles.address}>
        Nuevo Progreso, San Marcos
      </Text>

      <Text style={styles.greeting}>
        👋 ¡Bienvenido!
      </Text>

      <SearchBar />

      <Text style={styles.section}>
        Categorías
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <CategoryCard emoji="🍕" nombre="Pizza" />
        <CategoryCard emoji="🍔" nombre="Hamburguesas" />
        <CategoryCard emoji="🌮" nombre="Tacos" />
        <CategoryCard emoji="🍗" nombre="Pollo" />
        <CategoryCard emoji="☕" nombre="Café" />
      </ScrollView>

      <Text style={styles.section}>
        Restaurantes populares
      </Text>

      {cargando && (
        <ActivityIndicator size="large" />
      )}

      {error !== "" && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {comercios.map((comercio) => (
        <TouchableOpacity
          key={comercio.id}
          onPress={() =>
            navigation.navigate("Restaurant", {
              comercioId: comercio.id,
              nombre: comercio.nombre,
            })
          }
        >
          <RestaurantCard
            nombre={comercio.nombre}
            estrellas="4.8"
            tiempo="30-40 min"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
  },

  location: {
    marginTop: 15,
    color: "#666",
    fontSize: 15,
  },

  address: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  section: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },

  error: {
    color: "#E53935",
    marginBottom: 15,
  },
});