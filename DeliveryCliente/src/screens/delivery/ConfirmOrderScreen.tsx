import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { crearPedido } from "../../services/api";

export default function ConfirmOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    carrito,
    subtotal,
    envio,
    vaciarCarrito,
  } = useCart();

  const { token } = useAuth();

  const [enviandoPedido, setEnviandoPedido] =
    useState(false);

  const {
    tipoEntrega,
    direccion,
    latitude,
    longitude,
    tipoTiempo,
    fechaProgramada,
    horaProgramada,
    telefono,
    referencia,
    indicaciones,
  } = route.params || {};

  const envioFinal =
    tipoEntrega === "Recoger"
      ? 0
      : envio;

  const totalFinal =
    subtotal + envioFinal;

  function construirFechaProgramada() {
    if (
      tipoTiempo !== "Despues" ||
      !fechaProgramada ||
      !horaProgramada
    ) {
      return null;
    }

    const partesFecha =
      fechaProgramada.split("/");

    if (partesFecha.length !== 3) {
      throw new Error(
        "La fecha programada no tiene un formato válido."
      );
    }

    const dia =
      Number(partesFecha[0]);

    const mes =
      Number(partesFecha[1]);

    const anio =
      Number(partesFecha[2]);

    const partesHora =
      horaProgramada.split(":");

    if (partesHora.length !== 2) {
      throw new Error(
        "La hora programada no tiene un formato válido."
      );
    }

    const hora =
      Number(partesHora[0]);

    const minuto =
      Number(partesHora[1]);

    if (
      Number.isNaN(dia) ||
      Number.isNaN(mes) ||
      Number.isNaN(anio) ||
      Number.isNaN(hora) ||
      Number.isNaN(minuto)
    ) {
      throw new Error(
        "La fecha u hora programada no es válida."
      );
    }

    const fecha =
      new Date(
        anio,
        mes - 1,
        dia,
        hora,
        minuto,
        0
      );

    return fecha.toISOString();
  }

  async function confirmarPedido() {
    if (carrito.length === 0) {
      Alert.alert(
        "Carrito vacío",
        "No hay productos para confirmar."
      );

      return;
    }

    if (!token) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión nuevamente."
      );

      return;
    }

    const comercioId =
      carrito[0].comercioId;

    const productosDeOtroComercio =
      carrito.some(
        (item) =>
          item.comercioId !== comercioId
      );

    if (productosDeOtroComercio) {
      Alert.alert(
        "Pedido inválido",
        "Todos los productos deben pertenecer al mismo comercio."
      );

      return;
    }

    try {
      setEnviandoPedido(true);

      const productos =
        carrito.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
        }));

      const fechaProgramadaApi =
        construirFechaProgramada();

      const pedido =
        await crearPedido(
          token,
          {
            comercioId,

            tipoEntrega,

            direccionEntrega:
              tipoEntrega === "Domicilio"
                ? direccion
                : null,

            latitudEntrega:
              tipoEntrega === "Domicilio"
                ? latitude
                : null,

            longitudEntrega:
              tipoEntrega === "Domicilio"
                ? longitude
                : null,

            telefonoEntrega:
              tipoEntrega === "Domicilio"
                ? telefono
                : null,

            referenciaEntrega:
              tipoEntrega === "Domicilio"
                ? referencia
                : null,

            indicacionesEntrega:
              tipoEntrega === "Domicilio"
                ? indicaciones || null
                : null,

            tipoTiempo,

            fechaProgramada:
              fechaProgramadaApi,

            productos,
          }
        );

            Alert.alert(
        "Pedido realizado ✅",
        `Tu pedido #${pedido.id} fue registrado correctamente.\n\nTotal: Q ${Number(
          pedido.total
        ).toFixed(2)}`,
        [
          {
            text: "VER MIS PEDIDOS",
            onPress: () => {
              vaciarCarrito();

              navigation.navigate(
                "MisPedidos"
              );
            },
          },
        ],
        {
          cancelable: false,
        }
      );


    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          "No se pudo realizar el pedido."
      );
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
    >
      <Text style={styles.title}>
        🧾 Resumen del pedido
      </Text>

      <Text style={styles.subtitle}>
        Revisa toda la información antes de confirmar.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Productos
        </Text>

        {carrito.map((item) => (
          <View
            key={item.id}
            style={styles.productRow}
          >
            <View style={styles.productLeft}>
              <Text style={styles.productName}>
                {item.nombre}
              </Text>

              <Text style={styles.productQuantity}>
                {item.cantidad} x Q{" "}
                {item.precio.toFixed(2)}
              </Text>
            </View>

            <Text style={styles.productTotal}>
              Q{" "}
              {(
                item.precio *
                item.cantidad
              ).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🚚 Entrega
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            Tipo
          </Text>

          <Text style={styles.value}>
            {tipoEntrega}
          </Text>
        </View>

        {tipoEntrega === "Domicilio" && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>
                Dirección
              </Text>

              <Text style={styles.blockValue}>
                {direccion}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>
                Teléfono
              </Text>

              <Text style={styles.value}>
                {telefono}
              </Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>
                Referencia
              </Text>

              <Text style={styles.blockValue}>
                {referencia}
              </Text>
            </View>

            {indicaciones ? (
              <View style={styles.block}>
                <Text style={styles.label}>
                  Indicaciones
                </Text>

                <Text style={styles.blockValue}>
                  {indicaciones}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {tipoEntrega === "Recoger" && (
          <Text style={styles.pickupText}>
            🏪 Recogerás el pedido directamente en el comercio.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🕒 Cuándo
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            Modalidad
          </Text>

          <Text style={styles.value}>
            {tipoTiempo === "Ahora"
              ? "Lo antes posible"
              : "Programado"}
          </Text>
        </View>

        {tipoTiempo === "Despues" && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>
                Fecha
              </Text>

              <Text style={styles.value}>
                {fechaProgramada}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>
                Hora
              </Text>

              <Text style={styles.value}>
                {horaProgramada}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.row}>
          <Text style={styles.totalLabelSmall}>
            Subtotal
          </Text>

          <Text style={styles.totalValueSmall}>
            Q {subtotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.totalLabelSmall}>
            Envío
          </Text>

          <Text style={styles.totalValueSmall}>
            Q {envioFinal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalValue}>
            Q {totalFinal.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          enviandoPedido &&
            styles.confirmButtonDisabled,
        ]}
        onPress={confirmarPedido}
        disabled={enviandoPedido}
      >
        {enviandoPedido ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <Text style={styles.confirmButtonText}>
            CONFIRMAR PEDIDO
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          navigation.goBack()
        }
        disabled={enviandoPedido}
      >
        <Text style={styles.backButtonText}>
          REGRESAR
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
    paddingBottom: 45,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 30,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  productLeft: {
    flex: 1,
    paddingRight: 12,
  },

  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  productQuantity: {
    color: "#777",
    marginTop: 4,
  },

  productTotal: {
    fontWeight: "bold",
    fontSize: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  block: {
    marginBottom: 13,
  },

  label: {
    color: "#777",
    fontSize: 14,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  blockValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },

  pickupText: {
    color: "#555",
    lineHeight: 21,
  },

  totalCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginTop: 5,
    elevation: 3,
  },

  totalLabelSmall: {
    fontSize: 16,
    color: "#555",
  },

  totalValueSmall: {
    fontSize: 16,
    fontWeight: "600",
  },

  separator: {
    height: 1,
    backgroundColor: "#DDDDDD",
    marginVertical: 7,
  },

  totalLabel: {
    fontSize: 22,
    fontWeight: "bold",
  },

  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E53935",
  },

  confirmButton: {
    backgroundColor: "#E53935",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    minHeight: 55,
    justifyContent: "center",
  },

  confirmButtonDisabled: {
    opacity: 0.6,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
  },

  backButton: {
    padding: 14,
    marginTop: 8,
  },

  backButtonText: {
    textAlign: "center",
    color: "#E53935",
    fontWeight: "bold",
  },
});