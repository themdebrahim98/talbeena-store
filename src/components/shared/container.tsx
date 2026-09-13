import { cn } from "@/lib/utils";

interface ContainerProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}