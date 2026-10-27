import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Search } from 'lucide-react';
import useSensorData from '../hooks/useSensorData.js';
import Loading from '../components/Loading.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatNumber } from '../utils/formatters.js';

const colors={SAFE:'#31ad7b',WARNING:'#eba43b',CRITICAL:'#e34b58'};
function FlyToSensor({sensor}){const map=useMap();if(sensor)map.flyTo([sensor.latitude,sensor.longitude],15,{duration:.7});return null;}
export default function HazardMap(){
  const {sensors,loading,error}=useSensorData(12000);
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState(null);
  const filtered=useMemo(()=>sensors.filter((sensor)=>`${sensor.location} ${sensor.area} ${sensor.id}`.toLowerCase().includes(query.toLowerCase())),[sensors,query]);
  if(loading)return <Loading label="Loading demo map locations…"/>;
  return <>
    <div className="page-heading"><div><h2>Street hazard map</h2><p>Simulated demo sensor locations around Coimbatore. Marker status follows backend readings.</p></div><span className="demo-pill"><i/> DEMO COORDINATES</span></div>
    {error&&<div className="notice notice-error">{error}</div>}
    <div className="map-layout">
      <section className="panel map-panel"><MapContainer center={[11.0168,76.9558]} zoom={13} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {selected&&<FlyToSensor sensor={selected}/>}
        {sensors.map((sensor)=><CircleMarker key={sensor.id} center={[sensor.latitude,sensor.longitude]} radius={10} pathOptions={{color:colors[sensor.classification]||colors.SAFE,fillColor:colors[sensor.classification]||colors.SAFE,fillOpacity:.86,weight:2}}><Popup><div className="map-popup"><strong>{sensor.location}</strong><br/>{sensor.id} · {sensor.area}<br/>Water {formatNumber(sensor.waterLevel)} cm · {formatNumber(sensor.voltage)} V<br/>Leakage {formatNumber(sensor.leakageCurrent,2)} mA · Risk {sensor.riskScore}/100<br/><StatusBadge status={sensor.classification}/></div></Popup></CircleMarker>)}
      </MapContainer></section>
      <aside className="panel map-side"><h3>Demo sensor locations <small style={{color:'var(--muted)',fontWeight:400}}>({filtered.length})</small></h3>
        <label className="search-control input-control" style={{width:'100%'}}><Search size={14}/><input placeholder="Find location…" value={query} onChange={(e)=>setQuery(e.target.value)}/></label>
        <div className="sensor-list">{filtered.map((sensor)=><button className="sensor-row" key={sensor.id} onClick={()=>setSelected(sensor)} style={{width:'100%',background:'transparent',border:0,textAlign:'left'}}><i className={`sensor-indicator indicator-${sensor.classification.toLowerCase()}`}/><div className="sensor-row-info"><strong>{sensor.location}</strong><span>{sensor.id} · risk {sensor.riskScore}</span></div><StatusBadge status={sensor.classification}/></button>)}</div>
        <div className="map-legend"><span className="eyebrow">RISK CLASSIFICATION</span><div className="legend-item"><i className="legend-dot" style={{background:colors.SAFE}}/> Safe</div><div className="legend-item"><i className="legend-dot" style={{background:colors.WARNING}}/> Warning</div><div className="legend-item"><i className="legend-dot" style={{background:colors.CRITICAL}}/> Critical</div></div>
        <p className="map-disclaimer">Locations and coordinates are demonstration data, not verified utility infrastructure or real-world hazard reports. Map tiles require an internet connection.</p>
      </aside>
    </div>
  </>;
}
