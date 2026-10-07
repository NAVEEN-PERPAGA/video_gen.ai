/**
 * A browser event telling the header's credit balance to refetch: fired when
 * a generation starts (credits are held) or finishes (they're charged or
 * released).
 */
export const CREDITS_CHANGED = "credits:changed";

export function notifyCreditsChanged() {
  window.dispatchEvent(new Event(CREDITS_CHANGED));
}
