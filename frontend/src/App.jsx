import { NavLink, Route, Routes } from "react-router-dom";

import "./App.css";
import { API_BASE_URL } from "./config";
import Overview from "./pages/Overview";
import Recommendations from "./pages/Recommendations";
import Comparison from "./pages/Comparison";
import Dataset from "./pages/Dataset";
import Methodology from "./pages/Methodology";

const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/comparison", label: "Baseline Comparison" },
  { to: "/dataset", label: "Experiment Data" },
  { to: "/methodology", label: "Methodology" },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand">
          CloudOpt <span>AI</span>
        </NavLink>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/dataset" element={<Dataset />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="*" element={<Overview />} />
      </Routes>

      <footer className="app-footer">
        Phase 8 dashboard — read-only view of the CloudOpt AI backend at{" "}
        <span className="mono">{API_BASE_URL || "http://127.0.0.1:8000"}</span>
      </footer>
    </div>
  );
}
