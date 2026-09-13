"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface MenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuState>({
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

function applyRender(
  render: ReactElement,
  extra: { className?: string; onClick?: (event: MouseEvent) => void; children?: ReactNode },
): ReactNode {
  const el = render as Renderable;
  return cloneElement(el, {
    className: cn(extra.className, el.props.className),
    onClick: chainClick(el.props.onClick, extra.onClick),
    children: extra.children ?? el.props.children,
  });
}

/** Plain Tailwind dropdown menu (click to toggle, outside-click + Escape to close). */
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  );
}

interface TriggerProps extends HTMLAttributes<HTMLButtonElement> {
  render?: ReactElement;
}

export function DropdownMenuTrigger({
  render,
  className,
  children,
  onClick,
  ...props
}: TriggerProps) {
  const { open, setOpen } = useContext(MenuContext);
  const toggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      setOpen(!open);
    },
    [onClick, open, setOpen],
  );

  if (render && isValidElement(render)) {
    return (
      <>{applyRender(render, { onClick: toggle as (event: MouseEvent<Element>) => void, children })}</>
    );
  }
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={className}
      onClick={toggle}
      {...props}
    >
      {children}
    </button>
  );
}

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

export function DropdownMenuContent({
  align = "start",
  className,
  children,
  onClick,
  ...props
}: ContentProps) {
  const { open, setOpen } = useContext(MenuContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      className={cn(
        "absolute z-50 mt-1 min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ItemProps extends HTMLAttributes<HTMLDivElement> {
  render?: ReactElement;
  variant?: "default" | "destructive";
}

export function DropdownMenuItem({
  render,
  variant = "default",
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: ItemProps) {
  const itemClass = cn(
    "relative flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
    variant === "destructive" &&
      "text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive",
    className,
  );

  if (render && isValidElement(render)) {
    return (
      <>{applyRender(render, { className: itemClass, onClick: onClick as ((event: MouseEvent<Element>) => void) | undefined, children })}</>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      (event.currentTarget as HTMLDivElement).click();
    }
  };

  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={itemClass}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-1.5 py-1 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}