import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function RegisterScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Crear Cuenta</Text>

      <TextInput
        placeholder="Nombre completo"
        style={styles.input}
      />

      <TextInput
        placeholder="Correo"
        style={styles.input}
      />

      <TextInput
        placeholder="Teléfono"
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          Registrarme
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
padding:20,
backgroundColor:"#fff"
},

title:{
fontSize:28,
fontWeight:"bold",
marginBottom:25,
textAlign:"center"
},

input:{
borderWidth:1,
borderColor:"#ccc",
borderRadius:10,
padding:15,
marginBottom:15
},

button:{
backgroundColor:"#ff5a00",
padding:15,
borderRadius:10
},

buttonText:{
color:"#fff",
textAlign:"center",
fontSize:18,
fontWeight:"bold"
}

});