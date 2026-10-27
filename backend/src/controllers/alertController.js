import { db } from '../config/database.js';

export function listAlerts(req,res) {
  const conditions = [];
  const params = [];
  if (req.query.severity) { conditions.push('severity=?'); params.push(String(req.query.severity).toUpperCase()); }
  if (req.query.status) { conditions.push('status=?'); params.push(String(req.query.status).toUpperCase()); }
  if (req.query.search) { conditions.push('(location LIKE ? OR sensor_id LIKE ? OR title LIKE ?)'); const search=`%${req.query.search}%`; params.push(search,search,search); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const alerts = db.prepare(`SELECT id,sensor_id AS sensorId,location,type,severity,title,explanation,
    recommended_action AS recommendedAction,status,created_at AS createdAt,updated_at AS updatedAt
    FROM alerts ${where} ORDER BY created_at DESC`).all(...params);
  res.json({ alerts });
}

export function updateAlert(req,res) {
  const status = String(req.body?.status || '').toUpperCase();
  if (!['ACKNOWLEDGED','RESOLVED'].includes(status)) return res.status(400).json({ error: 'status must be ACKNOWLEDGED or RESOLVED.' });
  const now = new Date().toISOString();
  const result = db.prepare('UPDATE alerts SET status=?,updated_at=? WHERE id=?').run(status,now,req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Alert not found.' });
  const alert = db.prepare(`SELECT id,sensor_id AS sensorId,location,type,severity,title,explanation,
    recommended_action AS recommendedAction,status,created_at AS createdAt,updated_at AS updatedAt FROM alerts WHERE id=?`).get(req.params.id);
  res.json({ alert });
}
