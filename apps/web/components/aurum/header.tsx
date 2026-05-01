import { AurumButton } from "./button";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";

type HeaderProps = {
  mode: string;
  playerName: string;
  onCreateRoom?: () => void;
  onInvitePreview?: () => void;
  onSignOut: () => void;
  className?: string;
};

export function Header({ mode, playerName, onCreateRoom, onInvitePreview, onSignOut, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-3 z-20 flex h-12 items-center gap-3 rounded-[18px] border border-champagne-500/25 bg-sapphire-950/65 px-2 shadow-[0_10px_24px_-10px_rgb(0_0_0_/_0.34)] backdrop-blur-xl md:top-0 md:-mx-6 md:-mt-6 md:h-[60px] md:rounded-none md:border-x-0 md:border-t-0 md:px-6 xl:px-10",
        className,
      )}
    >
      <Logo className="[&_img]:size-7 [&_span]:text-base md:hidden" compact />
      <Logo className="hidden md:inline-flex [&_img]:size-7 [&_span]:text-lg xl:[&_span]:text-xl" />
      <span className="hidden h-4 w-px bg-champagne-500/25 md:block" />
      <span className="aurum-eyebrow hidden text-sapphire-200 sm:inline">{mode}</span>
      <nav className="ml-auto hidden items-center gap-2 lg:flex">
        {onCreateRoom && (
          <AurumButton className="min-h-8 px-3 text-xs" variant="ghost" onClick={onCreateRoom}>
            Create
          </AurumButton>
        )}
        {onInvitePreview && (
          <AurumButton className="min-h-8 px-3 text-xs" variant="ghost" onClick={onInvitePreview}>
            Invite
          </AurumButton>
        )}
      </nav>
      <div className="ml-auto flex min-h-8 items-center gap-2 rounded-full border border-champagne-500/35 bg-sapphire-800/60 py-1 pl-1 pr-2 text-xs md:pr-3 lg:ml-0">
        <b className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-champagne-300 to-[#8b6a2e] font-display text-sapphire-900">
          {playerName.slice(0, 1).toUpperCase()}
        </b>
        <span>{playerName}</span>
        <span className="hidden h-3 w-px bg-champagne-500/30 sm:block" />
        <span className="hidden font-mono text-gold-400 sm:block">$312.50</span>
      </div>
      <AurumButton className="hidden min-h-8 px-3 text-xs sm:inline-flex" variant="ghost" onClick={onSignOut}>
        Sign out
      </AurumButton>
    </header>
  );
}
