"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface SheetState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetState>({
  open: false,
  setOpen: () => {},
});

type Renderable = ReactElement<{
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: ReactNode;
}>;

function chainClick(
  first: ((event: MouseEvent<Element>) => void) | undefined,
  second: ((event: MouseEvent<Element>) => void) | undefined,
): ((event: MouseEvent<Element>) => void) | undefined {
  if (!first) return second;
  if (!second) return first;
  return (event: MouseEvent) => {
    first(event);
    second(event);
  };
}

/** Plain Tailwind slide-over panel (controlled, overlay-click + Escape to close). */
export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  render,
  className,
  children,
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { render?: ReactElement }) {
  const { setOpen } = useContext(SheetContext);
  const open = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(true);
  };

  if (render && isValidElement(render)) {
    const el = render as Renderable;
    return (
      <>
        {cloneElement(el, {
          className: cn(className, el.props.className),
          onClick: chainClick(el.props.onClick, open as (event: MouseEvent<Element>) => void),
          children: children ?? el.props.children,
        })}
      </>
    );
  }
  return (
    <button type="button" className={className} onClick={open} {...props}>
      {children}
    </button>
  );
}

export function SheetClose({
  render,
  className,
  children,
  onClick,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { render?: ReactElement }) {
  const { setOpen } = useContext(SheetContext);
  const close = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  if (render && isValidElement(render)) {
    const el = render as Renderable;
    return (
      <>
        {cloneElement(el, {
          className: cn(className, el.props.className),
          onClick: chainClick(el.props.onClick, close as (event: MouseEvent<Element>) => void),
          children: children ?? el.props.children,
        })}
      </>
    );
  }
  return (
    <button type="button" className={className} onClick={close} {...props}>
      {children}
    </button>
  );
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }) {
  const { open, setOpen } = useContext(SheetContext);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" {...props}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "absolute top-0 flex h-full w-80 flex-col gap-6 bg-background p-6 shadow-lg",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("flex items-center gap-2 text-base font-semibold", className)} {...props} />
  );
}