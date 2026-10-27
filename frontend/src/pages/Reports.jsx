import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts';
import { getReports } from '../api/api.js';
import ChartCard from '../components/ChartCard.jsx';
import Loading from '../components/Loading.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatNumber, formatTime } from '../utils/formatters.js';

function toCsv(rows){
  const headers=['Reading ID','Sensor ID','Location','Water Level (cm)','Voltage (V)','Leakage Current (mA)','Connected','Risk Score','Classification','Recorded At'];
  const escape=(value)=>`"${String(value??'').replaceAll('"','""')}"`;
  return [headers.map(escape).join(','),...rows.map((r)=>[r.id,r.sensorId,r.location,r.waterLevel,r.voltage,r.leakageCurrent,r.connected?'Yes':'No',r.riskScore,r.classification,r.recordedAt].map(escape).join(','))].join('\r\n');
}
export default function Reports(){
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const load=async()=>{setLoading(true);try{const params={};if(from)params.from=new Date(`${from}T00:00:00`).toISOString();if(to)params.to=new Date(`${to}T23:59:59.999`).toISOString();const result=await getReports(params);setData(result);setError('');}catch(err){setError(err.response?.data?.details?.join(' ')||err.response?.data?.error||`Could not load report: ${err.message}`);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const exportCsv=()=>{if(!data?.readings.length){setError('There are no filtered reading records to export.');return;}const blob=new Blob([toCsv(data.readings)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`gridguard-readings-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const trend=(data?.readings||[]).slice(0,200).reverse().map((r)=>({...r,time:new Date(r.recordedAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}));
  const tooltip={contentStyle:{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:8,fontSize:10}};
  return <>
    <div className="page-heading"><div><h2>Historical reports</h2><p>Explore stored simulated sensor readings and alert history.</p></div><button className="button" onClick={exportCsv} disabled={!data?.readings.length}><Download size={14}/> Export filtered CSV</button></div>
    {error&&<div className="notice notice-error">{error}</div>}
    <form className="toolbar" onSubmit={(e)=>{e.preventDefault();load();}}><label className="field"><span className="eyebrow">FROM DATE</span><input className="input-control" type="date" value={from} onChange={(e)=>setFrom(e.target.value)}/></label><label className="field"><span className="eyebrow">TO DATE</span><input className="input-control" type="date" value={to} onChange={(e)=>setTo(e.target.value)}/></label><button className="button button-secondary"><Filter size={14}/> Apply filters</button><span className="eyebrow">{data?.count??0} MATCHING RECORDS (MAX 10,000)</span></form>
    {loading?<Loading label="Preparing historical report…"/>:data&&<>
      <div className="report-stat-grid"><article className="panel report-stat"><span>Stored sensor readings</span><strong>{data.count}</strong></article><article className="panel report-stat"><span>Alerts in selected period</span><strong>{data.alerts.length}</strong></article><article className="panel report-stat"><span>Critical-risk readings</span><strong>{data.distribution.find((x)=>x.classification==='CRITICAL')?.count||0}</strong></article></div>
      <div className="dashboard-grid">
        <ChartCard title="Water-level trend" subtitle="Centimetres · historical demonstration readings"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:8,right:8,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 4" vertical={false}/><XAxis dataKey="time" hide/><YAxis tickLine={false} axisLine={false}/><Tooltip {...tooltip}/><Area type="monotone" dataKey="waterLevel" stroke="#3478f6" fill="#3478f633" name="Water cm"/></AreaChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Electrical readings" subtitle="Voltage and leakage current trends"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{top:8,right:8,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 4" vertical={false}/><XAxis dataKey="time" hide/><YAxis yAxisId="v" tickLine={false} axisLine={false}/><YAxis yAxisId="l" orientation="right" tickLine={false} axisLine={false}/><Tooltip {...tooltip}/><Line yAxisId="v" dataKey="voltage" name="Voltage V" stroke="#26b8ce" dot={false}/><Line yAxisId="l" dataKey="leakageCurrent" name="Leakage mA" stroke="#e9a23b" dot={false}/></LineChart></ResponsiveContainer></ChartCard>
      </div>
      <div className="bottom-grid" style={{marginBottom:14}}><ChartCard title="Risk distribution" subtitle="Classification counts in filtered records"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.distribution} margin={{top:12,right:12,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 4" vertical={false}/><XAxis dataKey="classification" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip {...tooltip}/><Bar dataKey="count" fill="#3478f6" radius={[4,4,0,0]} name="Readings"/></BarChart></ResponsiveContainer></ChartCard>
        <section className="panel"><div className="panel-heading"><div><h2>Filtered alert records</h2><p>Stored alerts in the chosen date range</p></div></div><div className="sensor-list">{data.alerts.slice(0,8).map((a)=><div className="sensor-row" key={a.id}><i className={`sensor-indicator indicator-${a.severity==='CRITICAL'?'critical':'warning'}`}/><div className="sensor-row-info"><strong>{a.title}</strong><span>{a.sensorId} · {a.location}</span></div><StatusBadge status={a.status}/></div>)}{!data.alerts.length&&<div className="empty-state">No alerts in this period.</div>}</div></section>
      </div>
      <section className="panel table-wrap"><table className="data-table"><thead><tr><th>Time</th><th>Sensor / Location</th><th>Water</th><th>Voltage</th><th>Leakage</th><th>Risk</th><th>Connection</th></tr></thead><tbody>{data.readings.slice(0,100).map((r)=><tr key={r.id}><td>{formatTime(r.recordedAt)}</td><td><span className="cell-primary">{r.sensorId}</span><span className="cell-muted">{r.location}</span></td><td>{formatNumber(r.waterLevel)} cm</td><td>{formatNumber(r.voltage)} V</td><td>{formatNumber(r.leakageCurrent,2)} mA</td><td>{r.riskScore}/100 · <StatusBadge status={r.classification}/></td><td>{r.connected?'Connected':'Offline'}</td></tr>)}{!data.readings.length&&<tr><td colSpan="7" className="empty-state">No readings in the selected date range.</td></tr>}</tbody></table></section>
      <p className="page-footer">Showing up to 100 table rows; CSV exports all {data.count} records returned for the selected filters. All data is simulated.</p>
    </>}
  </>;
}
