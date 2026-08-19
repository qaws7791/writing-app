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

    const scroller = readElement(contentRef)
    if (scroller === null) return
    const target: HTMLElement = scroller

    function update() {
      setMeasurement({
        reached: hasReachedScrollEnd(target),
        stepId,
      })
    }

    const frame = requestAnimationFrame(update)
    target.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(target)

    return () => {
      cancelAnimationFrame(frame)
      target.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [contentRef, enabled, stepId])

  if (!enabled) return true
  return measurement?.stepId === stepId && measurement.reached
}
