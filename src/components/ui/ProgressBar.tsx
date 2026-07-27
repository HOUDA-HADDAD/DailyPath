import { cn } from "@/lib/cn";

/**
 * Barre de progression accessible.
 *
 * Note UX : sur les parcours d'assistant (création d'activité), on démarre
 * volontairement au-dessus de 0 % — l'effet « gradient d'objectif » montre que
 * le parcours est déjà entamé. Sur les mesures réelles (taux de complétion du
 * jour), la valeur reste STRICTEMENT honnête : on ne gonfle jamais un chiffre
 * que l'utilisateur interprète comme une donnée.
 */
export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: {
  /** 0..100 */
  value: number;
  label: string;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
