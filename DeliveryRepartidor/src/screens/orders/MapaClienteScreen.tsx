import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import * as Location
  from "expo-location";

import {
  WebView,
} from "react-native-webview";

import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type {
  RootStackParamList,
} from "../../navigation/AppNavigator";

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    "MapaCliente"
  >;

type Coordenadas = {
  latitud: number;
  longitud: number;
};

export default function MapaClienteScreen({
  route,
}: Props) {
  const {
    clienteNombre,
    direccionEntrega,
    latitudEntrega,
    longitudEntrega,
  } = route.params;

  const [
    miUbicacion,
    setMiUbicacion,
  ] =
    useState<Coordenadas | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarUbicacion();
  }, []);

  async function cargarUbicacion() {
    try {
      setCargando(true);
      setMensaje("");

      const permisos =
        await Location
          .requestForegroundPermissionsAsync();

      if (
        permisos.status !==
        "granted"
      ) {
        setMensaje(
          "Necesitamos permiso de ubicación para mostrar tu posición en el mapa."
        );

        return;
      }

      const ubicacion =
        await Location
          .getCurrentPositionAsync({
            accuracy:
              Location.Accuracy.High,
          });

      setMiUbicacion({
        latitud:
          ubicacion.coords.latitude,

        longitud:
          ubicacion.coords.longitude,
      });
    } catch {
      setMensaje(
        "No se pudo obtener tu ubicación actual."
      );
    } finally {
      setCargando(false);
    }
  }

  const htmlMapa =
    useMemo(() => {
      if (
        !miUbicacion ||
        latitudEntrega == null ||
        longitudEntrega == null
      ) {
        return "";
      }

      return `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
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

    body {
      background: #f5f7f6;
    }

    .leaflet-control-attribution {
      font-size: 9px;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  ></script>

  <script>
    const repartidor = [
      ${miUbicacion.latitud},
      ${miUbicacion.longitud}
    ];

    const cliente = [
      ${latitudEntrega},
      ${longitudEntrega}
    ];

    const map =
      L.map("map");

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap"
      }
    ).addTo(map);

    const marcadorRepartidor =
      L.marker(repartidor)
        .addTo(map)
        .bindPopup("Tu ubicación");

    const marcadorCliente =
      L.marker(cliente)
        .addTo(map)
        .bindPopup(
          ${JSON.stringify(
            clienteNombre
          )}
        );

    const linea =
      L.polyline(
        [
          repartidor,
          cliente
        ],
        {
          weight: 5
        }
      ).addTo(map);

    const grupo =
      L.featureGroup([
        marcadorRepartidor,
        marcadorCliente,
        linea
      ]);

    map.fitBounds(
      grupo.getBounds(),
      {
        padding: [40, 40]
      }
    );
  </script>
</body>
</html>
      `;
    }, [
      miUbicacion,
      latitudEntrega,
      longitudEntrega,
      clienteNombre,
    ]);

  if (cargando) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#20a85a"
        />

        <Text
          style={styles.loadingText}
        >
          Cargando mapa...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    latitudEntrega == null ||
    longitudEntrega == null
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.messageCard}
        >
          <Text
            style={styles.messageTitle}
          >
            Ubicación del cliente no disponible
          </Text>

          <Text
            style={styles.messageText}
          >
            Este pedido no tiene
            coordenadas de entrega
            registradas.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!miUbicacion) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.messageCard}
        >
          <Text
            style={styles.messageTitle}
          >
            No pudimos obtener tu
            ubicación
          </Text>

          <Text
            style={styles.messageText}
          >
            {mensaje ||
              "Activa la ubicación del dispositivo e intenta nuevamente."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >
      <View
        style={styles.infoCard}
      >
        <Text
          style={styles.label}
        >
          Entregar a
        </Text>

        <Text
          style={
            styles.clientName
          }
        >
          {clienteNombre}
        </Text>

        <Text
          style={styles.address}
        >
          📍 {direccionEntrega}
        </Text>
      </View>

      <View
        style={styles.mapContainer}
      >
        <WebView
          originWhitelist={["*"]}
          source={{
            html: htmlMapa,
          }}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webview}
        />
      </View>

      <View
        style={styles.legend}
      >
        <View
          style={styles.legendRow}
        >
          <Text
            style={styles.legendIcon}
          >
            🛵
          </Text>

          <Text
            style={styles.legendText}
          >
            Tu ubicación
          </Text>
        </View>

        <View
          style={styles.legendRow}
        >
          <Text
            style={styles.legendIcon}
          >
            🏠
          </Text>

          <Text
            style={styles.legendText}
          >
            {clienteNombre}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f7f6",
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f7f6",
    },

    loadingText: {
      marginTop: 12,
      color: "#666",
    },

    infoCard: {
      backgroundColor: "#ffffff",
      margin: 16,
      marginBottom: 10,
      borderRadius: 16,
      padding: 16,
      elevation: 2,
    },

    label: {
      color: "#20a85a",
      fontSize: 12,
      fontWeight: "900",
    },

    clientName: {
      fontSize: 20,
      fontWeight: "900",
      color: "#222",
      marginTop: 4,
    },

    address: {
      color: "#666",
      marginTop: 6,
    },

    mapContainer: {
      flex: 1,
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#ddd",
    },

    webview: {
      flex: 1,
      backgroundColor: "#ddd",
    },

    legend: {
      backgroundColor: "#ffffff",
      margin: 16,
      borderRadius: 16,
      padding: 14,
      elevation: 2,
    },

    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 4,
    },

    legendIcon: {
      fontSize: 18,
      width: 30,
    },

    legendText: {
      color: "#333",
      fontWeight: "700",
    },

    messageCard: {
      backgroundColor: "#ffffff",
      margin: 20,
      borderRadius: 16,
      padding: 24,
      elevation: 2,
    },

    messageTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#222",
      textAlign: "center",
    },

    messageText: {
      color: "#666",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },
  });