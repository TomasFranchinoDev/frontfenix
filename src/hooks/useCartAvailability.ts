"use client";

import { useEffect, useMemo, useState } from "react";

import { validateCartItems } from "@/src/lib/api/catalog";
import { useCartStore } from "@/src/stores/cartStore";

export function useCartAvailability() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const removeItem = useCartStore((state) => state.removeItem);

  const [isValidating, setIsValidating] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const productIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.producto_id))),
    [items],
  );

  const validationKey = useMemo(() => productIds.slice().sort().join("|"), [productIds]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (productIds.length === 0) {
      setIsValidating(false);
      return;
    }

    let isActive = true;

    const syncCartAvailability = async () => {
      setIsValidating(true);

      try {
        const validation = await validateCartItems(productIds);

        if (!isActive || validation.no_disponibles.length === 0) {
          return;
        }

        const unavailableIds = new Set(validation.no_disponibles);
        const removedItems = items.filter((item) => unavailableIds.has(item.producto_id));

        if (removedItems.length === 0) {
          return;
        }

        removedItems.forEach((item) => {
          removeItem(item.id);
        });

        setToastMessage("Algunos productos de tu carrito ya no están disponibles y fueron removidos.");
        setIsToastVisible(true);
      } catch (error) {
        console.error("Failed to validate cart availability", error);
      } finally {
        if (isActive) {
          setIsValidating(false);
        }
      }
    };

    void syncCartAvailability();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, items, productIds, removeItem, validationKey]);

  return {
    isValidating,
    toastMessage,
    isToastVisible,
    closeToast: () => setIsToastVisible(false),
  };
}
