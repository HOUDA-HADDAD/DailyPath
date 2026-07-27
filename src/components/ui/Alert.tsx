import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "danger";

const TONES: Record<Tone, string> = {
  info: "bg-primary-soft text-primary-soft-fg",
  success: "bg-primary-soft text-primary-soft-fg",
  danger: "bg-danger-soft text-danger",
};

/**
 * Message de retour (succès / erreur / information).
 * `role="status"` + `aria-live` : le lecteur d'écran annonce le message sans
 * voler le focus — indispensable pour les retours de sauvegarde.
 */
export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm",
        TONES[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
