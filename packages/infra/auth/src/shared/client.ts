export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export function buildAuthApiUrl(baseURL: string, path: string): string {
  return new URL(
    path.replace(/^\/+/, ""),
    `${baseURL.replace(/\/+$/, "")}/`
  ).toString()
}
