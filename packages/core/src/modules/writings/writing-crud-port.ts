import type { WritingId, UserId } from "../../shared/brand/index"
import type {
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingSummary,
} from "./writing-types"

export interface WritingRepository {
  create(userId: UserId, input: WritingPersistInput): Promise<WritingDetail>
  delete(userId: UserId, writingId: WritingId): Promise<WritingDeleteResult>
  getById(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingCrudAccessResult>
  list(userId: UserId, limit?: number): Promise<readonly WritingSummary[]>
  replace(
    userId: UserId,
    writingId: WritingId,
    input: WritingPersistInput
  ): Promise<WritingMutationResult>
  resume(userId: UserId): Promise<WritingSummary | null>
}
