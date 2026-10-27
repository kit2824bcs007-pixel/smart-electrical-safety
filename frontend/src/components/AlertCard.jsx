import { Check, CircleCheck } from 'lucide-react';
import { formatTime } from '../utils/formatters.js';
import StatusBadge from './StatusBadge.jsx';

export default function AlertCard({ alert, onStatusChange }) {
  return <article className={`alert-card severity-${alert.severity.toLowerCase()}`}>
    <div className="alert-marker" />
    <div className="alert-content">
      <div className="alert-title-row"><div><span className="eyebrow">{alert.sensorId} · {alert.location}</span><h3>{alert.title}</h3></div><StatusBadge status={alert.severity} /></div>
      <p>{alert.explanation}</p>
      <p className="recommendation"><b>Recommended:</b> {alert.recommendedAction}</p>
      <div className="alert-footer"><span>{formatTime(alert.createdAt)}</span><StatusBadge status={alert.status} />
        {alert.status === 'ACTIVE' && <button className="button button-quiet" onClick={() => onStatusChange(alert.id, 'ACKNOWLEDGED')}><Check size={15} /> Acknowledge</button>}
        {alert.status !== 'RESOLVED' && <button className="button button-quiet" onClick={() => onStatusChange(alert.id, 'RESOLVED')}><CircleCheck size={15} /> Resolve</button>}
      </div>
    </div>
  </article>;
}
