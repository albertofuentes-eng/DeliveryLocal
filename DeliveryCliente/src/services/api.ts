const API_URL = "http://10.0.2.2:5022";

// ========================================
// COMERCIOS
// ========================================

export async function obtenerComercios() {
  const response = await fetch(
    `${API_URL}/api/Comercios`
  );

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.mensaje ||
        "No se pudo iniciar sesión."
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
// CREAR PEDIDO
// ========================================

export async function crearPedido(
  token: string,
  datos: {
    comercioId: number;

    tipoEntrega: "Domicilio" | "Recoger";

    direccionEntrega?: string | null;
    latitudEntrega?: number | null;
    longitudEntrega?: number | null;

    telefonoEntrega?: string | null;
    referenciaEntrega?: string | null;
    indicacionesEntrega?: string | null;

    tipoTiempo: "Ahora" | "Despues";

    fechaProgramada?: string | null;

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
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(datos),
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
        `No se pudo obtener el detalle del pedido. Código: ${response.status}`
    );
  }

  return data;
}