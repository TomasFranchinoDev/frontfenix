import api from "@/src/lib/api/client";

type ValidateCartItemsResponse = {
  disponibles: string[];
  no_disponibles: string[];
};

export async function validateCartItems(productIds: string[]): Promise<ValidateCartItemsResponse> {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return { disponibles: [], no_disponibles: [] };
  }

  const { data } = await api.post<ValidateCartItemsResponse>("/api/catalog/validar-carrito", {
    producto_ids: uniqueIds,
  });

  return data;
}
