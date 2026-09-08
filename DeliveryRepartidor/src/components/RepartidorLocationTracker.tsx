import {
  useEffect,
} from "react";

import * as Location
  from "expo-location";

import {
  useAuth,
} from "../context/AuthContext";

import {
  actualizarUbicacion,
} from "../services/api";

export default function RepartidorLocationTracker() {
  const {
    token,
    usuario,
  } = useAuth();

  useEffect(() => {
    if (
      !token ||
      usuario?.rol !== "Repartidor"
    ) {
      return;
    }

    let subscription:
      Location.LocationSubscription |
      null = null;

    let cancelado = false;

    async function iniciarSeguimiento() {
      try {
        const permisos =
          await Location
            .requestForegroundPermissionsAsync();

        if (
          permisos.status !==
          "granted"
        ) {
          return;
        }

        if (cancelado) {
          return;
        }

        subscription =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,

              timeInterval:
                10000,

              distanceInterval:
                20,
            },

            async (ubicacion) => {
              if (
                cancelado ||
                !token
              ) {
                return;
              }

              try {
                await actualizarUbicacion(
                  token,

                  ubicacion.coords
                    .latitude,

                  ubicacion.coords
                    .longitude
                );
              } catch (error) {
                console.log(
                  "No se pudo sincronizar la ubicación del repartidor:",
                  error
                );
              }
            }
          );
      } catch (error) {
        console.log(
          "No se pudo iniciar el seguimiento GPS:",
          error
        );
      }
    }

    iniciarSeguimiento();

    return () => {
      cancelado = true;

      if (subscription) {
        subscription.remove();
      }
    };
  }, [
    token,
    usuario?.rol,
  ]);

  return null;
}