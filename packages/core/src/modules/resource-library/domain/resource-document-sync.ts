declare const resourceDocumentTransactionIdBrand: unique symbol

export type ResourceDocumentTransactionId = string & {
  readonly [resourceDocumentTransactionIdBrand]: true
}

export function toResourceDocumentTransactionId(
  value: string
): ResourceDocumentTransactionId {
  return value as ResourceDocumentTransactionId
}
