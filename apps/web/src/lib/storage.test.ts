import { createMemoryStorage, getDefaultStorage, storageKeys } from "./storage"

describe("phase one storage helpers", () => {
  test("stores and removes values in memory storage", () => {
    const storage = createMemoryStorage()
    storage.setItem(storageKeys.sequence, "1")

    expect(storage.getItem(storageKeys.sequence)).toBe("1")

    storage.removeItem(storageKeys.sequence)
    expect(storage.getItem(storageKeys.sequence)).toBeNull()
  })

  test("returns browser local storage when window is available", () => {
    expect(getDefaultStorage()).toBe(window.localStorage)
  })
})
