import Image from "next/image"
import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"

const coursePreviews = [
  {
    description: "매일 한 편씩 쓰며 문장과 문단의 기본 감각을 만듭니다.",
    image: "/course-thumbnails/basic-sentence-writing.png",
    title: "글쓰기 첫걸음 30일",
  },
  {
    description: "문장의 구조, 조사, 연결 표현을 실제 문장으로 익힙니다.",
    image: "/course-thumbnails/grammar-complete.png",
    title: "문장의 기본 문법",
  },
  {
    description: "주장과 근거를 엮어 설득력 있는 글의 흐름을 연습합니다.",
    image: "/course-thumbnails/essay-writing.png",
    title: "글과 논증을 잘하는 30일",
  },
] as const

const learningMethods = [
  {
    description: "읽기와 비교 예시로 오늘의 글쓰기 초점을 빠르게 잡습니다.",
    icon: BookOpenIcon,
    title: "짧게 이해",
  },
  {
    description: "객관식, 배열, 빈칸, 글쓰기 스텝으로 바로 손을 움직입니다.",
    icon: GraduationCapIcon,
    title: "바로 연습",
  },
  {
    description: "AI 코칭이 잘된 점, 개선점, 다음 시도를 한 번에 정리합니다.",
    icon: SparklesIcon,
    title: "다시 다듬기",
  },
] as const

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative flex min-h-[86svh] items-end overflow-hidden bg-foreground text-background">
        <Image
          alt="문장 쓰기 학습 화면을 떠올리게 하는 코스 썸네일"
          className="object-cover opacity-70"
          fill
          priority
          sizes="100vw"
          src="/course-thumbnails/basic-sentence-writing.png"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-28 sm:px-8 lg:px-10">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="text-sm font-medium text-background/80">
              AI 코칭 기반 글쓰기 학습
            </p>
            <h1 className="text-6xl font-semibold sm:text-7xl">글결</h1>
            <p className="max-w-2xl text-xl leading-8 text-background/90">
              짧게 배우고, 바로 쓰고, AI 코칭으로 다시 다듬는 글쓰기 학습
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={buttonVariants({ size: "lg" })}
              href="/login?next=/app"
            >
              무료로 시작하기
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link
              className={buttonVariants({
                className:
                  "border-background/50 bg-background/10 text-background hover:bg-background/20 hover:text-background",
                size: "lg",
                variant: "outline",
              })}
              href="#course-preview"
            >
              코스 둘러보기
            </Link>
          </div>
          <dl className="grid max-w-3xl grid-cols-3 gap-4 text-background">
            <div>
              <dt className="text-3xl font-semibold">5</dt>
              <dd className="text-sm text-background/75">대표 코스</dd>
            </div>
            <div>
              <dt className="text-3xl font-semibold">44</dt>
              <dd className="text-sm text-background/75">Kwep 레슨</dd>
            </div>
            <div>
              <dt className="text-3xl font-semibold">3회</dt>
              <dd className="text-sm text-background/75">AI 코칭 재시도</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            "쓰기 전 막막함을 줄이는 짧은 개념",
            "자동 저장되는 스텝별 학습 흐름",
            "다시 쓸 수 있게 정리되는 코칭",
          ].map((value) => (
            <div
              className="flex items-start gap-3 border-l border-border pl-4"
              key={value}
            >
              <CheckCircleIcon className="mt-0.5 text-primary" />
              <p className="text-base leading-7">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="course-preview-heading"
        className="bg-muted/55"
        id="course-preview"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 lg:px-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-semibold" id="course-preview-heading">
              코스 미리보기
            </h2>
            <p className="leading-7 text-muted-foreground">
              입문, 문법, 논증 코스에서 시작해 문장을 고치고 완성하는 감각을
              단계별로 쌓습니다.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {coursePreviews.map((course) => (
              <Card className="bg-card" key={course.title}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    alt={`${course.title} 코스 썸네일`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    src={course.image}
                  />
                </div>
                <CardHeader>
                  <CardTitle as="h3">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="method-heading">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:px-8 lg:px-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-3xl font-semibold" id="method-heading">
              학습 방식
            </h2>
            <p className="leading-7 text-muted-foreground">
              긴 강의보다 짧은 반복, 추상 조언보다 다음 문장으로 이어지는
              피드백에 집중합니다.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {learningMethods.map((method) => {
              const Icon = method.icon

              return (
                <div
                  className="flex flex-col gap-4 border-t border-border pt-5"
                  key={method.title}
                >
                  <Icon className="text-primary" />
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold">{method.title}</h3>
                    <p className="leading-7 text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-14 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-2xl font-semibold">
              오늘 쓸 첫 문장을 준비하세요.
            </h2>
            <p className="text-muted-foreground">
              로그인하면 진행 상황과 다음 레슨이 이어집니다.
            </p>
          </div>
          <Link
            className={buttonVariants({ size: "lg" })}
            href="/login?next=/app"
          >
            학습 시작
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
      </section>
    </main>
  )
}
