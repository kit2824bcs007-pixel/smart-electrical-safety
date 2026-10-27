export default function StatCard({ title, value, detail, icon: Icon, tone = 'blue' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon tone-${tone}`}><Icon size={20} /></div>
      <div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  );
}
