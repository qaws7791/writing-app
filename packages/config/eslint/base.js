import js from "@eslint/js"
import turboPlugin from "eslint-plugin-turbo"
import unusedImports from "eslint-plugin-unused-imports"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "error",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            "'as unknown as T' bypasses type safety. Use branded constructors (toUserId, etc.) or .$type<>() in the Drizzle schema.",
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      ".next/**",
      "**/.source/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["scripts/**/*.{js,jsx,ts,tsx,cjs,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
]
