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
      className={
        navScrolled
          ? "fixed inset-x-0 top-0 z-50 bg-bg-canvas/85 backdrop-blur-md"
          : "fixed inset-x-0 top-0 z-50 bg-bg-canvas/0"
      }
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Button
          className="h-auto gap-2 px-0 py-0 text-fg-default hover:bg-transparent"
          onClick={goRoot}
          type="button"
          variant="ghost"
        >
          <span
            className="inline-block bg-action-selected-bg rounded-full"
            style={{ width: 12, height: 12 }}
          />
          <span className="text-title-lg font-black">Kernel</span>
        </Button>

        <Button
          className="h-auto px-5 py-2.5 text-body-sm"
          onClick={startLearning}
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-bg-surface px-4 py-2">
            <SparklesIcon className="text-fg-default" size={15} />
            <span className="text-label-md font-bold text-fg-muted">
              하루 5분, 새로운 학습 습관
            </span>
          </div>

          <h1 className="text-display-lg font-black">
            <span className="block">매일 한 조각,</span>
            <span className="block">
              단단해지는{" "}
              <span className="relative inline-block">
                <span className="relative z-10">학습</span>
                <span
                  className="absolute inset-x-0 bottom-1 bg-action-selected-bg rounded-full"
                  style={{ height: "0.4em", zIndex: 0, transform: "scaleX(1)" }}
                />
              </span>
              .
            </span>
          </h1>

          <p className="mt-6 max-w-md text-body-lg text-fg-muted">
            Kernel은 복잡한 개념을 작은 조각으로 나눠, 매일 가볍게 쌓아 올리는
            학습 경험을 만듭니다. 어른의 호기심을 위한 학습.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-9">
            <Button
              className="h-auto gap-2 px-7 py-4 text-body-lg"
              onClick={startLearning}
              type="button"
            >
              무료로 시작하기
              <ArrowRightIcon size={19} />
            </Button>
            <Button
              className="h-auto px-7 py-4 text-body-lg"
              onClick={browseCourses}
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
            className="relative bg-bg-surface rounded-panel p-4 mx-auto"
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
                className="rounded-full px-6 py-3 text-body-lg font-bold whitespace-nowrap"
                key={`${label}-${index < row.items.length ? "a" : "b"}`}
                style={{
                  backgroundColor: marqueeColors[index % marqueeColors.length],
                  color: "var(--semantic-color-fg-default)",
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
        <p className="mb-3 text-label-md font-bold uppercase text-fg-muted">
          왜 Kernel인가
        </p>
        <h2 className="text-heading-lg font-black">
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
              className="bg-bg-surface rounded-panel p-8"
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
                <Icon className="text-action-selected-fg" size={26} />
              </div>
              <h3 className="mb-3 text-heading-sm font-black">
                {feature.title}
              </h3>
              <p className="text-body-lg text-fg-muted">{feature.body}</p>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section className="py-24 bg-bg-surface">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <Reveal as="h2" className="mb-16 text-heading-lg font-black" y={20}>
          이렇게 시작해요
        </Reveal>

        <div className="relative">
          <div
            className="absolute top-2 bottom-2 bg-bg-canvas rounded-full"
            style={{ left: 27, width: 4 }}
          >
            <div
              className="absolute inset-x-0 top-0 bg-bg-inverse rounded-full origin-top"
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
                <div className="relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-bg-inverse text-body-lg font-black text-fg-inverse">
                  {step.n}
                </div>
                <div className="pt-2">
                  <h3 className="mb-2 text-heading-sm font-black">
                    {step.title}
                  </h3>
                  <p className="text-body-lg text-fg-muted">{step.body}</p>
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
      className="rounded-panel p-8 text-center"
      style={{ backgroundColor: stat.bg }}
    >
      <p className="text-display-md font-black text-action-selected-fg">
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p className="mt-3 text-body-md font-bold text-action-selected-fg">
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
        <p className="mb-3 text-label-md font-bold uppercase text-fg-muted">
          미리보기
        </p>
        <h2 className="text-heading-lg font-black">손에 익는 학습 경험</h2>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6">
        <div
          className="bg-bg-surface rounded-panel p-5"
          style={{ transform: `translateY(${firstPreviewY}px)` }}
        >
          <PreviewFrame alt="Kernel 레슨 진행 화면" aspectRatio="4 / 3" />
        </div>
        <div
          className="bg-bg-inverse rounded-panel p-5 md:mt-16"
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
        className="relative overflow-hidden bg-bg-inverse rounded-panel px-8 py-20 md:py-28 text-center"
        y={40}
      >
        <Pebbles items={finalPebbles} />
        <div className="relative z-10">
          <h2 className="text-display-md font-black text-fg-inverse">
            오늘의 첫 조각을
            <br />
            맞춰볼까요?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-body-lg text-fg-inverse/70">
            가입은 1분이면 충분해요. 지금 바로 첫 레슨을 시작해 보세요.
          </p>
          <Button
            className="mt-9 h-auto gap-2 bg-action-selected-bg px-8 py-4 text-body-lg text-action-selected-fg hover:bg-action-selected-bg/90"
            onClick={startLearning}
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
    <footer className="bg-bg-surface">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block bg-action-selected-bg rounded-full"
                style={{ width: 12, height: 12 }}
              />
              <span className="text-title-lg font-black">Kernel</span>
            </div>
            <p className="max-w-xs text-body-sm text-fg-muted">
              어른의 호기심을 위한 학습. 매일 한 조각씩, 단단하게.
            </p>
          </div>
          {footerLinks.map((column) => (
            <div key={column.group}>
              <p className="mb-4 text-label-md font-bold uppercase">
                {column.group}
              </p>
              <ul className="flex flex-col gap-3">
                {column.items.map((item) => (
                  <li key={item}>
                    <a
                      className="text-body-sm text-fg-muted transition-colors hover:text-fg-default"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-label-md text-fg-muted">
            © 2026 Kernel. All rights reserved.
          </p>
          <p className="text-label-md text-fg-muted">
            Made with care, one kernel at a time.
          </p>
        </div>
      </div>
    </footer>
  )
}
