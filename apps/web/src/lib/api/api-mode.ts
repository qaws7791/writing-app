export function isFakeApiMode(value: string | undefined): boolean {
  return (value ?? "fake") === "fake"
}

export function isServerFakeApiMode(): boolean {
  return isFakeApiMode(process.env["WEB_API_MODE"])
}

export function isBrowserFakeApiMode(): boolean {
  return isFakeApiMode(process.env["NEXT_PUBLIC_API_MODE"])
}
