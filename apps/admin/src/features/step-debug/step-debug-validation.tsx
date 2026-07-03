"use client"

import { useMemo } from "react"

import { lessonStepDtoSchema } from "@workspace/contracts/content/steps"

type StepDebugValidationProps = {
  readonly sample: unknown
}

export function StepDebugValidation({ sample }: StepDebugValidationProps) {
  const result = useMemo(() => lessonStepDtoSchema.safeParse(sample), [sample])

  if (result.success) {
    return (
      <div
        className="rounded-lg border border-emerald-600/30 bg-emerald-950/30 px-4 py-3"
        role="status"
      >
        <span className="text-sm font-medium text-emerald-400">
          ✓ 유효한 데이터 — Zod 스키마 검증 통과
        </span>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border border-red-600/30 bg-red-950/30 px-4 py-3"
      role="alert"
    >
      <p className="mb-2 text-sm font-medium text-red-400">
        ✗ 스키마 검증 실패
      </p>
      <ul className="flex flex-col gap-1">
        {result.error.issues.map((issue, index) => (
          <li
            className="text-xs text-red-300/80"
            key={`${issue.path.join(".")}-${index}`}
          >
            {issue.path.join(".")} — {issue.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
