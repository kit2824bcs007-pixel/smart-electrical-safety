import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header({ title, onMenu, dark, onThemeToggle, alertCount = 0 }) {
  return <header className="topbar">
    <div className="topbar-left"><button className="icon-button menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button><div><span className="breadcrumb">SAFETY OPERATIONS /</span><h1>{title}</h1></div></div>
    <div className="topbar-actions"><span className="demo-pill"><i /> SIMULATED DEMO DATA</span><Link className="icon-button notification-button" to="/alerts" aria-label="View alerts"><Bell size={19} />{alertCount > 0 && <b>{alertCount}</b>}</Link><button className="icon-button" onClick={onThemeToggle} aria-label="Toggle theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button><div className="avatar">GG</div></div>
  </header>;
}
