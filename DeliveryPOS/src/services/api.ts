const API_URL = "http://localhost:5022";

export type UsuarioPOS = {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: string;
};

export type PedidoComercio = {
  id: number;
  fecha: string;
  estado: string;

  tipoEntrega: string;
  tipoTiempo: string;
  fechaProgramada?: string | null;

  subtotal: number;
  envio: number;
  total: number;

  usuarioId: number;
  cliente: string;
  telefonoCliente?: string | null;

  direccionEntrega?: string | null;
  telefonoEntrega?: string | null;
  referenciaEntrega?: string | null;
  indicacionesEntrega?: string | null;

  latitudEntrega?: number | null;
  longitudEntrega?: number | null;

  comercioId: number;
  comercio: string;

  cantidadProductos: number;
};

export async function loginComercio(
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

  return data;
}

export async function obtenerPedidosComercio(
  token: string
): Promise<PedidoComercio[]> {
  const response = await fetch(
    `${API_URL}/api/Pedidos/comercio`,
    {
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

  if (response.status === 403) {
    throw new Error(
      "No tienes permisos para acceder al POS."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudieron cargar los pedidos."
    );
  }

  return data;
}

export type DetalleProductoPedido = {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type DetallePedidoComercio = {
  id: number;
  fecha: string;
  estado: string;

  usuarioId: number;

  cliente: string;
  correoCliente?: string | null;
  telefonoCliente?: string | null;

  tipoEntrega: string;
  direccionEntrega?: string | null;
  telefonoEntrega?: string | null;
  referenciaEntrega?: string | null;
  indicacionesEntrega?: string | null;

  latitudEntrega?: number | null;
  longitudEntrega?: number | null;

  tipoTiempo: string;
  fechaProgramada?: string | null;

  subtotal: number;
  envio: number;
  total: number;

  comercioId: number;
  comercio: string;

  detalles: DetalleProductoPedido[];
};

export async function obtenerDetallePedidoComercio(
  token: string,
  id: number
): Promise<DetallePedidoComercio> {
  const response = await fetch(
    `${API_URL}/api/Pedidos/comercio/${id}`,
    {
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

  if (response.status === 403) {
    throw new Error(
      "No tienes permisos para ver este pedido."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo cargar el detalle del pedido."
    );
  }

  return data;
}

export async function actualizarEstadoPedido(
  token: string,
  id: number,
  estado: string
) {
  const response = await fetch(
    `${API_URL}/api/Pedidos/${id}/estado`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        estado,
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo actualizar el estado del pedido."
    );
  }

  return data;
}

export type ProductoPOS = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;

  comercioId: number;
  categoriaId: number;

  categoria: string;
};

export async function obtenerMisProductos(
  token: string
): Promise<ProductoPOS[]> {
  const response = await fetch(
    `${API_URL}/api/Productos/mi-comercio`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
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
      "Tu sesión expiró."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "No tienes permisos para administrar productos."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudieron cargar los productos."
    );
  }

  return data;
}

export type CategoriaPOS = {
  id: number;
  nombre: string;
  comercioId: number;
  activo: boolean;
};

export async function obtenerMisCategorias(
  token: string
): Promise<CategoriaPOS[]> {
  const response = await fetch(
    `${API_URL}/api/Categorias/mi-comercio`,
    {
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudieron cargar las categorías."
    );
  }

  return data;
}

export async function crearCategoria(
  token: string,
  nombre: string
) {
  const response = await fetch(
    `${API_URL}/api/Categorias`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre,
        comercioId: 0
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo crear la categoría."
    );
  }

  return data;
}

export async function actualizarCategoria(
  token: string,
  id: number,
  nombre: string
) {
  const response = await fetch(
    `${API_URL}/api/Categorias/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre,
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo actualizar la categoría."
    );
  }

  return data;
}

export async function eliminarCategoria(
  token: string,
  id: number
) {
  const response = await fetch(
    `${API_URL}/api/Categorias/${id}`,
    {
      method: "DELETE",
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo desactivar la categoría."
    );
  }

  return data;
}

export async function activarCategoria(
  token: string,
  id: number
) {
  const response = await fetch(
    `${API_URL}/api/Categorias/${id}/activar`,
    {
      method: "PUT",
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
        "No se pudo activar la categoría."
    );
  }

  return data;
}

export async function crearProducto(
  token: string,
  datos: {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    imagenUrl?: string | null;
    categoriaId: number;
  }
) {
  const response = await fetch(
    `${API_URL}/api/Productos`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precio,
        imagenUrl: datos.imagenUrl,
        categoriaId: datos.categoriaId,

        // El backend ya obtiene el comercio real desde el JWT.
        comercioId: 0,
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo crear el producto."
    );
  }

  return data;
}

export async function obtenerProductoPOS(
  token: string,
  id: number
): Promise<ProductoPOS> {
  const productos =
    await obtenerMisProductos(token);

  const producto =
    productos.find(
      (p) => p.id === id
    );

  if (!producto) {
    throw new Error(
      "Producto no encontrado."
    );
  }

  return producto;
}

export async function actualizarProducto(
  token: string,
  id: number,
  datos: {
    nombre: string;
    descripcion?: string | null;
    precio: number;
    imagenUrl?: string | null;
    categoriaId: number;
  }
) {
  const response = await fetch(
    `${API_URL}/api/Productos/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({
        nombre:
          datos.nombre,

        descripcion:
          datos.descripcion,

        precio:
          datos.precio,

        imagenUrl:
          datos.imagenUrl,

        categoriaId:
          datos.categoriaId,
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
      data?.title ||
        "No se pudo actualizar el producto."
    );
  }

  return data;
}

export async function desactivarProducto(
  token: string,
  id: number
) {
  const response = await fetch(
    `${API_URL}/api/Productos/${id}`,
    {
      method: "DELETE",

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
        "No se pudo desactivar el producto."
    );
  }

  return data;
}

export async function activarProducto(
  token: string,
  id: number
) {
  const response = await fetch(
    `${API_URL}/api/Productos/${id}/activar`,
    {
      method: "PUT",

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
        "No se pudo activar el producto."
    );
  }

  return data;
}

export type MiComercioPOS = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  direccion: string;
  telefono?: string | null;
  imagenUrl?: string | null;
  activo: boolean;
  fechaCreacion: string;
};

export async function obtenerMiComercio(
  token: string
): Promise<MiComercioPOS> {
  const response = await fetch(
    `${API_URL}/api/Comercios/mi-comercio`,
    {
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

  if (response.status === 403) {
    throw new Error(
      "No tienes permisos para administrar este comercio."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudieron cargar los datos del comercio."
    );
  }

  return data;
}

export async function actualizarMiComercio(
  token: string,
  datos: {
    nombre: string;
    descripcion?: string | null;
    direccion: string;
    telefono?: string | null;
    imagenUrl?: string | null;
  }
) {
  const response = await fetch(
    `${API_URL}/api/Comercios/mi-comercio`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        direccion: datos.direccion,
        telefono: datos.telefono,
        imagenUrl: datos.imagenUrl,
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

  if (!response.ok) {
    throw new Error(
      data?.mensaje ||
        "No se pudo actualizar el comercio."
    );
  }

  return data;
}