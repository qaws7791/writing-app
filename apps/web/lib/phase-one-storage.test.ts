import {
  createMemoryStorage,
  getDefaultStorage,
  phaseOneStorageKeys,
} from "./phase-one-storage"

describe("phase one storage helpers", () => {
  test("stores and removes values in memory storage", () => {
    const storage = createMemoryStorage()
    storage.setItem(phaseOneStorageKeys.sequence, "1")

    expect(storage.getItem(phaseOneStorageKeys.sequence)).toBe("1")

    storage.removeItem(phaseOneStorageKeys.sequence)
    expect(storage.getItem(phaseOneStorageKeys.sequence)).toBeNull()
  })

  test("returns browser local storage when window is available", () => {
    expect(getDefaultStorage()).toBe(window.localStorage)
  })
})
