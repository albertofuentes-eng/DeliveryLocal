import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

import { useRoute } from "@react-navigation/native";
import { productos } from "../../data/productos";
import { useCart } from "../../context/CartContext";

export default function RestaurantScreen() {

  const route = useRoute<any>();
  const { nombre } = route.params;

  const { agregarProducto } = useCart();

  const lista = productos.filter(
    p => p.restaurante === nombre
  );

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        {nombre}
      </Text>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (

          <View style={styles.card}>

            <Text style={styles.nombre}>
              {item.nombre}
            </Text>

            <Text>
              Q {item.precio}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => agregarProducto(item)}
            >
              <Text style={styles.buttonText}>
                Agregar
              </Text>
            </TouchableOpacity>

          </View>

        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#fff",
    padding:20,
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    color:"#E53935",
    marginBottom:20,
  },

  card:{
    backgroundColor:"#F8F8F8",
    padding:15,
    marginBottom:15,
    borderRadius:12,
  },

  nombre:{
    fontSize:18,
    fontWeight:"bold",
  },

  button:{
    backgroundColor:"#E53935",
    marginTop:10,
    padding:10,
    borderRadius:8,
  },

  buttonText:{
    color:"white",
    textAlign:"center",
    fontWeight:"bold",
  }

});