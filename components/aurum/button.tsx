import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type AurumButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "segment";
  active?: boolean;
  children: ReactNode;
};

export function AurumButton({ variant = "primary", active, className, children, ...props }: AurumButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold tracking-[0.08em] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border border-champagne-500/35 bg-gradient-to-b from-champagne-500/30 to-[#8b6a2e]/25 text-gold-400 shadow-[inset_0_1px_0_rgb(240_217_164_/_0.2)] hover:from-champagne-500/40",
        variant === "ghost" &&
          "border border-ivory-100/10 bg-sapphire-950/20 text-gold-400 hover:border-champagne-500/30 hover:bg-sapphire-800/40",
        variant === "segment" &&
          "border border-transparent bg-transparent text-gold-400 hover:border-ivory-100/10",
        active && "border-champagne-500/35 bg-gradient-to-b from-champagne-500/30 to-[#8b6a2e]/25",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
