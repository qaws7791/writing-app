"use client"

/* eslint-disable react/button-has-type, @next/next/no-img-element */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"

import { useRouter } from "next/navigation"

import {
  ArrowRightIcon,
  FlameIcon,
  LayersIcon,
  PuzzleIcon,
} from "@workspace/ui/components/icons"

type Pebble = {
  bottom?: string
  color: string
  delay?: number
  drift?: number
  duration?: number
  left?: string
  right?: string
  size: number
  top?: string
}

type Feature = {
  bg: string
  body: string
  icon: ComponentType<{ className?: string; size?: number }>
  title: string
}

const marqueeRows = [
  {
    items: [
      "언어",
      "디자인",
      "코딩",
      "역사",
      "심리학",
      "경제",
      "글쓰기",
      "철학",
    ],
    reverse: false,
  },
  {
    items: [
      "데이터",
      "음악 이론",
      "비즈니스",
      "과학",
      "예술사",
      "마케팅",
      "수학",
      "사진",
    ],
    reverse: true,
  },
] as const

const marqueeColors = ["#FFC800", "#FF7A6B", "#34C759", "#F4EFE6"] as const

const heroPebbles: Pebble[] = [
  { color: "#FFC800", duration: 9, left: "-60px", size: 220, top: "12%" },
  {
    bottom: "14%",
    color: "#FF7A6B",
    delay: 1,
    duration: 7,
    left: "8%",
    size: 140,
  },
  {
    color: "#34C759",
    delay: 0.5,
    duration: 10,
    right: "6%",
    size: 180,
    top: "18%",
  },
  {
    bottom: "22%",
    color: "#52D86A",
    delay: 1.5,
    duration: 6,
    right: "24%",
    size: 90,
  },
]

const finalPebbles: Pebble[] = [
  { color: "#FFC800", duration: 8, left: "6%", size: 160, top: "-30px" },
  {
    bottom: "-20px",
    color: "#FF7A6B",
    delay: 1,
    duration: 7,
    right: "12%",
    size: 110,
  },
  {
    color: "#34C759",
    delay: 0.5,
    duration: 6,
    right: "8%",
    size: 70,
    top: "30%",
  },
]

const features: Feature[] = [
  {
    bg: "#FFC800",
    body: "큰 개념을 한 입 크기의 레슨으로 나눠, 부담 없이 매일 한 조각씩 익혀요.",
    icon: LayersIcon,
    title: "작은 조각으로",
  },
  {
    bg: "#FF7A6B",
    body: "연속 학습 기록과 부드러운 리듬이 학습을 매일의 습관으로 만들어 줍니다.",
    icon: FlameIcon,
    title: "습관이 되는 흐름",
  },
  {
    bg: "#34C759",
    body: "분류, 매칭, 순서 맞추기 — 손으로 조작하며 개념을 몸에 익히는 인터랙션.",
    icon: PuzzleIcon,
    title: "직접 만지는 학습",
  },
  {
    bg: "#F4EFE6",
    body: "진도와 관심사에 맞춰 다음에 배울 조각을 자연스럽게 이어서 추천해요.",
    icon: KwepSparklesIcon,
    title: "나에게 맞춰",
  },
]

const steps = [
  {
    body: "언어부터 철학까지, 배우고 싶은 주제를 선택하면 첫 조각이 준비됩니다.",
    n: "01",
    title: "관심사를 골라요",
  },
  {
    body: "하루 5분, 짧고 밀도 높은 레슨으로 개념을 손으로 만지며 익혀요.",
    n: "02",
    title: "매일 한 조각씩",
  },
  {
    body: "연속 학습이 이어지며 흩어진 조각들이 하나의 단단한 이해로 자라납니다.",
    n: "03",
    title: "쌓여서 단단해져요",
  },
] as const

const stats = [
  { bg: "#FFC800", label: "큐레이션 코스", suffix: "+", value: 120 },
  { bg: "#FF7A6B", label: "학습 조각", suffix: "+", value: 5000 },
  { bg: "#34C759", label: "습관 지속률", suffix: "%", value: 98 },
] as const

const footerLinks = [
  { group: "제품", items: ["코스", "레슨", "학습 통계", "요금제"] },
  { group: "회사", items: ["소개", "블로그", "채용", "문의"] },
  { group: "리소스", items: ["도움말", "커뮤니티", "이용약관", "개인정보"] },
] as const

