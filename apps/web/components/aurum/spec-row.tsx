type SpecRowProps = {
  items: Array<{ label: string; value: string; gold?: boolean }>;
  className?: string;
};

export function SpecRow({ items, className = "" }: SpecRowProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-lg border border-champagne-500/30 bg-sapphire-950/60 p-3 sm:flex sm:items-start sm:justify-between ${className}`}
    >
      {items.map((item) => (
        <span className="grid gap-1 whitespace-nowrap font-mono text-xs text-ivory-50" key={item.label}>
          <b className="aurum-eyebrow font-sans font-normal">{item.label}</b>
          <span className={item.gold ? "text-gold-400" : undefined}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}
