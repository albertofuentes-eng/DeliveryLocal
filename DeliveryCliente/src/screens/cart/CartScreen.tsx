import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

import { useCart } from "../../context/CartContext";

export default function CartScreen() {

  const { carrito } = useCart();

  const total = carrito.reduce(
    (suma, item) => suma + item.precio * item.cantidad,
    0
  );

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        🛒 Mi carrito
      </Text>

      <FlatList
        data={carrito}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay productos en el carrito.
          </Text>
        }
        renderItem={({ item }) => (

          <View style={styles.card}>

            <View>
              <Text style={styles.name}>
                {item.imagen} {item.nombre}
              </Text>

              <Text>
                Cantidad: {item.cantidad}
              </Text>

              <Text>
                Q {item.precio}
              </Text>
            </View>

          </View>

        )}
      />

      <View style={styles.footer}>

        <Text style={styles.total}>
          Total: Q {total}
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Finalizar pedido
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F5F5F5",
    padding:20,
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    marginTop:20,
    marginBottom:20,
    color:"#E53935",
  },

  card:{
    backgroundColor:"#FFF",
    padding:15,
    borderRadius:12,
    marginBottom:12,
    elevation:2,
  },

  name:{
    fontSize:18,
    fontWeight:"bold",
  },

  empty:{
    textAlign:"center",
    marginTop:80,
    fontSize:18,
    color:"#777",
  },

  footer:{
    borderTopWidth:1,
    borderColor:"#DDD",
    paddingTop:15,
  },

  total:{
    fontSize:22,
    fontWeight:"bold",
    marginBottom:15,
  },

  button:{
    backgroundColor:"#E53935",
    padding:15,
    borderRadius:10,
  },

  buttonText:{
    color:"white",
    textAlign:"center",
    fontWeight:"bold",
    fontSize:18,
  }

});