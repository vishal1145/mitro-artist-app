import { webColors } from '@theme';

/* Timings copied from the web screen (PrivateCallScreen.tsx). The backend
 * auto-expires a pending request 60s after it's created — the tick only drives
 * the countdown label. */
export const COUNTDOWN_TICK_MS = 1000;
export const REQUEST_POLL_MS = 8000;
export const HISTORY_PAGE_SIZE = 20;

export const secondsUntil = (iso: string): number =>
  Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));

/**
 * Wall-clock span between accept and end as a compact "1h 5m" / "12m 34s" /
 * "45s". Null when either edge is missing (the call never connected).
 */
export const formatCallDuration = (
  acceptedAtUtc: string | null,
  endedAtUtc: string | null,
): string | null => {
  if (!acceptedAtUtc || !endedAtUtc) return null;
  const ms = new Date(endedAtUtc).getTime() - new Date(acceptedAtUtc).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export type HistoryTone = 'ok' | 'warn' | 'bad' | 'neutral';

/**
 * Raw status / end_reason strings aren't meant for display — translate them
 * into a short label plus a tone so History reads at a glance.
 */
export const historyStatusMeta = (
  status: string,
  endReason: string | null,
): { label: string; tone: HistoryTone } => {
  if (status === 'failed') return { label: 'Failed', tone: 'bad' };
  if (status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  if (status === 'terminated') {
    return endReason === 'admin_terminated'
      ? { label: 'Ended by admin', tone: 'neutral' }
      : { label: 'Terminated', tone: 'bad' };
  }
  switch (endReason) {
    case 'user_ended':
    case 'artist_ended':
      return { label: 'Ended normally', tone: 'ok' };
    case 'insufficient_balance':
      return { label: 'Low balance', tone: 'warn' };
    case 'user_reconnect_timeout':
    case 'artist_reconnect_timeout':
    case 'both_disconnected':
      return { label: 'Connection dropped', tone: 'warn' };
    case 'join_timeout':
      return { label: 'Never connected', tone: 'bad' };
    case 'technical_failure':
    case 'token_failure':
      return { label: 'Technical issue', tone: 'bad' };
    case 'admin_terminated':
      return { label: 'Ended by admin', tone: 'neutral' };
    case 'platform_ended':
      return { label: 'Ended by platform', tone: 'neutral' };
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        tone: 'neutral',
      };
  }
};

export const TONE_FILL: Record<HistoryTone, string> = {
  ok: webColors.greenPill,
  warn: webColors.goldTone,
  bad: webColors.dangerTone,
  neutral: webColors.chip,
};

export const TONE_INK: Record<HistoryTone, string> = {
  ok: webColors.green,
  warn: webColors.gold,
  bad: webColors.danger,
  neutral: webColors.chipText,
};
