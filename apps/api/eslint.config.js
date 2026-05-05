import { config } from "@workspace/config/eslint/base"

export default [
  ...config,
  {
    files: ["src/**/*.ts"],
    ignores: ["src/http/create-openapi-app.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            "'as unknown as T' bypasses type safety. Use branded constructors (toUserId, etc.) or .$type<>() in the Drizzle schema.",
        },
        {
          selector: "NewExpression[callee.name='OpenAPIHono']",
          message:
            "OpenAPIHono는 src/http/create-openapi-app.ts의 중앙 팩토리로만 생성하세요.",
        },
        {
          selector: "Property[key.name='defaultHook']",
          message:
            "defaultHook 설정은 src/http/create-openapi-app.ts의 중앙 팩토리로만 정의하세요.",
        },
      ],
    },
  },
]
