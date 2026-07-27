import type { ReactNode } from "react";
import type { ActivityIcon } from "@/lib/activities/types";
import { Icon } from "./Icon";

/**
 * État vide : ne se contente pas de dire « rien ici », mais explique ce qu'on
 * gagne à agir et propose l'action suivante (cf. principe d'aversion à la
 * perte : on rend visible ce qui est en jeu).
 */
export function EmptyState({
  icon = "sparkles",
  title,
  description,
  action,
}: {
  icon?: ActivityIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="text-base font-medium text-content">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-content-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
