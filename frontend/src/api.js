import { API_BASE_URL } from "./config";

class ApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

const UNREACHABLE = `Could not reach the backend${
  API_BASE_URL ? ` at ${API_BASE_URL}` : ""
} — is it running on port 8000?`;

const GATEWAY_STATUSES = new Set([502, 503, 504]);

async function request(path) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch (error) {
    throw new ApiError(UNREACHABLE, { cause: error });
  }

  // A dev-proxy that cannot reach the backend answers with a gateway error
  // rather than failing the fetch outright.
  if (GATEWAY_STATUSES.has(response.status)) {
    throw new ApiError(UNREACHABLE, { status: response.status });
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = typeof body?.detail === "string" ? body.detail : "";
    } catch {
      detail = "";
    }
    throw new ApiError(
      detail || `Backend returned ${response.status} for ${path}`,
      { status: response.status },
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(`Backend returned invalid JSON for ${path}`, {
      cause: error,
    });
  }
}

export function getRecommendation(loadLevel) {
  return request(`/recommendations/${loadLevel}`);
}

export function getComparison() {
  return request("/recommendations/comparison");
}

export function getDataset() {
  return request("/experiments/dataset");
}

export function getHealth() {
  return request("/health");
}

export { ApiError };