export function LandingPage() {
  const router = useRouter()
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

  const goRoot = () => {
    router.push("/")
  }

  const startLearning = () => {
    router.push("/app")
  }

  const browseCourses = () => {
    router.push("/app/courses")
  }

  return (
    <div className="relative bg-cream text-charcoal min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="fixed z-0 rounded-full bg-primary pointer-events-none hidden md:block"
        style={{
          filter: "blur(8px)",
          height: 220,
          opacity: 0.14,
          transform: `translate(${glowPosition.x}px, ${glowPosition.y}px)`,
          width: 220,
        }}
      />
      <div className="relative z-10">
        <LandingNav
          goRoot={goRoot}
          navScrolled={navScrolled}
          startLearning={startLearning}
        />
        <Hero browseCourses={browseCourses} startLearning={startLearning} />
        <Marquee />
        <Features />
        <HowItWorks />
        <Stats />
        <Showcase />
        <FinalCta startLearning={startLearning} />
        <Footer />
      </div>
    </div>
  )
}

function LandingNav({
  goRoot,
  navScrolled,
  startLearning,
}: {
  goRoot: () => void
  navScrolled: boolean
  startLearning: () => void
}) {
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        backdropFilter: navScrolled ? "blur(12px)" : "blur(0px)",
        backgroundColor: navScrolled
          ? "rgba(253,251,247,0.85)"
          : "rgba(253,251,247,0)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <button
          className="flex items-center gap-2"
          onClick={goRoot}
          tabIndex={0}
        >
          <span
            className="inline-block bg-primary rounded-full"
            style={{ width: 12, height: 12 }}
          />
          <span
            className="font-black"
            style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
          >
            Kernel
          </span>
        </button>

        <button
          className="btn-squish bg-charcoal text-cream rounded-full font-bold"
          onClick={startLearning}
          style={{ fontSize: "0.9375rem", padding: "0.625rem 1.25rem" }}
          tabIndex={0}
        >
          시작하기
        </button>
      </div>
    </nav>
  )
}

function Hero({
  browseCourses,
  startLearning,
}: {
  browseCourses: () => void
  startLearning: () => void
}) {
  const ref = useRef<HTMLElement | null>(null)
  const scrollProgress = useScrollProgress(ref, "start-start")
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 })
  const previewY = scrollProgress * 120

  const handleMouseMove = (event: ReactMouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setPreviewOffset({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 28,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 28,
    })
  }

  return (
    <section
      className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden"
      onMouseMove={handleMouseMove}
      ref={ref}
    >
      <Pebbles items={heroPebbles} />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-10 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 bg-surface rounded-full mb-6"
            style={{ padding: "0.5rem 1rem" }}
          >
            <KwepSparklesIcon className="text-charcoal" size={15} />
            <span
              className="font-bold text-muted"
              style={{ fontSize: "0.8125rem" }}
            >
              하루 5분, 새로운 학습 습관
            </span>
          </div>

          <h1
            className="font-black"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
            }}
          >
            <span className="block">매일 한 조각,</span>
            <span className="block">
              단단해지는{" "}
              <span className="relative inline-block">
                <span className="relative z-10">학습</span>
                <span
                  className="absolute inset-x-0 bottom-1 bg-primary rounded-full"
                  style={{ height: "0.4em", zIndex: 0, transform: "scaleX(1)" }}
                />
              </span>
              .
            </span>
          </h1>

          <p
            className="text-muted mt-6 max-w-md"
            style={{ fontSize: "1.125rem", lineHeight: 1.6 }}
          >
            Kernel은 복잡한 개념을 작은 조각으로 나눠, 매일 가볍게 쌓아 올리는
            학습 경험을 만듭니다. 어른의 호기심을 위한 학습.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-9">
            <button
              className="btn-squish bg-charcoal text-cream rounded-full font-bold inline-flex items-center gap-2"
              onClick={startLearning}
              style={{
                fontSize: "1.0625rem",
                padding: "1rem 1.75rem",
              }}
              tabIndex={0}
            >
              무료로 시작하기
              <ArrowRightIcon size={19} />
            </button>
            <button
              className="btn-squish bg-surface rounded-full font-bold"
              onClick={browseCourses}
              style={{
                fontSize: "1.0625rem",
                padding: "1rem 1.75rem",
              }}
              tabIndex={0}
            >
              코스 둘러보기
            </button>
          </div>
        </div>

        <div
          className="relative hidden lg:block"
          style={{
            transform: `translate(${previewOffset.x}px, ${previewY + previewOffset.y}px)`,
          }}
        >
          <div
            className="relative bg-surface rounded-5xl p-4 mx-auto"
            style={{ maxWidth: 420 }}
          >
            <PreviewFrame
              alt="Kernel 앱 홈 화면 미리보기"
              aspectRatio="9 / 16"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function KwepSparklesIcon({
  className,
  size = 24,
}: {
  className?: string
  size?: number
}) {
  const mergedClassName = `lucide lucide-sparkles${className ? ` ${className}` : ""}`

  return (
    <svg
      aria-hidden="true"
      className={mergedClassName}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        key="4pj2yx"
      />
      <path d="M20 3v4" key="1olli1" />
      <path d="M22 5h-4" key="1gvqau" />
      <path d="M4 17v2" key="vumght" />
      <path d="M5 18H3" key="zchphs" />
    </svg>
  )
}

