import { logoUrl } from "./data";
import { cn } from "@/lib/cn";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3 text-gold-400", className)}>
      <img className="size-8 rounded object-cover md:size-9" src={logoUrl} alt="" />
      <span className="font-display text-lg font-medium uppercase tracking-[0.28em] md:text-2xl">
        {compact ? "Aurum" : "CryptoPoker"}
      </span>
    </div>
  );
}
