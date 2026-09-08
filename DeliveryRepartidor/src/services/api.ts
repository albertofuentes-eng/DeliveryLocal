const API_URL = "http://10.0.2.2:5022";

// ==========================================
// AUTENTICACIÓN
// ==========================================

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

// ==========================================
// REPARTIDOR
// ==========================================

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

// ==========================================
// PEDIDOS
// ==========================================

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

    latitud?: number | null;
    longitud?: number | null;
  };

  cliente: {
    id: number;
    nombre: string;
    telefonoEntrega?: string | null;
  };
};

export type DetalleProductoPedido = {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type DetallePedidoRepartidor = {
  id: number;
  fecha: string;
  estado: string;

  tipoEntrega: string;

  subtotal: number;
  envio: number;
  total: number;

  direccionEntrega?: string | null;
  latitudEntrega?: number | null;
  longitudEntrega?: number | null;

  telefonoEntrega?: string | null;
  referenciaEntrega?: string | null;
  indicacionesEntrega?: string | null;

  comercio: {
    id: number;
    nombre: string;
    direccion: string;
    telefono?: string | null;

    latitud?: number | null;
    longitud?: number | null;
  };

  cliente: {
    id: number;
    nombre: string;
    telefono?: string | null;
  };

  detalles: DetalleProductoPedido[];
};

// ==========================================
// AYUDANTE PARA LEER RESPUESTAS
// ==========================================

async function leerRespuesta(
  response: Response,
  mensajePredeterminado: string
) {
  const texto = await response.text();

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
      data?.mensaje || mensajePredeterminado
    );
  }

  return data;
}

// ==========================================
// LOGIN
// ==========================================

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

  const data = await leerRespuesta(
    response,
    "No se pudo iniciar sesión."
  );

  if (!data?.token) {
    throw new Error(
      "La API no devolvió un token válido."
    );
  }

  return data;
}

// ==========================================
// MI PERFIL
// ==========================================

export async function obtenerMiPerfil(
  token: string
): Promise<PerfilRepartidor> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/mi-perfil`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo cargar tu perfil de repartidor."
  );
}

// ==========================================
// DISPONIBILIDAD
// ==========================================

export async function actualizarDisponibilidad(
  token: string,
  disponible: boolean
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/disponibilidad`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(disponible),
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo cambiar tu disponibilidad."
  );
}

// ==========================================
// UBICACIÓN GPS
// ==========================================

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
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        latitud,
        longitud,
      }),
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo actualizar tu ubicación."
  );
}

// ==========================================
// PEDIDOS DISPONIBLES
// ==========================================

export async function obtenerPedidosDisponibles(
  token: string
): Promise<PedidoDisponible[]> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos-disponibles`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudieron cargar los pedidos disponibles."
  );
}

// ==========================================
// DETALLE PEDIDO
// ==========================================

export async function obtenerDetallePedido(
  token: string,
  pedidoId: number
): Promise<DetallePedidoRepartidor> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo cargar el detalle del pedido."
  );
}

// ==========================================
// ACEPTAR PEDIDO
// ==========================================

export async function aceptarPedido(
  token: string,
  pedidoId: number
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}/aceptar`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo aceptar el pedido."
  );
}

// ==========================================
// MI PEDIDO ACTIVO
// ==========================================

export async function obtenerMiPedido(
  token: string
): Promise<DetallePedidoRepartidor | null> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/mi-pedido`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  return await leerRespuesta(
    response,
    "No se pudo cargar tu pedido activo."
  );
}

// ==========================================
// MARCAR RECOGIDO
// ==========================================

export async function marcarPedidoRecogido(
  token: string,
  pedidoId: number
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}/recogido`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo marcar el pedido como recogido."
  );
}

// ==========================================
// MARCAR EN CAMINO
// ==========================================

export async function marcarPedidoEnCamino(
  token: string,
  pedidoId: number
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}/en-camino`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo iniciar la entrega."
  );
}

// ==========================================
// MARCAR ENTREGADO
// ==========================================

export async function marcarPedidoEntregado(
  token: string,
  pedidoId: number
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}/entregado`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo completar la entrega."
  );
}

// ==========================================
// HISTORIAL
// ==========================================

export type PedidoHistorial = {
  id: number;
  fecha: string;
  estado: string;

  total: number;
  envio: number;

  direccionEntrega?: string | null;

  comercio: {
    id: number;
    nombre: string;
    direccion: string;
    telefono?: string | null;

    latitud?: number | null;
    longitud?: number | null;
  };

  cliente: {
    id: number;
    nombre: string;
    telefono?: string | null;
  };
};

// ==========================================
// HISTORIAL DE ENTREGAS
// ==========================================

export async function obtenerHistorial(
  token: string
): Promise<PedidoHistorial[]> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/historial`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo cargar el historial."
  );
  
}

export type MetricasPeriodo = {
  entregas: number;
  ganancias: number;
};

export type MetricasRepartidor = {
  totalEntregas: number;
  gananciasTotales: number;

  hoy: MetricasPeriodo;
  semana: MetricasPeriodo;
  mes: MetricasPeriodo;
};

// ==========================================
// MÉTRICAS / GANANCIAS
// ==========================================

export async function obtenerMetricas(
  token: string
): Promise<MetricasRepartidor> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/metricas`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudieron cargar las métricas."
  );
}