function Marquee() {
  return (
    <section className="py-10 flex flex-col gap-4" aria-hidden>
      {marqueeRows.map((row) => (
        <div className="flex overflow-hidden" key={row.items.join("-")}>
          <div
            className="flex gap-4 shrink-0"
            style={{
              animation: `${row.reverse ? "landing-marquee-reverse" : "landing-marquee-forward"} 28s linear infinite`,
              paddingRight: "1rem",
            }}
          >
            {[...row.items, ...row.items].map((label, index) => (
              <span
                className="rounded-full font-bold whitespace-nowrap"
                key={`${label}-${index < row.items.length ? "a" : "b"}`}
                style={{
                  backgroundColor: marqueeColors[index % marqueeColors.length],
                  color: "#2A2621",
                  fontSize: "1.0625rem",
                  padding: "0.75rem 1.5rem",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function Features() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-5 md:px-10">
      <Reveal className="max-w-xl mb-14" y={20}>
        <p
          className="font-bold text-muted mb-3"
          style={{
            fontSize: "0.8125rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          왜 Kernel인가
        </p>
        <h2
          className="font-black"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          학습을 가볍게,
          <br />
          그러나 단단하게.
        </h2>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-5">
        {features.map((feature, index) => {
          const Icon = feature.icon

          return (
            <Reveal
              className="bg-surface rounded-4xl p-8"
              delay={index * 120}
              key={feature.title}
              y={40}
            >
              <div
                className="inline-flex items-center justify-center rounded-2xl mb-6"
                style={{
                  backgroundColor: feature.bg,
                  height: 56,
                  width: 56,
                }}
              >
                <Icon className="text-ink" size={26} />
              </div>
              <h3
                className="font-black mb-3"
                style={{ fontSize: "1.5rem", letterSpacing: "-0.01em" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-muted"
                style={{ fontSize: "1.0625rem", lineHeight: 1.6 }}
              >
                {feature.body}
              </p>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <Reveal
          as="h2"
          className="font-black mb-16"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
          y={20}
        >
          이렇게 시작해요
        </Reveal>

        <div className="relative">
          <div
            className="absolute top-2 bottom-2 bg-cream rounded-full"
            style={{ left: 27, width: 4 }}
          >
            <div
              className="absolute inset-x-0 top-0 bg-charcoal rounded-full origin-top"
              style={{ height: "100%", transform: "scaleY(0)" }}
            />
          </div>

          <div className="flex flex-col gap-14">
            {steps.map((step, index) => (
              <Reveal
                className="relative flex items-start gap-6 pl-0"
                delay={index * 120}
                key={step.n}
                x={24}
              >
                <div
                  className="relative z-10 shrink-0 inline-flex items-center justify-center rounded-full bg-charcoal text-cream font-black"
                  style={{ width: 58, height: 58, fontSize: "1.0625rem" }}
                >
                  {step.n}
                </div>
                <div className="pt-2">
                  <h3
                    className="font-black mb-2"
                    style={{
                      fontSize: "1.5rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-muted"
                    style={{ fontSize: "1.0625rem", lineHeight: 1.6 }}
                  >
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const [active, setActive] = useState(false)

  return (
    <section className="py-24 max-w-6xl mx-auto px-5 md:px-10">
      <Reveal
        className="grid sm:grid-cols-3 gap-5"
        onVisible={() => setActive(true)}
        y={30}
      >
        {stats.map((stat) => (
          <StatCard active={active} key={stat.label} stat={stat} />
        ))}
      </Reveal>
    </section>
  )
}

function StatCard({
  active,
  stat,
}: {
  active: boolean
  stat: (typeof stats)[number]
}) {
  const value = useCountUp(stat.value, active)

  return (
    <div
      className="rounded-4xl p-8 text-center"
      style={{ backgroundColor: stat.bg }}
    >
      <p
        className="font-black text-ink"
        style={{
          fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
          lineHeight: 1,
        }}
      >
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p className="font-bold text-ink mt-3" style={{ fontSize: "1rem" }}>
        {stat.label}
      </p>
    </div>
  )
}

function Showcase() {
  const ref = useRef<HTMLElement | null>(null)
  const scrollProgress = useScrollProgress(ref, "start-end")
  const firstPreviewY = 60 - scrollProgress * 120
  const secondPreviewY = -30 + scrollProgress * 120

  return (
    <section
      className="relative py-24 max-w-6xl mx-auto px-5 md:px-10 overflow-hidden"
      ref={ref}
    >
      <Reveal className="max-w-xl mb-14" y={20}>
        <p
          className="font-bold text-muted mb-3"
          style={{
            fontSize: "0.8125rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          미리보기
        </p>
        <h2
          className="font-black"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          손에 익는 학습 경험
        </h2>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6">
        <div
          className="bg-surface rounded-5xl p-5"
          style={{ transform: `translateY(${firstPreviewY}px)` }}
        >
          <PreviewFrame alt="Kernel 레슨 진행 화면" aspectRatio="4 / 3" />
        </div>
        <div
          className="bg-charcoal rounded-5xl p-5 md:mt-16"
          style={{ transform: `translateY(${secondPreviewY}px)` }}
        >
          <PreviewFrame alt="Kernel 코스 대시보드 화면" aspectRatio="4 / 3" />
        </div>
      </div>
    </section>
  )
}

function FinalCta({ startLearning }: { startLearning: () => void }) {
  return (
    <section className="py-20 max-w-6xl mx-auto px-5 md:px-10">
      <Reveal
        className="relative overflow-hidden bg-charcoal rounded-5xl px-8 py-20 md:py-28 text-center"
        y={40}
      >
        <Pebbles items={finalPebbles} />
        <div className="relative z-10">
          <h2
            className="font-black text-cream"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            오늘의 첫 조각을
            <br />
            맞춰볼까요?
          </h2>
          <p
            className="text-cream/70 mt-5 max-w-md mx-auto"
            style={{ fontSize: "1.125rem", lineHeight: 1.6 }}
          >
            가입은 1분이면 충분해요. 지금 바로 첫 레슨을 시작해 보세요.
          </p>
          <button
            className="btn-squish bg-primary text-ink rounded-full font-bold inline-flex items-center gap-2 mt-9"
            onClick={startLearning}
            style={{ fontSize: "1.125rem", padding: "1.125rem 2rem" }}
            tabIndex={0}
          >
            무료로 시작하기
            <ArrowRightIcon size={20} />
          </button>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-surface">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block bg-primary rounded-full"
                style={{ width: 12, height: 12 }}
              />
              <span
                className="font-black"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
              >
                Kernel
              </span>
            </div>
            <p
              className="text-muted max-w-xs"
              style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
            >
              어른의 호기심을 위한 학습. 매일 한 조각씩, 단단하게.
            </p>
          </div>
          {footerLinks.map((column) => (
            <div key={column.group}>
              <p
                className="font-bold mb-4"
                style={{
                  fontSize: "0.8125rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {column.group}
              </p>
              <ul className="flex flex-col gap-3">
                {column.items.map((item) => (
                  <li key={item}>
                    <a
                      className="text-muted transition-colors hover:text-charcoal"
                      href="#"
                      style={{ fontSize: "0.9375rem" }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "2px solid var(--color-surface-hover)" }}
        >
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            © 2026 Kernel. All rights reserved.
          </p>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Made with care, one kernel at a time.
          </p>
        </div>
      </div>
    </footer>
  )
}

function Pebbles({ items }: { items: Pebble[] }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {items.map((pebble) => (
        <div
          className="rounded-full"
          key={`${pebble.color}-${pebble.size}-${pebble.top ?? pebble.bottom}`}
          style={
            {
              "--landing-pebble-drift": `${pebble.drift ?? 24}px`,
              animation: `landing-pebble-float ${pebble.duration ?? 8}s ease-in-out ${pebble.delay ?? 0}s infinite`,
              backgroundColor: pebble.color,
              bottom: pebble.bottom,
              height: pebble.size,
              left: pebble.left,
              position: "absolute",
              right: pebble.right,
              top: pebble.top,
              width: pebble.size,
            } as CSSProperties
          }
        />
      ))}
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

function useScrollProgress(
  ref: { current: HTMLElement | null },
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

function Reveal({
  as = "div",
  children,
  className,
  onVisible,
  style,
  x = 0,
  y = 0,
}: {
  as?: "div" | "h2"
  children: ReactNode
  className?: string
  delay?: number
  onVisible?: () => void
  style?: CSSProperties
  x?: number
  y?: number
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

function PreviewFrame({
  alt,
  aspectRatio,
}: {
  alt: string
  aspectRatio: string
}) {
  return (
    <img
      alt={alt}
      className="w-full rounded-4xl object-cover"
      style={{ aspectRatio }}
    />
  )
}
