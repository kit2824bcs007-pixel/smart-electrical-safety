import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { getAlerts } from './api/api.js';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Loading from './components/Loading.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const LiveMonitoring = lazy(() => import('./pages/LiveMonitoring.jsx'));
const HazardMap = lazy(() => import('./pages/HazardMap.jsx'));
const Alerts = lazy(() => import('./pages/Alerts.jsx'));
const Sensors = lazy(() => import('./pages/Sensors.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const titles = {'/':'Overview Dashboard','/monitoring':'Live Sensor Monitoring','/map':'Street Hazard Map','/alerts':'Alerts & Notifications','/sensors':'Sensor Management','/reports':'Historical Reports','/settings':'Settings'};

export default function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem('gridguard-theme') === 'dark');
  const [alertCount, setAlertCount] = useState(0);
  const [alertError, setAlertError] = useState('');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('gridguard-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await getAlerts();
        if (active) {
          setAlertCount(data.alerts.filter((a) => a.status !== 'RESOLVED').length);
          setAlertError('');
        }
      } catch (err) {
        if (active) setAlertError(`Alert count unavailable: ${err.response?.data?.error || err.message}`);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [location.pathname]);
  return <div className="app-shell">
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    <main className="main-shell"><Header title={titles[location.pathname] || 'Page not found'} onMenu={() => setMenuOpen(true)} dark={dark} onThemeToggle={() => setDark(!dark)} alertCount={alertCount} />
      <div className="page-container">{alertError&&<div className="notice notice-error">{alertError}</div>}<Suspense fallback={<Loading label="Loading page…"/>}><Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/monitoring" element={<LiveMonitoring />} />
        <Route path="/map" element={<HazardMap />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/sensors" element={<Sensors />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes></Suspense><footer className="page-footer">GridGuard Prototype <span>•</span> Rule-based demonstration logic only · Not a certified safety system</footer></div>
    </main>
  </div>;
}
