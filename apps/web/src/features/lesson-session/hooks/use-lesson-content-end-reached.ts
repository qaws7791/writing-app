import { useLayoutEffect, useState, type Ref } from "react"

const OVERFLOW_THRESHOLD_PX = 8
const END_THRESHOLD_PX = 24

function readElement(ref: Ref<HTMLElement>): HTMLElement | null {
  if (ref === null || typeof ref === "function") return null
  return ref.current
}

function hasReachedScrollEnd(element: HTMLElement): boolean {
  const overflow = element.scrollHeight - element.clientHeight
  if (overflow <= OVERFLOW_THRESHOLD_PX) return true
  return (
    element.scrollTop + element.clientHeight >=
    element.scrollHeight - END_THRESHOLD_PX
  )
}

export function useLessonContentEndReached({
  contentRef,
  enabled,
  stepId,
}: {
  readonly contentRef: Ref<HTMLElement>
  readonly enabled: boolean
  readonly stepId: string
}): boolean {
  const [measurement, setMeasurement] = useState<{
    readonly reached: boolean
    readonly stepId: string
  } | null>(null)

  useLayoutEffect(() => {
    if (!enabled) return

    const element = readElement(contentRef)
    if (element === null) return

    function update() {
      setMeasurement({
        reached: hasReachedScrollEnd(element),
        stepId,
      })
    }

    const frame = requestAnimationFrame(update)
    element.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [contentRef, enabled, stepId])

  if (!enabled) return true
  return measurement?.stepId === stepId && measurement.reached
}
