import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import "./App.css";
import { getHealth } from "./api";
import { API_BASE_URL } from "./config";
import Overview from "./pages/Overview";
import Recommendations from "./pages/Recommendations";
import Comparison from "./pages/Comparison";
import Dataset from "./pages/Dataset";
import Methodology from "./pages/Methodology";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: "overview", end: true },
  { to: "/recommendations", label: "Recommendations", icon: "spark" },
  { to: "/comparison", label: "Comparison", icon: "compare" },
  { to: "/dataset", label: "Experiment data", icon: "database" },
  { to: "/methodology", label: "Methodology", icon: "method" },
];

function Icon({ name }) {
  const paths = {
    overview: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    spark: <path d="m12 2 1.45 4.55L18 8l-4.55 1.45L12 14l-1.45-4.55L6 8l4.55-1.45L12 2Zm6.5 11 .82 2.68L22 16.5l-2.68.82L18.5 20l-.82-2.68L15 16.5l2.68-.82L18.5 13ZM5 14l1.1 2.9L9 18l-2.9 1.1L5 22l-1.1-2.9L1 18l2.9-1.1L5 14Z" />,
    compare: <path d="M7 3 2 8l5 5V9h6V7H7V3Zm10 8v4h-6v2h6v4l5-5-5-5Z" />,
    database: <path d="M12 3C7 3 3 4.57 3 6.5S7 10 12 10s9-1.57 9-3.5S17 3 12 3Zm-9 7v4.5C3 16.43 7 18 12 18s9-1.57 9-3.5V10c-1.74 1.45-5.08 2.25-9 2.25S4.74 11.45 3 10Zm0 8v-.5c1.74 1.45 5.08 2.25 9 2.25s7.26-.8 9-2.25v.5c0 1.93-4 3.5-9 3.5S3 19.93 3 18Z" />,
    method: <path d="M5 3h10a4 4 0 0 1 4 4v14H7a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2Zm2 14a2 2 0 0 0-2 2h12V7a2 2 0 0 0-2-2H5v12.54A4 4 0 0 1 7 17Zm1-8h6v2H8V9Zm0 4h5v2H8v-2Z" />,
  };

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function SystemStatus() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    function check() {
      getHealth()
        .then(() => {
          if (active) setStatus("online");
        })
        .catch(() => {
          if (active) setStatus("offline");
        });
    }

    check();
    const interval = window.setInterval(check, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const label =
    status === "online"
      ? "Backend connected"
      : status === "offline"
        ? "Backend offline"
        : "Checking backend";

  return (
    <div className={`system-status ${status}`} aria-live="polite">
      <span className="status-dot" />
      {label}
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="CloudOpt AI home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 28 28">
              <path d="M8.4 20.8h11a5.1 5.1 0 0 0 .8-10.14A6.7 6.7 0 0 0 7.37 8.9 6 6 0 0 0 8.4 20.8Z" />
              <path className="brand-pulse" d="m8.2 15.1 3.1-3 2.3 3 4.5-5" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>CloudOpt</strong>
            <small>Resource intelligence</small>
          </span>
        </NavLink>

        <div className="sidebar-label">Workspace</div>
        <nav className="nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="sidebar-note-label">Project mode</span>
          <strong>Measured decision support</strong>
          <p>Transparent recommendations from controlled local experiments.</p>
        </div>
      </aside>

      <div className="app-frame">
        <header className="app-header">
          <div>
            <span className="topbar-kicker">Cloud optimization lab</span>
            <strong className="topbar-title">Experiment dashboard</strong>
          </div>
          <SystemStatus />
        </header>

        <div id="main-content" className="route-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>

        <footer className="app-footer">
          <span>CloudOpt AI · Read-only evidence dashboard</span>
          <span className="footer-api">
            API <span className="mono">{API_BASE_URL || "127.0.0.1:8000"}</span>
          </span>
        </footer>
      </div>
    </div>
  );
}
