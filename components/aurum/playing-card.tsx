import { cn } from "@/lib/cn";

type CardSuit = "D" | "H" | "S" | "C";

type PlayingCardProps = {
  rank?: string;
  suit?: CardSuit;
  size?: "table" | "seat";
  empty?: boolean;
  className?: string;
};

const suitSymbol: Record<CardSuit, string> = {
  D: "♦",
  H: "♥",
  S: "♠",
  C: "♣",
};

const redSuits = new Set<CardSuit>(["D", "H"]);

export function parseCard(card: string) {
  const suit = card.slice(-1) as CardSuit;
  return {
    rank: card.slice(0, -1),
    suit,
  };
}

export function PlayingCard({ rank, suit, size = "table", empty, className }: PlayingCardProps) {
  const symbol = suit ? suitSymbol[suit] : "";
  const isRed = suit ? redSuits.has(suit) : false;

  if (empty) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-[4.14px] border border-dashed border-ivory-100/10 bg-black/15 md:rounded-[9px]",
          size === "table"
            ? "h-[43.24px] w-[30.36px] md:h-[94px] md:w-[66px] xl:h-[108px] xl:w-[76px] xl:rounded-[10px] 2xl:h-[122px] 2xl:w-[86px] 2xl:rounded-xl"
            : "h-[23.92px] w-[16.56px] md:h-[52px] md:w-9 xl:h-[58px] xl:w-10",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden bg-gradient-to-b from-ivory-50 to-[#ece3cd] shadow-[0_4.6px_10.12px_rgb(0_0_0_/_0.6)] md:shadow-[0_10px_22px_rgb(0_0_0_/_0.6)]",
        size === "table"
          ? "h-[43.24px] w-[30.36px] rounded-[4.14px] md:h-[94px] md:w-[66px] md:rounded-[9px] xl:h-[108px] xl:w-[76px] xl:rounded-[10px] 2xl:h-[122px] 2xl:w-[86px] 2xl:rounded-xl"
          : "h-[23.92px] w-[16.56px] rounded-[2.3px] md:h-[52px] md:w-9 md:rounded-[5px] xl:h-[58px] xl:w-10",
        isRed ? "text-[#b22a2a]" : "text-sapphire-950",
        className,
      )}
    >
      <span
        className={cn(
          "absolute font-display font-semibold leading-none",
          size === "table"
            ? "left-[3.22px] top-[2.3px] text-[9.2px] md:left-[7px] md:top-[5px] md:text-xl xl:left-2 xl:top-1.5 xl:text-[23px] 2xl:left-[9px] 2xl:top-2 2xl:text-[26px]"
            : "left-[3.22px] top-[2.3px] text-[6.3px] md:left-[7px] md:top-[5px] md:text-[12px] xl:left-2 xl:top-1.5 xl:text-[13.5px]",
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          "absolute font-display leading-none",
          size === "table"
            ? "left-[3.22px] top-[11.5px] text-[9.2px] md:left-[7px] md:top-[25px] md:text-xl xl:left-2 xl:top-[29px] xl:text-[23px] 2xl:left-[9px] 2xl:top-[33px] 2xl:text-[26px]"
            : "left-[3.22px] top-[7.36px] text-[6.5px] md:left-[7px] md:top-4 md:text-[12px] xl:left-2 xl:top-[18px] xl:text-[13.5px]",
        )}
      >
        {symbol}
      </span>
      <span
        className={cn(
          "absolute font-display leading-none",
          size === "table"
            ? "left-[9.66px] top-[23.46px] text-[17.48px] md:left-[21px] md:top-[51px] md:text-[38px] xl:left-[24px] xl:top-[59px] xl:text-[44px] 2xl:left-[27px] 2xl:top-[66px] 2xl:text-[50px]"
            : "left-[5.06px] top-[13.34px] text-[9.75px] md:left-[11px] md:top-[29px] md:text-[19.5px] xl:left-3 xl:top-8 xl:text-[22px]",
        )}
      >
        {symbol}
      </span>
    </span>
  );
}
