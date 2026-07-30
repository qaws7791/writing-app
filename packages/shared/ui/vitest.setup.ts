import "@testing-library/jest-dom/vitest"

import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

import { installConsoleFailureHarness } from "@workspace/vitest-config/console-failure-harness"

// hydration 테스트가 Testing Library helper 밖에서 react의 `act`를 직접 쓴다. Testing
// Library는 자기 helper 안에서만 이 flag를 세우므로 환경 차원에서 명시한다.
Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true)

installConsoleFailureHarness()

afterEach(() => {
  cleanup()
})
