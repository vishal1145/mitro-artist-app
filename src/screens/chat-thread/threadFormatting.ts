import type { PrivateMessageItem } from '@app-types/api';

export function bubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export type Entry =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'msg'; id: string; msg: PrivateMessageItem };

export function buildEntries(messages: PrivateMessageItem[]): Entry[] {
  const out: Entry[] = [];
  let last: string | null = null;
  for (const m of messages) {
    const k = dayKey(m.createdAtUtc);
    if (k !== last) {
      out.push({ kind: 'date', id: `d-${k}`, label: dayLabel(m.createdAtUtc) });
      last = k;
    }
    out.push({ kind: 'msg', id: m.id, msg: m });
  }
  return out;
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
