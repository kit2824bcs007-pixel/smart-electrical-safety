import 'dotenv/config';
import { app } from './app.js';
import { db } from './config/database.js';
import { readSettings } from './config/database.js';
import { seedCurrentAlerts, simulateAll } from './services/simulationService.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
seedCurrentAlerts();
const server = app.listen(port,host,() => console.log(`API listening on http://${host}:${port} (simulated demo data)`));
let timer;
function scheduleSimulation() {
  timer = setTimeout(() => {
    simulateAll();
    scheduleSimulation();
  },Math.max(1000,Number(readSettings().simulationIntervalMs)||10000));
}
scheduleSimulation();

function shutdown() {
  clearTimeout(timer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT',shutdown);
process.on('SIGTERM',shutdown);
