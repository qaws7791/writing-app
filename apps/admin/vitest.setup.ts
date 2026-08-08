import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

import { installConsoleFailureHarness } from "@workspace/vitest-config/console-failure-harness"
import { installResizeObserverStub } from "@workspace/vitest-config/resize-observer-stub"

installConsoleFailureHarness()
installResizeObserverStub()

afterEach(() => {
  cleanup()
})
