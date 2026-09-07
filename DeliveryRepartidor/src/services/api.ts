const API_URL = "http://10.0.2.2:5022";

export type UsuarioAuth = {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: string;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioAuth;
};

export type PerfilRepartidor = {
  id: number;
  usuarioId: number;

  usuario: {
    nombre: string;
    correo: string;
    telefono?: string | null;
  };

  tipoVehiculo: string;
  placa?: string | null;

  disponible: boolean;

  latitudActual?: number | null;
  longitudActual?: number | null;

  ultimaActualizacionUbicacion?: string | null;

  activo: boolean;
  fechaCreacion: string;
};

export type PedidoDisponible = {
  id: number;
  fecha: string;

  total: number;
  envio: number;

  direccionEntrega?: string | null;
  latitudEntrega?: number | null;
  longitudEntrega?: number | null;

  comercio: {
    id: number;
    nombre: string;
    direccion: string;
    telefono?: string | null;
  };

  cliente: {
    id: number;
    nombre: string;
    telefonoEntrega?: string | null;
  };
};

// =========================
// LOGIN
// =========================
export async function login(
  correo: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/api/Auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        correo,
        password,
      }),
    }
  );

  const texto =
    await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo iniciar sesión."
    );
  }

  if (!data?.token) {
    throw new Error(
      "La API no devolvió un token válido."
    );
  }

  return data;
}

// =========================
// MI PERFIL
// =========================
export async function obtenerMiPerfil(
  token: string
): Promise<PerfilRepartidor> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/mi-perfil`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const texto =
    await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo cargar tu perfil de repartidor."
    );
  }

  return data;
}

// =========================
// DISPONIBILIDAD
// =========================
export async function actualizarDisponibilidad(
  token: string,
  disponible: boolean
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/disponibilidad`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      // IMPORTANTE:
      // La API recibe directamente
      // true o false.
      body: JSON.stringify(
        disponible
      ),
    }
  );

  const texto =
    await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo cambiar tu disponibilidad."
    );
  }

  return data;
}

// =========================
// UBICACIÓN GPS
// =========================
export async function actualizarUbicacion(
  token: string,
  latitud: number,
  longitud: number
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/ubicacion`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        latitud,
        longitud,
      }),
    }
  );

  const texto =
    await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo actualizar tu ubicación."
    );
  }

  return data;
}

// =========================
// PEDIDOS DISPONIBLES
// =========================
export async function obtenerPedidosDisponibles(
  token: string
): Promise<PedidoDisponible[]> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos-disponibles`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const texto =
    await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudieron cargar los pedidos disponibles."
    );
  }

  return data;
}