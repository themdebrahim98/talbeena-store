"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/primitives/input";

export function CatalogToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "featured";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = formData.get("search")?.toString().trim() || "";
    updateParam("search", searchVal);
  };

  const handleClearSearch = () => {
    updateParam("search", "");
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParam("sort", e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          key={currentSearch}
          name="search"
          defaultValue={currentSearch}
          placeholder="Search pantry…"
          className="pl-9 pr-8 text-xs h-9 rounded-full bg-card"
        />
        {currentSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      <select
        value={currentSort}
        onChange={handleSortChange}
        className="h-9 rounded-full border bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
        aria-label="Sort products"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="newest">Newest Arrivals</option>
      </select>
    </div>
  );
}
