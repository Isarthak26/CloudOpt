import { useEffect, useState } from "react";

import { getRecommendation } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { LOAD_LEVELS } from "../config";
import { ms, percent, resources, titleCase } from "../format";

const MAX_P95_MS = 50;

export default function Recommendations() {
  const [loadLevel, setLoadLevel] = useState("high");
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    let active = true;
    getRecommendation(loadLevel)
      .then((data) => {
        if (active) setOutcome({ loadLevel, data, error: null });
      })
      .catch((error) => {
        if (active) setOutcome({ loadLevel, data: null, error });
      });
    return () => {
      active = false;
    };
  }, [loadLevel]);

  const loading = outcome?.loadLevel !== loadLevel;
  const result = loading ? null : outcome.data;
  const error = loading ? null : outcome.error;
  const hasRecommendation = Boolean(result?.recommended_config);
  const headroom = hasRecommendation
    ? Math.max(MAX_P95_MS - result.p95_latency_ms, 0)
    : 0;
  const sloUsage = hasRecommendation
    ? Math.min((result.p95_latency_ms / MAX_P95_MS) * 100, 100)
    : 0;

  return (
    <main className="page">
      <div className="page-header split-header">
        <div>
          <span className="eyebrow">Decision explorer</span>
          <h1>Resource recommendations</h1>
          <p>
            Choose a measured traffic level to see the smallest resource profile
            that remains inside the project&apos;s performance boundary.
          </p>
        </div>
        <div className="rule-summary" aria-label="Selection rule">
          <span>Selection guardrail</span>
          <strong>p95 ≤ 50 ms · failures = 0%</strong>
        </div>
      </div>

      <section className="control-bar" aria-label="Traffic level selector">
        <div>
          <span className="control-label">Traffic scenario</span>
          <span className="control-help">Compare the recommendation by load</span>
        </div>
        <div className="segmented">
          {LOAD_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={level === loadLevel ? "active" : ""}
              aria-pressed={level === loadLevel}
              onClick={() => setLoadLevel(level)}
            >
              {titleCase(level)}
            </button>
          ))}
        </div>
      </section>

      <div className="result-region" aria-live="polite">
        {loading && <Loading label={`Evaluating ${loadLevel}-load measurements…`} />}
        {!loading && error && <ErrorMessage error={error} />}
        {!loading && !error && result && !hasRecommendation && (
          <div className="status error">
            No measured configuration meets the current SLO for this traffic level.
          </div>
        )}

        {!loading && !error && hasRecommendation && (
          <>
            <div className="recommendation-grid">
              <section className="recommended-card">
                <div className="recommendation-topline">
                  <div>
                    <span className="recommended-label">Recommended profile</span>
                    <h2 className="recommended-config">{result.recommended_config}</h2>
                  </div>
                  <span className="pill success">SLO qualified</span>
                </div>

                <p className="resource-line">
                  {resources(result.cpu_limit, result.memory_limit_mb)}
                </p>

                <div className="metric-grid">
                  <div>
                    <span className="metric-label">Measured p95</span>
                    <strong className="metric-value">{ms(result.p95_latency_ms)}</strong>
                  </div>
                  <div>
                    <span className="metric-label">Failure rate</span>
                    <strong className="metric-value">
                      {percent(result.http_req_failed_rate)}
                    </strong>
                  </div>
                  <div>
                    <span className="metric-label">SLO headroom</span>
                    <strong className="metric-value">{headroom.toFixed(1)} ms</strong>
                  </div>
                </div>

                <div className="slo-meter">
                  <div className="slo-row">
                    <span>Latency budget used</span>
                    <strong>{sloUsage.toFixed(0)}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${sloUsage}%` }} />
                  </div>
                  <div className="meter-scale">
                    <span>0 ms</span>
                    <span>50 ms limit</span>
                  </div>
                </div>
              </section>

              <aside className="decision-card">
                <span className="card-kicker">Why it was selected</span>
                <h2>Smallest safe allocation</h2>
                <p>
                  The selector first removes profiles outside the SLO, then
                  orders the remaining options by CPU and memory allocation.
                </p>
                <div className="decision-facts">
                  <div>
                    <strong>{result.eligible_config_labels.length}</strong>
                    <span>eligible profiles</span>
                  </div>
                  <div>
                    <strong>{result.rejected_configs.length}</strong>
                    <span>rejected profiles</span>
                  </div>
                </div>
                <span className="load-badge">{titleCase(loadLevel)} traffic</span>
              </aside>
            </div>

            {result.reasoning && (
              <section className="card rationale-card">
                <span className="card-kicker">Decision trace</span>
                <h2>Backend explanation</h2>
                <p>{result.reasoning}</p>
              </section>
            )}

            <div className="explanation-grid">
              <details className="explain" open>
                <summary>
                  <span>Qualified configurations</span>
                  <span className="count-badge">{result.eligible_config_labels.length}</span>
                </summary>
                <p className="caption">
                  These measured profiles remained inside the SLO at {loadLevel} load.
                </p>
                <ul className="chip-list">
                  {result.eligible_config_labels.map((label) => (
                    <li className="chip eligible mono" key={label}>
                      <span className="chip-icon">✓</span>{label}
                    </li>
                  ))}
                </ul>
              </details>

              <details className="explain" open>
                <summary>
                  <span>Rejected configurations</span>
                  <span className="count-badge">{result.rejected_configs.length}</span>
                </summary>
                {result.rejected_configs.length === 0 ? (
                  <p className="caption">
                    Every measured configuration met the requirement at this load level.
                  </p>
                ) : (
                  <ul className="chip-list">
                    {result.rejected_configs.map((item) => (
                      <li className="chip rejected" key={item.config_label}>
                        <span className="chip-icon">×</span>
                        <span><b className="mono">{item.config_label}</b>{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
