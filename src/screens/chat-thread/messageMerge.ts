import type { PrivateMessageItem } from '@app-types/api';

/** Prefix `handleSend` gives the placeholder it echoes into the thread. */
export const PENDING_PREFIX = 'temp-';
export const isPendingId = (id: string): boolean => id.startsWith(PENDING_PREFIX);

/**
 * How far apart a placeholder and its server copy may be timestamped and still
 * count as the same message. Generous, because the placeholder is stamped with
 * the device clock and the server row with the server's — but harmless, since
 * a match also requires a placeholder that is still un-reconciled.
 */
export const PENDING_MATCH_WINDOW_MS = 5 * 60_000;

/**
 * The placeholder in `prev` that `m` is the confirmed version of, if any.
 *
 * Same sender, same text, same reply target (when the incoming row carries one
 * — the realtime payload doesn't), sent at roughly the same moment.
 */
export function pendingTwinOf(
  byId: Map<string, PrivateMessageItem>,
  m: PrivateMessageItem,
): string | null {
  if (isPendingId(m.id) || byId.has(m.id)) return null;
  const at = new Date(m.createdAtUtc).getTime();
  for (const [key, existing] of byId) {
    if (!isPendingId(key)) continue;
    if (existing.senderType !== m.senderType) continue;
    if (existing.messageText !== m.messageText) continue;
    if (
      m.replyToMessageId != null &&
      existing.replyToMessageId != null &&
      m.replyToMessageId !== existing.replyToMessageId
    ) {
      continue;
    }
    if (Math.abs(at - new Date(existing.createdAtUtc).getTime()) > PENDING_MATCH_WINDOW_MS) {
      continue;
    }
    return key;
  }
  return null;
}

/**
 * Merge by id, and retire a placeholder the moment its server copy shows up.
 *
 * A sent message reaches this thread from three places — the `reply` response,
 * the realtime hub echo, and the 10s poll — and the last two carry the real id
 * while the placeholder is still on screen. Keying on id alone therefore left
 * both rows rendered until the `reply` promise resolved and removed the
 * placeholder by id, which is the flicker you see on a reply to a tagged
 * message (that round trip is the slowest, so the window is widest).
 *
 * Reconciling here means whichever source lands first swaps the placeholder
 * out in place. The placeholder is used as the base of the merged row so the
 * quoted-reply header survives: the hub payload has no `replyTo*` fields, so
 * taking the incoming row alone would drop the quote until the next poll.
 */
export function mergeMessages(prev: PrivateMessageItem[], incoming: PrivateMessageItem[]): PrivateMessageItem[] {
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) {
    const twin = pendingTwinOf(byId, m);
    const base = twin ? byId.get(twin) : byId.get(m.id);
    if (twin) byId.delete(twin);
    byId.set(m.id, { ...(base ?? {}), ...m });
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime(),
  );
}
