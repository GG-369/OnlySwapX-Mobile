/**
 * Security utilities — XSS / injection prevention
 * Never render untrusted strings via dangerouslySetInnerHTML.
 * All user-supplied text is escaped before being displayed.
 */

/**
 * Escapes HTML special characters so a string is safe to render.
 * React already does this for JSX text nodes, but this is useful
 * when constructing strings programmatically.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips all HTML tags from a string (defense-in-depth before display).
 */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Validates an email address format.
 * Uses a strict regex — does NOT rely on the browser's built-in validation.
 */
export function isValidEmail(email: string): boolean {
  const re =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 320;
}

/**
 * Trims and limits string length.
 * Use on all user input before sending to API.
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  return stripTags(input.trim()).slice(0, maxLength);
}

/**
 * Validates a URL is safe (http/https only, no javascript: or data:).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Formats a date string safely.
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Generates user initials from a full name.
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Returns a deterministic color index (0-5) from a string
 * so avatars have consistent colors per user.
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    "bg-primary/80",
    "bg-accent/80",
    "bg-success/80",
    "bg-purple-500/80",
    "bg-orange-500/80",
    "bg-pink-500/80",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
