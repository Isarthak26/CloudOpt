import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDataset } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { titleCase } from "../format";

const COLUMNS = [
  { key: "config_label", label: "Config", mono: true },
  { key: "cpu_limit", label: "CPU limit", mono: true },
  { key: "memory_limit_mb", label: "Memory (MB)", mono: true },
  { key: "load_level", label: "Load level" },
  { key: "vus", label: "VUs", mono: true },
  { key: "total_requests", label: "Requests", mono: true },
  { key: "avg_latency_ms", label: "Avg latency (ms)", mono: true, digits: 2 },
  { key: "p95_latency_ms", label: "p95 latency (ms)", mono: true, digits: 2 },
  { key: "http_req_failed_rate", label: "Fail rate", mono: true, digits: 2 },
];

const LOAD_ORDER = ["low", "medium", "high"];
const LINE_COLORS = ["#0f7b8a", "#8fa3b5", "#a3352c"];

function compareValues(a, b) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function formatCell(row, column) {
  const value = row[column.key];
  if (value === null || value === undefined) return "—";
  if (column.digits !== undefined) return Number(value).toFixed(column.digits);
  return String(value);
}

export default function Dataset() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: "load_level", direction: "asc" });

  useEffect(() => {
    let active = true;
    getDataset()
      .then((data) => {
        if (active) setRows(data.rows ?? []);
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

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const result = compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sort]);

  const configs = useMemo(
    () => [...new Set(rows.map((row) => row.config_label))],
    [rows],
  );

  const chartData = useMemo(
    () =>
      LOAD_ORDER.filter((level) =>
        rows.some((row) => row.load_level === level),
      ).map((level) => {
        const point = { load: titleCase(level) };
        for (const config of configs) {
          const match = rows.find(
            (row) => row.load_level === level && row.config_label === config,
          );
          if (match) point[config] = Number(match.p95_latency_ms.toFixed(2));
        }
        return point;
      }),
    [rows, configs],
  );

  function toggleSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Experiment Data Explorer</h1>
        <p>
          The frozen nine-row dataset every recommendation is derived from,
          served straight from <span className="mono">/experiments/dataset</span>.
        </p>
      </div>

      {loading && <Loading label="Loading the experiment dataset…" />}
      {!loading && error && <ErrorMessage error={error} />}

      {!loading && !error && rows.length > 0 && (
        <>
          <section className="card">
            <h2>All measured runs ({rows.length})</h2>
            <table>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="sortable"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      {sort.key === column.key
                        ? sort.direction === "asc"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={`${row.config_label}-${row.load_level}`}>
                    {COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        className={column.mono ? "mono" : undefined}
                      >
                        {formatCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="caption">
              Each row is one k6 run against the target app at a fixed CPU/memory
              limit. An early cold-start bug made the first requests of a run
              dominate the percentiles, so a warmup stage was added and the
              affected runs were re-measured; only the re-measured runs listed in{" "}
              <span className="mono">ml/canonical_runs.json</span> are included
              here.
            </p>
          </section>

          <section className="card">
            <h2>p95 latency across load levels</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 16, right: 24 }}>
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
                  {configs.map((config, index) => (
                    <Line
                      key={config}
                      type="monotone"
                      dataKey={config}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="caption">
              Lines stay flat until high load, where the smallest configuration
              falls off a cliff — that gap is the whole argument for measuring
              rather than guessing.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
