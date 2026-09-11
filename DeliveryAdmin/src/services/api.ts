const API_URL = "https://deliverylocal-api-2026-edfda6abe8byf2dg.mexicocentral-01.azurewebsites.net";

export type UsuarioLogin = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioLogin;
};

export type SolicitudRepartidorPendiente = {
  id: number;
  usuarioId: number;

  usuario: {
    nombre: string;
    correo: string;
    telefono: string;
  };

  tipoVehiculo: string;
  placa: string | null;
  estado: string;
  fechaSolicitud: string;
};

export type RepartidorAdmin = {
  id: number;
  usuarioId: number;

  usuario: {
    nombre: string;
    correo: string;
    telefono: string;
    activo: boolean;
  };

  tipoVehiculo: string;
  placa: string | null;

  disponible: boolean;
  activo: boolean;

  latitudActual: number | null;
  longitudActual: number | null;
  ultimaActualizacionUbicacion: string | null;

  fechaCreacion: string;

  totalEntregas: number;
};

function manejarSesionExpirada(
  response: Response
) {
  if (response.status !== 401) {
    return false;
  }

  localStorage.removeItem(
    "deliveryadmin_token"
  );

  localStorage.removeItem(
    "deliveryadmin_usuario"
  );

  sessionStorage.setItem(
    "deliveryadmin_mensaje_sesion",
    "Tu sesión expiró. Inicia sesión nuevamente."
  );

  window.location.href =
    "/login";

  return true;
}

export async function loginAdmin(
  correo: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/Auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        correo,
        password,
      }),
    }
  );

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.mensaje ||
        "Correo o contraseña incorrectos."
    );
  }

  if (
    !data?.token ||
    !data?.usuario
  ) {
    throw new Error(
      "La respuesta del servidor no es válida."
    );
  }

  if (
    data.usuario.rol !==
    "Administrador"
  ) {
    throw new Error(
      "Este usuario no tiene permisos de administrador."
    );
  }

  return data;
}

export async function obtenerSolicitudesPendientes(
  token: string
): Promise<
  SolicitudRepartidorPendiente[]
> {
  const response = await fetch(
    `${API_URL}/api/AdminRepartidores/solicitudes-pendientes`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (
    manejarSesionExpirada(
      response
    )
  ) {
    throw new Error(
      "Sesión expirada."
    );
  }

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.mensaje ||
        "No se pudieron cargar las solicitudes."
    );
  }

  return data;
}

export async function aprobarSolicitudRepartidor(
  token: string,
  solicitudId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/AdminRepartidores/solicitudes/${solicitudId}/aprobar`,
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        observacion:
          "Solicitud aprobada desde DeliveryAdmin.",
      }),
    }
  );

  if (
    manejarSesionExpirada(
      response
    )
  ) {
    throw new Error(
      "Sesión expirada."
    );
  }

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.mensaje ||
        "No se pudo aprobar la solicitud."
    );
  }
}

export async function rechazarSolicitudRepartidor(
  token: string,
  solicitudId: number,
  observacion: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/AdminRepartidores/solicitudes/${solicitudId}/rechazar`,
    {
      method: "PUT",

      headers: {
        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        observacion,
      }),
    }
  );

  if (
    manejarSesionExpirada(
      response
    )
  ) {
    throw new Error(
      "Sesión expirada."
    );
  }

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.mensaje ||
        "No se pudo rechazar la solicitud."
    );
  }
}

export async function obtenerRepartidores(
  token: string
): Promise<RepartidorAdmin[]> {
  const response = await fetch(
    `${API_URL}/api/AdminRepartidores/repartidores`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (
    manejarSesionExpirada(
      response
    )
  ) {
    throw new Error(
      "Sesión expirada."
    );
  }

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.mensaje ||
        "No se pudieron cargar los repartidores."
    );
  }

  return data;
}