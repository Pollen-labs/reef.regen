export type DateInput = string | number | Date | null | undefined;

// Always format in UTC so dates are consistent globally
const fmtUTC = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function parseAsUTC(value: DateInput): Date | null {
  if (value == null) return null;
  try {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map((n) => Number(n));
      return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    }
    const d = new Date(value as any);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

function formatDateShortInternal(value: DateInput, withSuffix: boolean): string {
  const d = parseAsUTC(value);
  if (!d) return '-';
  const base = fmtUTC.format(d);
  return withSuffix ? `${base}` : base;
}

export function formatDateShort(value: DateInput): string {
  return formatDateShortInternal(value, true);
}

export function formatDateRangeShort(start: DateInput, end: DateInput): string {
  const s = formatDateShortInternal(start, false);
  const e = formatDateShortInternal(end, false);
  if (s === '-' && e === '-') return '-';
  if (s !== '-' && e !== '-') return `${s} ~ ${e} `;
  return (s !== '-' ? s : e) ;
}
