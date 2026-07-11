import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

import { installConsoleFailureHarness } from "@/test/console-failure-harness"

installConsoleFailureHarness()

afterEach(() => {
  cleanup()
})
