import { db } from '../config/database.js';
import { parseDateRange } from '../utils/validation.js';

export function reports(req,res) {
  const range = parseDateRange(req.query);
  if (range.errors.length) return res.status(400).json({ error: 'Invalid date range.', details: range.errors });
  const conditions = [];
  const params = [];
  if (range.from) { conditions.push('r.recorded_at >= ?'); params.push(range.from); }
  if (range.to) { conditions.push('r.recorded_at <= ?'); params.push(range.to); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const readings = db.prepare(`SELECT r.id,r.sensor_id AS sensorId,s.location,r.water_level AS waterLevel,
    r.voltage,r.leakage_current AS leakageCurrent,r.connected,r.risk_score AS riskScore,
    r.classification,r.recorded_at AS recordedAt
    FROM readings r JOIN sensors s ON s.id=r.sensor_id ${where} ORDER BY r.recorded_at DESC LIMIT 10000`).all(...params)
    .map((r) => ({...r,connected:Boolean(r.connected)}));
  const distribution = db.prepare(`SELECT classification,COUNT(*) AS count FROM readings r ${where} GROUP BY classification`).all(...params);
  const alerts = db.prepare(`SELECT id,sensor_id AS sensorId,location,type,severity,title,status,created_at AS createdAt
    FROM alerts ${range.from || range.to ? `WHERE ${[range.from?'created_at >= ?':null,range.to?'created_at <= ?':null].filter(Boolean).join(' AND ')}` : ''}
    ORDER BY created_at DESC`).all(...[...(range.from?[range.from]:[]),...(range.to?[range.to]:[])]);
  res.json({ readings, alerts, distribution, count:readings.length, simulated:true });
}
