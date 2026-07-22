export type TransportError =
  | Readonly<{
      kind: "contract-invalid"
      status: number | null
    }>
  | Readonly<{
      code: string
      kind: "http-failed"
      status: number
    }>
  | Readonly<{
      kind: "network-failed"
      method: string
      reason: "aborted" | "failed"
      url: string
    }>
