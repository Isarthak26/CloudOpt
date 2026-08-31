const PHASES = [
  { done: true, label: "Phase 0 — Repository and architecture groundwork" },
  { done: true, label: "Phase 1 — Measurable local application" },
  { done: true, label: "Phase 2 — Local metrics and observability" },
  { done: true, label: "Phase 3 — Controlled experiments and result capture" },
  { done: true, label: "Phase 4 — Dataset and simple recommendation" },
  { done: true, label: "Phase 5 — Baseline comparison" },
  { done: false, label: "Phase 6 — Azure and infrastructure as code (future work)" },
  { done: false, label: "Phase 7 — CI/CD and cloud validation (CI test automation only so far)" },
  { done: true, label: "Phase 8 — This dashboard and final evaluation" },
];

export default function Methodology() {
  return (
    <main className="page">
      <div className="page-header">
        <h1>Methodology</h1>
        <p>The short version of how the numbers in this dashboard were produced.</p>
      </div>

      <section className="card">
        <h2>What the project is</h2>
        <p>
          CloudOpt AI runs a small monitored FastAPI workload under controlled
          traffic, measures it at different CPU and memory limits, and uses those
          measurements to recommend the smallest configuration that still meets a
          latency and failure-rate requirement.
        </p>
        <p>
          The measurement stack is k6 for load generation and Prometheus and
          Grafana for observability. The dataset is nine frozen runs: three
          resource configurations across low, medium and high load.
        </p>
      </section>

      <section className="card">
        <h2>How a recommendation is made</h2>
        <p>
          Among the rows for the requested load level, the selector keeps those
          with <span className="mono">p95_latency_ms &lt;= 50</span> and{" "}
          <span className="mono">http_req_failed_rate &lt;= 0</span>, then picks
          the smallest <span className="mono">cpu_limit</span>, breaking ties on{" "}
          <span className="mono">memory_limit_mb</span>. Unconstrained runs count
          as the largest allocation.
        </p>
        <p>
          This is a transparent threshold rule, not a trained model. It does not
          forecast load and never extrapolates beyond configurations that were
          actually measured — which is also its main limitation.
        </p>
      </section>

      <section className="card">
        <h2>Roadmap</h2>
        <ul className="checklist">
          {PHASES.map((phase) => (
            <li key={phase.label}>
              <span className="mono">{phase.done ? "[x]" : "[ ]"}</span>{" "}
              {phase.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Honest summary</h2>
        <p>
          The project delivers a working, measured, explainable recommendation
          loop on a local stack. Phase 5 is a retrospective comparison over the
          frozen Phase 4 measurements rather than a fresh paired re-run, Phase 6
          (Azure and Terraform) is documented as future work rather than built,
          and this dashboard is a read-only presentation layer over the existing
          backend API — it duplicates none of the selector logic.
        </p>
      </section>
    </main>
  );
}
