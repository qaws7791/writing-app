import { z } from "zod"

export const promptTopics = [
  "감정",
  "경험",
  "관계",
  "기술",
  "기억",
  "문화",
  "사회",
  "상상",
  "성장",
  "여행",
  "일상",
  "자기이해",
  "진로",
] as const

export type PromptTopic = (typeof promptTopics)[number]

export type PromptLevel = 1 | 2 | 3

export type PromptLengthLabel = "깊이" | "보통" | "짧음"

export const promptTopicSchema = z.enum(promptTopics)
export const promptLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
])
export const promptLengthLabelSchema = z.enum(["깊이", "보통", "짧음"])
