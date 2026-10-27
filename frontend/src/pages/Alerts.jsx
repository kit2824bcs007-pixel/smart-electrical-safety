import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { getAlerts, updateAlert } from '../api/api.js';
import AlertCard from '../components/AlertCard.jsx';
import Loading from '../components/Loading.jsx';

export default function Alerts(){
  const [alerts,setAlerts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const [severity,setSeverity]=useState('ALL');
  const [status,setStatus]=useState('ALL');
  const refresh=async()=>{setLoading(true);try{const result=await getAlerts();setAlerts(result.alerts);setError('');}catch(err){setError(err.response?.data?.error||`Could not load alerts: ${err.message}`);}finally{setLoading(false);}};
  useEffect(()=>{refresh();},[]);
  const changeStatus=async(id,nextStatus)=>{try{await updateAlert(id,nextStatus);await refresh();}catch(err){setError(err.response?.data?.error||`Could not update alert: ${err.message}`);}};
  const visible=useMemo(()=>alerts.filter((a)=>(severity==='ALL'||a.severity===severity)&&(status==='ALL'||a.status===status)&&`${a.title} ${a.location} ${a.sensorId} ${a.explanation}`.toLowerCase().includes(search.toLowerCase())),[alerts,severity,status,search]);
  return <>
    <div className="page-heading"><div><h2>Alerts & notifications</h2><p>Review and manage generated simulated sensor alerts.</p></div><button className="button button-secondary" onClick={refresh}><RefreshCw size={14}/> Refresh alerts</button></div>
    {error&&<div className="notice notice-error">{error}</div>}
    <div className="toolbar"><label className="search-control input-control"><Search size={14}/><input placeholder="Search alerts…" value={search} onChange={(e)=>setSearch(e.target.value)}/></label>
      <select className="select-control" value={severity} onChange={(e)=>setSeverity(e.target.value)} aria-label="Filter alert severity"><option value="ALL">All severities</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option></select>
      <select className="select-control" value={status} onChange={(e)=>setStatus(e.target.value)} aria-label="Filter alert status"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="RESOLVED">Resolved</option></select>
    </div>
    {loading?<Loading label="Loading alerts…"/>:<div className="alert-list">{visible.map((alert)=><AlertCard key={alert.id} alert={alert} onStatusChange={changeStatus}/>)}</div>}
    {!loading&&!visible.length&&<div className="panel empty-state">No alerts match those filters.</div>}
  </>;
}
