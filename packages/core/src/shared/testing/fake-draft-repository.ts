import type { DraftId, UserId } from "../brand/index"
import type {
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftMutationResult,
  DraftPersistInput,
  DraftRepository,
  DraftSummary,
} from "../ports/index"

/**
 * In-memory fake draft repository for testing.
 * Stores drafts by userId and draftId.
 */
export class FakeDraftRepository implements DraftRepository {
  private storage = new Map<string, Map<number, DraftDetail>>()

  async create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail> {
    const userDrafts = this.storage.get(userId) ?? new Map()
    const draftId = (Math.max(...userDrafts.keys(), 0) + 1) as DraftId
    const now = new Date().toISOString()

    const draft: DraftDetail = {
      ...input,
      characterCount: input.characterCount,
      createdAt: now,
      id: draftId as unknown as number as DraftId,
      lastSavedAt: now,
      preview: input.plainText.slice(0, 100),
      updatedAt: now,
      wordCount: input.wordCount,
    }

    userDrafts.set(draftId, draft)
    this.storage.set(userId, userDrafts)
    return draft
  }

  async delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult> {
    const userDrafts = this.storage.get(userId)
    const draft = userDrafts?.get(draftId)

    if (!draft) {
      return { kind: "not-found" }
    }

    userDrafts!.delete(draftId)
    return { kind: "deleted" }
  }

  async getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult> {
    const draft = this.storage.get(userId)?.get(draftId)

    if (!draft) {
      return { kind: "not-found" }
    }

    return { kind: "draft", draft }
  }

  async list(userId: UserId, limit?: number): Promise<readonly DraftSummary[]> {
    const userDrafts = this.storage.get(userId) ?? new Map()
    const drafts = Array.from(userDrafts.values()) as DraftSummary[]
    return limit ? drafts.slice(0, limit) : drafts
  }

  async replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult> {
    const userDrafts = this.storage.get(userId)
    const existing = userDrafts?.get(draftId)

    if (!existing) {
      return { kind: "not-found" }
    }

    const updated: DraftDetail = {
      ...existing,
      ...input,
      id: draftId,
      updatedAt: new Date().toISOString(),
    }

    userDrafts!.set(draftId, updated)
    return { kind: "draft", draft: updated }
  }

  async resume(userId: UserId): Promise<DraftSummary | null> {
    const userDrafts = this.storage.get(userId) ?? new Map()
    const drafts = Array.from(userDrafts.values())
    return drafts.length > 0 ? drafts[0] : null
  }

  clear(): void {
    this.storage.clear()
  }
}
