export default function ChartCard({ title, subtitle, children, className = '' }) {
  return <section className={`panel chart-card ${className}`}>
    <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
    <div className="chart-area">{children}</div>
  </section>;
}
