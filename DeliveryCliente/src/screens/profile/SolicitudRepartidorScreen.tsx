import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  crearSolicitudRepartidor,
  obtenerMiSolicitudRepartidor,
  type SolicitudRepartidorCliente,
} from "../../services/api";

export default function SolicitudRepartidorScreen() {
  const {
    token,
    usuario,
  } = useAuth();

  const [
    tipoVehiculo,
    setTipoVehiculo,
  ] = useState("Moto");

  const [
    placa,
    setPlaca,
  ] = useState("");

  const [
    solicitud,
    setSolicitud,
  ] =
    useState<SolicitudRepartidorCliente | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  useEffect(() => {
    cargarSolicitud();
  }, [token]);

  async function cargarSolicitud() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data =
        await obtenerMiSolicitudRepartidor(
          token
        );

      setSolicitud(data);
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo consultar tu solicitud."
      );
    } finally {
      setCargando(false);
    }
  }

  async function enviarSolicitud() {
    if (!token) {
      return;
    }

    if (
      !tipoVehiculo.trim()
    ) {
      Alert.alert(
        "Datos incompletos",
        "Ingresa el tipo de vehículo."
      );

      return;
    }

    Alert.alert(
      "Enviar solicitud",
      "¿Deseas enviar tu solicitud para trabajar como repartidor?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Enviar",
          onPress:
            confirmarEnvio,
        },
      ]
    );
  }

  async function confirmarEnvio() {
    if (!token) {
      return;
    }

    try {
      setEnviando(true);
      setMensaje("");

      await crearSolicitudRepartidor(
        token,
        {
          tipoVehiculo:
            tipoVehiculo.trim(),

          placa:
            placa.trim()
              ? placa
                  .trim()
                  .toUpperCase()
              : null,
        }
      );

      Alert.alert(
        "Solicitud enviada",
        "Tu solicitud fue enviada correctamente y será revisada por DeliveryLocal."
      );

      await cargarSolicitud();
    } catch (error: any) {
      setMensaje(
        error.message ||
          "No se pudo enviar la solicitud."
      );
    } finally {
      setEnviando(false);
    }
  }

  function colorEstado(
    estado?: string
  ) {
    if (
      estado === "Aprobada"
    ) {
      return "#20A85A";
    }

    if (
      estado === "Rechazada"
    ) {
      return "#E53935";
    }

    return "#C58A00";
  }

  if (cargando) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#E53935"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Consultando tu solicitud...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <View
        style={styles.iconBox}
      >
        <MaterialIcons
          name="delivery-dining"
          size={52}
          color="#E53935"
        />
      </View>

      <Text
        style={styles.title}
      >
        Quiero ser repartidor
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Forma parte de DeliveryLocal
        realizando entregas para los
        clientes de la plataforma.
      </Text>

      {usuario?.rol ===
      "Repartidor" ? (
        <View
          style={
            styles.approvedCard
          }
        >
          <MaterialIcons
            name="check-circle"
            size={38}
            color="#20A85A"
          />

          <Text
            style={
              styles.approvedTitle
            }
          >
            Ya eres repartidor
          </Text>

          <Text
            style={
              styles.approvedText
            }
          >
            Tu cuenta ya tiene el rol
            de Repartidor. Puedes usar
            la aplicación
            DeliveryRepartidor.
          </Text>
        </View>
      ) : solicitud ? (
        <View
          style={
            styles.statusCard
          }
        >
          <Text
            style={
              styles.statusLabel
            }
          >
            ESTADO DE TU SOLICITUD
          </Text>

          <Text
            style={[
              styles.statusValue,
              {
                color:
                  colorEstado(
                    solicitud.estado
                  ),
              },
            ]}
          >
            {solicitud.estado ||
              "Pendiente"}
          </Text>

          <View
            style={styles.divider}
          />

          <View
            style={styles.infoRow}
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              Vehículo
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {solicitud.tipoVehiculo ||
                "Sin información"}
            </Text>
          </View>

          <View
            style={styles.infoRow}
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              Placa
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {solicitud.placa ||
                "Sin placa"}
            </Text>
          </View>

          {solicitud.observacion ? (
            <View
              style={
                styles.observationBox
              }
            >
              <Text
                style={
                  styles.observationTitle
                }
              >
                Observación
              </Text>

              <Text
                style={
                  styles.observationText
                }
              >
                {
                  solicitud.observacion
                }
              </Text>
            </View>
          ) : null}

          {solicitud.estado ===
          "Pendiente" ? (
            <Text
              style={
                styles.helpText
              }
            >
              Tu solicitud está siendo
              revisada por
              DeliveryLocal.
            </Text>
          ) : null}

          {solicitud.estado ===
          "Aprobada" ? (
            <Text
              style={
                styles.successText
              }
            >
              Tu solicitud fue
              aprobada. Cierra sesión
              y vuelve a iniciar
              sesión para actualizar
              los permisos de tu
              cuenta.
            </Text>
          ) : null}

          {solicitud.estado ===
          "Rechazada" ? (
            <Text
              style={
                styles.rejectedText
              }
            >
              Esta solicitud fue
              rechazada. Por ahora no
              puedes ingresar como
              repartidor.
            </Text>
          ) : null}
        </View>
      ) : (
        <>
          <View
            style={styles.infoCard}
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              🛵 Trabaja con
              DeliveryLocal
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Envía tus datos y un
              administrador revisará
              tu solicitud antes de
              habilitarte como
              repartidor.
            </Text>
          </View>

          <Text
            style={
              styles.label
            }
          >
            Tipo de vehículo
          </Text>

          <View
            style={
              styles.vehicleOptions
            }
          >
            {[
              "Moto",
              "Carro",
              "Bicicleta",
            ].map(
              (tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.vehicleButton,

                    tipoVehiculo ===
                    tipo
                      ? styles.vehicleButtonActive
                      : null,
                  ]}
                  onPress={() =>
                    setTipoVehiculo(
                      tipo
                    )
                  }
                >
                  <Text
                    style={[
                      styles.vehicleButtonText,

                      tipoVehiculo ===
                      tipo
                        ? styles.vehicleButtonTextActive
                        : null,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text
            style={
              styles.label
            }
          >
            Placa
          </Text>

          <TextInput
            value={placa}
            onChangeText={
              setPlaca
            }
            placeholder="Ej. ABC-123"
            autoCapitalize="characters"
            style={styles.input}
          />

          <Text
            style={
              styles.optionalText
            }
          >
            Si tu vehículo no utiliza
            placa, puedes dejar este
            campo vacío.
          </Text>

          {mensaje ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {mensaje}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitButton,

              enviando
                ? styles.disabledButton
                : null,
            ]}
            disabled={enviando}
            onPress={
              enviarSolicitud
            }
          >
            {enviando ? (
              <ActivityIndicator
                color="#fff"
              />
            ) : (
              <>
                <MaterialIcons
                  name="send"
                  size={20}
                  color="#fff"
                />

                <Text
                  style={
                    styles.submitText
                  }
                >
                  ENVIAR SOLICITUD
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {mensaje &&
      solicitud ? (
        <View
          style={
            styles.errorBox
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {mensaje}
          </Text>
        </View>
      ) : null}
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

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F8F8F8",
    },

    loadingText: {
      marginTop: 12,
      color: "#777",
    },

    iconBox: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignSelf:
        "center",
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#FDECEC",
      marginTop: 20,
    },

    title: {
      fontSize: 27,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 16,
      color: "#222",
    },

    subtitle: {
      textAlign: "center",
      color: "#777",
      lineHeight: 20,
      marginTop: 8,
      marginBottom: 24,
    },

    infoCard: {
      backgroundColor:
        "#fff",
      borderRadius: 14,
      padding: 18,
      marginBottom: 22,
      elevation: 2,
    },

    infoTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: "#222",
    },

    description: {
      color: "#666",
      lineHeight: 20,
      marginTop: 8,
    },

    label: {
      fontSize: 15,
      fontWeight: "700",
      color: "#333",
      marginBottom: 9,
      marginTop: 8,
    },

    vehicleOptions: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },

    vehicleButton: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        "#D8D8D8",
      backgroundColor:
        "#fff",
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },

    vehicleButtonActive: {
      backgroundColor:
        "#E53935",
      borderColor:
        "#E53935",
    },

    vehicleButtonText: {
      color: "#555",
      fontWeight: "700",
    },

    vehicleButtonTextActive: {
      color: "#fff",
    },

    input: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#DDD",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 16,
    },

    optionalText: {
      color: "#888",
      fontSize: 12,
      marginTop: 7,
      lineHeight: 17,
    },

    submitButton: {
      marginTop: 25,
      backgroundColor:
        "#E53935",
      borderRadius: 10,
      paddingVertical: 15,
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 8,
    },

    disabledButton: {
      opacity: 0.6,
    },

    submitText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
    },

    statusCard: {
      backgroundColor:
        "#fff",
      borderRadius: 15,
      padding: 20,
      elevation: 2,
    },

    statusLabel: {
      fontSize: 12,
      color: "#777",
      fontWeight: "700",
    },

    statusValue: {
      marginTop: 5,
      fontSize: 25,
      fontWeight: "900",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#EEE",
      marginVertical: 18,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 14,
      gap: 15,
    },

    infoLabel: {
      color: "#777",
    },

    infoValue: {
      fontWeight: "700",
      color: "#222",
    },

    observationBox: {
      backgroundColor:
        "#F4F4F4",
      borderRadius: 10,
      padding: 14,
      marginTop: 5,
    },

    observationTitle: {
      fontWeight: "700",
      color: "#444",
    },

    observationText: {
      color: "#666",
      marginTop: 5,
    },

    helpText: {
      color: "#9A6700",
      backgroundColor:
        "#FFF6D8",
      padding: 13,
      borderRadius: 10,
      marginTop: 15,
      lineHeight: 19,
    },

    successText: {
      color: "#19894A",
      backgroundColor:
        "#E7F7ED",
      padding: 13,
      borderRadius: 10,
      marginTop: 15,
      lineHeight: 19,
    },

    rejectedText: {
      color: "#C62828",
      backgroundColor:
        "#FFF0F0",
      padding: 13,
      borderRadius: 10,
      marginTop: 15,
      lineHeight: 19,
    },

    approvedCard: {
      backgroundColor:
        "#fff",
      borderRadius: 15,
      padding: 25,
      alignItems:
        "center",
      elevation: 2,
    },

    approvedTitle: {
      marginTop: 10,
      fontSize: 21,
      fontWeight: "800",
      color: "#222",
    },

    approvedText: {
      textAlign:
        "center",
      color: "#666",
      lineHeight: 20,
      marginTop: 8,
    },

    errorBox: {
      backgroundColor:
        "#FFF0F0",
      borderRadius: 10,
      padding: 12,
      marginTop: 15,
    },

    errorText: {
      color: "#C62828",
      textAlign: "center",
    },
  });