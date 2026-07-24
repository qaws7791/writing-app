import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import {
  featuredCourse,
  footerLinks,
  learningMethods,
} from "@/features/landing/ui/landing-content"
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"
import { buttonVariants } from "@workspace/ui/components/ui/button"

const learningMethodIcons = {
  "AI 코칭": SparklesIcon,
  "직접 쓰기": CheckCircleIcon,
  "짧은 레슨": BookOpenIcon,
} as const

export function LandingNav() {
  return (
    <header className="border-b border-border bg-bg-canvas">
      <nav
        aria-label="공개 주요 메뉴"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-10"
      >
        <Link className="text-title-lg font-black text-fg-default" href="/">
          글결.
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({
              className: "text-fg-muted",
              size: "sm",
              variant: "ghost",
            })}
            href="/login"
          >
            로그인
          </Link>
          <Link
            className={buttonVariants({
              className:
                "bg-action-primary-bg text-action-primary-fg hover:opacity-90",
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
      className="px-5 py-20 text-center md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-4xl">
        <p className="mx-auto mb-6 w-fit rounded-pill bg-action-selected-bg px-4 py-2 text-label-md font-bold text-action-selected-fg">
          한국어 글쓰기 학습
        </p>
        <h1
          className="text-heading-lg font-black text-fg-default min-[360px]:text-heading-xl sm:text-display-lg"
          id="landing-value-title"
        >
          <span className="block whitespace-nowrap">생각을 문장으로,</span>
          <span className="block whitespace-nowrap">문장을 내 글로.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-fg-muted">
          짧게 배우고 직접 쓴 뒤 AI 코칭으로 다듬어 보세요. 글결.은 한국어
          글쓰기 연습을 한 흐름으로 이어 줍니다.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className={buttonVariants({
              className:
                "bg-action-primary-bg text-action-primary-fg hover:opacity-90",
              size: "lg",
            })}
            href="/app"
          >
            글쓰기 시작하기
            <ArrowRightIcon aria-hidden size={19} />
          </Link>
          <Link
            className={buttonVariants({
              className: "bg-bg-surface text-fg-default",
              size: "lg",
              variant: "secondary",
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
      className="bg-bg-surface px-5 py-20 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-label-md font-bold text-fg-muted">
          글결.의 학습 방식
        </p>
        <h2
          className="max-w-2xl text-heading-lg font-black text-fg-default"
          id="learning-method-title"
        >
          배우고, 쓰고, 바로 다듬습니다.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {learningMethods.map((method) => {
            const Icon = learningMethodIcons[method.title]

            return (
              <article
                className="rounded-card bg-bg-elevated p-7"
                key={method.title}
              >
                <span className="mb-6 flex size-12 items-center justify-center rounded-control bg-action-selected-bg text-action-selected-fg">
                  <Icon aria-hidden size={22} />
                </span>
                <h3 className="text-title-lg font-black text-fg-default">
                  {method.title}
                </h3>
                <p className="mt-3 text-body-md text-fg-muted">
                  {method.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ProductPreviewSection() {
  return (
    <section
      aria-labelledby="product-preview-title"
      className="px-5 py-20 md:px-10 md:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="mb-3 text-label-md font-bold text-fg-muted">
            실제 코스로 미리보기
          </p>
          <h2
            className="text-heading-lg font-black text-fg-default"
            id="product-preview-title"
          >
            무엇을 배우는지
            <br />
            시작 전에 확인하세요.
          </h2>
          <p className="mt-5 max-w-lg text-body-lg text-fg-muted">
            현재 제공하는 코스와 같은 콘텐츠를 공개 화면에서도 보여 줍니다. 범용
            예시가 아닌 실제 글쓰기 학습 흐름을 살펴보세요.
          </p>
          <Link
            className={buttonVariants({
              className: "mt-8 bg-bg-surface text-fg-default",
              size: "lg",
              variant: "secondary",
            })}
            href="/app/courses"
          >
            코스에서 보기
            <ArrowRightIcon aria-hidden size={19} />
          </Link>
        </div>

        <figure aria-label="실제 코스를 사용한 글결. 코스 화면 미리보기">
          <div className="overflow-hidden rounded-panel border border-border bg-bg-elevated">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-title-md font-black text-fg-default">
                글결.
              </span>
              <span className="text-label-md font-bold text-fg-muted">
                코스
              </span>
            </div>
            <div className="p-4 sm:p-6">
              <article className="overflow-hidden rounded-card bg-bg-surface">
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
                  <p className="text-label-md font-bold text-fg-muted">
                    {featuredCourse.category}
                  </p>
                  <h3 className="mt-2 text-heading-sm font-black text-fg-default">
                    {featuredCourse.title}
                  </h3>
                  <p className="mt-3 text-body-md text-fg-muted">
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
      className="px-5 pb-20 pt-4 md:px-10 md:pb-24"
    >
      <div className="mx-auto max-w-6xl rounded-panel bg-action-primary-bg px-7 py-16 text-center md:px-12 md:py-20">
        <h2
          className="text-heading-xl font-black text-action-primary-fg sm:text-display-md"
          id="landing-final-cta-title"
        >
          한 문장부터
          <br />
          써 보세요.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-body-lg text-action-primary-fg/80">
          코스를 고르고 첫 글쓰기 연습을 시작하세요.
        </p>
        <Link
          className={buttonVariants({
            className:
              "mt-8 bg-action-selected-bg text-action-selected-fg hover:opacity-90",
            size: "lg",
          })}
          href="/app"
        >
          첫 글쓰기 시작하기
          <ArrowRightIcon aria-hidden size={19} />
        </Link>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between md:px-10">
        <div>
          <p className="text-title-md font-black text-fg-default">글결.</p>
          <p className="mt-1 text-body-sm text-fg-muted">
            생각을 글로 완성하는 한국어 글쓰기 학습
          </p>
        </div>
        <nav aria-label="footer 메뉴">
          <ul className="flex flex-wrap gap-x-5 gap-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-body-sm font-bold text-fg-muted transition-colors hover:text-fg-default"
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
