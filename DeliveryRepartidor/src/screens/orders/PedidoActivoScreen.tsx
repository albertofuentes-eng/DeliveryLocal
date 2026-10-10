
import { useEffect, useState } from "react";

import * as ImagePicker from "expo-image-picker";


import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../navigation/AppNavigator";

import { useAuth } from "../../context/AuthContext";

import {
  crearIncidencia,
  subirEvidenciaIncidencia,
  marcarPedidoEnCamino,
  marcarPedidoEntregado,
  marcarPedidoRecogido,
  obtenerMiPedido,
  type DetallePedidoRepartidor,
} from "../../services/api";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "PedidoActivo"
>;

export default function PedidoActivoScreen({
  navigation,
}: Props) {
  const { token } = useAuth();

  const [pedido, setPedido] =
    useState<DetallePedidoRepartidor | null>(null);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // FASE 3: Código de entrega proporcionado por el cliente.
  const [codigoEntrega, setCodigoEntrega] = useState("");

  // ==========================================
  // FASE 4: REPORTE DE INCIDENCIAS
  // ==========================================

  const [mostrarIncidencia, setMostrarIncidencia] = useState(false);

  const [motivoIncidencia, setMotivoIncidencia] = useState("");

  const [descripcionIncidencia, setDescripcionIncidencia] = useState("");

  const [fotoIncidencia, setFotoIncidencia] =
  useState<string | null>(null);

  const motivosIncidencia = [
    { valor: "ClienteAusente", texto: "Cliente ausente" },
    { valor: "DireccionIncorrecta", texto: "Dirección incorrecta" },
    { valor: "ClienteRechaza", texto: "Cliente rechaza el pedido" },
    { valor: "Accidente", texto: "Accidente o inconveniente" },
    { valor: "Otro", texto: "Otro motivo" },
  ];

  useEffect(() => {
    cargarPedido();
  }, []);

  async function cargarPedido() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const data = await obtenerMiPedido(token);

      setPedido(data);

      if (!data) {
        setMensaje("No tienes un pedido activo.");
      }
    } catch (error: any) {
      setPedido(null);

      setMensaje(
        error.message || "No se pudo cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

  function confirmarAccion() {
    if (!pedido || procesando) {
      return;
    }

    if (pedido.estado === "Asignado a repartidor") {
      Alert.alert(
        "Confirmar recogida",
        "¿Ya recibiste el pedido del comercio?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            onPress: ejecutarRecogido,
          },
        ]
      );

      return;
    }

    if (pedido.estado === "Recogido") {
      Alert.alert(
        "Iniciar entrega",
        "¿Deseas comenzar el recorrido hacia el cliente?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Iniciar",
            onPress: ejecutarEnCamino,
          },
        ]
      );

      return;
    }

    if (pedido.estado === "En camino") {
      const codigo = codigoEntrega.trim();

      if (!codigo) {
        setMensaje(
          "Solicita al cliente su código de entrega antes de confirmar."
        );
        return;
      }

      Alert.alert(
        "Confirmar entrega",
        "¿Ya entregaste el pedido al cliente y verificaste su código?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            onPress: ejecutarEntregado,
          },
        ]
      );
    }
  }

  async function ejecutarRecogido() {
    if (!token || !pedido || procesando) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoRecogido(token, pedido.id);

      await cargarPedido();
    } catch (error: any) {
      setMensaje(
        error.message || "No se pudo marcar como recogido."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function ejecutarEnCamino() {
    if (!token || !pedido || procesando) {
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoEnCamino(token, pedido.id);

      await cargarPedido();
    } catch (error: any) {
      setMensaje(
        error.message || "No se pudo iniciar la entrega."
      );
    } finally {
      setProcesando(false);
    }
  }

  // FASE 3: Confirmación mediante código del cliente.
  async function ejecutarEntregado() {
    if (!token || !pedido || procesando) {
      return;
    }

    const codigo = codigoEntrega.trim().toUpperCase();

    if (!codigo) {
      setMensaje(
        "Debes ingresar el código de entrega que te proporciona el cliente."
      );
      return;
    }

    if (pedido.estado !== "En camino") {
      setMensaje(
        "El pedido debe estar en camino para confirmar la entrega."
      );
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      await marcarPedidoEntregado(
        token,
        pedido.id,
        codigo
      );

      setCodigoEntrega("");

      // El servidor aceptó la solicitud.
      // Volvemos al inicio del repartidor.
      navigation.popToTop();
    } catch (error: any) {
      setMensaje(
        error.message || "No se pudo completar la entrega."
      );
    } finally {
      setProcesando(false);
    }
  }


  // ==========================================
  // FASE 4: GUARDAR INCIDENCIA
  // ==========================================

  async function ejecutarReporteIncidencia() {
    if (!token || !pedido || procesando) {
      return;
    }

    if (pedido.estado !== "En camino") {
      Alert.alert(
        "Pedido no válido",
        "Solo puedes reportar problemas durante la entrega."
      );
      return;
    }

    if (!motivoIncidencia) {
      Alert.alert(
        "Motivo obligatorio",
        "Selecciona el motivo de la incidencia."
      );
      return;
    }

    const descripcion = descripcionIncidencia.trim();

    if (!descripcion) {
      Alert.alert(
        "Descripción obligatoria",
        "Explica qué sucedió durante la entrega."
      );
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      const incidencia = await crearIncidencia(token, {
      pedidoId: pedido.id,
      motivo: motivoIncidencia,
      descripcion,
    });

    let errorFotografia: string | null = null;

    if (fotoIncidencia) {
      try {
        await subirEvidenciaIncidencia(
          token,
          incidencia.id,
          fotoIncidencia
        );
      } catch (error: any) {
        errorFotografia =
          error?.message || "No se pudo subir la fotografía.";
      }
    }

    setMostrarIncidencia(false);
    setMotivoIncidencia("");
    setDescripcionIncidencia("");
    setFotoIncidencia(null);

    if (errorFotografia) {
      Alert.alert(
        "Reporte registrado",
        `La incidencia se guardó, pero la fotografía no se pudo adjuntar: ${errorFotografia}. No vuelvas a enviar el mismo reporte.`
      );
    } else {
      Alert.alert(
        "Reporte registrado",
        "La incidencia quedó pendiente de revisión."
      );
    }
    } catch (error: any) {
      Alert.alert(
        "No se pudo registrar",
        error?.message || "Intenta nuevamente."
      );
    } finally {
      setProcesando(false);
    }
  }

  // ==========================================
// FASE 4: SELECCIONAR FOTOGRAFÍA
// ==========================================

async function seleccionarFotoIncidencia() {
  if (procesando) {
    return;
  }

  try {
    const permiso =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos permiso para seleccionar una fotografía."
      );
      return;
    }

    const resultado =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7,
      });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const foto = resultado.assets[0];

      if (
        foto.fileSize != null &&
        foto.fileSize > 5 * 1024 * 1024
      ) {
        Alert.alert(
          "Fotografía demasiado grande",
          "Selecciona una imagen menor de 5 MB."
        );
        return;
      }

      setFotoIncidencia(foto.uri);
    }
  } catch {
    Alert.alert(
      "Error",
      "No se pudo seleccionar la fotografía."
    );
  }
}

  function textoBoton() {
    if (!pedido) {
      return "";
    }

    switch (pedido.estado) {
      case "Asignado a repartidor":
        return "CONFIRMAR RECOGIDA";

      case "Recogido":
        return "INICIAR ENTREGA";

      case "En camino":
        return "CONFIRMAR ENTREGA";

      default:
        return "";
    }
  }

  // ==========================================
  // CARGANDO PEDIDO
  // ==========================================

  if (cargando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#20a85a"
        />

        <Text style={styles.loadingText}>
          Cargando pedido...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SIN PEDIDO ACTIVO
  // ==========================================

  if (!pedido) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            🛵
          </Text>

          <Text style={styles.emptyTitle}>
            No tienes un pedido activo
          </Text>

          <Text style={styles.emptyText}>
            Cuando aceptes un pedido, aparecerá aquí.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.backButtonText}>
              VOLVER AL INICIO
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // PANTALLA DEL PEDIDO ACTIVO
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ESTADO DEL PEDIDO */}
        <View style={styles.topCard}>
          <Text style={styles.activeLabel}>
            PEDIDO EN CURSO
          </Text>

          <Text style={styles.orderNumber}>
            Pedido #{pedido.id}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {pedido.estado}
            </Text>
          </View>
        </View>

        {/* PROGRESO DEL PEDIDO */}
        <View style={styles.progressCard}>
          {/* PASO 1 */}
          <View style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                styles.stepComplete,
              ]}
            >
              <Text style={styles.stepNumber}>
                ✓
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Pedido aceptado
              </Text>

              <Text style={styles.stepText}>
                El pedido está asignado a ti.
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          {/* PASO 2 */}
          <View style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                pedido.estado === "Recogido" ||
                pedido.estado === "En camino"
                  ? styles.stepComplete
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>
                {pedido.estado === "Recogido" ||
                pedido.estado === "En camino"
                  ? "✓"
                  : "2"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Recoger pedido
              </Text>

              <Text style={styles.stepText}>
                Recibir el pedido en el comercio.
              </Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          {/* PASO 3 */}
          <View style={styles.stepRow}>
            <View
              style={[
                styles.stepCircle,
                pedido.estado === "En camino"
                  ? styles.stepCurrent
                  : styles.stepPending,
              ]}
            >
              <Text style={styles.stepNumber}>
                3
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                Entregar al cliente
              </Text>

              <Text style={styles.stepText}>
                Llevar el pedido hasta la dirección indicada.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================
            INFORMACIÓN DEL COMERCIO
           ====================================== */}

        <Text style={styles.sectionTitle}>
          Recoger en
        </Text>

        <View style={styles.card}>
          <Text style={styles.businessName}>
            {pedido.comercio.nombre}
          </Text>

          <Text style={styles.infoText}>
            📍{" "}
            {pedido.comercio.direccion ||
              "Sin dirección registrada"}
          </Text>

          {pedido.comercio.telefono ? (
            <Text style={styles.infoText}>
              ☎ {pedido.comercio.telefono}
            </Text>
          ) : null}

          {pedido.estado ===
            "Asignado a repartidor" &&
          pedido.comercio.latitud != null &&
          pedido.comercio.longitud != null ? (
            <Pressable
              style={styles.mapButton}
              onPress={() =>
                navigation.navigate(
                  "MapaComercio",
                  {
                    comercioNombre:
                      pedido.comercio.nombre,

                    comercioDireccion:
                      pedido.comercio.direccion,

                    comercioLatitud:
                      pedido.comercio.latitud!,

                    comercioLongitud:
                      pedido.comercio.longitud!,
                  }
                )
              }
            >
              <Text style={styles.mapButtonText}>
                🗺️ VER RUTA AL COMERCIO
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ======================================
            INFORMACIÓN DEL CLIENTE
           ====================================== */}

        <Text style={styles.sectionTitle}>
          Entregar a
        </Text>

        <View style={styles.card}>
          <Text style={styles.clientName}>
            {pedido.cliente.nombre}
          </Text>

          <Text style={styles.infoText}>
            📍{" "}
            {pedido.direccionEntrega ||
              "Sin dirección registrada"}
          </Text>

          {pedido.telefonoEntrega ? (
            <Text style={styles.infoText}>
              ☎ {pedido.telefonoEntrega}
            </Text>
          ) : null}

          {pedido.referenciaEntrega ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>
                Referencia
              </Text>

              <Text style={styles.infoValue}>
                {pedido.referenciaEntrega}
              </Text>
            </View>
          ) : null}

          {pedido.indicacionesEntrega ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>
                Indicaciones
              </Text>

              <Text style={styles.infoValue}>
                {pedido.indicacionesEntrega}
              </Text>
            </View>
          ) : null}

          {(pedido.estado === "Recogido" ||
            pedido.estado === "En camino") &&
          pedido.latitudEntrega != null &&
          pedido.longitudEntrega != null ? (
            <Pressable
              style={styles.mapButton}
              onPress={() =>
                navigation.navigate(
                  "MapaCliente",
                  {
                    clienteNombre:
                      pedido.cliente.nombre,

                    direccionEntrega:
                      pedido.direccionEntrega ||
                      "Sin dirección registrada",

                    latitudEntrega:
                      pedido.latitudEntrega!,

                    longitudEntrega:
                      pedido.longitudEntrega!,
                  }
                )
              }
            >
              <Text style={styles.mapButtonText}>
                🗺️ VER RUTA AL CLIENTE
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ======================================
            PRODUCTOS DEL PEDIDO
           ====================================== */}

        <Text style={styles.sectionTitle}>
          Productos
        </Text>

        <View style={styles.card}>
          {pedido.detalles.map(
            (detalle, index) => (
              <View
                key={`${detalle.productoId}-${index}`}
              >
                <View style={styles.productRow}>
                  <Text style={styles.productName}>
                    {detalle.cantidad} ×{" "}
                    {detalle.producto}
                  </Text>

                  <Text style={styles.productTotal}>
                    Q
                    {Number(
                      detalle.subtotal
                    ).toFixed(2)}
                  </Text>
                </View>

                {index <
                pedido.detalles.length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            )
          )}
        </View>

        {/* ======================================
            TOTAL DEL PEDIDO
           ====================================== */}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            Total del pedido
          </Text>

          <Text style={styles.totalValue}>
            Q
            {Number(pedido.total).toFixed(2)}
          </Text>
        </View>

        {/* ======================================
            FASE 3: CÓDIGO DE ENTREGA
            Solo visible cuando está en camino.
           ====================================== */}

        {pedido.estado === "En camino" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Código de verificación
            </Text>

            <Text style={styles.infoText}>
              Solicita al cliente el código de
              entrega que aparece en su aplicación.
              Ingrésalo para confirmar que recibió
              su pedido.
            </Text>

            <TextInput
              style={styles.codigoInput}
              placeholder="DL-..."
              placeholderTextColor="#999"
              value={codigoEntrega}
              onChangeText={(texto) => {
                setCodigoEntrega(
                  texto.toUpperCase()
                );

                if (mensaje) {
                  setMensaje("");
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!procesando}
              maxLength={35}
            />

            <Text style={styles.codigoAyuda}>
              El código debe pertenecer a este
              pedido y solo podrá utilizarse una vez.
            </Text>
          </View>
        )}

        {/* ======================================
            FASE 4: REPORTE DE INCIDENCIAS
           ====================================== */}

        {pedido.estado === "En camino" && (
          <View style={styles.incidenciaCard}>
            <Text style={styles.incidenciaTitulo}>
              ⚠️ ¿Tuviste un problema con la entrega?
            </Text>

            <Text style={styles.incidenciaDescripcion}>
              Si no puedes completar la entrega, registra
              lo sucedido para que un administrador revise
              el caso.
            </Text>

            <Pressable
              style={styles.incidenciaBoton}
              disabled={procesando}
              onPress={() =>
                setMostrarIncidencia(!mostrarIncidencia)
              }
            >
              <Text style={styles.incidenciaBotonTexto}>
                {mostrarIncidencia
                  ? "CERRAR FORMULARIO"
                  : "REPORTAR PROBLEMA"}
              </Text>
            </Pressable>

            {mostrarIncidencia && (
              <View style={styles.incidenciaFormulario}>
                <Text style={styles.incidenciaEtiqueta}>
                  Motivo de la incidencia
                </Text>

                {motivosIncidencia.map((motivo) => (
                  <Pressable
                    key={motivo.valor}
                    style={[
                      styles.incidenciaOpcion,
                      motivoIncidencia === motivo.valor &&
                        styles.incidenciaOpcionSeleccionada,
                    ]}
                    onPress={() =>
                      setMotivoIncidencia(motivo.valor)
                    }
                  >
                    <Text style={styles.incidenciaOpcionTexto}>
                      {motivoIncidencia === motivo.valor
                        ? "🔘"
                        : "⚪"}{" "}
                      {motivo.texto}
                    </Text>
                  </Pressable>
                ))}

                <Text style={styles.incidenciaEtiqueta}>
                  Describe lo sucedido
                </Text>

                <TextInput
                  style={styles.incidenciaInput}
                  placeholder="Explica qué ocurrió durante la entrega..."
                  placeholderTextColor="#999"
                  value={descripcionIncidencia}
                  onChangeText={setDescripcionIncidencia}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  textAlignVertical="top"
                  editable={!procesando}
                />


              <Text style={styles.incidenciaAyuda}>
                Máximo 1000 caracteres.
              </Text>

              {/* ======================================
                  FASE 4: FOTOGRAFÍA DE EVIDENCIA
                  ====================================== */}

              <View style={styles.evidenciaContenedor}>
                <Text style={styles.incidenciaEtiqueta}>
                  Fotografía de evidencia (opcional)
                </Text>

                <Pressable
                  style={styles.evidenciaBoton}
                  onPress={seleccionarFotoIncidencia}
                  disabled={procesando}
                >
                  <Text style={styles.evidenciaBotonTexto}>
                    📷{" "}
                    {fotoIncidencia
                      ? "CAMBIAR FOTOGRAFÍA"
                      : "SELECCIONAR FOTOGRAFÍA"}
                  </Text>
                </Pressable>

                {fotoIncidencia && (
                  <View>
                    <Image
                      source={{ uri: fotoIncidencia }}
                      style={styles.evidenciaImagen}
                      resizeMode="cover"
                    />

                    <Pressable
                      disabled={procesando}
                      onPress={() => setFotoIncidencia(null)}
                    >
                      <Text style={styles.evidenciaEliminar}>
                        Quitar fotografía
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* ======================================
                  BOTÓN PARA ENVIAR INCIDENCIA
                  ====================================== */}

              <Pressable
                style={[
                  styles.incidenciaEnviar,
                  procesando && styles.disabledButton,
                ]}
                disabled={procesando}
                onPress={ejecutarReporteIncidencia}
              >
                {procesando ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.incidenciaEnviarTexto}>
                    ENVIAR REPORTE
                  </Text>
                )}
              </Pressable>

              </View>
            )}
          </View>
        )}


        {/* ======================================
            MENSAJES DE ERROR
           ====================================== */}

        {mensaje ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {mensaje}
            </Text>
          </View>
        ) : null}

        {/* ======================================
            BOTÓN PARA CAMBIAR ESTADO
           ====================================== */}

        {textoBoton() ? (
          <Pressable
            style={[
              styles.actionButton,
              procesando &&
                styles.disabledButton,
            ]}
            disabled={procesando}
            onPress={confirmarAccion}
          >
            {procesando ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text style={styles.actionButtonText}>
                {textoBoton()}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS DE LA PANTALLA
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f6",
  },

  content: {
    padding: 18,
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
    color: "#777",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginTop: 12,
  },

  emptyText: {
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },

  backButton: {
    backgroundColor: "#20a85a",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 20,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "800",
  },

  topCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 17,
    elevation: 2,
  },

  activeLabel: {
    color: "#20a85a",
    fontWeight: "800",
    fontSize: 12,
  },

  orderNumber: {
    fontSize: 25,
    fontWeight: "900",
    color: "#222",
    marginTop: 5,
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#e8f7ee",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    color: "#19894a",
    fontWeight: "800",
    fontSize: 12,
  },

  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  stepComplete: {
    backgroundColor: "#20a85a",
  },

  stepCurrent: {
    backgroundColor: "#20a85a",
    borderWidth: 3,
    borderColor: "#bde8cc",
  },

  stepPending: {
    backgroundColor: "#d5d5d5",
  },

  stepNumber: {
    color: "#fff",
    fontWeight: "900",
  },

  stepTitle: {
    fontWeight: "800",
    color: "#222",
  },

  stepText: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },

  stepLine: {
    width: 2,
    height: 22,
    backgroundColor: "#ddd",
    marginLeft: 16,
    marginVertical: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 17,
    marginBottom: 20,
    elevation: 2,
  },

  businessName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },

  clientName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
  },

  infoText: {
    color: "#555",
    marginTop: 8,
    lineHeight: 20,
  },

  mapButton: {
    backgroundColor: "#e8f7ee",
    borderWidth: 1,
    borderColor: "#20a85a",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 16,
  },

  mapButtonText: {
    color: "#19894a",
    fontWeight: "900",
    fontSize: 13,
  },

  infoBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },

  infoLabel: {
    fontWeight: "800",
    fontSize: 12,
    color: "#555",
  },

  infoValue: {
    marginTop: 3,
    color: "#555",
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productName: {
    flex: 1,
    fontWeight: "700",
    color: "#222",
    paddingRight: 12,
  },

  productTotal: {
    fontWeight: "800",
    color: "#222",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  totalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    elevation: 2,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },

  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20a85a",
  },

  messageBox: {
    backgroundColor: "#fff0f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  messageText: {
    color: "#b3261e",
    textAlign: "center",
  },

  actionButton: {
    backgroundColor: "#20a85a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.6,
  },

  // FASE 3: Campo para ingresar el token.
  codigoInput: {
    backgroundColor: "#f5f7f6",
    borderWidth: 1,
    borderColor: "#20a85a",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginTop: 16,
    letterSpacing: 1,
  },

  codigoAyuda: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
    lineHeight: 18,
  },


  // ==========================================
  // FASE 4: ESTILOS DE INCIDENCIAS
  // ==========================================

  incidenciaCard: {
    backgroundColor: "#fff8ed",
    borderWidth: 1,
    borderColor: "#f2c879",
    borderRadius: 16,
    padding: 17,
    marginBottom: 20,
  },

  incidenciaTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#925500",
    marginBottom: 8,
  },

  incidenciaDescripcion: {
    fontSize: 13,
    color: "#735c3b",
    lineHeight: 20,
    marginBottom: 15,
  },

  incidenciaBoton: {
    backgroundColor: "#e69a21",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  incidenciaBotonTexto: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },

  incidenciaFormulario: {
    marginTop: 18,
  },

  incidenciaEtiqueta: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
    marginBottom: 10,
  },

  incidenciaOpcion: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },

  incidenciaOpcionSeleccionada: {
    borderColor: "#e69a21",
    backgroundColor: "#fff1d7",
  },

  incidenciaOpcionTexto: {
    color: "#333",
    fontSize: 13,
    fontWeight: "600",
  },

  incidenciaInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 13,
    minHeight: 110,
    color: "#222",
    fontSize: 14,
  },

  incidenciaAyuda: {
    fontSize: 12,
    color: "#777",
    marginTop: 7,
    marginBottom: 15,
  },

  incidenciaEnviar: {
    backgroundColor: "#b86b13",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  incidenciaEnviarTexto: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },

    evidenciaContenedor: {
    marginBottom: 16,
    marginTop: 10,
  },

    evidenciaBoton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e69a21",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  evidenciaBotonTexto: {
    color: "#925500",
    fontWeight: "800",
    fontSize: 13,
  },

  evidenciaImagen: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    marginTop: 12,
  },

  evidenciaEliminar: {
    color: "#b3261e",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 10,
  },

});
