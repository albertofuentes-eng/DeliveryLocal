const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:5022";

// ========================================
// COMERCIOS
// ========================================

export async function obtenerComercios(
  municipio?: string
) {
  const url = municipio
    ? `${API_URL}/api/Comercios?municipio=${encodeURIComponent(municipio)}`
    : `${API_URL}/api/Comercios`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "No se pudieron obtener los comercios."
    );
  }

  return await response.json();
}

// ========================================
// PRODUCTOS
// ========================================

export async function obtenerProductosPorComercio(
  comercioId: number
) {
  const response = await fetch(
    `${API_URL}/api/Productos/comercio/${comercioId}`
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron obtener los productos del comercio."
    );
  }

  return await response.json();
}

// ========================================
// AUTENTICACIÓN
// ========================================

export async function iniciarSesion(
  correo: string,
  password: string
) {
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

  const texto = await response.text();

  let data: any = {};

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
        `Error del servidor (${response.status})`
    );
  }

  return data;
}

export async function registrarUsuario(
  nombre: string,
  correo: string,
  telefono: string,
  password: string
) {
  const response = await fetch(
    `${API_URL}/api/Auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        nombre,
        correo,
        telefono,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
        "No se pudo registrar el usuario."
    );
  }

  return data;
}

// ========================================
// SOLICITUD PARA SER REPARTIDOR
// ========================================

export type SolicitudRepartidorCliente = {
  id?: number;
  tipoVehiculo?: string;
  placa?: string | null;
  estado?: string;
  fechaSolicitud?: string;
  fechaRevision?: string | null;
  observacion?: string | null;
};

export async function crearSolicitudRepartidor(
  token: string,
  datos: {
    tipoVehiculo: string;
    placa?: string | null;
  }
) {
  const response = await fetch(
    `${API_URL}/api/Repartidores/solicitud`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(datos),
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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Cierra sesión e inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo enviar la solicitud. Código: ${response.status}`
    );
  }

  return data;
}

export async function obtenerMiSolicitudRepartidor(
  token: string
): Promise<SolicitudRepartidorCliente | null> {
  const response = await fetch(
    `${API_URL}/api/Repartidores/mi-solicitud`,
    {
      method: "GET",

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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Cierra sesión e inicia sesión nuevamente."
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo consultar tu solicitud. Código: ${response.status}`
    );
  }

  return data;
}

// ========================================
// DISPONIBILIDAD DE ENTREGA
// ========================================

export type DisponibilidadEntrega = {
  hayRepartidores: boolean;
  hayDisponibles: boolean;
};

export async function obtenerDisponibilidadEntrega(
  token: string
): Promise<DisponibilidadEntrega> {
  const response = await fetch(
    `${API_URL}/api/Pedidos/disponibilidad-entrega`,
    {
      method: "GET",

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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Cierra sesión e inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo consultar la disponibilidad de entrega."
    );
  }

  return data;
}

// ========================================
// CREAR PEDIDO
// ========================================

export async function crearPedido(
  token: string,
  datos: {
    comercioId: number;
    metodoPago?: "Efectivo" | "Transferencia" | "Tarjeta";

    tipoEntrega:
      | "Domicilio"
      | "Recoger";

    direccionEntrega?:
      | string
      | null;

    latitudEntrega?:
      | number
      | null;

    longitudEntrega?:
      | number
      | null;

    telefonoEntrega?:
      | string
      | null;

    referenciaEntrega?:
      | string
      | null;

    indicacionesEntrega?:
      | string
      | null;

    tipoTiempo:
      | "Ahora"
      | "Despues";

    fechaProgramada?:
      | string
      | null;

    productos: {
      productoId: number;
      cantidad: number;
    }[];
  }
) {
  const response = await fetch(
    `${API_URL}/api/Pedidos`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body:
        JSON.stringify(datos),
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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Cierra sesión e inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo realizar el pedido. Código: ${response.status}`
    );
  }

  return data;
}

// ========================================
// MIS PEDIDOS
// ========================================

export async function obtenerMisPedidos(
  token: string
) {
  const response = await fetch(
    `${API_URL}/api/Pedidos/mis-pedidos`,
    {
      method: "GET",

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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudieron obtener los pedidos. Código: ${response.status}`
    );
  }

  return data;
}

// ========================================
// DETALLE DE UN PEDIDO
// ========================================

export async function obtenerPedidoPorId(
  token: string,
  pedidoId: number
) {
  const response = await fetch(
    `${API_URL}/api/Pedidos/${pedidoId}`,
    {
      method: "GET",

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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo obtener el detalle del pedido. Código: ${response.status}`
    );
  }

  return data;
}

// ========================================
// NOTIFICACIONES PUSH
// ========================================

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

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        expoPushToken,
        aplicacion: "Cliente",
        plataforma: "Android",
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

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo registrar el dispositivo. Código: ${response.status}`
    );
  }

  return data;
}


/* ==========================================
   FASE 3: CÓDIGO DE SEGURIDAD DEL CLIENTE
   ========================================== */

export type TokenEntregaCliente = {
  disponible: boolean;
  tokenEntrega: string | null;
  mensaje: string;
};

export async function obtenerTokenEntregaPedido(
  token: string,
  pedidoId: number
): Promise<TokenEntregaCliente> {
  const response = await fetch(
    `${API_URL}/api/Pedidos/${pedidoId}/token-entrega`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const texto = await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo obtener el código. Error ${response.status}.`
    );
  }

  return {
    disponible: data?.disponible === true,
    tokenEntrega: data?.tokenEntrega ?? null,
    mensaje:
      data?.mensaje ?? "No hay un código disponible.",
  };
}


