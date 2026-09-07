import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import * as Location
  from "expo-location";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  actualizarDisponibilidad,
  actualizarUbicacion,
  obtenerMiPerfil,
  obtenerPedidosDisponibles,
  type PedidoDisponible,
  type PerfilRepartidor,
} from "../../services/api";

export default function HomeScreen() {
  const {
    usuario,
    token,
    cerrarSesion,
  } = useAuth();

  const [
    perfil,
    setPerfil,
  ] = useState<PerfilRepartidor | null>(
    null
  );

  const [
    pedidos,
    setPedidos,
  ] = useState<PedidoDisponible[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    cambiandoDisponibilidad,
    setCambiandoDisponibilidad,
  ] = useState(false);

  const [
    cargandoPedidos,
    setCargandoPedidos,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarInicio();
  }, []);

  async function cargarInicio() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const perfilData =
        await obtenerMiPerfil(
          token
        );

      setPerfil(perfilData);

      if (perfilData.disponible) {
        await cargarPedidos();
      } else {
        setPedidos([]);
      }
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cargar la información."
      );
    } finally {
      setCargando(false);
    }
  }

  async function obtenerYEnviarUbicacion() {
    if (!token) {
      return false;
    }

    const permisos =
      await Location.requestForegroundPermissionsAsync();

    if (
      permisos.status !== "granted"
    ) {
      setMensaje(
        "Necesitamos permiso de ubicación para mostrarte pedidos cercanos."
      );

      return false;
    }

    const ubicacion =
      await Location.getCurrentPositionAsync({
        accuracy:
          Location.Accuracy.High,
      });

    const latitud =
      ubicacion.coords.latitude;

    const longitud =
      ubicacion.coords.longitude;

    await actualizarUbicacion(
      token,
      latitud,
      longitud
    );

    return true;
  }

  async function cambiarDisponibilidad(
    nuevoEstado: boolean
  ) {
    if (
      !token ||
      cambiandoDisponibilidad
    ) {
      return;
    }

    try {
      setCambiandoDisponibilidad(
        true
      );

      setMensaje("");

      // Para ponerse disponible
      // necesitamos saber dónde está.
      if (nuevoEstado) {
        const ubicacionCorrecta =
          await obtenerYEnviarUbicacion();

        if (!ubicacionCorrecta) {
          return;
        }
      }

      await actualizarDisponibilidad(
        token,
        nuevoEstado
      );

      setPerfil((actual) =>
        actual
          ? {
              ...actual,
              disponible:
                nuevoEstado,
            }
          : actual
      );

      if (nuevoEstado) {
        setMensaje(
          "Ya estás disponible para recibir pedidos."
        );

        await cargarPedidos();
      } else {
        setPedidos([]);

        setMensaje(
          "Ahora estás fuera de servicio."
        );
      }
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo cambiar tu disponibilidad."
      );
    } finally {
      setCambiandoDisponibilidad(
        false
      );
    }
  }

  async function cargarPedidos() {
    if (!token) {
      return;
    }

    try {
      setCargandoPedidos(true);

      const data =
        await obtenerPedidosDisponibles(
          token
        );

      setPedidos(data);
    } catch (error: any) {
      setPedidos([]);

      setMensaje(
        error.message ||
          "No se pudieron cargar los pedidos."
      );
    } finally {
      setCargandoPedidos(false);
    }
  }

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#20a85a"
        />

        <Text
          style={styles.loadingText}
        >
          Cargando tu perfil...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View>
            <Text
              style={styles.welcome}
            >
              Hola,
            </Text>

            <Text
              style={styles.name}
            >
              {usuario?.nombre}
            </Text>
          </View>

          <View
            style={styles.roleBadge}
          >
            <Text
              style={styles.roleText}
            >
              Repartidor
            </Text>
          </View>
        </View>

        {/* DISPONIBILIDAD */}
        <View
          style={styles.statusCard}
        >
          <View
            style={
              styles.statusInfo
            }
          >
            <View
              style={[
                styles.statusDot,

                perfil?.disponible
                  ? styles.dotAvailable
                  : styles.dotUnavailable,
              ]}
            />

            <View>
              <Text
                style={styles.statusTitle}
              >
                {perfil?.disponible
                  ? "Disponible"
                  : "No disponible"}
              </Text>

              <Text
                style={
                  styles.statusSubtitle
                }
              >
                {perfil?.disponible
                  ? "Puedes recibir nuevos pedidos."
                  : "Actívate para comenzar a recibir pedidos."}
              </Text>
            </View>
          </View>

          {cambiandoDisponibilidad ? (
            <ActivityIndicator
              color="#20a85a"
            />
          ) : (
            <Switch
              value={
                perfil?.disponible ??
                false
              }
              onValueChange={
                cambiarDisponibilidad
              }
              trackColor={{
                false: "#cccccc",
                true: "#8ddca9",
              }}
              thumbColor={
                perfil?.disponible
                  ? "#20a85a"
                  : "#f4f4f4"
              }
            />
          )}
        </View>

        {/* INFORMACIÓN VEHÍCULO */}
        <View
          style={styles.vehicleCard}
        >
          <Text
            style={styles.sectionTitle}
          >
            Mi vehículo
          </Text>

          <View
            style={styles.vehicleRow}
          >
            <Text
              style={
                styles.vehicleLabel
              }
            >
              Tipo
            </Text>

            <Text
              style={
                styles.vehicleValue
              }
            >
              {perfil?.tipoVehiculo ||
                "Sin información"}
            </Text>
          </View>

          <View
            style={styles.vehicleRow}
          >
            <Text
              style={
                styles.vehicleLabel
              }
            >
              Placa
            </Text>

            <Text
              style={
                styles.vehicleValue
              }
            >
              {perfil?.placa ||
                "Sin placa"}
            </Text>
          </View>
        </View>

        {/* MENSAJE */}
        {mensaje ? (
          <View
            style={styles.messageBox}
          >
            <Text
              style={styles.messageText}
            >
              {mensaje}
            </Text>
          </View>
        ) : null}

        {/* PEDIDOS */}
        {perfil?.disponible ? (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Pedidos disponibles
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Pedidos listos para recoger.
                </Text>
              </View>

              <Pressable
                style={
                  styles.refreshButton
                }
                onPress={
                  cargarPedidos
                }
              >
                <Text
                  style={
                    styles.refreshText
                  }
                >
                  ACTUALIZAR
                </Text>
              </Pressable>
            </View>

            {cargandoPedidos ? (
              <View
                style={
                  styles.ordersLoading
                }
              >
                <ActivityIndicator
                  color="#20a85a"
                />

                <Text>
                  Buscando pedidos...
                </Text>
              </View>
            ) : pedidos.length ===
              0 ? (
              <View
                style={styles.emptyCard}
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  🛵
                </Text>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No hay pedidos disponibles
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Cuando un comercio tenga
                  un pedido listo para
                  recoger aparecerá aquí.
                </Text>
              </View>
            ) : (
              pedidos.map(
                (pedido) => (
                  <View
                    key={pedido.id}
                    style={
                      styles.orderCard
                    }
                  >
                    <View
                      style={
                        styles.orderHeader
                      }
                    >
                      <Text
                        style={
                          styles.orderTitle
                        }
                      >
                        Pedido #{pedido.id}
                      </Text>

                      <View
                        style={
                          styles.newBadge
                        }
                      >
                        <Text
                          style={
                            styles.newBadgeText
                          }
                        >
                          NUEVO
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.restaurantName
                      }
                    >
                      {
                        pedido.comercio
                          .nombre
                      }
                    </Text>

                    <Text
                      style={
                        styles.orderAddress
                      }
                    >
                      📍{" "}
                      {
                        pedido.comercio
                          .direccion
                      }
                    </Text>

                    <View
                      style={
                        styles.divider
                      }
                    />

                    <Text
                      style={
                        styles.clientText
                      }
                    >
                      Cliente:{" "}
                      <Text
                        style={
                          styles.bold
                        }
                      >
                        {
                          pedido.cliente
                            .nombre
                        }
                      </Text>
                    </Text>

                    <Text
                      style={
                        styles.orderAddress
                      }
                    >
                      Entrega:{" "}
                      {pedido.direccionEntrega ||
                        "Sin dirección"}
                    </Text>

                    <View
                      style={
                        styles.orderBottom
                      }
                    >
                      <Text
                        style={
                          styles.totalLabel
                        }
                      >
                        Total pedido
                      </Text>

                      <Text
                        style={
                          styles.totalValue
                        }
                      >
                        Q
                        {Number(
                          pedido.total
                        ).toFixed(2)}
                      </Text>
                    </View>

                    <Pressable
                      style={
                        styles.detailsButton
                      }
                      onPress={() => {
                        setMensaje(
                          `El siguiente paso será aceptar el pedido #${pedido.id}.`
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.detailsButtonText
                        }
                      >
                        VER PEDIDO
                      </Text>
                    </Pressable>
                  </View>
                )
              )
            )}
          </>
        ) : (
          <View
            style={styles.offlineCard}
          >
            <Text
              style={styles.offlineIcon}
            >
              📍
            </Text>

            <Text
              style={styles.offlineTitle}
            >
              Activa tu disponibilidad
            </Text>

            <Text
              style={styles.offlineText}
            >
              Cuando estés disponible,
              usaremos tu ubicación para
              mostrarte pedidos.
            </Text>
          </View>
        )}

        {/* CERRAR SESIÓN */}
        <Pressable
          style={styles.logout}
          onPress={cerrarSesion}
        >
          <Text
            style={styles.logoutText}
          >
            Cerrar sesión
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f7f6",
    },

    content: {
      padding: 20,
      paddingBottom: 40,
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

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 22,
    },

    welcome: {
      fontSize: 14,
      color: "#777",
    },

    name: {
      fontSize: 25,
      fontWeight: "800",
      color: "#181818",
    },

    roleBadge: {
      backgroundColor: "#e2f6e9",
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 20,
    },

    roleText: {
      color: "#19894a",
      fontWeight: "700",
    },

    statusCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 18,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 16,
      elevation: 2,
    },

    statusInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 10,
    },

    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },

    dotAvailable: {
      backgroundColor: "#20a85a",
    },

    dotUnavailable: {
      backgroundColor: "#999",
    },

    statusTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#202020",
    },

    statusSubtitle: {
      fontSize: 12,
      color: "#777",
      marginTop: 3,
      maxWidth: 220,
    },

    vehicleCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      elevation: 2,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
    },

    sectionSubtitle: {
      fontSize: 12,
      color: "#777",
      marginTop: 3,
    },

    vehicleRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 14,
    },

    vehicleLabel: {
      color: "#777",
    },

    vehicleValue: {
      fontWeight: "700",
      color: "#222",
    },

    messageBox: {
      backgroundColor: "#eef8f1",
      borderRadius: 12,
      padding: 13,
      marginBottom: 16,
    },

    messageText: {
      color: "#277a48",
      textAlign: "center",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 6,
      marginBottom: 14,
    },

    refreshButton: {
      borderWidth: 1,
      borderColor: "#20a85a",
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    refreshText: {
      color: "#20a85a",
      fontSize: 11,
      fontWeight: "800",
    },

    ordersLoading: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 30,
      alignItems: "center",
      gap: 10,
    },

    emptyCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 25,
      alignItems: "center",
      elevation: 2,
    },

    emptyIcon: {
      fontSize: 35,
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#222",
    },

    emptyText: {
      textAlign: "center",
      color: "#777",
      marginTop: 6,
      lineHeight: 19,
    },

    orderCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 18,
      marginBottom: 15,
      elevation: 3,
    },

    orderHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    orderTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
    },

    newBadge: {
      backgroundColor: "#fff1d2",
      borderRadius: 14,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    newBadgeText: {
      color: "#b17600",
      fontSize: 10,
      fontWeight: "800",
    },

    restaurantName: {
      marginTop: 14,
      fontWeight: "700",
      fontSize: 16,
    },

    orderAddress: {
      color: "#666",
      marginTop: 5,
      lineHeight: 19,
    },

    divider: {
      height: 1,
      backgroundColor: "#eeeeee",
      marginVertical: 14,
    },

    clientText: {
      color: "#444",
    },

    bold: {
      fontWeight: "700",
    },

    orderBottom: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 16,
      marginBottom: 14,
    },

    totalLabel: {
      color: "#666",
    },

    totalValue: {
      fontWeight: "800",
      fontSize: 18,
      color: "#222",
    },

    detailsButton: {
      backgroundColor: "#20a85a",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: "center",
    },

    detailsButtonText: {
      color: "#ffffff",
      fontWeight: "800",
    },

    offlineCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
      marginTop: 6,
      elevation: 2,
    },

    offlineIcon: {
      fontSize: 36,
    },

    offlineTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginTop: 10,
    },

    offlineText: {
      color: "#777",
      textAlign: "center",
      marginTop: 7,
      lineHeight: 19,
    },

    logout: {
      alignItems: "center",
      paddingVertical: 20,
      marginTop: 25,
    },

    logoutText: {
      color: "#d32f2f",
      fontWeight: "700",
    },
  });