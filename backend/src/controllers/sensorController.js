import { db } from '../config/database.js';
import { validateSensor } from '../utils/validation.js';
import { calculateRisk } from '../services/riskService.js';
import { recordReading } from '../services/simulationService.js';

const mapSensor = (row) => ({
  ...row,
  enabled: Boolean(row.enabled),
  connected: Boolean(row.connected),
  waterLevel: row.water_level,
  leakageCurrent: row.leakage_current,
  riskScore: row.risk_score,
  lastUpdated: row.last_updated,
  recommendedAction: row.recommended_action,
});
const findSensor = (id) => db.prepare('SELECT * FROM sensors WHERE id=?').get(id);

export function listSensors(_req,res) {
  const sensors = db.prepare('SELECT * FROM sensors ORDER BY id').all().map(mapSensor);
  res.json({ sensors, simulated: true });
}

export function createSensor(req,res) {
  const payload = req.body || {};
  const errors = validateSensor(payload);
  if (errors.length) return res.status(400).json({ error: 'Invalid sensor data.', details: errors });
  const {id,location,area,latitude,longitude} = payload;
  const now = new Date().toISOString();
  const readings = {waterLevel:0,voltage:230,leakageCurrent:0,connected:true};
  const risk = calculateRisk(readings);
  db.prepare(`INSERT INTO sensors
    (id,location,area,latitude,longitude,enabled,connected,water_level,voltage,leakage_current,risk_score,classification,explanation,recommended_action,last_updated)
    VALUES (?,?,?,?,?,1,1,?,?,?,?,?,?,?,?)`)
    .run(String(id).trim(),String(location).trim(),String(area).trim(),Number(latitude),Number(longitude),readings.waterLevel,readings.voltage,readings.leakageCurrent,risk.riskScore,risk.classification,risk.explanation,risk.recommendedAction,now);
  const sensor = findSensor(id);
  recordReading(sensor,readings,now);
  return res.status(201).json({ sensor: mapSensor(findSensor(id)) });
}

export function updateSensor(req,res) {
  const existing = findSensor(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sensor not found.' });
  const payload = req.body || {};
  const errors = validateSensor(payload,{partial:true});
  if (errors.length) return res.status(400).json({ error: 'Invalid sensor data.', details: errors });
  const fields = {
    location: payload.location ?? existing.location,
    area: payload.area ?? existing.area,
    latitude: payload.latitude === undefined ? existing.latitude : Number(payload.latitude),
    longitude: payload.longitude === undefined ? existing.longitude : Number(payload.longitude),
  };
  db.prepare('UPDATE sensors SET location=?,area=?,latitude=?,longitude=? WHERE id=?')
    .run(String(fields.location).trim(),String(fields.area).trim(),fields.latitude,fields.longitude,req.params.id);
  res.json({ sensor: mapSensor(findSensor(req.params.id)) });
}

export function deleteSensor(req,res) {
  const result = db.prepare('DELETE FROM sensors WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Sensor not found.' });
  res.json({ message: 'Sensor deleted.' });
}

export function updateSimulation(req,res) {
  const payload = req.body || {};
  if (typeof payload.enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean.' });
  const result = db.prepare('UPDATE sensors SET enabled=? WHERE id=?').run(payload.enabled ? 1 : 0,req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Sensor not found.' });
  res.json({ sensor: mapSensor(findSensor(req.params.id)) });
}

export function sensorReadings(req,res) {
  if (!findSensor(req.params.id)) return res.status(404).json({ error: 'Sensor not found.' });
  const readings = db.prepare(`SELECT id,sensor_id AS sensorId,water_level AS waterLevel,voltage,
    leakage_current AS leakageCurrent,connected,risk_score AS riskScore,classification,recorded_at AS recordedAt
    FROM readings WHERE sensor_id=? ORDER BY recorded_at DESC LIMIT 500`).all(req.params.id);
  res.json({ readings: readings.map((reading) => ({...reading,connected:Boolean(reading.connected)})), simulated: true });
}
