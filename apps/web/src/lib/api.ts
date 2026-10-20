export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export function getHealthUrl(): string {
  return `${getApiBaseUrl()}/api/v1/health`;
}
