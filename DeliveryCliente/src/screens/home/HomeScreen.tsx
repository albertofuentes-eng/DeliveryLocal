
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  View,
} from "react-native";

import * as Location from "expo-location";
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
  municipio?: string | null;
  telefono?: string | null;
  imagenUrl?: string | null;
  activo: boolean;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [municipioInput, setMunicipioInput] = useState("");
  const [municipioConfirmado, setMunicipioConfirmado] = useState("");

  const [cargando, setCargando] = useState(false);
  const [detectando, setDetectando] = useState(false);
  const [error, setError] = useState("");

  // ======================================
  // CARGAR COMERCIOS DEL MUNICIPIO
  // ======================================

  useEffect(() => {
    if (!municipioConfirmado) {
      return;
    }

    let cancelado = false;

    async function cargarComercios() {
      try {
        setCargando(true);
        setError("");
        setComercios([]);

        const data = await obtenerComercios(
          municipioConfirmado
        );

        if (!cancelado) {
          setComercios(data);
        }
      } catch (err) {
        console.log(err);

        if (!cancelado) {
          setError(
            "No se pudieron cargar los restaurantes."
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarComercios();

    return () => {
      cancelado = true;
    };
  }, [municipioConfirmado]);

  // ======================================
  // CONFIRMAR MUNICIPIO MANUALMENTE
  // ======================================

  function confirmarMunicipio() {
    const municipio = municipioInput.trim();

    if (!municipio) {
      Alert.alert(
        "Municipio requerido",
        "Escribí el municipio donde querés buscar restaurantes."
      );

      return;
    }

    setMunicipioConfirmado(municipio);
  }

  // ======================================
  // DETECTAR MUNICIPIO MEDIANTE GPS
  // ======================================

  async function detectarMunicipio() {
    try {
      setDetectando(true);

      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        Alert.alert(
          "Permiso de ubicación",
          "Podés escribir tu municipio manualmente."
        );

        return;
      }

      const ubicacion =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const direcciones =
        await Location.reverseGeocodeAsync({
          latitude: ubicacion.coords.latitude,
          longitude: ubicacion.coords.longitude,
        });

      if (direcciones.length === 0) {
        Alert.alert(
          "Ubicación no identificada",
          "Escribí tu municipio manualmente."
        );

        return;
      }

      const lugar = direcciones[0];

      const municipioDetectado =
        lugar.city ||
        lugar.district ||
        lugar.subregion ||
        "";

      if (!municipioDetectado) {
        Alert.alert(
          "Municipio no identificado",
          "Escribí tu municipio manualmente."
        );

        return;
      }

      setMunicipioInput(municipioDetectado);

      Alert.alert(
        "Ubicación detectada",
        `Se encontró: ${municipioDetectado}.\n\nVerificá que sea tu municipio y presioná "Buscar restaurantes".`
      );
    } catch (err) {
      console.log(err);

      Alert.alert(
        "Error de ubicación",
        "No pudimos detectar tu municipio. Podés ingresarlo manualmente."
      );
    } finally {
      setDetectando(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.location}>
        📍 Restaurantes en tu municipio
      </Text>

      <Text style={styles.address}>
        {municipioConfirmado || "Seleccioná tu municipio"}
      </Text>

      <View style={styles.locationBox}>
        <Text style={styles.label}>
          ¿Dónde querés buscar restaurantes?
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ej. Nuevo Progreso"
          value={municipioInput}
          onChangeText={setMunicipioInput}
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={styles.gpsButton}
          onPress={detectarMunicipio}
          disabled={detectando}
        >
          <Text style={styles.gpsButtonText}>
            {detectando
              ? "Detectando ubicación..."
              : "📍 Detectar mi municipio"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={confirmarMunicipio}
        >
          <Text style={styles.searchButtonText}>
            Buscar restaurantes
          </Text>
        </TouchableOpacity>
      </View>

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
        Restaurantes disponibles
      </Text>

      {cargando && (
        <ActivityIndicator size="large" />
      )}

      {error !== "" && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {!municipioConfirmado && !cargando && (
        <Text style={styles.empty}>
          Seleccioná tu municipio para ver los restaurantes disponibles.
        </Text>
      )}

      {Boolean(municipioConfirmado) &&
        !cargando &&
        !error &&
        comercios.length === 0 && (
          <Text style={styles.empty}>
            Por el momento no hay restaurantes disponibles en{" "}
            {municipioConfirmado}.
          </Text>
        )}

      {!cargando &&
        !error &&
        comercios.map((comercio) => (
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

  locationBox: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },

  gpsButton: {
    backgroundColor: "#E8F5E9",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  gpsButtonText: {
    color: "#2E7D32",
    fontWeight: "600",
  },

  searchButton: {
    backgroundColor: "#E53935",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
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

  empty: {
    color: "#777",
    textAlign: "center",
    padding: 20,
    fontSize: 15,
  },
});
