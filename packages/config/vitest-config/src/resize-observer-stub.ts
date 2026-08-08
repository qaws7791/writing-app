export function installResizeObserverStub(): void {
  if (typeof globalThis.ResizeObserver !== "undefined") return

  class ResizeObserverStub {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  Reflect.set(globalThis, "ResizeObserver", ResizeObserverStub)
}
