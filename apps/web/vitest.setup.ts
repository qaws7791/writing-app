import "@testing-library/jest-dom/vitest"

import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

process.env.NEXT_PUBLIC_CLIENT_MODE ??= "local"
process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://127.0.0.1:3010"

afterEach(() => {
  cleanup()
})

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn()
}
