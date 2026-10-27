import { Droplets, Gauge, Radio, Zap } from 'lucide-react';
import { formatNumber, formatTime } from '../utils/formatters.js';
import StatusBadge from './StatusBadge.jsx';

export default function SensorCard({ sensor }) {
  return <article className="sensor-card">
    <div className="sensor-card-top"><div><span className="eyebrow">{sensor.id}</span><h3>{sensor.location}</h3></div><StatusBadge status={sensor.classification} /></div>
    <p className="sensor-address">{sensor.area || 'Coimbatore, Tamil Nadu'}</p>
    <div className="sensor-reading-grid">
      <div><Droplets size={15} /><span>Water</span><strong>{formatNumber(sensor.waterLevel)} cm</strong></div>
      <div><Zap size={15} /><span>Voltage</span><strong>{formatNumber(sensor.voltage)} V</strong></div>
      <div><Gauge size={15} /><span>Leakage</span><strong>{formatNumber(sensor.leakageCurrent, 2)} mA</strong></div>
      <div><Radio size={15} /><span>Connection</span><strong>{sensor.connected ? 'Connected' : 'Offline'}</strong></div>
    </div>
    <div className="sensor-card-bottom"><span>Risk score <b>{sensor.riskScore}/100</b></span><span>{formatTime(sensor.lastUpdated)}</span></div>
  </article>;
}
