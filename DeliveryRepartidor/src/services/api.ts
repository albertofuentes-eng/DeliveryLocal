import { Platform } from "react-native";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:5022"
    : "https://deliverylocal-api-2026-edfda6abe8byf2dg.mexicocentral-01.azurewebsites.net";

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
  pedidoId: number,
  codigoEntrega: string
) {
  const codigo = codigoEntrega.trim().toUpperCase();

  if (!codigo) {
    throw new Error(
      "Debes ingresar el código de entrega del cliente."
    );
  }

  const response = await fetch(
    `${API_URL}/api/Repartidores/pedidos/${pedidoId}/entregado`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tokenEntrega: codigo,
      }),
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

// ==========================================
// NOTIFICACIONES PUSH
// ==========================================

export async function registrarTokenPush(
  token: string,
  expoPushToken: string
) {
  const response = await fetch(
    `${API_URL}/api/Notificaciones/registrar-token`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        expoPushToken,
        aplicacion: "Repartidor",
        plataforma: "Android",
      }),
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo registrar el dispositivo para notificaciones."
  );
}


//
// ==========================================
// FASE 4: INCIDENCIAS DE ENTREGA
// ==========================================
//

export type CrearIncidenciaRequest = {
  pedidoId: number;
  motivo: string;
  descripcion: string;
};

export type IncidenciaCreada = {
  id: number;
  pedidoId: number;
  motivo: string;
  descripcion: string;
  estado: string;
  evidenciaUrl?: string | null;
};


export type IncidenciaRepartidor = {
  id: number;
  pedidoId: number;
  motivo: string;
  descripcion: string;
  evidenciaUrl: string | null;
  estado: string;
  fechaReporte: string;
  resolucion: string | null;
  fechaResolucion: string | null;
};

// Consultar incidencias registradas por el repartidor.
export async function obtenerMisIncidencias(
  token: string
): Promise<IncidenciaRepartidor[]> {
  const response = await fetch(
    `${API_URL}/api/Incidencias/mis-incidencias`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await leerRespuesta(
    response,
    "No se pudieron consultar las incidencias."
  );
}


export async function crearIncidencia(
  token: string,
  datos: CrearIncidenciaRequest
): Promise<IncidenciaCreada> {
  if (!Number.isInteger(datos.pedidoId) || datos.pedidoId <= 0) {
    throw new Error("El pedido no es válido.");
  }

  if (!datos.motivo.trim()) {
    throw new Error("Selecciona un motivo.");
  }

  if (!datos.descripcion.trim()) {
    throw new Error("Describe lo sucedido.");
  }

  const response = await fetch(
    `${API_URL}/api/Incidencias`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pedidoId: datos.pedidoId,
        motivo: datos.motivo.trim(),
        descripcion: datos.descripcion.trim(),
      }),
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo registrar la incidencia."
  );
}

// ==========================================
// FASE 4: SUBIR FOTOGRAFÍA DE EVIDENCIA
// ==========================================


export async function subirEvidenciaIncidencia(
  token: string,
  incidenciaId: number,
  imagenUri: string
) {
  if (!Number.isInteger(incidenciaId) || incidenciaId <= 0) {
    throw new Error("La incidencia no es válida.");
  }

  if (!imagenUri) {
    throw new Error("Selecciona una fotografía.");
  }

  const uriSinParametros = imagenUri.split("?")[0];

  const extensionOriginal = uriSinParametros
    .split(".")
    .pop()
    ?.toLowerCase();

  const extensionInicial =
    extensionOriginal === "png" ||
    extensionOriginal === "webp" ||
    extensionOriginal === "jpg" ||
    extensionOriginal === "jpeg"
      ? extensionOriginal
      : "jpg";

  const formData = new FormData();

  if (Platform.OS === "web") {
    // En navegador debemos enviar un Blob real.
    const respuestaImagen = await fetch(imagenUri);

    if (!respuestaImagen.ok) {
      throw new Error("No se pudo leer la fotografía seleccionada.");
    }

    const blob = await respuestaImagen.blob();

    const tipoReal = blob.type.toLowerCase();

    const mimeType =
      tipoReal === "image/png" ||
      tipoReal === "image/webp" ||
      tipoReal === "image/jpeg"
        ? tipoReal
        : "";

    if (!mimeType) {
      throw new Error(
        "Formato de fotografía no permitido. Utiliza JPG, PNG o WEBP."
      );
    }

    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";

    formData.append(
      "archivo",
      blob,
      `evidencia-${incidenciaId}.${extension}`
    );
  } else {
    // En Android/iOS mantenemos el formato de React Native.
    const mimeType =
      extensionInicial === "png"
        ? "image/png"
        : extensionInicial === "webp"
          ? "image/webp"
          : "image/jpeg";

    formData.append(
      "archivo",
      {
        uri: imagenUri,
        name: `evidencia-${incidenciaId}.${extensionInicial}`,
        type: mimeType,
      } as any
    );
  }

  const response = await fetch(
    `${API_URL}/api/Incidencias/${incidenciaId}/evidencia`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo subir la fotografía."
  );
}



//
// ==========================================
// FASE 5: CALIFICACIONES DE CLIENTES
// ==========================================
//

export type CalificacionPedido = {
  id: number;
  pedidoId: number;
  tipo: "ClienteARepartidor" | "RepartidorACliente";
  puntuacion: number;
  comentario: string | null;
  fechaCreacion: string;
  emisorUsuarioId: number;
  receptorUsuarioId: number;
};

export type CrearCalificacionRequest = {
  pedidoId: number;
  puntuacion: number;
  comentario?: string | null;
};

// Consultar calificaciones de un pedido
export async function obtenerCalificacionesPedido(
  token: string,
  pedidoId: number
): Promise<CalificacionPedido[]> {
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    throw new Error("El pedido no es válido.");
  }

  const response = await fetch(
    `${API_URL}/api/Calificaciones/pedido/${pedidoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await leerRespuesta(
    response,
    "No se pudieron consultar las calificaciones."
  );

  if (!Array.isArray(data)) {
    throw new Error("El servidor no devolvió una lista válida.");
  }

  return data;
}

// Calificar al cliente después de la entrega
export async function crearCalificacionPedido(
  token: string,
  datos: CrearCalificacionRequest
) {
  if (!Number.isInteger(datos.pedidoId) || datos.pedidoId <= 0) {
    throw new Error("El pedido no es válido.");
  }

  if (
    !Number.isInteger(datos.puntuacion) ||
    datos.puntuacion < 1 ||
    datos.puntuacion > 5
  ) {
    throw new Error("Selecciona entre 1 y 5 estrellas.");
  }

  const comentario = datos.comentario?.trim() || null;

  if (comentario && comentario.length > 500) {
    throw new Error("El comentario no puede superar 500 caracteres.");
  }

  const response = await fetch(
    `${API_URL}/api/Calificaciones`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pedidoId: datos.pedidoId,
        puntuacion: datos.puntuacion,
        comentario,
      }),
    }
  );

  return await leerRespuesta(
    response,
    "No se pudo registrar la calificación."
  );
}
