import { cn } from "@/lib/cn";

/**
 * Placeholder de chargement. Préféré à un texte « Chargement… » : il conserve
 * la mise en page et réduit la sensation d'attente.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-surface-2", className)}
      aria-hidden="true"
    />
  );
}

/** Bloc de chargement générique pour une carte de contenu. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
