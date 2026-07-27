// Rappels locaux, sans dépendance ni service externe.
//
// Portée assumée : le rappel se déclenche pendant que l'application est
// ouverte dans le navigateur. Une notification « push » hors application
// exigerait un service worker et un serveur de push — hors périmètre ici.
// L'interface le dit explicitement pour ne rien promettre d'inexact.

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** Demande l'autorisation ; à appeler depuis un geste utilisateur. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Clé de déduplication : un rappel au maximum par activité et par jour. */
function seenKey(dateISO: string, activityId: string): string {
  return `dailypath:reminder:${dateISO}:${activityId}`;
}

export function alreadyNotified(dateISO: string, activityId: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(dateISO, activityId)) === "1";
  } catch {
    return false; // mode privé / stockage indisponible
  }
}

export function markNotified(dateISO: string, activityId: string): void {
  try {
    window.localStorage.setItem(seenKey(dateISO, activityId), "1");
  } catch {
    // sans stockage, on accepte un éventuel doublon plutôt que de planter
  }
}

export function showReminder(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: "dailypath-reminder" });
  } catch {
    // certains navigateurs exigent un service worker : échec silencieux
  }
}
