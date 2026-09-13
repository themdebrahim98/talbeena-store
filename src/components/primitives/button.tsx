"use client";

import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const BASE_CLASSES =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
  link: "text-primary underline-offset-4 hover:underline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "h-8 px-2.5",
  xs: "h-6 gap-1 rounded-[10px] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-[12px] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 px-2.5",
  icon: "size-8",
  "icon-xs": "size-6 rounded-[10px] [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-7 rounded-[12px]",
  "icon-lg": "size-9",
};

type RenderElement = ReactElement<{
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: ReactNode;
}>;

type ClickHandler = (event: MouseEvent<Element>) => void;

function chainClick(
  first: ClickHandler | undefined,
  second: ClickHandler | undefined,
): ClickHandler | undefined {
  if (!first) return second;
  if (!second) return first;
  return (event: MouseEvent) => {
    first(event);
    second(event);
  };
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Polymorphic rendering (replaces the old shadcn `render` prop): the given
   * element (e.g. a Next.js `<Link>`) receives the button classes, the click
   * handler and the children, so links can look like buttons with plain
   * Tailwind classes.
   */
  render?: ReactElement;
}

/** Plain Tailwind button. Pass `render={<Link href=.../>}` to style a link. */
export function Button({
  className,
  variant = "default",
  size = "default",
  render,
  type = "button",
  children,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (render && isValidElement(render)) {
    const el = render as RenderElement;
    return cloneElement(el, {
      className: cn(classes, el.props.className),
      onClick: chainClick(el.props.onClick, onClick as ClickHandler | undefined),
      children,
    });
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}