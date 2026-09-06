import React, {
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import * as Location from "expo-location";
import { WebView } from "react-native-webview";

type Coordenadas = {
  latitude: number;
  longitude: number;
};

type TipoEntrega = "Domicilio" | "Recoger";

export default function DeliveryLocationScreen() {
  const navigation = useNavigation<any>();

  const webViewRef =
    useRef<WebView>(null);

  const [tipoEntrega, setTipoEntrega] =
    useState<TipoEntrega>("Domicilio");

  const [direccionManual, setDireccionManual] =
    useState("");

  const [
    direccionDetectada,
    setDireccionDetectada,
  ] = useState("");

  const [ubicacion, setUbicacion] =
    useState<Coordenadas | null>(null);

  const [
    cargandoUbicacion,
    setCargandoUbicacion,
  ] = useState(false);

  const [mapaCargado, setMapaCargado] =
    useState(false);

  async function solicitarUbicacion() {
    try {
      setCargandoUbicacion(true);

      const permiso =
        await Location.requestForegroundPermissionsAsync();

      if (permiso.status !== "granted") {
        Alert.alert(
          "Ubicación no permitida",
          "No pudimos acceder a tu ubicación. Puedes escribir manualmente dónde deseas recibir tu pedido."
        );

        return;
      }

      const posicion =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const nuevaUbicacion = {
        latitude:
          posicion.coords.latitude,
        longitude:
          posicion.coords.longitude,
      };

      setUbicacion(nuevaUbicacion);

      await obtenerDireccion(
        nuevaUbicacion.latitude,
        nuevaUbicacion.longitude
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo obtener tu ubicación actual."
      );
    } finally {
      setCargandoUbicacion(false);
    }
  }

  async function obtenerDireccion(
    latitude: number,
    longitude: number
  ) {
    try {
      const resultado =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

      if (resultado.length === 0) {
        setDireccionDetectada(
          "Ubicación seleccionada"
        );

        return;
      }

      const lugar = resultado[0];

      const partes = [
        lugar.street,
        lugar.name,
        lugar.district,
        lugar.city,
        lugar.subregion,
        lugar.region,
        lugar.country,
      ].filter(Boolean);

      const partesUnicas = [
        ...new Set(partes),
      ];

      setDireccionDetectada(
        partesUnicas.join(", ") ||
          "Ubicación seleccionada"
      );
    } catch {
      setDireccionDetectada(
        "Ubicación seleccionada"
      );
    }
  }

  async function actualizarUbicacion(
    latitude: number,
    longitude: number
  ) {
    setUbicacion({
      latitude,
      longitude,
    });

    await obtenerDireccion(
      latitude,
      longitude
    );
  }

  function confirmarUbicacion() {
    if (!ubicacion) {
      Alert.alert(
        "Ubicación requerida",
        "Selecciona tu ubicación antes de continuar."
      );

      return;
    }

    navigation.navigate(
      "DeliveryTime",
      {
        tipoEntrega,
        direccion:
          direccionDetectada ||
          "Ubicación seleccionada",
        latitude: ubicacion.latitude,
        longitude: ubicacion.longitude,
      }
    );
  }

  function continuarDireccionManual() {
    const direccion =
      direccionManual.trim();

    if (!direccion) {
      Alert.alert(
        "Dirección requerida",
        "Escribe dónde deseas recibir tu pedido."
      );

      return;
    }

    navigation.navigate(
      "DeliveryTime",
      {
        tipoEntrega,
        direccion,
        latitude: null,
        longitude: null,
      }
    );
  }

  function seleccionarTipoEntrega(
    tipo: TipoEntrega
  ) {
    setTipoEntrega(tipo);

    if (tipo === "Recoger") {
      navigation.navigate(
        "DeliveryTime",
        {
          tipoEntrega: "Recoger",
          direccion: "",
          latitude: null,
          longitude: null,
        }
      );
    }
  }

  function generarMapaHtml(
    latitude: number,
    longitude: number
  ) {
    return `
<!DOCTYPE html>

<html>
<head>

<meta
  name="viewport"
  content="width=device-width,
  initial-scale=1.0,
  maximum-scale=1.0,
  user-scalable=no"
/>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<style>

html,
body,
#map {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.leaflet-control-attribution {
  font-size: 9px;
}

</style>

</head>

<body>

<div id="map"></div>

<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
</script>

<script>

const latitude = ${latitude};
const longitude = ${longitude};

const map = L.map(
  "map",
  {
    zoomControl: true
  }
).setView(
  [latitude, longitude],
  16
);

L.tileLayer(
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      "&copy; OpenStreetMap contributors"
  }
).addTo(map);

const marker = L.marker(
  [latitude, longitude],
  {
    draggable: true
  }
).addTo(map);

marker.bindPopup(
  "Tu ubicación"
);

marker.on(
  "dragend",
  function(event) {
    const posicion =
      event.target.getLatLng();

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "locationChanged",
        latitude: posicion.lat,
        longitude: posicion.lng
      })
    );
  }
);

map.whenReady(
  function() {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "mapReady"
      })
    );
  }
);

</script>

</body>
</html>
`;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        📍 ¿Dónde deseas recibirlo?
      </Text>

      <Text style={styles.subtitle}>
        Selecciona cómo deseas recibir tu pedido.
      </Text>

      <View
        style={
          styles.deliveryTypeContainer
        }
      >
        <TouchableOpacity
          style={[
            styles.deliveryTypeButton,
            tipoEntrega === "Domicilio" &&
              styles.deliveryTypeActive,
          ]}
          onPress={() =>
            seleccionarTipoEntrega(
              "Domicilio"
            )
          }
        >
          <Text
            style={[
              styles.deliveryTypeText,
              tipoEntrega === "Domicilio" &&
                styles.deliveryTypeActiveText,
            ]}
          >
            DOMICILIO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deliveryTypeButton,
            tipoEntrega === "Recoger" &&
              styles.deliveryTypeActive,
          ]}
          onPress={() =>
            seleccionarTipoEntrega(
              "Recoger"
            )
          }
        >
          <Text
            style={[
              styles.deliveryTypeText,
              tipoEntrega === "Recoger" &&
                styles.deliveryTypeActiveText,
            ]}
          >
            RECOGER
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        Para entregarte tu pedido necesitamos
        conocer dónde deseas recibirlo.
      </Text>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={solicitarUbicacion}
        disabled={cargandoUbicacion}
      >
        {cargandoUbicacion ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              color="#FFFFFF"
            />

            <Text
              style={
                styles.locationButtonText
              }
            >
              OBTENIENDO UBICACIÓN...
            </Text>
          </View>
        ) : (
          <Text
            style={
              styles.locationButtonText
            }
          >
            📍 USAR MI UBICACIÓN ACTUAL
          </Text>
        )}
      </TouchableOpacity>

      {ubicacion && (
        <>
          <View style={styles.mapContainer}>
            {!mapaCargado && (
              <View
                style={
                  styles.mapLoadingContainer
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#E53935"
                />

                <Text
                  style={
                    styles.mapLoadingText
                  }
                >
                  Cargando mapa...
                </Text>
              </View>
            )}

            <WebView
              ref={webViewRef}
              style={styles.map}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              source={{
                html: generarMapaHtml(
                  ubicacion.latitude,
                  ubicacion.longitude
                ),
              }}
              onMessage={async (event) => {
                try {
                  const data =
                    JSON.parse(
                      event.nativeEvent.data
                    );

                  if (
                    data.type ===
                    "mapReady"
                  ) {
                    setMapaCargado(true);

                    return;
                  }

                  if (
                    data.type ===
                    "locationChanged"
                  ) {
                    await actualizarUbicacion(
                      data.latitude,
                      data.longitude
                    );
                  }
                } catch {
                  console.log(
                    "Mensaje inválido del mapa"
                  );
                }
              }}
            />
          </View>

          <View
            style={
              styles.locationResult
            }
          >
            <Text
              style={
                styles.locationResultTitle
              }
            >
              📍 Dirección seleccionada
            </Text>

            <Text
              style={
                styles.locationResultText
              }
            >
              {direccionDetectada ||
                "Buscando dirección..."}
            </Text>

            <Text
              style={styles.helpText}
            >
              Si el punto no está exactamente
              donde deseas recibir el pedido,
              mantén presionado el marcador
              del mapa y arrástralo.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmarUbicacion}
          >
            <Text
              style={
                styles.confirmButtonText
              }
            >
              CONFIRMAR UBICACIÓN
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.separatorRow}>
        <View style={styles.separator} />

        <Text style={styles.orText}>
          o escribe tu dirección
        </Text>

        <View style={styles.separator} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Ej. Zona, calle, avenida, referencia..."
        value={direccionManual}
        onChangeText={
          setDireccionManual
        }
        multiline
      />

      <TouchableOpacity
        style={styles.continueButton}
        onPress={
          continuarDireccionManual
        }
      >
        <Text
          style={
            styles.continueButtonText
          }
        >
          CONTINUAR CON ESTA DIRECCIÓN
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 25,
  },

  deliveryTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E53935",
    marginBottom: 20,
  },

  deliveryTypeButton: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },

  deliveryTypeActive: {
    backgroundColor: "#E53935",
  },

  deliveryTypeActiveText: {
    color: "#FFFFFF",
  },

  deliveryTypeText: {
    color: "#E53935",
    fontWeight: "bold",
  },

  infoText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    lineHeight: 21,
  },

  locationButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  locationButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  mapContainer: {
    height: 320,
    marginTop: 18,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EEEEEE",
  },

  map: {
    flex: 1,
    backgroundColor: "transparent",
  },

  mapLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },

  mapLoadingText: {
    marginTop: 10,
    color: "#666",
  },

  locationResult: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    elevation: 2,
  },

  locationResultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  locationResultText: {
    color: "#444",
    fontSize: 15,
    lineHeight: 21,
  },

  helpText: {
    marginTop: 10,
    color: "#777",
    fontSize: 13,
    lineHeight: 18,
  },

  confirmButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  separator: {
    flex: 1,
    height: 1,
    backgroundColor: "#CCCCCC",
  },

  orText: {
    marginHorizontal: 10,
    color: "#777",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 15,
    minHeight: 90,
    textAlignVertical: "top",
  },

  continueButton: {
    backgroundColor: "#E53935",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },

  continueButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});