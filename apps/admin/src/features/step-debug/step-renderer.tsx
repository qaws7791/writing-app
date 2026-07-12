"use client"

import {
  LessonStepRenderer as SharedLessonStepRenderer,
  type LessonStepRendererProps,
} from "@workspace/ui/lesson-runtime/renderer"

const adminPreviewDraftNamespace = "admin-step-debug"

export function LessonStepRenderer(
  props: Omit<LessonStepRendererProps, "draftNamespace">
) {
  return (
    <SharedLessonStepRenderer
      draftNamespace={adminPreviewDraftNamespace}
      {...props}
    />
  )
}
