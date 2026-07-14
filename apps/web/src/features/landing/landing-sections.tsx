import Link from "next/link"

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
  LandingHeroPreviewMotion,
  LandingShowcaseMotion,
  LandingStatsMotion,
  Reveal,
} from "@/features/landing/landing-motion"
import { Pebbles } from "@/features/landing/landing-primitives"
import { ArrowRightIcon } from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
      <Pebbles items={heroPebbles} />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-10 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2">
            <SparklesIcon className="text-foreground" size={15} />
            <span className="text-label-md font-bold text-muted-foreground">
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
                  className="absolute inset-x-0 bottom-1 bg-accent rounded-full"
                  style={{ height: "0.4em", zIndex: 0, transform: "scaleX(1)" }}
                />
              </span>
              .
            </span>
          </h1>

          <p className="mt-6 max-w-md text-body-lg text-muted-foreground">
            글결은 복잡한 개념을 작은 조각으로 나눠, 매일 가볍게 쌓아 올리는
            학습 경험을 만듭니다. 어른의 호기심을 위한 학습.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-9">
            <Link className={buttonVariants({ size: "lg" })} href="/app">
              무료로 시작하기
              <ArrowRightIcon size={19} />
            </Link>
            <Link
              className={buttonVariants({ size: "lg", variant: "secondary" })}
              href="/app/courses"
            >
              코스 둘러보기
            </Link>
          </div>
        </div>

        <LandingHeroPreviewMotion />
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
                  color: "var(--fg-default)",
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
    <section
      className="scroll-mt-24 py-24 max-w-6xl mx-auto px-5 md:px-10"
      id="features"
    >
      <Reveal className="max-w-xl mb-14" y={20}>
        <p className="mb-3 text-label-md font-bold uppercase text-muted-foreground">
          왜 글결인가
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
              className="bg-surface rounded-panel p-8"
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
                <Icon className="text-accent" size={26} />
              </div>
              <h3 className="mb-3 text-heading-sm font-black">
                {feature.title}
              </h3>
              <p className="text-body-lg text-muted-foreground">
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
        <Reveal as="h2" className="mb-16 text-heading-lg font-black" y={20}>
          이렇게 시작해요
        </Reveal>

        <div className="relative">
          <div
            className="absolute top-2 bottom-2 bg-background rounded-full"
            style={{ left: 27, width: 4 }}
          >
            <div
              className="absolute inset-x-0 top-0 bg-foreground rounded-full origin-top"
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
                <div className="relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground text-body-lg font-black text-background">
                  {step.n}
                </div>
                <div className="pt-2">
                  <h3 className="mb-2 text-heading-sm font-black">
                    {step.title}
                  </h3>
                  <p className="text-body-lg text-muted-foreground">
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
  return (
    <section className="py-24 max-w-6xl mx-auto px-5 md:px-10">
      <LandingStatsMotion stats={stats} />
    </section>
  )
}

export function Showcase() {
  return (
    <section className="relative py-24 max-w-6xl mx-auto px-5 md:px-10 overflow-hidden">
      <Reveal className="max-w-xl mb-14" y={20}>
        <p className="mb-3 text-label-md font-bold uppercase text-muted-foreground">
          미리보기
        </p>
        <h2 className="text-heading-lg font-black">손에 익는 학습 경험</h2>
      </Reveal>

      <LandingShowcaseMotion />
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="py-20 max-w-6xl mx-auto px-5 md:px-10">
      <Reveal
        className="relative overflow-hidden bg-foreground rounded-panel px-8 py-20 md:py-28 text-center"
        y={40}
      >
        <Pebbles items={finalPebbles} />
        <div className="relative z-10">
          <h2 className="text-display-md font-black text-background">
            오늘의 첫 조각을
            <br />
            맞춰볼까요?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-body-lg text-background/70">
            가입은 1분이면 충분해요. 지금 바로 첫 레슨을 시작해 보세요.
          </p>
          <Link
            className={buttonVariants({
              className: "mt-9 bg-accent text-foreground hover:bg-accent/90",
              size: "lg",
            })}
            href="/app"
          >
            무료로 시작하기
            <ArrowRightIcon size={20} />
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block bg-accent-soft rounded-full"
                style={{ width: 12, height: 12 }}
              />
              <span className="text-title-lg font-black">글결</span>
            </div>
            <p className="max-w-xs text-body-sm text-muted-foreground">
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
                  <li key={item.label}>
                    <Link
                      className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-label-md text-muted-foreground">
            © 2026 글결. All rights reserved.
          </p>
          <p className="text-label-md text-muted-foreground">
            Made with care, one kernel at a time.
          </p>
        </div>
      </div>
    </footer>
  )
}
