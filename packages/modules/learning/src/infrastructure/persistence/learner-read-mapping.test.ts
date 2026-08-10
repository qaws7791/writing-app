import { describe, expect, it } from "vitest"

import {
  learnerStepPresentationCases,
  learnerStepPresentationContext,
  learnerStepPresentationFutureSecret,
} from "#learning/test/fixtures/lesson-step-presentation-cases"

import { presentLearnerStep } from "#learning/infrastructure/persistence/learner-read-mapping"

describe("학습자 step 공개 presenter", () => {
  it.each(learnerStepPresentationCases)(
    "$name 공개 허용 필드만 투영하고 nested future secret을 노출하지 않는다",
    ({ expected, step }) => {
      const stepWithNestedFutureSecret = Object.assign(
        withFutureSecretOnEveryObject(step),
        {
          futureMetadata: {
            secret: learnerStepPresentationFutureSecret,
          },
        }
      )

      const presented = presentLearnerStep(
        stepWithNestedFutureSecret,
        learnerStepPresentationContext
      )

      expect({
        leakedFutureSecret: JSON.stringify(presented).includes(
          learnerStepPresentationFutureSecret
        ),
        presentation: withItemsSortedById(presented),
      }).toEqual({
        leakedFutureSecret: false,
        presentation: withItemsSortedById(expected),
      })
    }
  )
})

function withItemsSortedById(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(withItemsSortedById)
    return items.every(hasStableId)
      ? [...items].sort((left, right) => left.id.localeCompare(right.id))
      : items
  }
  if (typeof value !== "object" || value === null) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      withItemsSortedById(child),
    ])
  )
}

function hasStableId(value: unknown): value is { readonly id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { readonly id: unknown }).id === "string"
  )
}

function withFutureSecretOnEveryObject<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(withFutureSecretOnEveryObject) as T
  }
  if (!isRecord(value)) return value

  return Object.fromEntries([
    ...Object.entries(value).map(([key, child]) => [
      key,
      withFutureSecretOnEveryObject(child),
    ]),
    ["futureSecret", learnerStepPresentationFutureSecret],
  ]) as T
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null
}
