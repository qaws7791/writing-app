import type { UserId } from "../brand/index"

export interface UserSeedRepository {
  ensureDevUser(userId: UserId, nickname: string): Promise<void>
}
