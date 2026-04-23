import api from "@/src/lib/api/client";

export type OrderItemPayload = {
  producto_id: string;
  cantidad: number;
  variantes: Record<string, string | number | boolean>;
};

export type CreateOrderPayload = {
  items: OrderItemPayload[];
  notas_cliente?: string;
  direccion_entrega?: string;
  telefono_contacto?: string;
};

export type CreateOrderResponse = {
  codigo_orden: string;
  total: string;
};

export type MyOrder = {
  codigo_orden: string;
  estado: string;
  total: string;
  creado_en: string;
};

export type OrderDetailItem = {
  producto_id: string;
  sku: string;
  nombre: string;
  precio_unitario: string;
  cantidad: number;
  variantes: Record<string, string | number | boolean>;
  subtotal: string;
};

export type OrderDetail = {
  codigo_orden: string;
  estado: string;
  total: string;
  creado_en: string;
  actualizado_en: string;
  notas_cliente: string;
  direccion_entrega: string;
  telefono_contacto: string;
  detalle_carrito: {
    items: OrderDetailItem[];
    notas_cliente: string;
    direccion_entrega: string;
    telefono_contacto: string;
  };
};

export async function getMyOrders(): Promise<MyOrder[]> {
  const { data } = await api.get<MyOrder[]>("/api/orders/mis-ordenes");
  return data;
}

export async function getOrderDetail(codigoOrden: string): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/api/orders/mis-ordenes/${codigoOrden}`);
  return data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const { data } = await api.post<CreateOrderResponse>("/api/orders/crear", payload);
  return data;
}
