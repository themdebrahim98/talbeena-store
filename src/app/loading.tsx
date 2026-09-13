import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Leaf className="size-6 animate-pulse text-primary" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-xs font-medium text-muted-foreground animate-pulse">
        Loading wholesome foods…
      </p>
    </div>
  );
}
