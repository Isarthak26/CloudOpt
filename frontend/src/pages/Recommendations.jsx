import { useEffect, useState } from "react";

import { getRecommendation } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { LOAD_LEVELS } from "../config";
import { ms, percent, resources, titleCase } from "../format";

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

  return (
    <main className="page">
      <div className="page-header">
        <h1>Recommendations Explorer</h1>
        <p>
          Pick a traffic level and the backend returns the lowest-resource
          configuration that still met the SLO in the measured experiments,
          along with why every other configuration was accepted or rejected.
        </p>
      </div>

      <div className="segmented">
        {LOAD_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={level === loadLevel ? "active" : ""}
            onClick={() => setLoadLevel(level)}
          >
            {titleCase(level)} Load
          </button>
        ))}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        {loading && <Loading label={`Asking the backend about ${loadLevel} load…`} />}
        {!loading && error && <ErrorMessage error={error} />}
        {!loading && !error && result && (
          <>
            <div className="recommended-card">
              <div className="recommended-label">Recommended configuration</div>
              <div className="recommended-config">
                {result.recommended_config}
              </div>
              <div className="stat-label">
                {resources(result.cpu_limit, result.memory_limit_mb)}
              </div>

              <div className="metric-row">
                <div>
                  <div className="metric-value">{ms(result.p95_latency_ms)}</div>
                  <div className="metric-label">measured p95 latency</div>
                </div>
                <div>
                  <div className="metric-value">
                    {percent(result.http_req_failed_rate)}
                  </div>
                  <div className="metric-label">request failure rate</div>
                </div>
              </div>
            </div>

            {result.reasoning && <p className="caption">{result.reasoning}</p>}

            <details className="explain" open>
              <summary>Why this config?</summary>
              <p className="caption">
                These configurations met the requirement at {loadLevel} load:
              </p>
              <ul className="chip-list">
                {result.eligible_config_labels.map((label) => (
                  <li className="chip eligible mono" key={label}>
                    {label}
                  </li>
                ))}
              </ul>
            </details>

            <details className="explain">
              <summary>
                Why not the others? ({result.rejected_configs.length})
              </summary>
              {result.rejected_configs.length === 0 ? (
                <p className="caption">
                  Every measured configuration met the requirement at this load
                  level.
                </p>
              ) : (
                <ul className="chip-list">
                  {result.rejected_configs.map((item) => (
                    <li className="chip rejected" key={item.config_label}>
                      <span className="mono">{item.config_label}</span> —
                      rejected: {item.reason}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </>
        )}
      </div>
    </main>
  );
}
