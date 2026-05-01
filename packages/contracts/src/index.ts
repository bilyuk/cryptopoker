export const API_HEALTH_PATH = "/health" as const;

export type ApiHealthStatus = "ok";

export type ApiHealthResponse = {
  status: ApiHealthStatus;
};

export function createHealthResponse(status: ApiHealthStatus): ApiHealthResponse {
  return { status };
}
