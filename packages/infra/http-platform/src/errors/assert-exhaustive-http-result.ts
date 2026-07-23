export function assertExhaustiveHttpResult(value: never): never {
  void value
  throw new Error("Unreachable HTTP result mapping")
}
