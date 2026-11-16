import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getComparison, getDataset, getRecommendation } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { ms, resources } from "../format";

const FALLBACK_STATS = [
  { value: "9", label: "Measured runs", note: "3 loads × 3 configurations" },
  { value: "3", label: "Resource profiles", note: "Compared under equal traffic" },
  { value: "28×", label: "Worst slowdown", note: "When high load is under-provisioned" },
  { value: "0%", label: "Request failures", note: "Across the frozen experiment set" },
];

function buildStats(rows) {
  if (!rows?.length) return FALLBACK_STATS;

  const configs = new Set(rows.map((row) => row.config_label));
  const worstP95 = Math.max(...rows.map((row) => row.p95_latency_ms));
  const bestP95 = Math.min(...rows.map((row) => row.p95_latency_ms));
  const maxFailRate = Math.max(...rows.map((row) => row.http_req_failed_rate));

  return [
    { value: String(rows.length), label: "Measured runs", note: "Controlled k6 experiments" },
    { value: String(configs.size), label: "Resource profiles", note: "CPU and memory allocations" },
    {
      value: `${(worstP95 / bestP95).toFixed(0)}×`,
      label: "Worst slowdown",
      note: "Under-provisioning impact on p95",
    },
    {
      value: `${(maxFailRate * 100).toFixed(0)}%`,
      label: "Request failures",
      note: "Maximum measured failure rate",
    },
  ];
}

export default function Overview() {
  const [dashboard, setDashboard] = useState({
    stats: FALLBACK_STATS,
    recommendation: null,
    comparisons: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      getDataset(),
      getRecommendation("high"),
      getComparison(),
    ]).then(([dataset, recommendation, comparison]) => {
      if (!active) return;

      setDashboard({
        stats:
          dataset.status === "fulfilled"
            ? buildStats(dataset.value.rows)
            : FALLBACK_STATS,
        recommendation:
          recommendation.status === "fulfilled" ? recommendation.value : null,
        comparisons:
          comparison.status === "fulfilled"
            ? comparison.value.comparisons ?? []
            : [],
      });

      const failure = [dataset, recommendation, comparison].find(
        (result) => result.status === "rejected",
      );
      setError(failure?.reason ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const recommendation = dashboard.recommendation;
  const safeDecisions = dashboard.comparisons.filter(
    (item) => item.recommended_meets_slo,
  ).length;
  const sloUsage = recommendation
    ? Math.min((recommendation.p95_latency_ms / 50) * 100, 100)
    : 0;

  return (
    <main className="page overview-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Measured · Explainable · Reproducible</span>
          <h1>Right-size cloud resources with evidence, not instinct.</h1>
          <p>
            CloudOpt turns controlled load tests into transparent infrastructure
            recommendations—showing what to deploy, why it qualifies, and where
            the performance limit begins.
          </p>
          <div className="cta-row">
            <Link className="cta primary" to="/recommendations">
              View recommendations
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="cta" to="/dataset">
              Inspect the evidence
            </Link>
          </div>
          <div className="hero-trust-row" aria-label="Project attributes">
            <span><i className="trust-dot" />9 canonical runs</span>
            <span><i className="trust-dot" />50 ms p95 SLO</span>
            <span><i className="trust-dot" />No black-box model</span>
          </div>
        </div>

        <div className="decision-preview">
          <div className="decision-preview-header">
            <div>
              <span className="card-kicker">Current decision</span>
              <h2>High-load profile</h2>
            </div>
            <span className={`pill ${recommendation ? "success" : "neutral"}`}>
              {recommendation ? "Within SLO" : "Waiting for API"}
            </span>
          </div>

          {loading ? (
            <Loading label="Evaluating measured profiles…" />
          ) : recommendation ? (
            <>
              <div className="preview-config mono">
                {recommendation.recommended_config}
              </div>
              <div className="preview-resource">
                {resources(recommendation.cpu_limit, recommendation.memory_limit_mb)}
              </div>
              <div className="slo-row">
                <span>p95 latency</span>
                <strong>{ms(recommendation.p95_latency_ms)} / 50 ms</strong>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${sloUsage}%` }} />
              </div>
              <div className="decision-preview-footer">
                <span>{recommendation.eligible_config_labels.length} profiles eligible</span>
                <span>{(50 - recommendation.p95_latency_ms).toFixed(1)} ms headroom</span>
              </div>
            </>
          ) : (
            <p className="empty-copy">
              Start the backend to see the live high-load recommendation. The
              frozen experiment summary remains available below.
            </p>
          )}
        </div>
      </section>

      {error && (
        <div className="inline-banner">
          <ErrorMessage error={error} />
          <p className="caption">
            Headline figures fall back to the committed experiment dataset.
          </p>
        </div>
      )}

      <section className="section-block" aria-labelledby="evidence-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Experiment snapshot</span>
            <h2 id="evidence-heading">The evidence at a glance</h2>
          </div>
          {safeDecisions > 0 && (
            <span className="section-note">
              {safeDecisions}/{dashboard.comparisons.length} recommended profiles meet the SLO
            </span>
          )}
        </div>
        <div className="stat-grid">
          {dashboard.stats.map((stat, index) => (
            <article className={`stat-card accent-${index + 1}`} key={stat.label}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-note">{stat.note}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="card workflow-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">How CloudOpt works</span>
            <h2>One auditable path from traffic to decision</h2>
          </div>
          <Link className="text-link" to="/methodology">Read the methodology →</Link>
        </div>
        <div className="workflow-grid">
          <article>
            <span className="step-number">01</span>
            <h3>Measure</h3>
            <p>Run repeatable k6 traffic against fixed CPU and memory profiles.</p>
          </article>
          <article>
            <span className="step-number">02</span>
            <h3>Qualify</h3>
            <p>Keep only configurations below the p95 latency and failure thresholds.</p>
          </article>
          <article>
            <span className="step-number">03</span>
            <h3>Recommend</h3>
            <p>Select the smallest measured profile that still meets the defined SLO.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
