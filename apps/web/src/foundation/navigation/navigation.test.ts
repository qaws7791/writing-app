import { describe, expect, it, vi } from "vitest"

import {
  appendReturnTo,
  isSafeInternalPath,
  navigateBack,
} from "@/foundation/navigation"

describe("isSafeInternalPath", () => {
  it("accepts internal relative paths with query strings", () => {
    expect(isSafeInternalPath("/journeys?tab=active")).toBe(true)
    expect(isSafeInternalPath("/writings/new?returnTo=%2Fhome")).toBe(true)
  })

  it("rejects external or invalid values", () => {
    expect(isSafeInternalPath("")).toBe(false)
    expect(isSafeInternalPath("https://external.com")).toBe(false)
    expect(isSafeInternalPath("//external.com")).toBe(false)
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false)
    expect(isSafeInternalPath("#hash-only")).toBe(false)
    expect(isSafeInternalPath("/home#section")).toBe(false)
  })
})

describe("appendReturnTo", () => {
  it("appends encoded returnTo while preserving existing query strings", () => {
    expect(
      appendReturnTo("/writings/new/editor?promptId=1", "/writings/new")
    ).toBe("/writings/new/editor?promptId=1&returnTo=%2Fwritings%2Fnew")
  })

  it("skips invalid returnTo values", () => {
    expect(
      appendReturnTo("/writings/new/editor?promptId=1", "https://external.com")
    ).toBe("/writings/new/editor?promptId=1")
  })
})

describe("navigateBack", () => {
  it("replaces to returnTo when it is an internal path", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "/home",
      fallbackPath: "/journeys",
    })

    expect(router.replace).toHaveBeenCalledWith("/home")
  })

  it("falls back when returnTo is an external absolute url", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "https://external.com",
      fallbackPath: "/journeys",
    })

    expect(router.replace).toHaveBeenCalledWith("/journeys")
  })

  it("falls back when returnTo is protocol-relative", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "//external.com",
      fallbackPath: "/journeys",
    })

    expect(router.replace).toHaveBeenCalledWith("/journeys")
  })

  it("falls back when returnTo is empty", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "",
      fallbackPath: "/writings",
    })

    expect(router.replace).toHaveBeenCalledWith("/writings")
  })
})
