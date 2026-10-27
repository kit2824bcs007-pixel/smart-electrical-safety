import { readSettings, writeSettings } from '../config/database.js';

export function getSettings(_req,res) {
  res.json({ settings:readSettings(), simulated:true });
}

export function updateSettings(req,res) {
  const allowed = ['simulationEnabled','warningScore','criticalScore','warningWaterLevel','criticalLeakage','simulationIntervalMs'];
  const entries = Object.entries(req.body || {});
  if (!entries.length) return res.status(400).json({ error: 'Provide at least one setting to update.' });
  const invalidKeys = entries.map(([key]) => key).filter((key) => !allowed.includes(key));
  if (invalidKeys.length) return res.status(400).json({ error: `Unsupported setting: ${invalidKeys.join(', ')}.` });
  const values = {};
  for (const [key,value] of entries) {
    if (key === 'simulationEnabled') {
      if (typeof value !== 'boolean') return res.status(400).json({ error: 'simulationEnabled must be a boolean.' });
      values[key] = value;
    } else {
      const number = Number(value);
      const maximum = key.endsWith('Score') ? 100 : key === 'simulationIntervalMs' ? 600000 : 1000;
      const minimum = key === 'simulationIntervalMs' ? 1000 : 0;
      if (!Number.isFinite(number) || number < minimum || number > maximum) {
        return res.status(400).json({ error: `${key} must be between ${minimum} and ${maximum}.` });
      }
      values[key] = number;
    }
  }
  const current = readSettings();
  const merged = {...current,...values};
  if (merged.warningScore >= merged.criticalScore) return res.status(400).json({ error: 'warningScore must be lower than criticalScore.' });
  res.json({ settings:writeSettings(values), simulated:true });
}
