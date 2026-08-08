"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, CheckmarkCircle02Icon, PlayIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/registry/luma/lib/utils";
import { LearnerShell } from "@/registry/luma/blocks/learner-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/luma/ui/accordion";
import { Button } from "@/registry/luma/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/luma/ui/progress";

type CoursePatternKind = "dots" | "lines" | "grid" | "rings";
type CourseStatus = "not-started" | "in-progress" | "completed";
type LessonState = "not-started" | "in-progress" | "completed";

type CourseLesson = {
  id: string;
  title: string;
  state: LessonState;
};

type CourseUnit = {
  id: string;
  title: string;
  lessons: CourseLesson[];
};

type CourseDetailData = {
  id: string;
  category: string;
  title: string;
  description: string;
  pattern: CoursePatternKind;
  lessonCount: number;
  estimatedDuration: string;
  level: string;
  status: CourseStatus;
  completedLessons: number;
  nextLessonTitle?: string;
  units: CourseUnit[];
};

const COURSE: CourseDetailData = {
  id: "vocab-meaning",
  category: "읽기",
  title: "어휘와 문장의 의미 정확히 읽기",
  description:
    "문맥 단서로 낯선 어휘의 뜻을 추론하고, 문장 구조와 논리 관계를 따라가며 의미를 정확히 읽습니다.",
  pattern: "dots",
  lessonCount: 20,
  estimatedDuration: "약 3시간",
  level: "입문",
  status: "in-progress",
  completedLessons: 0,
  nextLessonTitle: "문맥 단서의 종류 찾기",
  units: [
    {
      id: "unit-1",
      title: "문맥에서 단어 의미와 쓰임 판단하기",
      lessons: [
        { id: "l1", title: "문맥 단서의 종류 찾기", state: "in-progress" },
        { id: "l2", title: "동의어·반의어로 뜻 좁히기", state: "not-started" },
        { id: "l3", title: "예시와 설명으로 의미 추론하기", state: "not-started" },
        { id: "l4", title: "문장에서 알맞은 쓰임 고르기", state: "not-started" },
        { id: "l5", title: "짧은 단락에서 어휘 확인하기", state: "not-started" },
      ],
    },
    {
      id: "unit-2",
      title: "문장의 참여자와 기본 관계 복원하기",
      lessons: [
        { id: "l6", title: "주어와 서술어 찾기", state: "not-started" },
        { id: "l7", title: "목적어·보어 관계 읽기", state: "not-started" },
        { id: "l8", title: "수식어가 가리키는 대상 찾기", state: "not-started" },
        { id: "l9", title: "생략된 주어 되살리기", state: "not-started" },
        { id: "l10", title: "한 문장의 역할 관계 정리하기", state: "not-started" },
      ],
    },
    {
      id: "unit-3",
      title: "문장 사이 논리 관계 따라가기",
      lessons: [
        { id: "l11", title: "원인·결과 표지 찾기", state: "not-started" },
        { id: "l12", title: "대조·양보 관계 읽기", state: "not-started" },
        { id: "l13", title: "예시·부연이 붙는 자리 찾기", state: "not-started" },
        { id: "l14", title: "지시어가 가리키는 내용 확인하기", state: "not-started" },
        { id: "l15", title: "두 문장의 관계 한 줄로 쓰기", state: "not-started" },
      ],
    },
    {
      id: "unit-4",
      title: "짧은 글에서 의미 정확히 종합하기",
      lessons: [
        { id: "l16", title: "핵심 문장과 보조 정보 구분하기", state: "not-started" },
        { id: "l17", title: "어휘와 문장 관계를 함께 읽기", state: "not-started" },
        { id: "l18", title: "오해하기 쉬운 표현 점검하기", state: "not-started" },
        { id: "l19", title: "짧은 글 의미 요약하기", state: "not-started" },
        { id: "l20", title: "종합: 정확히 읽고 확인하기", state: "not-started" },
      ],
    },
  ],
};

function ctaLabel(status: CourseStatus) {
  if (status === "completed") return "다시 보기";
  if (status === "in-progress") return "이어하기";
  return "학습 시작하기";
}

function unitProgress(unit: CourseUnit) {
  const completed = unit.lessons.filter((lesson) => lesson.state === "completed").length;
  return { completed, total: unit.lessons.length };
}

function findOpenUnitId(course: CourseDetailData) {
  const withProgress = course.units.find((unit) =>
    unit.lessons.some((lesson) => lesson.state === "in-progress"),
  );
  return withProgress?.id ?? course.units[0]?.id;
}

function CoursePattern({ pattern, className }: { pattern: CoursePatternKind; className?: string }) {
  return (
    <div
      data-slot="course-detail-pattern"
      className={cn("relative aspect-square overflow-hidden rounded-[1.25rem] bg-muted", className)}
      aria-hidden="true"
    >
      {pattern === "dots" ? (
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 28%, transparent) 1.1px, transparent 1.2px)",
            backgroundSize: "12px 12px",
          }}
        />
      ) : null}
      {pattern === "lines" ? (
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, color-mix(in oklch, var(--foreground) 22%, transparent) 0 1px, transparent 1px 10px)",
          }}
        />
      ) : null}
      {pattern === "grid" ? (
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
      ) : null}
      {pattern === "rings" ? (
        <>
          <span className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/15" />
          <span className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-foreground/20" />
          <span className="absolute top-[28%] left-[22%] size-3 rounded-full bg-foreground/12" />
        </>
      ) : null}
      <span className="absolute inset-3 rounded-[0.9rem] border border-border/50" />
    </div>
  );
}

