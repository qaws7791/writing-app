import assert from "node:assert/strict"

import { RuleTester } from "oxlint/plugins-dev"

import {
  catchPreservesCauseRule,
  noDtoDomainAliasRule,
  noUnsafeUnknownCastRule,
} from "./workspace-rules.mjs"

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: "ts" },
    sourceType: "module",
  },
})

tester.run("no-unsafe-unknown-cast", noUnsafeUnknownCastRule, {
  invalid: [
    {
      code: "const userId = value as unknown as UserId",
      errors: [{ messageId: "unsafeUnknownCast" }],
    },
  ],
  valid: [
    {
      code: "const userId = toUserId(value)",
    },
  ],
})

tester.run("no-dto-domain-alias", noDtoDomainAliasRule, {
  invalid: [
    {
      code: 'import type { LearnerLessonDto as Lesson } from "@/shared/http/learner-api-client"',
      errors: [{ messageId: "dtoDomainAlias" }],
    },
  ],
  valid: [
    {
      code: 'import type { Lesson } from "@/features/lesson-session/model/lesson-view-model"',
    },
    {
      code: 'import type { LearnerLessonDto } from "@/shared/http/learner-api-client"',
    },
  ],
})

assert.ok(true)

tester.run("catch-preserves-cause", catchPreservesCauseRule, {
  invalid: [
    {
      code: "try { save() } catch { return err({ kind: 'save-failed' }) }",
      errors: [{ messageId: "missingCause" }],
    },
    {
      code: "try { save() } catch (cause) { return err({ kind: 'save-failed' }) }",
      errors: [{ messageId: "missingCause" }],
    },
  ],
  valid: [
    {
      code: "try { save() } catch (cause) { return err({ cause, kind: 'save-failed' }) }",
    },
    {
      code: "try { save() } catch (error) { if (error instanceof Abort) return err(error.failure); throw error }",
    },
    {
      code: "return err({ kind: 'conflict' })",
    },
  ],
})
