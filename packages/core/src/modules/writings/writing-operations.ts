export function createPreview(
  plainText: string,
  maxLength: number = 120
): string {
  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength)}...`
    : plainText
}
