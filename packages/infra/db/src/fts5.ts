export function createFts5Phrase(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}
