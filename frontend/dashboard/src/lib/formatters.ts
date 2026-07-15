export function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function formatMoney(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
