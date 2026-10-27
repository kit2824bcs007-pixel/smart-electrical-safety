import { useEffect, useState } from 'react';
import { Check, RefreshCw, Save } from 'lucide-react';
import { getSettings, saveSettings } from '../api/api.js';
import Loading from '../components/Loading.jsx';

const defaults={simulationEnabled:true,warningScore:35,criticalScore:70,warningWaterLevel:25,criticalLeakage:25};
export default function SettingsPage(){
  const [settings,setSettings]=useState(defaults);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const load=async()=>{setLoading(true);try{const data=await getSettings();setSettings(data.settings);setError('');}catch(err){setError(err.response?.data?.error||`Could not load settings: ${err.message}`);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const set=(key,value)=>setSettings((current)=>({...current,[key]:value}));
  const save=async(event)=>{event.preventDefault();setSaving(true);setError('');setNotice('');try{const data=await saveSettings({simulationEnabled:settings.simulationEnabled,warningScore:Number(settings.warningScore),criticalScore:Number(settings.criticalScore),warningWaterLevel:Number(settings.warningWaterLevel),criticalLeakage:Number(settings.criticalLeakage)});setSettings(data.settings);setNotice('Settings saved to the backend database.');}catch(err){setError(err.response?.data?.error||`Could not save settings: ${err.message}`);}finally{setSaving(false);}};
  if(loading)return <Loading label="Loading persisted settings…"/>;
  return <>
    <div className="page-heading"><div><h2>System settings</h2><p>Configure simulation behavior and demonstration classification thresholds.</p></div><button className="button button-secondary" onClick={load}><RefreshCw size={14}/> Reload settings</button></div>
    {error&&<div className="notice notice-error">{error}</div>}{notice&&<div className="notice notice-success"><Check size={14} style={{verticalAlign:'middle',marginRight:5}}/>{notice}</div>}
    <form onSubmit={save}><div className="settings-layout">
      <section className="panel settings-panel"><h3>Simulation controls</h3><p>These controls affect generated demo readings only.</p>
        <div className="setting-row"><div><strong>Enable sensor simulation</strong><span>Generate periodic example readings and alerts</span></div><input className="toggle" type="checkbox" checked={Boolean(settings.simulationEnabled)} onChange={(e)=>set('simulationEnabled',e.target.checked)} aria-label="Enable sensor simulation"/></div>
        <div className="setting-row"><div><strong>Data source</strong><span>Rule-based generator · SQLite persistence</span></div><span className="badge badge-warning">DEMO ONLY</span></div>
        <div className="setting-row"><div><strong>Update interval</strong><span>Backend sampling cadence</span></div><b style={{fontSize:10}}>{Math.round(Number(settings.simulationIntervalMs||10000)/1000)} sec</b></div>
      </section>
      <section className="panel settings-panel"><h3>Risk thresholds</h3><p>Editable values consumed by the backend risk service.</p>
        <div className="form-grid">
          {[['warningScore','Warning score (0–100)'],['criticalScore','Critical score (0–100)'],['warningWaterLevel','Warning water level (cm)'],['criticalLeakage','Critical leakage (mA)']].map(([key,label])=><div className="field" key={key}><label htmlFor={key}>{label}</label><input className="input-control" id={key} type="number" min="0" max={key.includes('Score')?100:1000} step="any" value={settings[key]} onChange={(e)=>set(key,e.target.value)}/></div>)}
        </div><div className="form-actions"><button className="button" disabled={saving}><Save size={14}/>{saving?'Saving…':'Save settings'}</button></div>
      </section>
    </div></form>
    <div className="notice" style={{marginTop:14}}>Risk classification is configurable rule-based demonstration logic, not a trained AI model. Threshold changes do not replace certified electrical protection, professional installation, or independent safety testing.</div>
  </>;
}
