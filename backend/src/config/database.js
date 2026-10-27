import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const configuredPath = process.env.DB_PATH || './data/safety.sqlite';
const dbPath = path.isAbsolute(configuredPath) ? configuredPath : path.resolve(here, '..', '..', configuredPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
  CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY, location TEXT NOT NULL, area TEXT NOT NULL,
    latitude REAL NOT NULL, longitude REAL NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
    connected INTEGER NOT NULL DEFAULT 1, water_level REAL NOT NULL DEFAULT 0,
    voltage REAL NOT NULL DEFAULT 0, leakage_current REAL NOT NULL DEFAULT 0,
    risk_score INTEGER NOT NULL DEFAULT 0, classification TEXT NOT NULL DEFAULT 'SAFE',
    explanation TEXT NOT NULL DEFAULT '', recommended_action TEXT NOT NULL DEFAULT '',
    last_updated TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sensor_id TEXT NOT NULL,
    water_level REAL NOT NULL, voltage REAL NOT NULL, leakage_current REAL NOT NULL,
    connected INTEGER NOT NULL, risk_score INTEGER NOT NULL, classification TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY(sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_readings_time ON readings(recorded_at);
  CREATE INDEX IF NOT EXISTS idx_readings_sensor ON readings(sensor_id);
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, sensor_id TEXT NOT NULL,
    location TEXT NOT NULL, type TEXT NOT NULL, severity TEXT NOT NULL,
    title TEXT NOT NULL, explanation TEXT NOT NULL, recommended_action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(sensor_id, type, status);
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  );
`);

const defaultSettings = {
  simulationEnabled: true,
  warningScore: 35,
  criticalScore: 70,
  warningWaterLevel: 25,
  criticalLeakage: 25,
  simulationIntervalMs: Number(process.env.SIMULATION_INTERVAL_MS) || 10000,
};
const settingInsert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) settingInsert.run(key, JSON.stringify(value));

const seededSensors = [
  {id:'CG-001',location:'Avinashi Road Junction',area:'Peelamedu',latitude:11.0276,longitude:77.0365,water:8,voltage:229.8,leakage:0.35},
  {id:'CG-002',location:'Gandhipuram Bus Stand',area:'Gandhipuram',latitude:11.0183,longitude:76.9674,water:31,voltage:231.2,leakage:2.4},
  {id:'CG-003',location:'Ukkadam Lake Road',area:'Ukkadam',latitude:10.9916,longitude:76.9588,water:43,voltage:228.7,leakage:29.2},
  {id:'CG-004',location:'Race Course North',area:'Race Course',latitude:11.0037,longitude:76.9742,water:12,voltage:230.4,leakage:0.6},
  {id:'CG-005',location:'Saibaba Colony Main Road',area:'Saibaba Colony',latitude:11.0268,longitude:76.9447,water:27,voltage:232.1,leakage:1.9},
];
const count = db.prepare('SELECT COUNT(*) AS count FROM sensors').get().count;
if (count === 0) {
  const now = new Date();
  const insertSensor = db.prepare(`INSERT INTO sensors
    (id,location,area,latitude,longitude,enabled,connected,water_level,voltage,leakage_current,risk_score,classification,explanation,recommended_action,last_updated)
    VALUES (@id,@location,@area,@latitude,@longitude,1,1,@water,@voltage,@leakage,@riskScore,@classification,@explanation,@recommendedAction,@lastUpdated)`);
  const insertReading = db.prepare(`INSERT INTO readings
    (sensor_id,water_level,voltage,leakage_current,connected,risk_score,classification,recorded_at)
    VALUES (?,?,?,?,1,?,?,?)`);
  db.exec('BEGIN');
  try {
    for (const [index, sensor] of seededSensors.entries()) {
      const score = Math.min(100, Math.round(sensor.water * 0.7 + Math.min(35, sensor.leakage * 1.4) + Math.min(20, sensor.voltage * 0.12)));
      const classification = sensor.leakage >= 25 || score >= 70 ? 'CRITICAL' : score >= 35 || sensor.water >= 25 ? 'WARNING' : 'SAFE';
      const explanation = classification === 'CRITICAL' ? 'Leakage current exceeds the demonstration critical threshold.' : classification === 'WARNING' ? 'Water level or combined readings indicate an elevated demonstration risk.' : 'Readings are within the configured demonstration range.';
      const recommendedAction = classification === 'CRITICAL' ? 'Treat as a simulated critical event; isolate the area and have qualified personnel inspect it.' : classification === 'WARNING' ? 'Inspect the location and continue monitoring the simulated readings.' : 'Continue routine monitoring.';
      insertSensor.run({...sensor,riskScore:score,classification,explanation,recommendedAction,lastUpdated:now.toISOString()});
      for (let point=23; point>=0; point-=1) {
        const wobble = Math.sin((point + index * 3) / 3) * (1.2 + index * .15);
        const water = Math.max(0, sensor.water + wobble);
        const leakage = Math.max(0, sensor.leakage + wobble * .08);
        const timestamp = new Date(now.getTime() - point * 30 * 60 * 1000).toISOString();
        insertReading.run(sensor.id,water,sensor.voltage + wobble * .15,leakage,score,classification,timestamp);
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function readSettings() {
  return Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(({key,value}) => [key, JSON.parse(value)]));
}

export function writeSettings(values) {
  const insert = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  db.exec('BEGIN');
  try {
    for (const [key,value] of Object.entries(values)) insert.run(key, JSON.stringify(value));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return readSettings();
}
