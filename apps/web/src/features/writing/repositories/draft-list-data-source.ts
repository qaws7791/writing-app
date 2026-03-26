import type { DraftDetail, DraftSummary } from "@/domain/draft"
import {
  createAppRepository,
  type CreateDraftInput,
} from "@/features/writing/repositories/app-repository"

export type DraftListDataSource = {
  createDraft: (input: CreateDraftInput) => Promise<DraftDetail>
  listDrafts: () => Promise<DraftSummary[]>
}

export function createDraftListDataSource(): DraftListDataSource {
  const repository = createAppRepository()
  return {
    createDraft: (input) => repository.createDraft(input),
    listDrafts: () => repository.listDrafts(),
  }
}
