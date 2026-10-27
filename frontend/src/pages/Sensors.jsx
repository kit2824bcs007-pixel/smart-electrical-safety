import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Radio, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { createSensor, deleteSensor, getSensors, setSensorSimulation, updateSensor } from '../api/api.js';
import Loading from '../components/Loading.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatNumber, formatTime } from '../utils/formatters.js';

const emptyForm={id:'',location:'',area:'',latitude:'',longitude:''};
export default function Sensors(){
  const [sensors,setSensors]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [search,setSearch]=useState('');
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [saving,setSaving]=useState(false);
  const refresh=async()=>{try{const result=await getSensors();setSensors(result.sensors);setError('');}catch(err){setError(err.response?.data?.error||`Could not load sensors: ${err.message}`);}finally{setLoading(false);}};
  useEffect(()=>{refresh();},[]);
  const visible=useMemo(()=>sensors.filter((s)=>`${s.id} ${s.location} ${s.area}`.toLowerCase().includes(search.toLowerCase())),[sensors,search]);
  const startCreate=()=>{setEditing('new');setForm(emptyForm);setNotice('');};
  const startEdit=(sensor)=>{setEditing(sensor.id);setForm({id:sensor.id,location:sensor.location,area:sensor.area,latitude:sensor.latitude,longitude:sensor.longitude});setNotice('');};
  const submit=async(event)=>{event.preventDefault();setSaving(true);setError('');try{const payload={location:form.location,area:form.area,latitude:Number(form.latitude),longitude:Number(form.longitude)};if(editing==='new'){await createSensor({id:form.id,...payload});setNotice(`Sensor ${form.id} created.`);}else{await updateSensor(editing,payload);setNotice(`Sensor ${editing} updated.`);}setEditing(null);await refresh();}catch(err){setError(err.response?.data?.details?.join(' ')||err.response?.data?.error||`Save failed: ${err.message}`);}finally{setSaving(false);}};
  const remove=async(sensor)=>{if(!window.confirm(`Delete ${sensor.id} at ${sensor.location}? Its reading history and alerts will also be deleted.`))return;try{await deleteSensor(sensor.id);setNotice(`${sensor.id} deleted.`);await refresh();}catch(err){setError(err.response?.data?.error||`Delete failed: ${err.message}`);}};
  const toggle=async(sensor)=>{try{await setSensorSimulation(sensor.id,!sensor.enabled);setNotice(`${sensor.id} simulation ${sensor.enabled?'paused':'enabled'}.`);await refresh();}catch(err){setError(err.response?.data?.error||`Could not update simulation: ${err.message}`);}};
  const field=(name,label,type='text')=><div className="field" key={name}><label htmlFor={`sensor-${name}`}>{label}</label><input id={`sensor-${name}`} className="input-control" required value={form[name]} type={type} step={type==='number'?'any':undefined} onChange={(e)=>setForm({...form,[name]:e.target.value})} disabled={saving}/></div>;
  return <>
    <div className="page-heading"><div><h2>Sensor management</h2><p>Create, update, and control simulated sensor locations.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={refresh}><RefreshCw size={14}/> Refresh</button><button className="button" onClick={startCreate}><Plus size={14}/> Add sensor</button></div></div>
    {error&&<div className="notice notice-error">{error}</div>}{notice&&<div className="notice notice-success">{notice}</div>}
    {editing!==null&&<section className="panel settings-panel" style={{marginBottom:14}}><h3>{editing==='new'?'Add a demo sensor':'Edit sensor details'}</h3><p>All locations and coordinates should be treated as demonstration data.</p>
      <form onSubmit={submit}><div className="form-grid">{editing==='new'&&field('id','Sensor ID')}{field('location','Location')}{field('area','Area')}{field('latitude','Latitude','number')}{field('longitude','Longitude','number')}</div><div className="form-actions"><button type="button" className="button button-secondary" onClick={()=>setEditing(null)}><X size={14}/> Cancel</button><button disabled={saving} className="button"><Check size={14}/>{saving?'Saving…':'Save sensor'}</button></div></form>
    </section>}
    <div className="toolbar"><label className="search-control input-control"><Search size={14}/><input placeholder="Search sensors…" value={search} onChange={(e)=>setSearch(e.target.value)}/></label><span className="eyebrow">{sensors.length} TOTAL SENSORS</span></div>
    {loading?<Loading label="Loading sensor records…"/>:<section className="panel table-wrap"><table className="data-table"><thead><tr><th>Sensor / Location</th><th>Readings</th><th>Risk</th><th>Connection</th><th>Simulation</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>
      {visible.map((s)=><tr key={s.id}><td><span className="cell-primary">{s.id}</span><span className="cell-muted">{s.location} · {s.area}</span></td><td>{formatNumber(s.waterLevel)} cm · {formatNumber(s.voltage)} V<span className="cell-muted">{formatNumber(s.leakageCurrent,2)} mA leakage</span></td><td><StatusBadge status={s.classification}/><span className="cell-muted">{s.riskScore}/100</span></td><td><StatusBadge status={s.connected?'CONNECTED':'DISCONNECTED'}/></td><td><button className="button button-quiet" onClick={()=>toggle(s)}><Radio size={13}/>{s.enabled?'Enabled':'Paused'}</button></td><td>{formatTime(s.lastUpdated)}</td><td><div className="inline-actions"><button className="icon-action" aria-label={`Edit ${s.id}`} onClick={()=>startEdit(s)}><Pencil size={14}/></button><button className="icon-action" aria-label={`Delete ${s.id}`} onClick={()=>remove(s)}><Trash2 size={14}/></button></div></td></tr>)}
      {!visible.length&&<tr><td colSpan="7" className="empty-state">No sensors match your search.</td></tr>}
    </tbody></table></section>}
  </>;
}
