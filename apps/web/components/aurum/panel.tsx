import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("gilt-panel rounded-[28px]", className)} {...props}>
      <span className="gilt-line absolute left-6 right-6 top-0 h-px" />
      {children}
    </div>
  );
}
