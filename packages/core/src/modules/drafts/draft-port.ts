import type { DraftId, UserId } from "../../shared/brand/index"
import type {
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftMutationResult,
  DraftPersistInput,
  DraftSummary,
} from "./draft-types"

export interface DraftRepository {
  create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail>
  delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult>
  getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult>
  list(userId: UserId, limit?: number): Promise<readonly DraftSummary[]>
  replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult>
  resume(userId: UserId): Promise<DraftSummary | null>
}
