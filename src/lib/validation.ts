// Validation des saisies utilisateur, côté client.
// Volontairement sans dépendance : les règles sont simples et explicites.
// Rappel : la validation client est une aide à la saisie, la sécurité réelle
// vient de Supabase Auth et des policies RLS côté serveur.

export const PASSWORD_MIN_LENGTH = 8;
export const DISPLAY_NAME_MAX_LENGTH = 60;
export const ACTIVITY_LABEL_MAX_LENGTH = 60;
export const ACTIVITY_NOTE_MAX_LENGTH = 400;

/** Clé i18n de l'erreur, ou null si la valeur est valide. */
export type ValidationError = string | null;

export function validateEmail(value: string): ValidationError {
  const email = value.trim();
  if (!email) return "validation.emailRequired";
  // Contrôle volontairement permissif : on n'invente pas de règles exotiques.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "validation.emailInvalid";
  return null;
}

export function validatePassword(value: string): ValidationError {
  if (!value) return "validation.passwordRequired";
  if (value.length < PASSWORD_MIN_LENGTH) return "validation.passwordTooShort";
  if (!/[a-z]/i.test(value)) return "validation.passwordNeedsLetter";
  if (!/[0-9]/.test(value)) return "validation.passwordNeedsDigit";
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationError {
  if (!confirmation) return "validation.confirmationRequired";
  if (password !== confirmation) return "validation.passwordsMismatch";
  return null;
}

export function validateDisplayName(value: string): ValidationError {
  const name = value.trim();
  if (!name) return "validation.displayNameRequired";
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return "validation.displayNameTooLong";
  return null;
}

export function validateActivityLabel(value: string): ValidationError {
  const label = value.trim();
  if (!label) return "validation.activityLabelRequired";
  if (label.length > ACTIVITY_LABEL_MAX_LENGTH) return "validation.activityLabelTooLong";
  return null;
}

export function validateActivityNote(value: string): ValidationError {
  if (value.length > ACTIVITY_NOTE_MAX_LENGTH) return "validation.activityNoteTooLong";
  return null;
}

/** Force du mot de passe sur 4 paliers (0 = très faible … 4 = excellent). */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, score);
}

/** Normalise une saisie texte libre avant persistance. */
export function cleanText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}
