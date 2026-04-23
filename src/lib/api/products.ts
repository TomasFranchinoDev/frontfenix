import api from "@/src/lib/api/client";

export type ProductImage = {
  id: string;
  url: string;
  es_principal: boolean;
  orden: number;
};

export type Product = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: string;
  sku: string | null;
  slug: string | null;
  esquema_opciones: Record<string, unknown>;
  imagenes: ProductImage[];
};

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/api/catalog/productos");
  return data;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(`/api/catalog/productos/${slug}`);
  return data;
}
