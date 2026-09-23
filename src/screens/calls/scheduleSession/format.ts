export const pad2 = (value: number) => String(value).padStart(2, '0');

/** Digits -> `HH:MM`, mirroring what `<input type="time">` accepts. */
export const maskTime = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const normalizeTime = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length < 3) {
    return '';
  }
  const padded = digits.padStart(4, '0');
  const hours = Math.min(23, parseInt(padded.slice(0, 2), 10));
  const minutes = Math.min(59, parseInt(padded.slice(2, 4), 10));
  return `${pad2(hours)}:${pad2(minutes)}`;
};
