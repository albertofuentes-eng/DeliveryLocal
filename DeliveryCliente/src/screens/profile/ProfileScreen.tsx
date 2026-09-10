import React, {
  useCallback,
  useState,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  obtenerMiSolicitudRepartidor,
  type SolicitudRepartidorCliente,
} from "../../services/api";

export default function ProfileScreen() {
  const navigation =
    useNavigation<any>();

  const {
    usuario,
    token,
    cerrarSesion,
  } = useAuth();

  const [
    solicitud,
    setSolicitud,
  ] =
    useState<SolicitudRepartidorCliente | null>(
      null
    );

  const [
    cargandoSolicitud,
    setCargandoSolicitud,
  ] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarSolicitud();
    }, [token])
  );

  async function cargarSolicitud() {
    if (!token) {
      setSolicitud(null);
      return;
    }

    try {
      setCargandoSolicitud(true);

      const data =
        await obtenerMiSolicitudRepartidor(
          token
        );

      setSolicitud(data);
    } catch {
      setSolicitud(null);
    } finally {
      setCargandoSolicitud(false);
    }
  }

  async function handleLogout() {
    await cerrarSesion();
  }

  function obtenerEstadoSolicitud() {
    if (
      usuario?.rol ===
      "Repartidor"
    ) {
      return "Aprobada";
    }

    return solicitud?.estado;
  }

  const estadoSolicitud =
    obtenerEstadoSolicitud();

  function obtenerColorEstado() {
    if (
      estadoSolicitud ===
      "Aprobada"
    ) {
      return "#20A85A";
    }

    if (
      estadoSolicitud ===
      "Rechazada"
    ) {
      return "#E53935";
    }

    if (
      estadoSolicitud ===
      "Pendiente"
    ) {
      return "#C58A00";
    }

    return "#222";
  }

  function obtenerTituloRepartidor() {
    if (
      usuario?.rol ===
      "Repartidor"
    ) {
      return "Mi cuenta de repartidor";
    }

    if (solicitud) {
      return "Mi solicitud de repartidor";
    }

    return "Quiero ser repartidor";
  }

  function obtenerDescripcionRepartidor() {
    if (
      usuario?.rol ===
      "Repartidor"
    ) {
      return "Tu solicitud fue aprobada. Ya puedes usar DeliveryRepartidor.";
    }

    if (
      solicitud?.estado ===
      "Pendiente"
    ) {
      return "Tu solicitud está siendo revisada por DeliveryLocal.";
    }

    if (
      solicitud?.estado ===
      "Rechazada"
    ) {
      return "Tu solicitud fue revisada. Consulta el resultado.";
    }

    return "Envía una solicitud para trabajar con DeliveryLocal.";
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View
        style={styles.avatar}
      >
        <MaterialIcons
          name="person"
          size={65}
          color="#E53935"
        />
      </View>

      <Text
        style={styles.title}
      >
        Mi perfil
      </Text>

      {usuario ? (
        <>
          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Nombre
            </Text>

            <Text
              style={styles.value}
            >
              {usuario.nombre}
            </Text>
          </View>

          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Correo
            </Text>

            <Text
              style={styles.value}
            >
              {usuario.correo}
            </Text>
          </View>

          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Teléfono
            </Text>

            <Text
              style={styles.value}
            >
              {usuario.telefono ||
                "No registrado"}
            </Text>
          </View>

          <View
            style={styles.card}
          >
            <Text
              style={styles.label}
            >
              Rol
            </Text>

            <Text
              style={styles.value}
            >
              {usuario.rol}
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.ordersButton
            }
            onPress={() =>
              navigation.navigate(
                "MisPedidos"
              )
            }
          >
            <MaterialIcons
              name="receipt-long"
              size={22}
              color="#E53935"
            />

            <Text
              style={
                styles.ordersText
              }
            >
              Mis pedidos
            </Text>
          </TouchableOpacity>

          {usuario.rol ===
            "Cliente" ||
          usuario.rol ===
            "Repartidor" ? (
            <TouchableOpacity
              style={
                styles.driverButton
              }
              onPress={() =>
                navigation.navigate(
                  "SolicitudRepartidor"
                )
              }
            >
              <MaterialIcons
                name="delivery-dining"
                size={26}
                color="#fff"
              />

              <View
                style={
                  styles.driverContent
                }
              >
                <Text
                  style={
                    styles.driverTitle
                  }
                >
                  {obtenerTituloRepartidor()}
                </Text>

                <Text
                  style={
                    styles.driverSubtitle
                  }
                >
                  {cargandoSolicitud
                    ? "Consultando estado..."
                    : obtenerDescripcionRepartidor()}
                </Text>

                {estadoSolicitud ? (
                  <View
                    style={
                      styles.statusRow
                    }
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            obtenerColorEstado(),
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            obtenerColorEstado(),
                        },
                      ]}
                    >
                      {
                        estadoSolicitud
                      }
                    </Text>
                  </View>
                ) : null}
              </View>

              <MaterialIcons
                name="chevron-right"
                size={27}
                color="#fff"
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
          >
            <MaterialIcons
              name="logout"
              size={22}
              color="#fff"
            />

            <Text
              style={
                styles.logoutText
              }
            >
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text
          style={styles.noUser}
        >
          No hay una sesión activa.
        </Text>
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F8F8F8",
    },

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    avatar: {
      alignSelf: "center",
      marginTop: 35,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor:
        "#FDECEC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    title: {
      textAlign: "center",
      fontSize: 28,
      fontWeight: "bold",
      marginTop: 15,
      marginBottom: 30,
    },

    card: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
    },

    label: {
      fontSize: 13,
      color: "#777",
      marginBottom: 5,
    },

    value: {
      fontSize: 17,
      fontWeight: "600",
    },

    ordersButton: {
      borderWidth: 1,
      borderColor: "#E53935",
      borderRadius: 10,
      padding: 15,
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff",
    },

    ordersText: {
      color: "#E53935",
      fontSize: 17,
      fontWeight: "bold",
    },

    driverButton: {
      backgroundColor: "#222",
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    driverContent: {
      flex: 1,
    },

    driverTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },

    driverSubtitle: {
      color: "#DDD",
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },

    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    statusText: {
      fontSize: 12,
      fontWeight: "800",
    },

    logoutButton: {
      backgroundColor: "#E53935",
      borderRadius: 10,
      padding: 15,
      marginTop: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },

    logoutText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "bold",
    },

    noUser: {
      textAlign: "center",
      color: "#777",
    },
  });