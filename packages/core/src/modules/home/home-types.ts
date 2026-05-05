export type HomeStartAction = {
  readonly id: "photo" | "garden" | "manual"
  readonly title: string
  readonly description: string
  readonly href: string
}

export type RecentWorkSummary = {
  readonly sceneId: string
  readonly title: string
  readonly updatedAt: string
}

export type GardenSummary = {
  readonly cardCount: number
  readonly sentenceCount: number
}

export type HomeSnapshot = {
  readonly startActions: HomeStartAction[]
  readonly recentWork: RecentWorkSummary | null
  readonly garden: GardenSummary
}
