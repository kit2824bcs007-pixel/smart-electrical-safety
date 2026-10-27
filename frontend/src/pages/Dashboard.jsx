import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Droplets, Radio, ShieldCheck, Zap } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/api.js';
import AlertCard from '../components/AlertCard.jsx';
import ChartCard from '../components/ChartCard.jsx';
import Loading from '../components/Loading.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatNumber, formatTime } from '../utils/formatters.js';

export default function Dashboard() {
  const [data,setData] = useState(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  useEffect(() => {
    let active=true;
    const load=async()=>{try{const result=await getDashboard();if(active){setData(result);setError('');}}catch(err){if(active)setError(err.response?.data?.error||`Dashboard request failed: ${err.message}`);}finally{if(active)setLoading(false);}};
    load();
    const timer=window.setInterval(load,10000);
    return()=>{active=false;window.clearInterval(timer);};
  },[]);
  if(loading)return <Loading label="Loading safety overview…" />;
  if(error&&!data)return <div className="notice notice-error">{error} <button className="button button-secondary" onClick={()=>window.location.reload()}>Retry</button></div>;
  if(!data)return null;
  const {stats,sensors,recentAlerts,readings,lastUpdated}=data;
  const chartData=readings.map((item)=>({...item,time:new Date(item.recordedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}));
  const chartTooltip={contentStyle:{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:8,fontSize:10},labelStyle:{color:'var(--muted)'}};
  return <>
    <div className="page-heading"><div><h2>City safety at a glance</h2><p>Monitoring demonstration sensors across Coimbatore, Tamil Nadu.</p></div><div className="heading-actions"><span className="eyebrow">UPDATED {formatTime(lastUpdated)}</span></div></div>
    {error&&<div className="notice notice-error">{error}</div>}
    <div className="stat-grid">
      <StatCard title="Monitored locations" value={stats.total||0} detail="Demo sensor locations" icon={Radio} tone="blue" />
      <StatCard title="Safe locations" value={stats.safe||0} detail={`${stats.connected||0} sensors connected`} icon={ShieldCheck} tone="green" />
      <StatCard title="Warning locations" value={stats.warning||0} detail="Require attention" icon={AlertTriangle} tone="orange" />
      <StatCard title="Critical locations" value={stats.critical||0} detail={`${stats.disconnected||0} disconnected`} icon={Activity} tone="red" />
    </div>
    <div className="report-stat-grid">
      <article className="panel report-stat"><span>Average water level</span><strong>{formatNumber(stats.averageWaterLevel)} cm</strong></article>
      <article className="panel report-stat"><span>Average voltage</span><strong>{formatNumber(stats.averageVoltage)} V</strong></article>
      <article className="panel report-stat"><span>Average leakage current</span><strong>{formatNumber(stats.averageLeakage,2)} mA</strong></article>
    </div>
    <div className="dashboard-grid">
      <ChartCard title="Environmental & electrical trends" subtitle="Historical sensor averages · simulated records">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:8,right:12,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 4" vertical={false}/><XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={30}/><YAxis yAxisId="water" tickLine={false} axisLine={false}/><YAxis yAxisId="electric" orientation="right" tickLine={false} axisLine={false}/><Tooltip {...chartTooltip}/><Line yAxisId="water" dataKey="waterLevel" name="Water cm" stroke="#3478f6" strokeWidth={2} dot={false} activeDot={{r:4}}/><Line yAxisId="electric" dataKey="voltage" name="Voltage V" stroke="#27b7ce" strokeWidth={2} dot={false}/><Line yAxisId="electric" dataKey="leakageCurrent" name="Leakage mA" stroke="#e9a23b" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Hazard score trend" subtitle="Average rule-based demonstration risk score">
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:8,right:10,left:-18,bottom:0}}><defs><linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e74f5d" stopOpacity={.3}/><stop offset="100%" stopColor="#e74f5d" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 4" vertical={false}/><XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={30}/><YAxis domain={[0,100]} tickLine={false} axisLine={false}/><Tooltip {...chartTooltip}/><Area type="monotone" dataKey="riskScore" name="Risk score" stroke="#e4515c" fill="url(#riskFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer>
      </ChartCard>
    </div>
    <div className="bottom-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Highest risk locations</h2><p>Current simulated readings</p></div><Link className="panel-link" to="/monitoring">View all →</Link></div>
        <div className="sensor-list">{sensors.slice(0,5).map((sensor)=><div className="sensor-row" key={sensor.id}><i className={`sensor-indicator indicator-${sensor.classification.toLowerCase()}`}/><div className="sensor-row-info"><strong>{sensor.location}</strong><span>{sensor.id} · {sensor.area}</span></div><div className="sensor-row-value"><strong>{sensor.riskScore}/100</strong><span>{formatNumber(sensor.waterLevel)} cm water</span></div><StatusBadge status={sensor.classification}/></div>)}</div>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Recent alerts</h2><p>Latest active and historical notices</p></div><Link className="panel-link" to="/alerts">All alerts →</Link></div>
        <div className="alert-preview">{recentAlerts.length?recentAlerts.slice(0,4).map((alert)=><div className="alert-preview-item" key={alert.id}><i className={`alert-side-dot ${alert.severity==='CRITICAL'?'indicator-critical':'indicator-warning'}`}/><div><h4>{alert.title}</h4><p>{alert.location} · {formatTime(alert.createdAt)}</p></div></div>):<div className="empty-state">No alerts to display.</div>}</div>
      </section>
    </div>
    <div className="notice" style={{marginTop:14}}><Droplets size={13} style={{verticalAlign:'middle',marginRight:6}}/>All displayed readings and locations are simulated demo data. The rule-based score is not a trained AI model or a certified safety system.</div>
  </>;
}
