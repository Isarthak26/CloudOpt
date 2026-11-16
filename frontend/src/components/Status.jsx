export function Loading({ label = "Loading…" }) {
  return (
    <div className="status loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ error }) {
  return (
    <div className="status error" role="alert">
      <span className="status-symbol" aria-hidden="true">!</span>
      <div>
        <strong>Data source unavailable</strong>
        <span>{error?.message || "Something went wrong talking to the backend."}</span>
      </div>
    </div>
  );
}
