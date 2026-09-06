export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string | null;
  disponible: boolean;
  comercioId: number;
  categoriaId: number;
}