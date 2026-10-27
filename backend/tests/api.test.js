import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const port = 31487 + Math.floor(Math.random()*500);
const baseUrl = `http://127.0.0.1:${port}/api`;
let child;
let dataDirectory;

before(async () => {
  dataDirectory = await mkdtemp(path.join(tmpdir(),'gridguard-test-'));
  child = spawn(process.execPath,['src/server.js'],{
    cwd:new URL('..',import.meta.url),
    env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DB_PATH:path.join(dataDirectory,'test.sqlite'),SIMULATION_INTERVAL_MS:'60000'},
    stdio:'ignore',
  });
  let ready = false;
  for (let attempt=0;attempt<50;attempt+=1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) { ready=true; break; }
    } catch {}
    await delay(100);
  }
  assert.equal(ready,true,'API process should start and expose health endpoint');
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill();
    await new Promise((resolve) => child.once('exit',resolve));
  }
  if (dataDirectory) await rm(dataDirectory,{recursive:true,force:true});
});

test('health, sensor CRUD, alert updates, reports, and settings persist',async () => {
  const health = await fetch(`${baseUrl}/health`).then((r)=>r.json());
  assert.equal(health.status,'ok');
  assert.equal(health.simulated,true);

  const sensorsResponse = await fetch(`${baseUrl}/sensors`);
  assert.equal(sensorsResponse.status,200);
  const sensors = await sensorsResponse.json();
  assert.ok(sensors.sensors.length >= 5);
  const createdResponse = await fetch(`${baseUrl}/sensors`,{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({id:'TEST-01',location:'Test Street',area:'Coimbatore',latitude:11,longitude:77}),
  });
  assert.equal(createdResponse.status,201);
  const created = await createdResponse.json();
  assert.equal(created.sensor.id,'TEST-01');
  const updated = await fetch(`${baseUrl}/sensors/TEST-01`,{
    method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({location:'Updated Street'}),
  }).then((r)=>r.json());
  assert.equal(updated.sensor.location,'Updated Street');
  const simulation = await fetch(`${baseUrl}/sensors/TEST-01/simulation`,{
    method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({enabled:false}),
  }).then((r)=>r.json());
  assert.equal(simulation.sensor.enabled,false);

  const alerts = await fetch(`${baseUrl}/alerts`).then((r)=>r.json());
  assert.ok(alerts.alerts.length > 0);
  const alertResponse = await fetch(`${baseUrl}/alerts/${alerts.alerts[0].id}`,{
    method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'ACKNOWLEDGED'}),
  });
  assert.equal(alertResponse.status,200);
  assert.equal((await alertResponse.json()).alert.status,'ACKNOWLEDGED');

  const reportResponse = await fetch(`${baseUrl}/reports`);
  assert.equal(reportResponse.status,200);
  assert.ok((await reportResponse.json()).readings.length > 0);
  const settings = await fetch(`${baseUrl}/settings`,{
    method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({warningWaterLevel:28}),
  }).then((r)=>r.json());
  assert.equal(settings.settings.warningWaterLevel,28);
  const invalid = await fetch(`${baseUrl}/sensors`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  assert.equal(invalid.status,400);
  const deleted = await fetch(`${baseUrl}/sensors/TEST-01`,{method:'DELETE'});
  assert.equal(deleted.status,200);
});
