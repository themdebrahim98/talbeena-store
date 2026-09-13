import Link from "next/link";
import { Home, Package } from "lucide-react";
import { Button } from "@/components/primitives/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            404 Not Found
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Page does not exist
          </h1>
          <p className="text-sm text-muted-foreground">
            The pantry item or page you are looking for may have moved or been taken off the shelf.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" render={<Link href="/" />}>
            <Home className="size-4 mr-2" /> Back to Home
          </Button>
          <Button render={<Link href="/products" />}>
            <Package className="size-4 mr-2" /> Browse Products
          </Button>
        </div>
      </div>
    </div>
  );
}
