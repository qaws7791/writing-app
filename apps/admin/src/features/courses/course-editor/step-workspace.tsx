"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

import {
  formatPointLabel,
  getNodeStatusLabel,
  getStepDisplayTitle,
} from "@/features/courses/course-editor/editor-labels"
import type { CourseEditorStep } from "@/features/courses/course-editor/editor-state"
import { STEP_FORM_BY_TYPE } from "@/features/courses/course-editor/step-form-registry"

type StepWorkspaceProps = {
  isReadOnly?: boolean
  lessonSteps: CourseEditorStep[]
  onBack?: () => void
  onUpdateStepContent?: (stepId: string, key: string, value: unknown) => void
  step: CourseEditorStep
}

export function StepWorkspace({
  isReadOnly = false,
  lessonSteps,
  onBack,
  onUpdateStepContent,
  step,
}: StepWorkspaceProps) {
  const StepForm = STEP_FORM_BY_TYPE[step.type]
  const stepTitle = getStepDisplayTitle(step)

  return (
    <div className="space-y-6">
      <header className="space-y-3 border-b pb-4">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            레슨으로 돌아가기
          </Button>
        )}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {getNodeStatusLabel(step.status)} · {formatPointLabel(step.points)}{" "}
            · {step.required ? "필수 스텝" : "선택 스텝"}
          </p>
          <h1 className="text-2xl font-semibold">{stepTitle}</h1>
        </div>
      </header>
      <StepForm
        isReadOnly={isReadOnly}
        lessonSteps={lessonSteps}
        onUpdateContent={(key, value) =>
          onUpdateStepContent?.(step.id, key, value)
        }
        step={step}
      />
    </div>
  )
}
