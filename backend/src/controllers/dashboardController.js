import { db } from '../config/database.js';
import { readSettings } from '../config/database.js';

export function dashboard(_req,res) {
  const stats = db.prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN classification='SAFE' AND connected=1 THEN 1 ELSE 0 END) AS safe,
    SUM(CASE WHEN classification='WARNING' AND connected=1 THEN 1 ELSE 0 END) AS warning,
    SUM(CASE WHEN classification='CRITICAL' OR connected=0 THEN 1 ELSE 0 END) AS critical,
    SUM(CASE WHEN connected=1 THEN 1 ELSE 0 END) AS connected,
    SUM(CASE WHEN connected=0 THEN 1 ELSE 0 END) AS disconnected,
    AVG(water_level) AS averageWaterLevel,AVG(voltage) AS averageVoltage,AVG(leakage_current) AS averageLeakage
    FROM sensors`).get();
  const readings = db.prepare(`SELECT substr(recorded_at,1,16) AS recordedAt,
    ROUND(AVG(water_level),1) AS waterLevel,ROUND(AVG(voltage),1) AS voltage,
    ROUND(AVG(leakage_current),2) AS leakageCurrent,ROUND(AVG(risk_score),0) AS riskScore
    FROM readings WHERE recorded_at >= ? GROUP BY substr(recorded_at,1,16) ORDER BY recordedAt`)
    .all(new Date(Date.now()-24*60*60*1000).toISOString());
  const recentAlerts = db.prepare(`SELECT id,sensor_id AS sensorId,location,type,severity,title,explanation,
    recommended_action AS recommendedAction,status,created_at AS createdAt
    FROM alerts ORDER BY created_at DESC LIMIT 5`).all();
  const sensors = db.prepare('SELECT * FROM sensors ORDER BY risk_score DESC,id').all().map((row) => ({
    id:row.id,location:row.location,area:row.area,latitude:row.latitude,longitude:row.longitude,
    enabled:Boolean(row.enabled),connected:Boolean(row.connected),waterLevel:row.water_level,
    voltage:row.voltage,leakageCurrent:row.leakage_current,riskScore:row.risk_score,
    classification:row.classification,lastUpdated:row.last_updated,
  }));
  res.json({
    stats:{...stats,averageWaterLevel:Number(stats.averageWaterLevel || 0),averageVoltage:Number(stats.averageVoltage || 0),averageLeakage:Number(stats.averageLeakage || 0)},
    sensors, recentAlerts, readings, settings:readSettings(), lastUpdated:new Date().toISOString(), simulated:true,
  });
}
