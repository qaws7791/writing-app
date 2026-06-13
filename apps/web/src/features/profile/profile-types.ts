export type LearnerProfile = {
  readonly stats: {
    readonly completedLessons: number
    readonly currentStreakDays: number
    readonly lastActiveDate: string | null
    readonly progressPercent: number
    readonly totalLessons: number
  }
  readonly user: {
    readonly email: string
    readonly id: string
    readonly image: string | null
    readonly joinedAt: string
    readonly name: string
    readonly status: "active" | "deleted" | "suspended"
  }
}