/* ==========================================
   FASE 5: CALIFICACIONES DEL CLIENTE
   ========================================== */

export type CalificacionPedidoCliente = {
  id: number;
  pedidoId: number;
  tipo: "ClienteARepartidor" | "RepartidorACliente";
  puntuacion: number;
  comentario: string | null;
  fechaCreacion: string;
  emisorUsuarioId: number;
  receptorUsuarioId: number;
};

export type CrearCalificacionCliente = {
  pedidoId: number;
  puntuacion: number;
  comentario?: string | null;
};

// Consultar si el pedido ya fue calificado.
export async function obtenerCalificacionesPedido(
  token: string,
  pedidoId: number
): Promise<CalificacionPedidoCliente[]> {
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    throw new Error("El pedido no es válido.");
  }

  const response = await fetch(
    `${API_URL}/api/Calificaciones/pedido/${pedidoId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const texto = await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudieron consultar las calificaciones. Error ${response.status}.`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "El servidor no devolvió una lista válida de calificaciones."
    );
  }

  return data;
}

// Registrar calificación del repartidor.
export async function crearCalificacionPedido(
  token: string,
  datos: CrearCalificacionCliente
) {
  if (
    !Number.isInteger(datos.pedidoId) ||
    datos.pedidoId <= 0
  ) {
    throw new Error("El pedido no es válido.");
  }

  if (
    !Number.isInteger(datos.puntuacion) ||
    datos.puntuacion < 1 ||
    datos.puntuacion > 5
  ) {
    throw new Error(
      "Selecciona una calificación entre 1 y 5 estrellas."
    );
  }

  const comentario = datos.comentario?.trim() || null;

  if (comentario && comentario.length > 500) {
    throw new Error(
      "El comentario no puede superar los 500 caracteres."
    );
  }

  const response = await fetch(
    `${API_URL}/api/Calificaciones`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pedidoId: datos.pedidoId,
        puntuacion: datos.puntuacion,
        comentario,
      }),
    }
  );

  const texto = await response.text();

  let data: any = null;

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    throw new Error(
      "Tu sesión expiró. Inicia sesión nuevamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo registrar la calificación. Error ${response.status}.`
    );
  }

  return data;
}

// ========================================
// PAGOS: SUBIR COMPROBANTE DE TRANSFERENCIA
// ========================================

export async function subirComprobantePedido(
  token: string,
  pedidoId: number,
  archivo: {
    uri: string;
    file?: Blob;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number;
  }
) {
  const formData = new FormData();

  const nombreArchivo =
    archivo.fileName || "comprobante.jpg";

  const tipoArchivo =
    archivo.mimeType || "image/jpeg";

  if (archivo.file) {
    // Navegador web
    formData.append(
      "archivo",
      archivo.file,
      nombreArchivo
    );
  } else {
    // Android / iOS
    formData.append(
      "archivo",
      {
        uri: archivo.uri,
        name: nombreArchivo,
        type: tipoArchivo,
      } as any
    );
  }

  const response = await fetch(
    `${API_URL}/api/Pagos/pedido/${pedidoId}/comprobante`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const texto = await response.text();

  let data: any = {};

  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
      `No se pudo subir el comprobante (${response.status}).`
    );
  }

  return data;
}

// ========================================
// PAGOS CON TARJETA - RECURRENTE SANDBOX
// ========================================

export type CheckoutTarjeta = {
  pedidoId: number;
  transaccionId: number;
  monto: number;
  moneda: string;
  checkoutId: string;
  checkoutUrl: string;
  estadoPago: string;
};

export async function crearCheckoutTarjeta(
  token: string,
  pedidoId: number
): Promise<CheckoutTarjeta> {

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    throw new Error("El pedido no es válido.");
  }

  const response = await fetch(
    `${API_URL}/api/pagos-tarjeta/pedidos/${pedidoId}/checkout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
      `No se pudo iniciar el pago con tarjeta. Código: ${response.status}`
    );
  }

  if (
    typeof data?.checkoutUrl !== "string" ||
    !data.checkoutUrl.startsWith("https://")
  ) {
    throw new Error(
      "Recurrente no devolvió una dirección de pago válida."
    );
  }

  return data as CheckoutTarjeta;
}

// ========================================
// GOOGLE LOGIN - DELIVERYCLIENTE
// ========================================

export async function iniciarSesionGoogle(
  idToken: string
) {
  const response = await fetch(
    `${API_URL}/api/Auth/google`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        `No se pudo iniciar sesión con Google (${response.status}).`
    );
  }

  if (!data?.token || !data?.usuario) {
    throw new Error(
      "El servidor no devolvió una sesión válida."
    );
  }

  return data;
}

// ========================================
// VINCULAR GOOGLE CON CUENTA EXISTENTE
// ========================================

export async function vincularCuentaGoogle(
  tokenJwt: string,
  idTokenGoogle: string
) {
  const response = await fetch(
    `${API_URL}/api/Auth/google/vincular`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenJwt}`,
      },
      body: JSON.stringify({
        idToken: idTokenGoogle,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
      `No se pudo vincular Google (${response.status}).`
    );
  }

  return data;
}
