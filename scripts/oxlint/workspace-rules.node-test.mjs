// RuleTester는 Node.js >= 22의 raw transfer 바인딩을 요구하므로 bun에서는 실행할 수 없다.
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

runRuleCases("no-unsafe-unknown-cast", noUnsafeUnknownCastRule, {
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

runRuleCases("no-dto-domain-alias", noDtoDomainAliasRule, {
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

runRuleCases("catch-preserves-cause", catchPreservesCauseRule, {
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

function runRuleCases(name, rule, cases) {
  tester.run(name, rule, cases)
  console.log(
    `${name}: valid ${cases.valid.length}건, invalid ${cases.invalid.length}건 통과`
  )
}
