import { describe, expect, it, vi } from "vitest"

import {
  appendReturnTo,
  isSafeInternalPath,
  navigateBack,
} from "@/foundation/navigation"

describe("isSafeInternalPath", () => {
  it("accepts internal relative paths with query strings", () => {
    expect(isSafeInternalPath("/photo?mode=manual")).toBe(true)
    expect(isSafeInternalPath("/garden?returnTo=%2Fhome")).toBe(true)
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
    expect(appendReturnTo("/photo?mode=manual", "/home")).toBe(
      "/photo?mode=manual&returnTo=%2Fhome"
    )
  })

  it("skips invalid returnTo values", () => {
    expect(appendReturnTo("/photo", "https://external.com")).toBe("/photo")
  })
})

describe("navigateBack", () => {
  it("replaces to returnTo when it is an internal path", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "/home",
      fallbackPath: "/photo",
    })

    expect(router.replace).toHaveBeenCalledWith("/home")
  })

  it("falls back when returnTo is an external absolute url", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "https://external.com",
      fallbackPath: "/photo",
    })

    expect(router.replace).toHaveBeenCalledWith("/photo")
  })

  it("falls back when returnTo is protocol-relative", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "//external.com",
      fallbackPath: "/photo",
    })

    expect(router.replace).toHaveBeenCalledWith("/photo")
  })

  it("falls back when returnTo is empty", () => {
    const router = {
      replace: vi.fn(),
    }

    navigateBack(router, {
      returnTo: "",
      fallbackPath: "/garden",
    })

    expect(router.replace).toHaveBeenCalledWith("/garden")
  })
})
