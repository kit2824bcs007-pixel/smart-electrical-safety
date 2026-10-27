# AI-Based Smart Electrical Shock Detection and Prevention System

A college-project prototype for monitoring simulated water-level, voltage, and leakage-current readings at street sensors around Coimbatore. The risk engine is configurable, rule-based demonstration logic; it is **not a trained AI model**, certified safety equipment, or a guarantee of shock prevention.

> **Electrical safety:** This software uses simulated data only. Do not connect it to mains electricity. Real deployment requires professionally designed isolated sensing hardware, certified protective systems, qualified electrical installation, and independently tested fail-safe mechanisms. This application does not contact emergency services.

## Requirements

- Windows 10/11 with PowerShell
- Node.js 22.13+ (tested with Node 24; uses the built-in `node:sqlite` module)
- npm 10+

## Install

Open the project folder in VS Code. In a PowerShell terminal:

```powershell
npm install
Copy-Item backend\.env.example backend\.env
```

The backend creates its SQLite database automatically at `backend\data\safety.sqlite`. The default development ports are 3000 (API) and 5173 (web app). The Vite development server proxies `/api` requests to port 3000.

## Run in two VS Code terminals

Terminal 1:

```powershell
npm run dev:backend
```

Terminal 2:

```powershell
npm run dev:frontend
```

Or run both with `npm run dev`.

Expected startup messages include `API listening on http://127.0.0.1:3000` and Vite's `Local: http://localhost:5173/`. Node may also print its standard experimental-feature warning for the built-in SQLite module.

## URLs and API

- Dashboard: <http://localhost:5173>
- API health: <http://localhost:3000/api/health>
- Sensors: `GET /api/sensors`
- Alerts: `GET /api/alerts`
- Reports: `GET /api/reports`
- Settings: `GET /api/settings`

The `.env.example` files document the supported settings. Change `PORT` or `CORS_ORIGIN` in `backend\.env` if needed.

## Tests and production build

```powershell
npm test
npm run build
```

Tests run against an isolated temporary SQLite database and exercise health, sensor CRUD, alert status updates, reports, and settings persistence. The production frontend is written to `frontend\dist`.

## Features

- Responsive overview, live sensor list, map, alerts, sensor management, reports, and settings pages.
- Interactive readings and trend charts; reports can be filtered by dates and exported as CSV.
- Coimbatore demo sensors and map markers are clearly identified as simulated demonstration data.
- SQLite persistence for sensors, readings, alerts, and settings.
- Duplicate active alerts are suppressed for the same sensor and hazard type.
- Demo risk thresholds can be configured from Settings; simulation can be enabled or paused per sensor.

## Troubleshooting

- **Port already in use:** set `PORT=3001` in `backend\.env`; update the Vite proxy target in `frontend\vite.config.js` to match.
- **Database permission error:** ensure the project directory is writable. Stop the API before moving or replacing the SQLite file.
- **No dashboard data:** confirm the API health URL responds, then refresh the page. Check the backend terminal for validation or database errors.
- **Dependency install errors:** use Node.js 22.13+ and run `npm install` from the project root.

## Push to GitHub

After reviewing the files and ensuring no private `.env` files are staged:

```powershell
git init
git add .
git commit -m "Build smart electrical safety demo"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/smart-electrical-safety.git
git push -u origin main
```

Replace the example repository URL with your own GitHub repository. The SQLite database and environment files are ignored by Git.
