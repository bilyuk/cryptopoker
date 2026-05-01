import type { ReactNode } from "react";
import { Backdrop } from "@/components/aurum/backdrop";

export function AurumCanvas({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sapphire-950 text-ivory-100">
      <Backdrop />
      <div className={padded ? "relative z-10 p-8" : "relative z-10"}>{children}</div>
    </div>
  );
}
