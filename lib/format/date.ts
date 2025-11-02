export type DateInput = string | number | Date | null | undefined;

const fmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDateShort(value: DateInput): string {
  if (value == null) return '-';
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '-';
    return fmt.format(d);
  } catch {
    return '-';
  }
}

export function formatDateRangeShort(start: DateInput, end: DateInput): string {
  const s = formatDateShort(start);
  const e = formatDateShort(end);
  if (s === '-' && e === '-') return '-';
  if (s !== '-' && e !== '-') return `${s} ~ ${e}`;
  return s !== '-' ? s : e;
}

