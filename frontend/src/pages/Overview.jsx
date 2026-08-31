import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDataset } from "../api";
import { ErrorMessage } from "../components/Status";

const FALLBACK_STATS = [
  { value: "9", label: "controlled experiments run" },
  { value: "3", label: "resource configurations tested" },
  { value: "28x", label: "worst latency degradation when under-provisioned" },
  { value: "0%", label: "request failures across all tests" },
];

function buildStats(rows) {
  if (!rows?.length) return FALLBACK_STATS;

  const configs = new Set(rows.map((row) => row.config_label));
  const worstP95 = Math.max(...rows.map((row) => row.p95_latency_ms));
  const bestP95 = Math.min(...rows.map((row) => row.p95_latency_ms));
  const maxFailRate = Math.max(...rows.map((row) => row.http_req_failed_rate));

  return [
    { value: String(rows.length), label: "controlled experiments run" },
    { value: String(configs.size), label: "resource configurations tested" },
    {
      value: `${(worstP95 / bestP95).toFixed(0)}x`,
      label: "worst latency degradation when under-provisioned",
    },
    {
      value: `${(maxFailRate * 100).toFixed(0)}%`,
      label: "request failures across all tests",
    },
  ];
}

export default function Overview() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getDataset()
      .then((data) => {
        if (!active) return;
        setStats(buildStats(data.rows));
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>CloudOpt AI</h1>
        <p>
          Evidence-based cloud resource recommendations from controlled
          experiments.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "1.25rem" }}>
          <ErrorMessage error={error} />
          <p className="caption">
            Showing the headline figures from the frozen experiment run instead
            of live data.
          </p>
        </div>
      )}

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="card">
        <h2>What this tool does</h2>
        <p>
          CloudOpt AI tests an application under different CPU/memory limits and
          traffic levels, then recommends the cheapest configuration that still
          meets performance requirements. The recommendation is a transparent
          threshold rule over nine measured k6 runs — not a trained model, and
          not a guess.
        </p>
        <p>
          Every number in this dashboard is read live from the CloudOpt backend
          API, which wraps the same selector code used in the report.
        </p>
        <div className="cta-row">
          <Link className="cta primary" to="/recommendations">
            Explore Recommendations →
          </Link>
          <Link className="cta" to="/dataset">
            View Experiment Data →
          </Link>
        </div>
      </section>
    </main>
  );
}
