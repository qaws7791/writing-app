import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const stylesDirectory = join(process.cwd(), "src", "styles")
const globalsCss = readFileSync(join(stylesDirectory, "globals.css"), "utf8")
const semanticCss = readFileSync(
  join(stylesDirectory, "tokens", "semantic.css"),
  "utf8"
)

const semanticTokenMappings = [
  ["--success-bg", "var(--ref-mint-light)"],
  ["--success-fg", "var(--ref-mint-dark)"],
  ["--danger-bg", "var(--ref-coral-light)"],
  ["--danger-fg", "var(--ref-coral-dark)"],
  ["--fg-default", "var(--ref-charcoal)"],
] as const

const tailwindColorMappings = [
  ["--color-success-bg", "var(--success-bg)"],
  ["--color-success-fg", "var(--success-fg)"],
  ["--color-danger", "var(--danger-bg)"],
  ["--color-danger-fg", "var(--danger-fg)"],
  ["--color-danger-foreground", "var(--danger-fg)"],
  ["--color-fg-default", "var(--fg-default)"],
] as const

describe("semantic color token contract", () => {
  it("globals가 semantic token source를 가져온다", () => {
    expect(globalsCss).toContain('@import "./tokens/semantic.css";')
  })

  it.each(semanticTokenMappings)("%s 역할 값을 정의한다", (token, value) => {
    expect(semanticCss).toContain(`${token}: ${value};`)
  })

  it.each(tailwindColorMappings)(
    "%s Tailwind 색상 mapping을 정의한다",
    (token, value) => {
      expect(globalsCss).toContain(`${token}: ${value};`)
    }
  )
})
