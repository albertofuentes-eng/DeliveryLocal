import {
  useCallback,
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

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import type {
  CompositeNavigationProp,
} from "@react-navigation/native";

import type {
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import * as Location from "expo-location";

import type {
  BottomTabParamList,
} from "../../navigation/BottomTabs";

import type {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  actualizarDisponibilidad,
  actualizarUbicacion,
  obtenerMiPerfil,
  obtenerPedidosDisponibles,
  obtenerMiPedido,
  type PedidoDisponible,
  type DetallePedidoRepartidor,
  type PerfilRepartidor,
} from "../../services/api";

type HomeNavigation =
  CompositeNavigationProp<
    BottomTabNavigationProp<
      BottomTabParamList,
      "Inicio"
    >,
    NativeStackNavigationProp<
      RootStackParamList
    >
  >;

export default function HomeScreen() {
  const navigation =
    useNavigation<HomeNavigation>();

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
    pedidoActivo,
    setPedidoActivo,
  ] =
    useState<DetallePedidoRepartidor | null>(
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

  useFocusEffect(
    useCallback(() => {
      cargarInicio(false);
    }, [token])
  );

  async function cargarInicio(
    mostrarCarga = true
  ) {
    if (!token) {
      return;
    }

    try {
      if (mostrarCarga) {
        setCargando(true);
      }

      setMensaje("");

      const perfilData =
        await obtenerMiPerfil(
          token
        );

      setPerfil(perfilData);

      const activo =
        await obtenerMiPedido(
          token
        );

      setPedidoActivo(activo);

      if (
        perfilData.disponible &&
        !activo
      ) {
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
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }

  async function obtenerYEnviarUbicacion() {
    if (!token) {
      return false;
    }

    const permisos =
      await Location
        .requestForegroundPermissionsAsync();

    if (
      permisos.status !== "granted"
    ) {
      setMensaje(
        "Necesitamos permiso de ubicación para mostrarte pedidos cercanos."
      );

      return false;
    }

    const ubicacion =
      await Location
        .getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.High,
        });

    await actualizarUbicacion(
      token,
      ubicacion.coords.latitude,
      ubicacion.coords.longitude
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

      if (pedidoActivo) {
        setMensaje(
          "No puedes cambiar tu disponibilidad mientras tienes una entrega en curso."
        );

        return;
      }

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

  function verPedido(
    pedidoId: number
  ) {
    navigation.navigate(
      "DetallePedido",
      {
        pedidoId,
      }
    );
  }

  function continuarPedidoActivo() {
    navigation.navigate(
      "PedidoActivo"
    );
  }

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

        {/* ESTADO */}
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

            <View style={{ flex: 1 }}>
              <Text
                style={styles.statusTitle}
              >
                {pedidoActivo
                  ? "Ocupado"
                  : perfil?.disponible
                  ? "Disponible"
                  : "No disponible"}
              </Text>

              <Text
                style={
                  styles.statusSubtitle
                }
              >
                {pedidoActivo
                  ? "Tienes una entrega en curso."
                  : perfil?.disponible
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
              disabled={
                !!pedidoActivo
              }
              onValueChange={
                cambiarDisponibilidad
              }
            />
          )}
        </View>

        {/* VEHÍCULO */}
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

        {/* PEDIDO ACTIVO */}
        {pedidoActivo ? (
          <View
            style={
              styles.activeOrderCard
            }
          >
            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.activeOrderLabel
                }
              >
                PEDIDO EN CURSO
              </Text>

              <Text
                style={
                  styles.activeOrderTitle
                }
              >
                Pedido #{pedidoActivo.id}
              </Text>

              <Text
                style={
                  styles.activeOrderCommerce
                }
              >
                {
                  pedidoActivo.comercio
                    .nombre
                }
              </Text>

              <Text
                style={
                  styles.activeOrderState
                }
              >
                {pedidoActivo.estado}
              </Text>
            </View>

            <Pressable
              style={
                styles.activeOrderButton
              }
              onPress={
                continuarPedidoActivo
              }
            >
              <Text
                style={
                  styles.activeOrderButtonText
                }
              >
                VER
              </Text>
            </Pressable>
          </View>
        ) : null}

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

        {/* PEDIDOS DISPONIBLES */}
        {perfil?.disponible &&
        !pedidoActivo ? (
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
                        style={styles.bold}
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
                      onPress={() =>
                        verPedido(
                          pedido.id
                        )
                      }
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
        ) : pedidoActivo ? (
          <View
            style={styles.busyCard}
          >
            <Text
              style={styles.busyIcon}
            >
              🛵
            </Text>

            <Text
              style={styles.busyTitle}
            >
              Tienes una entrega en curso
            </Text>

            <Text
              style={styles.busyText}
            >
              Completa tu pedido actual
              antes de recibir uno nuevo.
            </Text>

            <Pressable
              style={
                styles.busyButton
              }
              onPress={
                continuarPedidoActivo
              }
            >
              <Text
                style={
                  styles.busyButtonText
                }
              >
                CONTINUAR ENTREGA
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={styles.offlineCard}
          >
            <Text
              style={
                styles.offlineIcon
              }
            >
              📍
            </Text>

            <Text
              style={
                styles.offlineTitle
              }
            >
              Activa tu disponibilidad
            </Text>

            <Text
              style={
                styles.offlineText
              }
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
      backgroundColor: "#fff",
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
    },

    vehicleCard: {
      backgroundColor: "#fff",
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

    activeOrderCard: {
      backgroundColor: "#e8f7ee",
      borderRadius: 16,
      padding: 17,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    activeOrderLabel: {
      color: "#19894a",
      fontSize: 11,
      fontWeight: "900",
    },

    activeOrderTitle: {
      fontSize: 19,
      fontWeight: "900",
      color: "#222",
      marginTop: 3,
    },

    activeOrderCommerce: {
      color: "#444",
      marginTop: 4,
      fontWeight: "600",
    },

    activeOrderState: {
      color: "#19894a",
      marginTop: 4,
      fontWeight: "700",
    },

    activeOrderButton: {
      backgroundColor: "#20a85a",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    activeOrderButtonText: {
      color: "#fff",
      fontWeight: "900",
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
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 30,
      alignItems: "center",
      gap: 10,
    },

    emptyCard: {
      backgroundColor: "#fff",
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
      backgroundColor: "#fff",
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
      color: "#fff",
      fontWeight: "800",
    },

    busyCard: {
      backgroundColor: "#ffffff",
      borderRadius: 16,
      padding: 25,
      alignItems: "center",
      elevation: 2,
    },

    busyIcon: {
      fontSize: 38,
    },

    busyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#222",
      marginTop: 10,
    },

    busyText: {
      color: "#777",
      textAlign: "center",
      marginTop: 6,
      lineHeight: 19,
    },

    busyButton: {
      backgroundColor: "#20a85a",
      width: "100%",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
      marginTop: 18,
    },

    busyButtonText: {
      color: "#fff",
      fontWeight: "900",
    },

    offlineCard: {
      backgroundColor: "#fff",
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