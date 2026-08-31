import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

  return (
    <main className="page">
      <div className="page-header">
        <h1>Baseline Comparison</h1>
        <p>
          A naive strategy never shrinks anything — it always deploys{" "}
          <span className="mono">unconstrained</span>. This page shows what the
          selector chooses instead, and what it costs in latency.
        </p>
      </div>

      {loading && <Loading label="Loading the baseline comparison…" />}
      {!loading && error && <ErrorMessage error={error} />}

      {!loading && !error && comparisons.length > 0 && (
        <>
          <section className="card">
            <h2>Naive vs recommended</h2>
            <p className="caption" style={{ marginTop: 0 }}>
              Naive strategy: {data.naive_strategy}.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Load level</th>
                  <th>Naive choice</th>
                  <th>Naive p95</th>
                  <th>Recommended choice</th>
                  <th>Recommended p95</th>
                  <th>Why the recommendation wins</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item) => (
                  <tr key={item.load_level}>
                    <td>{titleCase(item.load_level)}</td>
                    <td className="mono">{item.naive_config_label}</td>
                    <td className="mono">{ms(item.naive_p95_latency_ms)}</td>
                    <td className="mono">{item.recommended_config_label}</td>
                    <td className="mono">
                      {ms(item.recommended_p95_latency_ms)}
                    </td>
                    <td>{item.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2>p95 latency: naive vs recommended</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 16, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf1" />
                  <XAxis dataKey="load" />
                  <YAxis
                    label={{
                      value: "p95 latency (ms)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip formatter={(value) => `${value} ms`} />
                  <Legend />
                  <Bar dataKey="naive" name="Naive (unconstrained)" fill="#8fa3b5" />
                  <Bar dataKey="recommended" name="Recommended" fill="#0f7b8a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
