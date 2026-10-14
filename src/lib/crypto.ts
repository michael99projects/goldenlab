/**
 * Utility functions for security hashing, currency calculations in Qirsh,
 * and rate limiting.
 */

// Simple SHA-256 implementation using SubtleCrypto if available or fallback
export async function sha256(message: string): Promise<string> {
  const normalized = message.trim().toUpperCase();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

/**
 * Format minor currency units (100 Qirsh = 1 EGP).
 * Example: 90000 Qirsh -> "900 ج.م"
 */
export function formatEgp(minorUnits: number): string {
  if (isNaN(minorUnits)) return '0 ج.م';
  const pounds = minorUnits / 100;
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pounds) + ' ج.م';
}

/**
 * Convert pounds to minor units (Qirsh).
 * Example: 900 -> 90000
 */
export function poundsToMinor(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Format timestamp to Arabic date format
 */
export function formatArabicDate(timestamp: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatArabicDateTime(timestamp: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Helper to check if a case is delayed
 */
export function isCaseDelayed(dueDate: number, status: string): boolean {
  if (status === 'delivered' || status === 'cancelled') return false;
  return Date.now() > dueDate;
}
