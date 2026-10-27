export default function StatusBadge({ status }) {
  const normalized = String(status || 'unknown').toLowerCase();
  return <span className={`badge badge-${normalized}`}>{status || 'Unknown'}</span>;
}
