"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

type ToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({ message, visible, onClose, durationMs = 6000 }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(false);
      return;
    }

    // Trigger enter animation
    const enterTimer = setTimeout(() => setShow(true), 10);

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 350); // wait for exit animation
    }, durationMs);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [visible, durationMs, onClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300 ease-out",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-5 py-4 shadow-xl shadow-black/10">
        <CheckCircle2 className="size-5 shrink-0 text-green-600" />
        <p className="text-sm font-medium text-foreground pr-2">{message}</p>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 350);
          }}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
