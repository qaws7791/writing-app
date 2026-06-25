"use client"

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react"

import {
  features,
  finalPebbles,
  footerLinks,
  heroPebbles,
  marqueeColors,
  marqueeRows,
  stats,
  steps,
} from "@/features/landing/landing-content"
import { SparklesIcon } from "@/features/landing/landing-icons"
import {
  Reveal,
  useCountUp,
  useScrollProgress,
} from "@/features/landing/landing-motion"
import { Pebbles, PreviewFrame } from "@/features/landing/landing-primitives"
import { ArrowRightIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"

export function LandingNav({
  goRoot,
  navScrolled,
  startLearning,
}: {
  readonly goRoot: () => void
  readonly navScrolled: boolean
  readonly startLearning: () => void
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
        <Button
          className="h-auto gap-2 px-0 py-0 text-charcoal hover:bg-transparent"
          onClick={goRoot}
          type="button"
          variant="ghost"
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
        </Button>

        <Button
          onClick={startLearning}
          style={{ fontSize: "0.9375rem", padding: "0.625rem 1.25rem" }}
          type="button"
        >
          시작하기
        </Button>
      </div>
    </nav>
  )
}

export function Hero({
  browseCourses,
  startLearning,
}: {
  readonly browseCourses: () => void
  readonly startLearning: () => void
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
            <SparklesIcon className="text-charcoal" size={15} />
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
            <Button
              className="h-auto gap-2"
              onClick={startLearning}
              style={{
                fontSize: "1.0625rem",
                padding: "1rem 1.75rem",
              }}
              type="button"
            >
              무료로 시작하기
              <ArrowRightIcon size={19} />
            </Button>
            <Button
              className="h-auto"
              onClick={browseCourses}
              style={{
                fontSize: "1.0625rem",
                padding: "1rem 1.75rem",
              }}
              type="button"
              variant="secondary"
            >
              코스 둘러보기
            </Button>
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

export function Marquee() {
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

export function Features() {
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

export function HowItWorks() {
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

export function Stats() {
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
  readonly active: boolean
  readonly stat: (typeof stats)[number]
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

export function Showcase() {
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

export function FinalCta({
  startLearning,
}: {
  readonly startLearning: () => void
}) {
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
          <Button
            className="mt-9 h-auto gap-2 bg-primary text-ink hover:bg-primary/90"
            onClick={startLearning}
            style={{ fontSize: "1.125rem", padding: "1.125rem 2rem" }}
            type="button"
          >
            무료로 시작하기
            <ArrowRightIcon size={20} />
          </Button>
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
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
