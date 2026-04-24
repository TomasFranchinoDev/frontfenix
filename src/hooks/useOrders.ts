"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createOrder, getMyOrders, getOrderDetail } from "@/src/lib/api/orders";

export const ordersQueryKeys = {
  all: ["orders"] as const,
  mine: ["orders", "mine"] as const,
  detail: (codigoOrden: string) => ["orders", "detail", codigoOrden] as const,
};

type OrdersQueryOptions = {
  enabled?: boolean;
  userId?: string;
};

export function useMyOrders(options: OrdersQueryOptions = {}) {
  const { enabled = true, userId } = options;

  return useQuery({
    queryKey: [...ordersQueryKeys.mine, userId ?? "anonymous"],
    queryFn: getMyOrders,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useOrderDetail(codigoOrden: string | undefined, options: OrdersQueryOptions = {}) {
  const { enabled = true, userId } = options;

  return useQuery({
    queryKey: [...ordersQueryKeys.detail(codigoOrden ?? ""), userId ?? "anonymous"],
    queryFn: () => getOrderDetail(codigoOrden!),
    enabled: Boolean(codigoOrden) && enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.mine });
    },
  });
}

