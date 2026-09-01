import { describe, expect, it } from "vitest"

import type { LessonStepId } from "@workspace/contracts/content/ids"
import {
  getLessonStepActionLabel,
  getLessonStepPendingLabel,
  getLessonStepSubmissionMode,
  isLessonStepSubmittable,
} from "@/features/lesson-session/model/lesson-step-policy"
import type { LessonStep } from "@/features/lesson-session/model/lesson-view-model"

describe("lesson-step-policy", () => {
  describe("getLessonStepSubmissionMode", () => {
    it("단일 값 선택형(MULTIPLE_CHOICE, TRUE_FALSE)은 instant 모드를 반환한다", () => {
      const mcStep = {
        correct: "opt-1",
        explanation: "설명",
        id: "step-mc" as LessonStepId,
        options: [
          { id: "opt-1", text: "보기 1" },
          { id: "opt-2", text: "보기 2" },
        ],
        question: "질문",
        sortOrder: 1,
        type: "MULTIPLE_CHOICE",
      } satisfies LessonStep

      const tfStep = {
        correct: true,
        explanation: "설명",
        id: "step-tf" as LessonStepId,
        question: "질문",
        sortOrder: 1,
        statement: "진술",
        type: "TRUE_FALSE",
      } satisfies LessonStep

      expect(getLessonStepSubmissionMode(mcStep)).toBe("instant")
      expect(getLessonStepSubmissionMode(tfStep)).toBe("instant")
    })

    it("조립/정렬/분류/다중선택 및 비평가형 스텝은 manual 모드를 반환한다", () => {
      const readingStep = {
        body: "본문",
        id: "step-rd" as LessonStepId,
        sortOrder: 1,
        title: "제목",
        type: "READING",
      } satisfies LessonStep

      const compareStep = {
        id: "step-cp" as LessonStepId,
        sortOrder: 1,
        title: "제목",
        type: "COMPARE",
        versions: [{ label: "A", text: "본문 A" }],
      } satisfies LessonStep

      const selectStep = {
        correct: ["seg-1"],
        explanation: "설명",
        id: "step-sl" as LessonStepId,
        items: [{ id: "seg-1", text: "단어 1" }],
        question: "질문",
        sortOrder: 1,
        type: "SELECT",
      } satisfies LessonStep

      const fillBlankStep = {
        answer: ["c-1"],
        blankCount: 1,
        choices: [{ id: "c-1", text: "보기 1" }],
        explanation: "설명",
        id: "step-fb" as LessonStepId,
        sortOrder: 1,
        template: "___",
        type: "FILL_BLANK",
      } satisfies LessonStep

      const matchStep = {
        explanation: "설명",
        id: "step-mt" as LessonStepId,
        leftItems: [{ id: "l-1", text: "L1" }],
        pairs: [{ leftId: "l-1", rightId: "r-1" }],
        rightItems: [{ id: "r-1", text: "R1" }],
        sortOrder: 1,
        title: "제목",
        type: "MATCH",
      } satisfies LessonStep

      const categorizeStep = {
        categories: [{ id: "cat-1", text: "분류 1" }],
        explanation: "설명",
        id: "step-cg" as LessonStepId,
        items: [{ categoryId: "cat-1", id: "item-1", text: "항목 1" }],
        sortOrder: 1,
        title: "제목",
        type: "CATEGORIZE",
      } satisfies LessonStep

      const orderStep = {
        correct: ["item-1"],
        explanation: "설명",
        id: "step-or" as LessonStepId,
        items: [{ id: "item-1", text: "항목 1" }],
        sortOrder: 1,
        title: "제목",
        type: "ORDER",
      } satisfies LessonStep

      const sentenceBuildStep = {
        correct: ["t-1"],
        explanation: "설명",
        id: "step-sb" as LessonStepId,
        question: "질문",
        sortOrder: 1,
        tileCount: 1,
        tiles: [{ id: "t-1", text: "어절 1" }],
        type: "SENTENCE_BUILD",
      } satisfies LessonStep

      const errorCorrectStep = {
        correctFix: "fix-1",
        correctSegment: "seg-1",
        explanation: "설명",
        fixes: [{ id: "fix-1", text: "수정 1" }],
        id: "step-ec" as LessonStepId,
        question: "질문",
        segments: [{ id: "seg-1", text: "구간 1" }],
        sortOrder: 1,
        type: "ERROR_CORRECT",
      } satisfies LessonStep

      expect(getLessonStepSubmissionMode(readingStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(compareStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(selectStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(fillBlankStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(matchStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(categorizeStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(orderStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(sentenceBuildStep)).toBe("manual")
      expect(getLessonStepSubmissionMode(errorCorrectStep)).toBe("manual")
    })
  })

  describe("isLessonStepSubmittable", () => {
    it("MULTIPLE_CHOICE는 옵션이 선택되면 submittable하다", () => {
      const step: LessonStep = {
        correct: "opt-1",
        explanation: "설명",
        id: "step-mc" as LessonStepId,
        options: [{ id: "opt-1", text: "보기 1" }],
        question: "질문",
        sortOrder: 1,
        type: "MULTIPLE_CHOICE",
      }

      expect(isLessonStepSubmittable(step, undefined)).toBe(false)
      expect(
        isLessonStepSubmittable(step, {
          selectedOptionId: null,
          type: "MULTIPLE_CHOICE",
        })
      ).toBe(false)
      expect(
        isLessonStepSubmittable(step, {
          selectedOptionId: "opt-1",
          type: "MULTIPLE_CHOICE",
        })
      ).toBe(true)
    })

    it("TRUE_FALSE는 불리언 값이 선택되면 submittable하다", () => {
      const step: LessonStep = {
        correct: true,
        explanation: "설명",
        id: "step-tf" as LessonStepId,
        question: "질문",
        sortOrder: 1,
        statement: "진술",
        type: "TRUE_FALSE",
      }

      expect(isLessonStepSubmittable(step, undefined)).toBe(false)
      expect(
        isLessonStepSubmittable(step, {
          selectedAnswer: null,
          type: "TRUE_FALSE",
        })
      ).toBe(false)
      expect(
        isLessonStepSubmittable(step, {
          selectedAnswer: false,
          type: "TRUE_FALSE",
        })
      ).toBe(true)
    })
  })

  describe("getLessonStepActionLabel & getLessonStepPendingLabel", () => {
    it("READING/COMPARE는 이해했어요를 반환하고 나머지는 확인하기를 반환한다", () => {
      const readingStep = {
        body: "본문",
        id: "step-rd" as LessonStepId,
        sortOrder: 1,
        title: "제목",
        type: "READING",
      } satisfies LessonStep

      const mcStep = {
        correct: "opt-1",
        explanation: "설명",
        id: "step-mc" as LessonStepId,
        options: [{ id: "opt-1", text: "보기 1" }],
        question: "질문",
        sortOrder: 1,
        type: "MULTIPLE_CHOICE",
      } satisfies LessonStep

      expect(getLessonStepActionLabel(readingStep)).toBe("이해했어요")
      expect(getLessonStepPendingLabel(readingStep)).toBe("계속하는 중…")
      expect(getLessonStepActionLabel(mcStep)).toBe("확인하기")
      expect(getLessonStepPendingLabel(mcStep)).toBe("확인하는 중…")
    })
  })
})
