import { nextJsConfig } from "@workspace/config/eslint/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@test/*",
                "../test/*",
                "../../test/*",
                "../../../test/*",
                "../../../../test/*",
              ],
              message:
                "제품 소스는 테스트 지원 경계를 import할 수 없습니다. 테스트 fixture와 fake는 apps/web/test 안에서만 사용하세요.",
            },
          ],
        },
      ],
    },
  },
]
