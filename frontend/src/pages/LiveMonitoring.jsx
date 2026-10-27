import { useMemo, useState } from 'react';
import { ArrowDownUp, RefreshCw, Search } from 'lucide-react';
import useSensorData from '../hooks/useSensorData.js';
import SensorCard from '../components/SensorCard.jsx';
import Loading from '../components/Loading.jsx';

export default function LiveMonitoring() {
  const {sensors,loading,error,refresh}=useSensorData(10000);
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('ALL');
  const [sort,setSort]=useState('risk');
  const visible=useMemo(()=>sensors.filter((sensor)=>(filter==='ALL'||sensor.classification===filter)&&`${sensor.id} ${sensor.location} ${sensor.area}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='risk'?b.riskScore-a.riskScore:sort==='location'?a.location.localeCompare(b.location):new Date(b.lastUpdated)-new Date(a.lastUpdated)),[sensors,filter,search,sort]);
  return <>
    <div className="page-heading"><div><h2>Live sensor monitoring</h2><p>Automatically refreshed simulated readings and rule-based risk classifications.</p></div><button className="button button-secondary" onClick={refresh}><RefreshCw size={14}/> Refresh data</button></div>
    {error&&<div className="notice notice-error">{error}</div>}
    <div className="toolbar"><label className="search-control input-control"><Search size={14}/><input aria-label="Search sensors" placeholder="Search ID, location or area…" value={search} onChange={(e)=>setSearch(e.target.value)}/></label>
      <select className="select-control" aria-label="Filter by classification" value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="ALL">All classifications</option><option>SAFE</option><option>WARNING</option><option>CRITICAL</option></select>
      <button className="button button-secondary" onClick={()=>setSort(sort==='risk'?'location':sort==='location'?'updated':'risk')}><ArrowDownUp size={14}/> Sort: {sort==='risk'?'Risk':sort==='location'?'Location':'Updated'}</button>
    </div>
    {loading?<Loading label="Loading sensors…"/>:<div className="sensor-page-grid">{visible.map((sensor)=><SensorCard key={sensor.id} sensor={sensor}/>)}</div>}
    {!loading&&!visible.length&&<div className="panel empty-state">No sensors match your search and filter.</div>}
    <div className="page-footer">Refresh interval: 10 seconds · {sensors.length} sensors · Demonstration data only</div>
  </>;
}
