import type { WritingId, UserId } from "../../shared/brand/index"
import type {
  WritingCreateInput,
  WritingUpdateInput,
  WritingDetail,
  WritingSummary,
  WritingAccessResult,
  WritingUpdateResult,
  WritingDeleteResult,
} from "./writing-types"

export interface WritingRepository {
  create(userId: UserId, input: WritingCreateInput): Promise<WritingDetail>
  getById(userId: UserId, writingId: WritingId): Promise<WritingAccessResult>
  list(
    userId: UserId,
    params?: { limit?: number; cursor?: string }
  ): Promise<{ items: WritingSummary[]; nextCursor: string | null }>
  update(
    userId: UserId,
    writingId: WritingId,
    input: WritingUpdateInput
  ): Promise<WritingUpdateResult>
  delete(userId: UserId, writingId: WritingId): Promise<WritingDeleteResult>
}
