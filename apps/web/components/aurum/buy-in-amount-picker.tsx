"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AurumChip } from "./chip";
import { cn } from "@/lib/cn";

export type BuyInAmountPickerProps = {
  range: { min: number; max: number };
  value: number;
  onChange: (amount: number) => void;
  disabled?: boolean;
  className?: string;
};

export function BuyInAmountPicker({ range, value, onChange, disabled, className }: BuyInAmountPickerProps) {
  const presets = useMemo(() => buildPresets(range), [range]);
  const helperId = useId();
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [customDraft, setCustomDraft] = useState<string>(() =>
    presets.includes(value) ? "" : String(value),
  );

  useEffect(() => {
    if (presets.includes(value)) setCustomDraft("");
  }, [value, presets]);

  const customError = customDraft === "" ? null : validateCustom(customDraft, range);

  function selectPreset(preset: number) {
    if (disabled) return;
    onChange(preset);
    setCustomDraft("");
  }

  function focusByOffset(currentIndex: number, offset: number) {
    const next = (currentIndex + offset + presets.length) % presets.length;
    const target = radioRefs.current[next];
    target?.focus();
    selectPreset(presets[next]);
  }

  function handleChipKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusByOffset(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusByOffset(index, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusByOffset(index, -index);
    } else if (event.key === "End") {
      event.preventDefault();
      focusByOffset(index, presets.length - 1 - index);
    }
  }

  function handleCustomChange(next: string) {
    if (disabled) return;
    setCustomDraft(next);
    if (next === "") return;
    const parsed = Number(next.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed)) return;
    if (parsed >= range.min && parsed <= range.max) onChange(parsed);
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <p id={helperId} className="aurum-eyebrow text-sapphire-400">
        Choose your stack
      </p>
      <div
        role="radiogroup"
        aria-labelledby={helperId}
        aria-disabled={disabled || undefined}
        className="grid grid-cols-3 gap-2"
      >
        {presets.map((preset, index) => (
          <AurumChip
            key={preset}
            ref={(node) => {
              radioRefs.current[index] = node;
            }}
            selected={!customDraft && value === preset}
            disabled={disabled}
            onClick={() => selectPreset(preset)}
            onKeyDown={(event) => handleChipKeyDown(event, index)}
          >
            ${preset}
          </AurumChip>
        ))}
      </div>
      <label className="grid gap-1">
        <span className="aurum-eyebrow text-sapphire-400">Or set custom</span>
        <input
          type="text"
          inputMode="decimal"
          aria-describedby={`${helperId}-custom-helper`}
          aria-invalid={Boolean(customError)}
          disabled={disabled}
          placeholder={`$${range.min}-$${range.max}`}
          value={customDraft}
          onChange={(event) => handleCustomChange(event.target.value)}
          className={cn(
            "aurum-input min-h-12 px-4 text-sm",
            customError && "border-champagne-500/70",
          )}
        />
        <span
          id={`${helperId}-custom-helper`}
          className={cn(
            "text-xs",
            customError ? "text-champagne-500" : "text-sapphire-300",
          )}
        >
          {customError ?? `Min $${range.min}, Max $${range.max}.`}
        </span>
      </label>
    </div>
  );
}

function buildPresets({ min, max }: { min: number; max: number }): [number, number, number] {
  const mid = Math.round((min + max) / 2);
  return [min, mid, max];
}

function validateCustom(input: string, range: { min: number; max: number }): string | null {
  const cleaned = input.trim();
  if (cleaned === "") return null;
  const numericText = cleaned.replace(/[^0-9.]/g, "");
  if (numericText === "" || numericText === ".") return "Enter a numeric amount.";
  const parsed = Number(numericText);
  if (!Number.isFinite(parsed)) return "Enter a numeric amount.";
  if (parsed < range.min) return `$${parsed} is below the $${range.min} minimum.`;
  if (parsed > range.max) return `$${parsed} is above the $${range.max} maximum.`;
  return null;
}
