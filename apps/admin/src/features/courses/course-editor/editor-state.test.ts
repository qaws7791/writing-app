import { describe, expect, it } from "vitest"

import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  getDirtyState,
  moveItem,
} from "@/features/courses/course-editor/editor-state"
import { parseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

describe("course editor state", () => {
  it("parses step view from search params", () => {
    expect(
      parseEditorUrlState(
        new URLSearchParams(
          "version=v2&view=step&lessonId=lesson-1&stepId=step-1"
        )
      )
    ).toEqual({
      versionId: "v2",
      view: "step",
      lessonId: "lesson-1",
      stepId: "step-1",
    })
  })

  it("falls back to lesson view for invalid search params", () => {
    expect(parseEditorUrlState(new URLSearchParams("view=unknown"))).toEqual({
      versionId: null,
      view: "lesson",
      lessonId: null,
      stepId: null,
    })
  })

  it("classifies lesson reorder as structural", () => {
    expect(
      getEditorChangeKind({
        courseChanged: false,
        addedStepCount: 0,
        reorderedLessonCount: 1,
        archivedLessonCount: 0,
        archivedChapterCount: 0,
      })
    ).toBe("structural")
  })

  it("moves an item without mutating the original list", () => {
    const items = ["intro", "practice", "summary"]

    expect(moveItem(items, 0, 2)).toEqual(["practice", "summary", "intro"])
    expect(items).toEqual(["intro", "practice", "summary"])
  })

  it("returns dirty state from changed fields", () => {
    expect(getDirtyState(["course.title"])).toEqual({
      hasChanges: true,
      changedFields: ["course.title"],
    })
  })
})
