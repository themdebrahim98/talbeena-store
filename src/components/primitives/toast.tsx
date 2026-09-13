"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type PushFn = (toast: Omit<ToastItem, "id">) => void;

let pushToast: PushFn | null = null;
let nextId = 1;

function show(kind: ToastKind, message: string) {
  pushToast?.({ kind, message });
}

/** Drop-in replacement for `sonner`'s `toast`: `toast()`, `toast.success()`, `toast.error()`. */
export const toast = Object.assign((message: string) => show("default", message), {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  info: (message: string) => show("default", message),
});

const POSITION_CLASSES: Record<string, string> = {
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "right-4 bottom-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
};

const KIND_STYLES: Record<ToastKind, { icon: typeof Info; ring: string; iconClass: string }> = {
  default: { icon: Info, ring: "ring-foreground/10", iconClass: "text-primary" },
  success: { icon: CheckCircle2, ring: "ring-emerald-500/40", iconClass: "text-emerald-600" },
  error: { icon: AlertCircle, ring: "ring-destructive/40", iconClass: "text-destructive" },
};

/** Plain Tailwind toast viewport. Renders queued toasts with auto-dismiss. */
export function Toaster({
  position = "top-center",
}: {
  position?: keyof typeof POSITION_CLASSES | string;
  richColors?: boolean;
  closeButton?: boolean;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushToast = ({ kind, message }) => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  function dismiss(id: number) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed z-[100] flex w-full max-w-sm flex-col gap-2",
        POSITION_CLASSES[position] ?? POSITION_CLASSES["top-center"],
      )}
    >
      {items.map((item) => {
        const style = KIND_STYLES[item.kind];
        const Icon = style.icon;
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-lg bg-card px-3.5 py-3 text-sm text-card-foreground shadow-lg ring-1",
              style.ring,
            )}
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", style.iconClass)} />
            <p className="flex-1">{item.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}