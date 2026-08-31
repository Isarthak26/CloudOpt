export function Loading({ label = "Loading…" }) {
  return <div className="status">{label}</div>;
}

export function ErrorMessage({ error }) {
  return (
    <div className="status error">
      {error?.message || "Something went wrong talking to the backend."}
    </div>
  );
}
