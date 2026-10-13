// Keys that represent user app state (not auth/session) and must survive logout.
const PRESERVED_KEYS = new Set([
  "reefregen.attestation.wizard.v1",
]);

// Clear auth/session keys from localStorage while preserving user app state
// (e.g. the attestation wizard draft). Replaces blanket localStorage.clear()
// which was silently destroying in-progress wizard data on logout.
export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !PRESERVED_KEYS.has(key)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      localStorage.removeItem(key);
    }
  } catch {}
}