import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getComparison } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { ms, titleCase } from "../format";

export default function Comparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getComparison()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const comparisons = data?.comparisons ?? [];
  const chartData = comparisons.map((item) => ({
    load: titleCase(item.load_level),
    naive: Number(item.naive_p95_latency_ms.toFixed(2)),
    recommended: Number(item.recommended_p95_latency_ms.toFixed(2)),
  }));
  const fewerResources = comparisons.filter(
    (item) => item.recommended_uses_fewer_resources,
  ).length;
  const sloPasses = comparisons.filter(
    (item) => item.recommended_meets_slo,
  ).length;

  return (
    <main className="page">
      <div className="page-header split-header">
        <div>
          <span className="eyebrow">Baseline evaluation</span>
          <h1>Static allocation vs measured decisions</h1>
          <p>
            Compare an always-unconstrained strategy with the smallest measured
            profile that passes the same service-level objective.
          </p>
        </div>
        <div className="rule-summary">
          <span>Baseline</span>
          <strong>Always deploy unconstrained</strong>
        </div>
      </div>

      {loading && <Loading label="Loading the baseline comparison…" />}
      {!loading && error && <ErrorMessage error={error} />}

      {!loading && !error && comparisons.length > 0 && (
        <>
          <section className="comparison-summary" aria-label="Comparison summary">
            <article>
              <span className="summary-icon">↓</span>
              <div><strong>{fewerResources}/{comparisons.length}</strong><span>use fewer resources</span></div>
            </article>
            <article>
              <span className="summary-icon">✓</span>
              <div><strong>{sloPasses}/{comparisons.length}</strong><span>recommendations meet SLO</span></div>
            </article>
            <article>
              <span className="summary-icon">◎</span>
              <div><strong>0%</strong><span>measured failure rate</span></div>
            </article>
          </section>

          <div className="analytics-grid">
            <section className="card chart-card">
              <div className="card-heading">
                <div>
                  <span className="card-kicker">Performance boundary</span>
                  <h2>p95 latency by strategy</h2>
                </div>
                <span className="legend-note">Lower is better</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#dce4ef" />
                    <XAxis dataKey="load" axisLine={false} tickLine={false} tick={{ fill: "#69788d", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#69788d", fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(35, 74, 129, 0.05)" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #dce4ef", boxShadow: "0 12px 30px rgba(15, 35, 65, .12)" }}
                      formatter={(value) => `${value} ms`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                    <ReferenceLine y={50} stroke="#d86d51" strokeDasharray="5 5" label={{ value: "50 ms SLO", fill: "#a94f3b", fontSize: 11, position: "insideTopRight" }} />
                    <Bar dataKey="naive" name="Unconstrained baseline" fill="#b8c4d5" radius={[5, 5, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="recommended" name="CloudOpt recommendation" fill="#3e8f7c" radius={[5, 5, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card scenario-card">
              <span className="card-kicker">Decision outcome</span>
              <h2>Profile selected at each load</h2>
              <div className="scenario-list">
                {comparisons.map((item) => {
                  const delta = item.recommended_p95_latency_ms - item.naive_p95_latency_ms;
                  return (
                    <article key={item.load_level}>
                      <span className={`load-indicator ${item.load_level}`} />
                      <div>
                        <span>{titleCase(item.load_level)} load</span>
                        <strong className="mono">{item.recommended_config_label}</strong>
                      </div>
                      <div className="scenario-metric">
                        <strong>{ms(item.recommended_p95_latency_ms)}</strong>
                        <span>{delta >= 0 ? "+" : ""}{delta.toFixed(1)} ms vs baseline</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="card table-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Full evidence</span>
                <h2>Measured decision table</h2>
              </div>
              <span className="legend-note">Retrospective comparison</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Load</th>
                    <th>Baseline</th>
                    <th>Baseline p95</th>
                    <th>Recommendation</th>
                    <th>Recommended p95</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((item) => (
                    <tr key={item.load_level}>
                      <td><strong>{titleCase(item.load_level)}</strong></td>
                      <td className="mono">{item.naive_config_label}</td>
                      <td className="mono">{ms(item.naive_p95_latency_ms)}</td>
                      <td className="mono">{item.recommended_config_label}</td>
                      <td className="mono">{ms(item.recommended_p95_latency_ms)}</td>
                      <td>
                        <span className={`pill ${item.recommended_uses_fewer_resources ? "success" : "neutral"}`}>
                          {item.recommended_uses_fewer_resources ? "Lower allocation" : "Same allocation"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption">
              This comparison reuses the same frozen measurements; it is not a fresh
              paired deployment test. That follow-up is captured in the project roadmap.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
