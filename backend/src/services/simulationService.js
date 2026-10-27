import { db, readSettings } from '../config/database.js';
import { calculateRisk } from './riskService.js';

const randomBetween = (min, max) => min + Math.random() * (max - min);

function createAlert(sensor, type, title, severity, explanation, recommendedAction) {
  const existing = db.prepare(`SELECT id FROM alerts WHERE sensor_id=? AND type=? AND status IN ('ACTIVE','ACKNOWLEDGED')`).get(sensor.id,type);
  if (existing) return;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO alerts
    (sensor_id,location,type,severity,title,explanation,recommended_action,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,'ACTIVE',?,?)`).run(sensor.id,sensor.location,type,severity,title,explanation,recommendedAction,now,now);
}

export function recordReading(sensor, readings, timestamp = new Date().toISOString()) {
  const settings = readSettings();
  const risk = calculateRisk(readings, settings);
  db.prepare(`UPDATE sensors SET connected=?,water_level=?,voltage=?,leakage_current=?,risk_score=?,classification=?,
    explanation=?,recommended_action=?,last_updated=? WHERE id=?`)
    .run(readings.connected ? 1 : 0,readings.waterLevel,readings.voltage,readings.leakageCurrent,risk.riskScore,risk.classification,risk.explanation,risk.recommendedAction,timestamp,sensor.id);
  db.prepare(`INSERT INTO readings (sensor_id,water_level,voltage,leakage_current,connected,risk_score,classification,recorded_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(sensor.id,readings.waterLevel,readings.voltage,readings.leakageCurrent,readings.connected ? 1 : 0,risk.riskScore,risk.classification,timestamp);
  const updated = db.prepare('SELECT * FROM sensors WHERE id=?').get(sensor.id);
  if (!readings.connected) createAlert(updated,'disconnected','Sensor connection lost','CRITICAL',risk.explanation,risk.recommendedAction);
  if (readings.leakageCurrent >= Number(settings.criticalLeakage)) createAlert(updated,'leakage','Critical electrical leakage detected','CRITICAL',risk.explanation,risk.recommendedAction);
  if (readings.waterLevel >= Number(settings.warningWaterLevel)) createAlert(updated,'water_level','High water level detected',risk.classification === 'CRITICAL' ? 'CRITICAL' : 'HIGH',risk.explanation,risk.recommendedAction);
  return { ...updated, connected: Boolean(updated.connected), enabled: Boolean(updated.enabled) };
}

export function simulateAll() {
  const settings = readSettings();
  if (!settings.simulationEnabled) return;
  const sensors = db.prepare('SELECT * FROM sensors WHERE enabled=1').all();
  for (const sensor of sensors) {
    const waterLevel = Math.max(0, Math.min(80, sensor.water_level + randomBetween(-2.2,2.2)));
    const voltage = Math.max(215, Math.min(245, sensor.voltage + randomBetween(-1.5,1.5)));
    const leakageCurrent = Math.max(0, Math.min(40, sensor.leakage_current + randomBetween(-0.75,0.75)));
    const connected = Math.random() > 0.015;
    recordReading(sensor,{waterLevel,voltage,leakageCurrent,connected});
  }
}

export function seedCurrentAlerts() {
  for (const sensor of db.prepare('SELECT * FROM sensors').all()) {
    if (sensor.leakage_current >= Number(readSettings().criticalLeakage)) {
      createAlert(sensor,'leakage','Critical electrical leakage detected','CRITICAL',sensor.explanation,sensor.recommended_action);
    }
    if (sensor.water_level >= Number(readSettings().warningWaterLevel)) {
      createAlert(sensor,'water_level','High water level detected',sensor.classification === 'CRITICAL' ? 'CRITICAL' : 'HIGH',sensor.explanation,sensor.recommended_action);
    }
  }
}
