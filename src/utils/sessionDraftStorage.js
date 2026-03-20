/**
 * Small helpers for persisting in-progress form state to sessionStorage
 * (survives tab switches / remounts; cleared when tab closes).
 */

const PREFIX = 'pem_draft_v1:';

export function saveSessionDraft(scope, data) {
  try {
    sessionStorage.setItem(PREFIX + scope, JSON.stringify(data));
  } catch (e) {
    console.warn('[sessionDraftStorage] save failed:', scope, e);
  }
}

export function loadSessionDraft(scope) {
  try {
    const raw = sessionStorage.getItem(PREFIX + scope);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[sessionDraftStorage] load failed:', scope, e);
    return null;
  }
}

export function clearSessionDraft(scope) {
  try {
    sessionStorage.removeItem(PREFIX + scope);
  } catch (e) {
    /* ignore */
  }
}
