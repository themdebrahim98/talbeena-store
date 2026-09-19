"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  autoSubmit?: boolean;
  size?: "sm" | "default";
}

export function CustomSelect({
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Select an option",
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
  required = false,
  id,
  autoSubmit = false,
  size = "default",
}: CustomSelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const currentValue = isControlled ? controlledValue : internalValue;

  const selectedOption = options.find((o) => o.value === currentValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = useCallback(
    (optValue: string) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalValue(optValue);
      }
      onChange?.(optValue);
      setOpen(false);
      triggerRef.current?.focus();

      if (autoSubmit && hiddenInputRef.current?.form) {
        // Small timeout so the hidden input value is updated before submission
        setTimeout(() => {
          hiddenInputRef.current?.form?.requestSubmit();
        }, 10);
      }
    },
    [autoSubmit, disabled, isControlled, onChange],
  );

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        const currentIndex = options.findIndex((o) => o.value === currentValue);
        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      } else {
        const next =
          event.key === "ArrowDown"
            ? (activeIndex + 1) % options.length
            : (activeIndex - 1 + options.length) % options.length;
        setActiveIndex(next);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && activeIndex >= 0 && activeIndex < options.length) {
        const opt = options[activeIndex];
        if (!opt.disabled) {
          handleSelect(opt.value);
        }
      } else {
        setOpen(!open);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full sm:w-auto", className)}>
      {/* Hidden input for HTML form submissions / FormData */}
      {name && (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={currentValue}
          required={required && !currentValue}
        />
      )}

      {/* Select Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-card text-left font-medium text-foreground shadow-xs transition-all cursor-pointer select-none",
          "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          open && "border-primary ring-2 ring-primary/20",
          isSmall
            ? "h-8 px-2.5 text-xs"
            : "h-9 px-3 text-xs sm:text-sm",
          triggerClassName,
        )}
      >
        <span
          className={cn(
            "truncate flex items-center gap-1.5",
            !selectedOption && "text-muted-foreground",
          )}
        >
          {displayText}
          {selectedOption?.badge && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={cn(
            "size-3.5 sm:size-4 shrink-0 text-muted-foreground/80 transition-transform duration-200 group-hover:text-foreground",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {/* Dropdown Options List */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute left-0 top-full mt-1.5 z-50 min-w-full sm:min-w-[200px] max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150",
            contentClassName,
          )}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === currentValue;
            const isActive = index === activeIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  if (!opt.disabled) {
                    handleSelect(opt.value);
                  }
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "relative flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none",
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  isActive && !isSelected && "bg-accent/60",
                  opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                )}
              >
                <span className="truncate flex items-center gap-1.5">
                  {opt.label}
                  {opt.badge && (
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                      {opt.badge}
                    </span>
                  )}
                </span>

                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
