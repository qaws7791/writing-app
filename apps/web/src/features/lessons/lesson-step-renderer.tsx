"use client"

import {
  LessonStepRenderer as SharedLessonStepRenderer,
  type LessonStepRendererProps as SharedLessonStepRendererProps,
} from "@workspace/ui/lesson-runtime/renderer"

export type LessonStepRendererProps = Omit<
  SharedLessonStepRendererProps,
  "draftNamespace"
> & {
  readonly learnerId: string
}

export function LessonStepRenderer({
  learnerId,
  ...props
}: LessonStepRendererProps) {
  return <SharedLessonStepRenderer draftNamespace={learnerId} {...props} />
}
