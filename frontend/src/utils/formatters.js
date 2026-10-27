export const formatTime = (value) => value
  ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date(value))
  : '—';

export const formatNumber = (value, digits = 1) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—';

export const statusLabel = (value) => String(value || '').toLowerCase();
