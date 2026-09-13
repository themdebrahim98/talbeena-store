"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number; // 0 to 5
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  interactive = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "size-3.5",
    md: "size-4 sm:size-5",
    lg: "size-6 sm:size-7",
  }[size];

  const currentDisplay = hoverRating !== null ? hoverRating : value;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${interactive ? "cursor-pointer" : ""} ${className}`}
      onMouseLeave={() => interactive && setHoverRating(null)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = currentDisplay >= starIndex;
        const isHalf = !isFilled && currentDisplay >= starIndex - 0.5;

        return (
          <button
            type="button"
            key={starIndex}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starIndex)}
            onMouseEnter={() => interactive && setHoverRating(starIndex)}
            className={`p-0.5 transition-transform ${
              interactive ? "hover:scale-110 focus:outline-hidden" : "cursor-default"
            }`}
            aria-label={`${starIndex} Star${starIndex > 1 ? "s" : ""}`}
          >
            <Star
              className={`${sizeClasses} transition-colors ${
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : isHalf
                    ? "fill-amber-400/60 text-amber-400"
                    : "fill-muted/20 text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
