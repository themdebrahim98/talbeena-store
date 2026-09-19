"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/primitives/input";
import { CustomSelect } from "@/components/primitives/custom-select";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
];

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

  return (
    <div className="flex items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          key={currentSearch}
          name="search"
          defaultValue={currentSearch}
          placeholder="Search catalog…"
          className="pl-9 pr-8 h-9 rounded-full bg-card"
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

      <CustomSelect
        value={currentSort}
        onChange={(val) => updateParam("sort", val)}
        options={SORT_OPTIONS}
        className="w-44"
        triggerClassName="rounded-full px-3.5 h-9 text-xs"
      />
    </div>
  );
}
