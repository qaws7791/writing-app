"use client"

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import Link from "next/link"

import { PreviewFrame } from "@/features/landing/ui/landing-primitives"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export function LandingNavMotion() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setNavScrolled(window.scrollY > 0)
    }
    const scheduleUpdate = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", scheduleUpdate, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", scheduleUpdate)
    }
  }, [])

  return (
    <nav
      className={
        navScrolled
          ? "fixed inset-x-0 top-0 z-50 bg-background/85 backdrop-blur-md"
          : "fixed inset-x-0 top-0 z-50 bg-background/0"
      }
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link
          className={buttonVariants({
            className:
              "h-auto cursor-pointer rounded-sm border-0 bg-transparent p-0 text-foreground no-underline hover:bg-transparent hover:no-underline",
            size: "sm",
            variant: "link",
          })}
          href="/"
        >
          <span
            className="inline-block bg-accent-soft rounded-full"
            style={{ width: 12, height: 12 }}
          />
          <span className="text-title-lg font-black">글결</span>
        </Link>
        <Link className={buttonVariants()} href="/app">
          시작하기
        </Link>
      </div>
    </nav>
  )
}

export function LandingPointerGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    let x = -200
    let y = -200
    const render = () => {
      frame = 0
      if (glowRef.current !== null) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px)`
      }
    }
    const handlePointerMove = (event: PointerEvent) => {
      x = event.clientX - 110
      y = event.clientY - 110
      if (frame === 0) frame = requestAnimationFrame(render)
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="landing-motion pointer-events-none fixed z-0 hidden rounded-full bg-accent-soft md:block"
      ref={glowRef}
      style={{
        filter: "blur(8px)",
        height: 220,
        opacity: 0.14,
        transform: "translate(-200px, -200px)",
        width: 220,
      }}
    />
  )
}

export function LandingHeroPreviewMotion() {
  const previewRef = useRef<HTMLDivElement>(null)
  useMotionTransform((pointer, scrollY) => {
    const x = (pointer.x / Math.max(window.innerWidth, 1) - 0.5) * 28
    const pointerY = (pointer.y / Math.max(window.innerHeight, 1) - 0.5) * 28
    const scrollOffset = Math.min(120, scrollY * 0.15)
    if (previewRef.current !== null) {
      previewRef.current.style.transform = `translate(${x}px, ${scrollOffset + pointerY}px)`
    }
  })

  return (
    <div className="landing-motion relative hidden lg:block" ref={previewRef}>
      <div
        className="relative mx-auto rounded-5xl bg-surface p-4"
        style={{ maxWidth: 420 }}
      >
        <PreviewFrame alt="글결 앱 홈 화면 미리보기" aspectRatio="9 / 16" />
      </div>
    </div>
  )
}

export function LandingShowcaseMotion() {
  const containerRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLDivElement>(null)
  const secondRef = useRef<HTMLDivElement>(null)
  useMotionTransform(() => {
    const container = containerRef.current
    if (container === null) return
    const rect = container.getBoundingClientRect()
    const progress = Math.min(
      1,
      Math.max(
        0,
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      )
    )
    if (firstRef.current !== null) {
      firstRef.current.style.transform = `translateY(${60 - progress * 120}px)`
    }
    if (secondRef.current !== null) {
      secondRef.current.style.transform = `translateY(${-30 + progress * 120}px)`
    }
  })

  return (
    <div className="grid md:grid-cols-2 gap-6" ref={containerRef}>
      <div
        className="landing-motion bg-surface rounded-panel p-5"
        ref={firstRef}
      >
        <PreviewFrame alt="글결 레슨 진행 화면" aspectRatio="4 / 3" />
      </div>
      <div
        className="landing-motion bg-foreground rounded-panel p-5 md:mt-16"
        ref={secondRef}
      >
        <PreviewFrame alt="글결 코스 대시보드 화면" aspectRatio="4 / 3" />
      </div>
    </div>
  )
}

export function LandingStatsMotion({
  stats,
}: {
  readonly stats: readonly {
    readonly bg: string
    readonly label: string
    readonly suffix: string
    readonly value: number
  }[]
}) {
  const [active, setActive] = useState(false)
  return (
    <Reveal
      className="grid sm:grid-cols-3 gap-5"
      onVisible={() => setActive(true)}
      y={30}
    >
      {stats.map((stat) => (
        <LandingStatCard active={active} key={stat.label} stat={stat} />
      ))}
    </Reveal>
  )
}

function LandingStatCard({
  active,
  stat,
}: {
  readonly active: boolean
  readonly stat: {
    readonly bg: string
    readonly label: string
    readonly suffix: string
    readonly value: number
  }
}) {
  const value = useCountUp(stat.value, active)
  return (
    <div
      className="rounded-panel p-8 text-center"
      style={{ backgroundColor: stat.bg }}
    >
      <p className="text-display-md font-black text-accent">
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p className="mt-3 text-body-md font-bold text-accent">{stat.label}</p>
    </div>
  )
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    let raf = 0
    if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(raf)
    }
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

function useMotionTransform(
  updateTransform: (
    pointer: { readonly x: number; readonly y: number },
    scrollY: number
  ) => void
) {
  const update = useEffectEvent(updateTransform)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let frame = 0
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const render = () => {
      frame = 0
      update(pointer, window.scrollY)
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(render)
    }
    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      schedule()
    }
    schedule()
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    window.addEventListener("scroll", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scroll", schedule)
    }
  }, [])
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}
