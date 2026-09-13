"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/firebase";

interface ProductGalleryProps {
  images: Array<{ id: string } & ProductImage>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeImage = images[selectedIndex] || {
    url: "/images/product-placeholder.svg",
    alt: productName,
  };

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto md:flex-col md:overflow-visible">
          {images.map((img, i) => {
            const isSelected = i === selectedIndex;
            return (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-xl border bg-muted/30 transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected && "border-primary ring-2 ring-primary/20",
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image */}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-3xl border bg-accent/20 shadow-xs">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover transition-all duration-300"
        />
      </div>
    </div>
  );
}
