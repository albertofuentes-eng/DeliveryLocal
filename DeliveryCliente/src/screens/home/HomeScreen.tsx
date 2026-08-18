import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import SearchBar from "../../components/SearchBar";
import CategoryCard from "../../components/CategoryCard";
import RestaurantCard from "../../components/RestaurantCard";

export default function HomeScreen() {

  const navigation = useNavigation<any>();

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

      <TouchableOpacity
  onPress={() =>
    navigation.navigate("Restaurant", {
      nombre: "Pizza Hut",
    })
  }
>
  <RestaurantCard
    nombre="Pizza Hut"
    estrellas="4.8"
    tiempo="30-40 min"
  />
</TouchableOpacity>

      
      <TouchableOpacity
  onPress={() =>
    navigation.navigate("Restaurant", {
      nombre: "Pollo Campero",
    })
  }
>
  <RestaurantCard
    nombre="Pollo Campero"
    estrellas="4.9"
    tiempo="20-30 min"
  />
</TouchableOpacity>


      <TouchableOpacity
  onPress={() =>
    navigation.navigate("Restaurant", {
      nombre: "McDonald's",
    })
  }
>
  <RestaurantCard
    nombre="McDonald's"
    estrellas="4.7"
    tiempo="25-35 min"
  />
</TouchableOpacity>


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

});