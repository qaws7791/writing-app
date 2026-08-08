import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import {
  featuredCourse,
  footerLinks,
  learningMethods,
} from "@/features/landing/ui/landing-content"
import { ChevronRightIcon } from "@workspace/ui/components/icons/action-icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export function LandingNav() {
  return (
    <header className="border-b border-border/60 bg-background">
      <nav
        aria-label="공개 주요 메뉴"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8"
      >
        <Link
          className="font-heading text-lg font-semibold tracking-[-0.03em]"
          href="/"
        >
          글결.
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({
              size: "sm",
              variant: "ghost",
            })}
            href="/login"
          >
            로그인
          </Link>
          <Link
            className={buttonVariants({
              size: "sm",
            })}
            href="/app"
          >
            시작하기
          </Link>
        </div>
      </nav>
    </header>
  )
}

export function HeroSection() {
  return (
    <section
      aria-labelledby="landing-value-title"
      className="border-b border-border/60 px-5 py-24 sm:py-28 lg:px-8 lg:py-36"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-7 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          한국어 글쓰기 학습
        </p>
        <h1
          className="max-w-4xl font-heading text-4xl leading-[1.12] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl"
          id="landing-value-title"
        >
          생각을 문장으로,
          <br />
          문장을 내 글로.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg sm:leading-8">
          짧게 배우고 직접 쓴 뒤 AI 코칭으로 다듬어 보세요. 글결.은 한국어
          글쓰기 연습을 한 흐름으로 이어 줍니다.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className={buttonVariants({
              size: "lg",
            })}
            href="/app"
          >
            글쓰기 시작하기
            <ChevronRightIcon aria-hidden data-icon="inline-end" />
          </Link>
          <Link
            className={buttonVariants({
              size: "lg",
              variant: "outline",
            })}
            href="/app/courses"
          >
            코스 둘러보기
          </Link>
        </div>
      </div>
    </section>
  )
}

export function LearningMethodSection() {
  return (
    <section
      aria-labelledby="learning-method-title"
      className="border-b border-border/60 px-5 py-20 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          글결.의 학습 방식
        </p>
        <h2
          className="max-w-2xl font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl"
          id="learning-method-title"
        >
          배우고, 쓰고, 바로 다듬습니다.
        </h2>
        <div className="mt-12 grid border-t border-border/70 md:grid-cols-3">
          {learningMethods.map((method, index) => (
            <article
              className="border-b border-border/70 py-7 md:border-r md:px-7 md:last:border-r-0 md:first:pl-0"
              key={method.title}
            >
              <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 font-heading text-xl font-semibold tracking-[-0.025em]">
                {method.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-pretty text-muted-foreground">
                {method.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductPreviewSection() {
  return (
    <section
      aria-labelledby="product-preview-title"
      className="border-b border-border/60 bg-surface/30 px-5 py-20 lg:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="mb-3 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            실제 코스로 미리보기
          </p>
          <h2
            className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl"
            id="product-preview-title"
          >
            무엇을 배우는지
            <br />
            시작 전에 확인하세요.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-pretty text-muted-foreground">
            현재 제공하는 코스와 같은 콘텐츠를 공개 화면에서도 보여 줍니다. 범용
            예시가 아닌 실제 글쓰기 학습 흐름을 살펴보세요.
          </p>
          <Link
            className={buttonVariants({
              className: "mt-8",
              size: "lg",
              variant: "outline",
            })}
            href="/app/courses"
          >
            코스에서 보기
            <ChevronRightIcon aria-hidden data-icon="inline-end" />
          </Link>
        </div>

        <figure aria-label="실제 코스를 사용한 글결. 코스 화면 미리보기">
          <div className="overflow-hidden rounded-4xl border border-border/80 bg-background shadow-2xs">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <span className="font-heading text-sm font-semibold tracking-[-0.02em]">
                글결.
              </span>
              <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                코스
              </span>
            </div>
            <div className="p-4 sm:p-6">
              <article className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    alt={resolveCourseImage(featuredCourse).alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 767px) calc(100vw - 4.5rem), (max-width: 1023px) 34rem, 32rem"
                    src={resolveCourseImage(featuredCourse).src}
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    {featuredCourse.category}
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-semibold tracking-[-0.025em]">
                    {featuredCourse.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {featuredCourse.description}
                  </p>
                </div>
              </article>
            </div>
          </div>
          <figcaption className="sr-only">
            글결. 학습자 코스 화면에서 실제 제공하는 코스를 보여 주는 미리보기
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="landing-final-cta-title"
      className="px-5 py-20 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className="font-heading text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl"
          id="landing-final-cta-title"
        >
          한 문장부터
          <br />
          써 보세요.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          코스를 고르고 첫 글쓰기 연습을 시작하세요.
        </p>
        <Link
          className={buttonVariants({
            className: "mt-8",
            size: "lg",
          })}
          href="/app"
        >
          첫 글쓰기 시작하기
          <ChevronRightIcon aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-heading text-sm font-semibold tracking-[-0.02em]">
            글결.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            생각을 글로 완성하는 한국어 글쓰기 학습
          </p>
        </div>
        <nav aria-label="footer 메뉴">
          <ul className="flex flex-wrap gap-x-5 gap-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
