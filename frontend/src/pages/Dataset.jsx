import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDataset } from "../api";
import { ErrorMessage, Loading } from "../components/Status";
import { titleCase } from "../format";

const COLUMNS = [
  { key: "config_label", label: "Configuration", mono: true },
  { key: "cpu_limit", label: "CPU", mono: true },
  { key: "memory_limit_mb", label: "Memory", mono: true, suffix: " MB" },
  { key: "load_level", label: "Load" },
  { key: "vus", label: "VUs", mono: true },
  { key: "total_requests", label: "Requests", mono: true },
  { key: "avg_latency_ms", label: "Avg latency", mono: true, digits: 2, suffix: " ms" },
  { key: "p95_latency_ms", label: "p95 latency", mono: true, digits: 2, suffix: " ms" },
  { key: "http_req_failed_rate", label: "Failures", mono: true, percent: true },
];

const LOAD_ORDER = ["low", "medium", "high"];
const LINE_COLORS = ["#244f7c", "#3e8f7c", "#d67a4e"];

function compareValues(a, b) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function formatCell(row, column) {
  const value = row[column.key];
  if (value === null || value === undefined) return "Unconstrained";
  if (column.percent) return `${(Number(value) * 100).toFixed(2)}%`;
  if (column.digits !== undefined) {
    return `${Number(value).toFixed(column.digits)}${column.suffix ?? ""}`;
  }
  return `${value}${column.suffix ?? ""}`;
}

export default function Dataset() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState({ key: "load_level", direction: "asc" });
  const [loadFilter, setLoadFilter] = useState("all");
  const [configFilter, setConfigFilter] = useState("all");

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

  const configs = useMemo(
    () => [...new Set(rows.map((row) => row.config_label))],
    [rows],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (loadFilter === "all" || row.load_level === loadFilter) &&
          (configFilter === "all" || row.config_label === configFilter),
      ),
    [rows, loadFilter, configFilter],
  );

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const result = compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? result : -result;
    });
    return copy;
  }, [filteredRows, sort]);

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

  function ariaSort(key) {
    if (sort.key !== key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  return (
    <main className="page">
      <div className="page-header split-header">
        <div>
          <span className="eyebrow">Evidence explorer</span>
          <h1>Experiment dataset</h1>
          <p>
            Inspect the canonical measurements behind every recommendation. Filter
            and sort the nine controlled runs without changing the source data.
          </p>
        </div>
        <div className="rule-summary">
          <span>Dataset scope</span>
          <strong>{rows.length || 9} runs · 3 loads · 3 profiles</strong>
        </div>
      </div>

      {loading && <Loading label="Loading the experiment dataset…" />}
      {!loading && error && <ErrorMessage error={error} />}

      {!loading && !error && rows.length > 0 && (
        <>
          <section className="card table-card">
            <div className="card-heading dataset-heading">
              <div>
                <span className="card-kicker">Canonical measurements</span>
                <h2>Controlled experiment runs</h2>
              </div>
              <span className="record-count">Showing {sortedRows.length} of {rows.length}</span>
            </div>

            <div className="filter-bar">
              <label>
                <span>Traffic load</span>
                <select value={loadFilter} onChange={(event) => setLoadFilter(event.target.value)}>
                  <option value="all">All load levels</option>
                  {LOAD_ORDER.map((level) => (
                    <option key={level} value={level}>{titleCase(level)} load</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Resource profile</span>
                <select value={configFilter} onChange={(event) => setConfigFilter(event.target.value)}>
                  <option value="all">All configurations</option>
                  {configs.map((config) => (
                    <option key={config} value={config}>{config}</option>
                  ))}
                </select>
              </label>
              {(loadFilter !== "all" || configFilter !== "all") && (
                <button
                  className="clear-filter"
                  type="button"
                  onClick={() => {
                    setLoadFilter("all");
                    setConfigFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {COLUMNS.map((column) => (
                      <th key={column.key} aria-sort={ariaSort(column.key)}>
                        <button className="sort-button" type="button" onClick={() => toggleSort(column.key)}>
                          {column.label}
                          <span aria-hidden="true">
                            {sort.key === column.key
                              ? sort.direction === "asc" ? "↑" : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => {
                    const passes = row.p95_latency_ms <= 50 && row.http_req_failed_rate <= 0;
                    return (
                      <tr key={`${row.config_label}-${row.load_level}`} className={passes ? "" : "threshold-row"}>
                        {COLUMNS.map((column) => (
                          <td key={column.key} className={column.mono ? "mono" : undefined}>
                            {column.key === "load_level" ? titleCase(row[column.key]) : formatCell(row, column)}
                          </td>
                        ))}
                        <td><span className={`pill ${passes ? "success" : "danger"}`}>{passes ? "Pass" : "Over SLO"}</span></td>
                      </tr>
                    );
                  })}
                  {sortedRows.length === 0 && (
                    <tr><td colSpan={COLUMNS.length + 1} className="empty-table">No runs match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="caption">
              Only the re-measured runs listed in <span className="mono">ml/canonical_runs.json</span>
              are included. A warm-up stage prevents cold-start requests from distorting the percentiles.
            </p>
          </section>

          <section className="card chart-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Performance curve</span>
                <h2>p95 latency across traffic levels</h2>
              </div>
              <span className="legend-note">50 ms acceptance boundary</span>
            </div>
            <div className="chart-container large">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#dce4ef" />
                  <XAxis dataKey="load" axisLine={false} tickLine={false} tick={{ fill: "#69788d", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#69788d", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #dce4ef", boxShadow: "0 12px 30px rgba(15, 35, 65, .12)" }}
                    formatter={(value) => `${value} ms`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <ReferenceLine y={50} stroke="#d86d51" strokeDasharray="5 5" label={{ value: "SLO", fill: "#a94f3b", fontSize: 11, position: "insideTopRight" }} />
                  {configs.map((config, index) => (
                    <Line
                      key={config}
                      type="monotone"
                      dataKey={config}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-insight">
              <span className="insight-mark">!</span>
              <p>
                The 0.25 CPU / 128 MB profile remains stable at low and medium load,
                then reaches <strong>275.87 ms p95</strong> under high traffic—well beyond the SLO.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
