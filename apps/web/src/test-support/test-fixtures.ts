import type {
  WritingContent,
  WritingDetail,
  WritingSummary,
  HomeSnapshot,
} from "@/domain/writing"
import type { PromptDetail, PromptSummary } from "@/domain/prompt"

export function createWritingContent(text = "기본 본문"): WritingContent {
  return {
    content: [
      {
        content: [{ text, type: "text" }],
        type: "paragraph",
      },
    ],
    type: "doc",
  }
}

export function createPromptSummary(
  overrides: Partial<PromptSummary> = {}
): PromptSummary {
  return {
    id: 1,
    level: 1,
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["시작"],
    text: "기본 글감",
    topic: "일상",
    ...overrides,
  }
}

export function createPromptDetail(
  overrides: Partial<PromptDetail> = {}
): PromptDetail {
  return {
    ...createPromptSummary(),
    description: "글감 설명",
    outline: ["도입", "본론", "정리"],
    tips: ["장면부터 시작하세요."],
    ...overrides,
  }
}

export function createWritingSummary(
  overrides: Partial<WritingSummary> = {}
): WritingSummary {
  return {
    characterCount: 12,
    id: 1,
    lastSavedAt: "2026-03-20T10:00:00.000Z",
    preview: "기본 미리보기",
    sourcePromptId: null,
    title: "기본 글",
    wordCount: 3,
    ...overrides,
  }
}

export function createWritingDetail(
  overrides: Partial<WritingDetail> = {}
): WritingDetail {
  return {
    ...createWritingSummary(),
    content: createWritingContent(),
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    ...overrides,
  }
}

export function createHomeSnapshot(
  overrides: Partial<HomeSnapshot> = {}
): HomeSnapshot {
  const resumeWriting = createWritingSummary({
    id: 11,
    preview: "이어서 쓰는 글",
    title: "이어서 쓰기",
  })

  return {
    recentWritings: [resumeWriting],
    resumeWriting,
    savedPrompts: [
      createPromptSummary({ id: 21, saved: true, text: "저장 글감" }),
    ],
    todayPrompts: [
      createPromptSummary({ id: 31, text: "오늘의 글감 1" }),
      createPromptSummary({ id: 32, text: "오늘의 글감 2", topic: "기술" }),
    ],
    ...overrides,
  }
}
