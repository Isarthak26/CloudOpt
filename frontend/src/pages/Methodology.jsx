const PHASES = [
  { done: true, label: "Foundation", detail: "Repository, API and measurable target workload" },
  { done: true, label: "Observability", detail: "Prometheus metrics and Grafana dashboard" },
  { done: true, label: "Experiments", detail: "Repeatable k6 profiles and canonical result capture" },
  { done: true, label: "Decision engine", detail: "Explainable threshold selector and baseline comparison" },
  { done: false, label: "Cloud validation", detail: "Azure infrastructure, deployment and paired re-runs" },
  { done: false, label: "Delivery automation", detail: "CI/CD image build, security gates and controlled release" },
];

const NEXT_STEPS = [
  {
    priority: "01",
    title: "Repeat experiments",
    description: "Run every workload/configuration pair multiple times and report variance, confidence intervals and outliers.",
    tag: "Evidence quality",
  },
  {
    priority: "02",
    title: "Add live Prometheus views",
    description: "Expose safe query endpoints for request rate, CPU, memory and latency so this dashboard can show current behavior.",
    tag: "Product value",
  },
  {
    priority: "03",
    title: "Model real cost",
    description: "Attach an explicit hourly cost or normalized resource score to each profile and quantify the trade-off against latency.",
    tag: "FinOps",
  },
  {
    priority: "04",
    title: "Validate on Azure",
    description: "Provision ACR and AKS with Terraform, deploy the target app, then rerun baseline and recommended profiles in the same environment.",
    tag: "Cloud delivery",
  },
];

export default function Methodology() {
  return (
    <main className="page">
      <div className="page-header split-header">
        <div>
          <span className="eyebrow">Method & roadmap</span>
          <h1>How the evidence is produced</h1>
          <p>
            CloudOpt is deliberately small and auditable: measured inputs, explicit
            thresholds, and recommendations limited to configurations that were tested.
          </p>
        </div>
        <div className="rule-summary">
          <span>Current maturity</span>
          <strong>Local proof of concept</strong>
        </div>
      </div>

      <section className="method-flow" aria-label="Recommendation process">
        <article>
          <span>1</span>
          <div><strong>Generate traffic</strong><p>k6 executes low, medium and high workload profiles.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>2</span>
          <div><strong>Capture evidence</strong><p>Latency, throughput and failures are saved per allocation.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>3</span>
          <div><strong>Apply guardrails</strong><p>Profiles must keep p95 ≤ 50 ms with zero failures.</p></div>
        </article>
        <i aria-hidden="true">→</i>
        <article>
          <span>4</span>
          <div><strong>Choose smallest</strong><p>The least CPU, then memory, wins among qualified runs.</p></div>
        </article>
      </section>

      <div className="method-grid">
        <section className="card methodology-card">
          <span className="card-kicker">Decision rule</span>
          <h2>Transparent by design</h2>
          <p>
            For the selected load level, CloudOpt keeps rows where
            <span className="inline-code">p95_latency_ms ≤ 50</span> and
            <span className="inline-code">http_req_failed_rate = 0</span>.
            It then sorts eligible rows by CPU limit and memory limit.
          </p>
          <div className="formula-box mono">
            qualified → min(cpu_limit, memory_limit_mb)
          </div>
          <p className="caption">
            Unconstrained runs are treated as the largest allocation. The selector
            does not forecast unseen traffic or invent an untested resource profile.
          </p>
        </section>

        <section className="card limitations-card">
          <span className="card-kicker">Interpretation boundary</span>
          <h2>What the result does not claim</h2>
          <ul>
            <li>It is not a trained machine-learning model.</li>
            <li>It does not prove production or multi-application generalization.</li>
            <li>It does not yet include cloud billing or energy measurements.</li>
            <li>The comparison is retrospective, not a fresh paired deployment.</li>
          </ul>
        </section>
      </div>

      <section className="card roadmap-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Delivery progress</span>
            <h2>Project roadmap</h2>
          </div>
          <span className="section-note">4 of 6 stages complete</span>
        </div>
        <div className="roadmap-list">
          {PHASES.map((phase) => (
            <article className={phase.done ? "complete" : "future"} key={phase.label}>
              <span className="roadmap-marker">{phase.done ? "✓" : ""}</span>
              <div><strong>{phase.label}</strong><p>{phase.detail}</p></div>
              <span className={`pill ${phase.done ? "success" : "neutral"}`}>
                {phase.done ? "Complete" : "Next"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block next-section" aria-labelledby="next-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Recommended next work</span>
            <h2 id="next-heading">Four changes that strengthen the project most</h2>
          </div>
          <span className="section-note">Ordered by research and demo value</span>
        </div>
        <div className="next-grid">
          {NEXT_STEPS.map((step) => (
            <article key={step.priority}>
              <div className="next-card-topline"><span>{step.priority}</span><b>{step.tag}</b></div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
