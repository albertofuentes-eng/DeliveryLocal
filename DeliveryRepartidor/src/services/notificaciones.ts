import { Platform } from "react-native";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function obtenerExpoPushToken() {
  if (!Device.isDevice) {
    console.log(
      "Las notificaciones push requieren un dispositivo físico."
    );

    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      "default",
      {
        name: "Notificaciones de DeliveryLocal",
        importance:
          Notifications.AndroidImportance.HIGH,
        sound: "default",
      }
    );
  }

  const permisosActuales =
    await Notifications.getPermissionsAsync();

  let estadoFinal =
    permisosActuales.status;

  if (estadoFinal !== "granted") {
    const permisosSolicitados =
      await Notifications.requestPermissionsAsync();

    estadoFinal =
      permisosSolicitados.status;
  }

  if (estadoFinal !== "granted") {
    console.log(
      "El usuario no concedió permiso para notificaciones."
    );

    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    throw new Error(
      "No se encontró el projectId de EAS."
    );
  }

  const token =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  return token.data;
}