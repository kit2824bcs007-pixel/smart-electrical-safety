import { Activity, Bell, ChartNoAxesCombined, LayoutDashboard, MapPinned, Radio, Settings, Shield, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  ['/','Overview Dashboard',LayoutDashboard],
  ['/monitoring','Live Sensor Monitoring',Activity],
  ['/map','Street Hazard Map',MapPinned],
  ['/alerts','Alerts & Notifications',Bell],
  ['/sensors','Sensor Management',Radio],
  ['/reports','Historical Reports',ChartNoAxesCombined],
  ['/settings','Settings',Settings],
];

export default function Sidebar({ open, onClose }) {
  return <>
    {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Shield size={23} /></div><div><strong>GridGuard</strong><span>SMART CITY SAFETY</span></div><button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><X size={20} /></button></div>
      <div className="workspace-label">MONITORING CENTER</div>
      <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><span className="online-dot" /> Demo simulation active <small>Coimbatore · India</small></div>
    </aside>
  </>;
}
