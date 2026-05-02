import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type AurumChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "aria-checked"> & {
  selected?: boolean;
  children: ReactNode;
};

export const AurumChip = forwardRef<HTMLButtonElement, AurumChipProps>(function AurumChip(
  { selected, className, children, tabIndex, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      role="radio"
      aria-checked={selected ?? false}
      tabIndex={tabIndex ?? (selected ? 0 : -1)}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold tracking-[0.08em] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border border-champagne-500/35 bg-gradient-to-b from-champagne-500/30 to-[#8b6a2e]/25 text-gold-400 shadow-[inset_0_1px_0_rgb(240_217_164_/_0.2)]"
          : "border border-ivory-100/10 bg-sapphire-950/20 text-gold-400 hover:border-champagne-500/30 hover:bg-sapphire-800/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
