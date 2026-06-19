"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

export function useLandingChromeMotion() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: -200, y: -200 })

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 0)
    }

    const handleMouseMove = (event: MouseEvent) => {
      setGlowPosition({ x: event.clientX - 110, y: event.clientY - 110 })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return { glowPosition, navScrolled }
}

export function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(target * eased))

      if (t < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [active, duration, target])

  return value
}

export function useScrollProgress(
  ref: { readonly current: HTMLElement | null },
  offset: "start-end" | "start-start"
) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const element = ref.current

      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()
      const top = rect.top + window.scrollY
      const height = element.offsetHeight
      const start = offset === "start-end" ? top - window.innerHeight : top
      const end = top + height
      const next = (window.scrollY - start) / (end - start)

      setProgress(Math.min(1, Math.max(0, next)))
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, { passive: true })

    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update)
    }
  }, [offset, ref])

  return progress
}

export function Reveal({
  as = "div",
  children,
  className,
  onVisible,
  style,
  x = 0,
  y = 0,
}: {
  readonly as?: "div" | "h2"
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
  readonly onVisible?: () => void
  readonly style?: CSSProperties
  readonly x?: number
  readonly y?: number
}) {
  const ref = useRef<HTMLElement | null>(null)
  const notifiedRef = useRef(false)
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !("IntersectionObserver" in window)
  )
  const Element = as

  useEffect(() => {
    if (visible && !notifiedRef.current) {
      notifiedRef.current = true
      onVisible?.()
    }
  }, [onVisible, visible])

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    if (visible || !("IntersectionObserver" in window)) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "-80px" }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [visible])

  return (
    <Element
      className={className}
      ref={(node) => {
        ref.current = node
      }}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: resolveRevealTransform({ visible, x, y }),
      }}
    >
      {children}
    </Element>
  )
}

function resolveRevealTransform({
  visible,
  x,
  y,
}: {
  readonly visible: boolean
  readonly x: number
  readonly y: number
}) {
  if (visible) {
    return "none"
  }

  if (x !== 0) {
    return `translateX(${x}px)`
  }

  return `translateY(${y}px)`
}
