"use client";

import { cn } from "@/lib/cn";

/** Interrupteur accessible (role=switch, pilotable au clavier). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        checked ? "bg-primary" : "bg-border",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 transform rounded-full bg-surface shadow transition-transform",
          "h-[18px] w-[18px]",
          checked ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