function LessonStatusIcon({ state }: { state: LessonState }) {
  if (state === "completed") {
    return (
      <span className="grid size-8 shrink-0 place-items-center text-foreground" aria-hidden="true">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
      </span>
    );
  }

  if (state === "in-progress") {
    return (
      <span
        className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background"
        aria-hidden="true"
      >
        <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5 translate-x-px" />
      </span>
    );
  }

  return (
    <span className="grid size-8 shrink-0 place-items-center" aria-hidden="true">
      <span className="size-2 rounded-full bg-border" />
    </span>
  );
}

function LessonRow({ lesson }: { lesson: CourseLesson }) {
  const stateLabel =
    lesson.state === "completed" ? "완료" : lesson.state === "in-progress" ? "진행 중" : "미진행";

  return (
    <div
      data-slot="course-detail-lesson"
      data-state={lesson.state}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-2.5 py-2.5",
        lesson.state === "in-progress" && "bg-background/90",
      )}
      aria-label={`${lesson.title}, ${stateLabel}`}
    >
      <LessonStatusIcon state={lesson.state} />
      <span
        className={cn(
          "min-w-0 flex-1 text-sm tracking-[-0.01em] text-pretty",
          lesson.state === "completed" && "text-muted-foreground",
          lesson.state === "in-progress" && "font-medium text-foreground",
          lesson.state === "not-started" && "text-foreground/80",
        )}
      >
        {lesson.title}
      </span>
      {lesson.state === "in-progress" ? (
        <span className="shrink-0 rounded-full bg-foreground/8 px-2 py-0.5 text-[11px] font-medium tracking-[0.02em] text-foreground">
          다음
        </span>
      ) : null}
    </div>
  );
}

function CourseHero({ course }: { course: CourseDetailData }) {
  const showProgress = course.status !== "not-started";
  const percent =
    course.lessonCount > 0 ? Math.round((course.completedLessons / course.lessonCount) * 100) : 0;

  return (
    <section
      data-slot="course-detail-hero"
      className="@container flex flex-col gap-6 rounded-[1.75rem] bg-muted/55 p-5 sm:gap-7 sm:p-7"
      aria-labelledby="course-detail-title"
    >
      <div className="flex flex-col gap-5 @[36rem]:flex-row @[36rem]:items-start @[36rem]:gap-6">
        <CoursePattern
          pattern={course.pattern}
          className="w-full max-w-40 @[36rem]:w-36 @[36rem]:shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            {course.category}
          </p>
          <h1
            id="course-detail-title"
            className="font-heading text-2xl font-semibold tracking-[-0.035em] text-balance sm:text-3xl sm:leading-[1.2]"
          >
            {course.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-pretty text-muted-foreground sm:text-[0.9375rem]">
            {course.description}
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-xs tabular-nums text-muted-foreground">
            <li>{course.lessonCount}레슨</li>
            <li aria-hidden="true" className="text-border">
              ·
            </li>
            <li>{course.estimatedDuration}</li>
            <li aria-hidden="true" className="text-border">
              ·
            </li>
            <li>{course.level}</li>
          </ul>
        </div>
      </div>

      {showProgress ? (
        <div className="flex flex-col gap-3">
          <Progress value={percent} className="gap-1.5">
            <ProgressLabel className="sr-only">{course.title} 진행</ProgressLabel>
            <ProgressValue className="text-xs tabular-nums text-muted-foreground">
              {() => `${course.completedLessons}/${course.lessonCount}`}
            </ProgressValue>
          </Progress>
          {course.nextLessonTitle ? (
            <p className="text-sm text-muted-foreground">
              {course.status === "completed" ? "최근 레슨" : "다음 레슨"}
              <span className="mx-1.5 text-border" aria-hidden="true">
                ·
              </span>
              <span className="text-foreground/85">{course.nextLessonTitle}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <Button size="lg" className="min-w-40" type="button">
          {ctaLabel(course.status)}
        </Button>
      </div>
    </section>
  );
}

function Curriculum({ course }: { course: CourseDetailData }) {
  const openUnitId = findOpenUnitId(course);

  return (
    <section
      data-slot="course-detail-curriculum"
      className="flex flex-col gap-4"
      aria-labelledby="course-detail-curriculum-title"
    >
      <h2
        id="course-detail-curriculum-title"
        className="font-heading text-xl font-semibold tracking-[-0.03em] sm:text-2xl"
      >
        커리큘럼
      </h2>

      <Accordion defaultValue={openUnitId ? [openUnitId] : []} className="gap-3">
        {course.units.map((unit, index) => {
          const { completed, total } = unitProgress(unit);

          return (
            <AccordionItem
              key={unit.id}
              value={unit.id}
              className="rounded-[1.5rem] border-0 bg-muted/55 px-4 sm:px-5"
            >
              <AccordionTrigger className="items-center gap-4 py-4 hover:no-underline">
                <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-xl bg-background text-xs font-medium tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-medium tracking-[-0.015em] text-foreground text-balance sm:text-[0.9375rem]">
                      {unit.title}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                      {completed}/{total}개 레슨
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-foreground">
                <div className="flex flex-col gap-0.5 pl-0 sm:pl-11">
                  {unit.lessons.map((lesson) => (
                    <LessonRow key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

/**
 * Logged-in learner course detail: hero summary with CTA, plus unit accordion curriculum.
 * Demo defaults to an in-progress course — static only, no navigation.
 */
export function CourseDetail({ className, ...props }: React.ComponentProps<"div">) {
  const course = COURSE;

  return (
    <LearnerShell data-slot="course-detail" className={className} currentNav="learn" {...props}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-8 sm:gap-12 sm:px-8 sm:py-10">
        <a
          href="#learn"
          data-slot="course-detail-back"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={(event) => event.preventDefault()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          코스 목록으로
        </a>

        <CourseHero course={course} />
        <Curriculum course={course} />
      </main>
    </LearnerShell>
  );
}

export default CourseDetail;
