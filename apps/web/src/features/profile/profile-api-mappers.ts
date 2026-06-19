import type { ApiProfileResponse } from "@/lib/api/writing-app-api-contract"
import type { LearnerProfile } from "@/features/profile/profile-types"

export function mapProfile(response: ApiProfileResponse): LearnerProfile {
  return {
    stats: {
      completedLessons: response.stats.completedLessons,
      currentStreakDays: response.stats.currentStreakDays,
      lastActiveDate: response.stats.lastActiveDate,
      progressPercent: response.stats.progressPercent,
      totalLessons: response.stats.totalLessons,
    },
    user: {
      email: response.user.email,
      id: response.user.id,
      image: response.user.image,
      joinedAt: response.user.joinedAt,
      name: response.user.name,
      status: response.user.status,
    },
  }
}
