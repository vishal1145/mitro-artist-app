/**
 * Formats a duration in whole seconds as `mm:ss`, or `h:mm:ss` once it
 * crosses an hour.
 *
 * Shared by the three call/broadcast room screens (live-broadcast-room,
 * group-call-room, private-call-room) — this is the exact same helper that
 * was previously copy-pasted verbatim in all three.
 */
export const formatElapsed = (t: number): string => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
