"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { toast } from "@/components/primitives/toast";
import { saveCategoryAction, deleteCategoryAction } from "@/actions/admin-catalog";
import type { AdminCategory } from "@/queries/admin";

interface CategoryManagerProps {
  initialCategories: AdminCategory[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await saveCategoryAction({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
      });

      if (res.success) {
        toast.success(`Category "${formData.name}" saved`);
        setShowForm(false);
        setCategories((prev) => {
          const index = prev.findIndex((c) => c.slug === formData.slug);
          const updated: AdminCategory = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            imageUrl: null,
            sortOrder: Number(formData.sortOrder) || 0,
            isActive: formData.isActive,
          };
          if (index >= 0) {
            return prev.map((c, i) => (i === index ? updated : c));
          }
          return [...prev, updated].sort((a, b) => a.sortOrder - b.sortOrder);
        });
        setFormData({ name: "", slug: "", description: "", sortOrder: 0, isActive: true });
      } else {
        toast.error(res.error || "Failed to save category");
      }
    } catch {
      toast.error("Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete category "${slug}"?`)) return;
    const res = await deleteCategoryAction(slug);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.slug !== slug));
      toast.info("Category removed");
    } else {
      toast.error(res.error || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your store departments, ordering and visibility.
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5 w-full sm:w-auto" size="sm">
            <Plus className="size-4" /> Add Category
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl sm:rounded-3xl border bg-card p-4 sm:p-6 shadow-xs space-y-4 max-w-2xl"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-sm">Add / Edit Category</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Organic Talbina"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">URL Slug *</Label>
              <Input
                id="cat-slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="organic-talbina"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description (Optional)</Label>
            <Input
              id="cat-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description for storefront header"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort">Sort Order</Label>
              <Input
                id="cat-sort"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2 sm:pt-6">
              <input
                type="checkbox"
                id="cat-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-input text-primary focus:ring-primary size-4"
              />
              <Label htmlFor="cat-active" className="text-xs font-medium cursor-pointer">
                Visible on Storefront
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save Category"}
            </Button>
          </div>
        </form>
      )}

      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {categories.map((c) => (
          <div
            key={c.slug}
            className="rounded-2xl border bg-card p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">/{c.slug}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  c.isActive
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.isActive ? "Active" : "Hidden"}
              </span>
            </div>

            {c.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
              <span>Order: <strong className="text-foreground">{c.sortOrder}</strong></span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                onClick={() => handleDelete(c.slug)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            No categories created yet.
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-3xl border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Sort Order</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <tr key={c.slug} className="hover:bg-muted/10 transition-colors">
                <td className="p-4 font-semibold text-foreground">{c.name}</td>
                <td className="p-4 text-muted-foreground font-mono">/{c.slug}</td>
                <td className="p-4 text-muted-foreground">{c.sortOrder}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.isActive
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.slug)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
