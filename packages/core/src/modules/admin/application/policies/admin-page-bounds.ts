export type AdminPageInput = {
  readonly page: number
  readonly pageSize: number
}

export type AdminPageBounds = {
  readonly offset: number
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export function createAdminPageBounds(
  input: AdminPageInput,
  totalItems: number
): AdminPageBounds {
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)

  return {
    offset: (page - 1) * input.pageSize,
    page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
  }
}
