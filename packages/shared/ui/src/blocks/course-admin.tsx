"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { AdminShell } from "#ui/blocks/admin-shell"
import {
  CurriculumBuilder,
  normalizeUnits,
  validateCurriculum,
  type CurriculumSelection,
  type UnitNode,
  type ValidationIssue,
} from "#ui/blocks/curriculum-builder"
import { Badge } from "#ui/components/ui/badge"
import { Button } from "#ui/components/ui/button"
import {
  ContentValidation,
  ContentValidationHeader,
  ContentValidationIssue,
  ContentValidationIssueActions,
  ContentValidationIssueDetail,
  ContentValidationIssueMeta,
  ContentValidationIssueTitle,
  ContentValidationList,
  ContentValidationSummary,
  ContentValidationTitle,
} from "#ui/components/ui/content-validation"
import { Field, FieldGroup, FieldLabel } from "#ui/components/ui/field"
import { Input } from "#ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#ui/components/ui/tabs"
import { Textarea } from "#ui/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#ui/components/ui/tooltip"

type PublishStatus = "draft" | "published" | "published-with-changes"

type CourseFixture = {
  id: string
  title: string
  topic: string
  level: string
  description: string
  publishStatus: PublishStatus
  thumbnailUrl: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  units: UnitNode[]
}

const TOPIC_ITEMS = [
  { label: "읽기", value: "읽기" },
  { label: "듣기", value: "듣기" },
  { label: "말하기", value: "말하기" },
  { label: "쓰기", value: "쓰기" },
  { label: "문법", value: "문법" },
  { label: "어휘", value: "어휘" },
  { label: "회화", value: "회화" },
] as const

const LEVEL_ITEMS = [
  { label: "초급", value: "초급" },
  { label: "중급", value: "중급" },
  { label: "고급", value: "고급" },
] as const

const PUBLISH_STATUS_LABEL: Record<PublishStatus, string> = {
  draft: "초안",
  published: "게시됨",
  "published-with-changes": "게시됨·변경있음",
}

const INITIAL_UNITS: UnitNode[] = normalizeUnits([
  {
    id: "unit-1",
    title: "문단의 기초",
    description: "주제문과 뒷받침 문장을 가려 읽습니다.",
    state: "ready",
    lessons: [
      {
        id: "lesson-1",
        title: "주제문 찾기",
        state: "ready",
        steps: [
          {
            id: "step-1a",
            type: "READING",
            title: "읽기",
            prompt: "다음 문단을 읽고 주제문이 될 수 있는 문장을 표시하세요.",
            body: "다음 문단을 읽고 주제문이 될 수 있는 문장을 표시하세요.",
          },
          {
            id: "step-1b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "이 문단의 중심 생각을 가장 잘 나타낸 문장은 무엇입니까?",
            body: "이 문단의 중심 생각을 가장 잘 나타낸 문장은 무엇입니까?",
            options: [
              { id: "opt-1b-a", label: "첫 문장이 주제문이다." },
              { id: "opt-1b-b", label: "마지막 문장이 주제문이다." },
              { id: "opt-1b-c", label: "예시 문장이 주제문이다." },
              { id: "opt-1b-d", label: "세부 정보가 주제문이다." },
            ],
            correctOptionIds: ["opt-1b-a"],
          },
          {
            id: "step-1c",
            type: "WRITE",
            title: "쓰기",
            prompt: "주제문을 한 문장으로 다시 써 보세요.",
            body: "주제문을 한 문장으로 다시 써 보세요.",
            minChars: 20,
            targetChars: 60,
            maxChars: 120,
            rubricRef: "주제문 한 문장, 근거 표현 포함",
          },
        ],
      },
      {
        id: "lesson-2",
        title: "세부 정보 구분",
        state: "draft",
        steps: [
          {
            id: "step-2a",
            type: "READING",
            title: "읽기",
            prompt: "예시와 부연 설명을 구분하며 문단을 읽습니다.",
            body: "예시와 부연 설명을 구분하며 문단을 읽습니다.",
          },
          {
            id: "step-2b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "다음 중 세부 정보에 해당하는 문장을 고르세요.",
            body: "다음 중 세부 정보에 해당하는 문장을 고르세요.",
            options: [
              { id: "opt-2b-a", label: "선택지 A" },
              { id: "opt-2b-b", label: "선택지 B" },
              { id: "opt-2b-c", label: "선택지 C" },
              { id: "opt-2b-d", label: "선택지 D" },
            ],
            correctOptionIds: ["opt-2b-b"],
          },
          {
            id: "step-2c",
            type: "MULTIPLE_CHOICE",
            title: "객관식 · 검증",
            prompt: "선택지 C가 비어 있습니다. (검증 대상)",
            body: "선택지 C가 비어 있습니다. (검증 대상)",
            options: [
              { id: "opt-2c-a", label: "선택지 A" },
              { id: "opt-2c-b", label: "선택지 B" },
              { id: "opt-2c-c", label: "" },
              { id: "opt-2c-d", label: "선택지 D" },
            ],
            correctOptionIds: [],
          },
        ],
      },
      {
        id: "lesson-2b",
        title: "정보 추론하기",
        state: "draft",
        steps: [
          {
            id: "step-2d",
            type: "READING",
            title: "읽기",
            prompt: "생략된 정보를 추론하며 읽습니다.",
            body: "생략된 정보를 추론하며 읽습니다.",
          },
        ],
      },
    ],
  },
  {
    id: "unit-2",
    title: "세부 정보 읽기",
    description: "그래프와 표를 읽고 정보를 추출합니다.",
    state: "draft",
    lessons: [
      {
        id: "lesson-3",
        title: "그래프 읽기",
        state: "draft",
        steps: [
          {
            id: "step-3a",
            type: "READING",
            title: "읽기",
            prompt: "그래프의 축과 범례를 확인하세요.",
            body: "그래프의 축과 범례를 확인하세요.",
          },
          {
            id: "step-3b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "가장 큰 값을 나타내는 항목은?",
            body: "가장 큰 값을 나타내는 항목은?",
            options: [
              { id: "opt-3b-a", label: "선택지 A" },
              { id: "opt-3b-b", label: "선택지 B" },
              { id: "opt-3b-c", label: "선택지 C" },
              { id: "opt-3b-d", label: "선택지 D" },
            ],
            correctOptionIds: ["opt-3b-a"],
          },
        ],
      },
      {
        id: "lesson-4",
        title: "표 읽기",
        state: "ready",
        steps: [
          {
            id: "step-4a",
            type: "READING",
            title: "읽기",
            prompt: "표의 행과 열을 따라 읽으세요.",
            body: "표의 행과 열을 따라 읽으세요.",
          },
          {
            id: "step-4b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "표에서 확인할 수 있는 사실은?",
            body: "표에서 확인할 수 있는 사실은?",
            options: [
              { id: "opt-4b-a", label: "선택지 A" },
              { id: "opt-4b-b", label: "선택지 B" },
              { id: "opt-4b-c", label: "선택지 C" },
              { id: "opt-4b-d", label: "선택지 D" },
            ],
            correctOptionIds: ["opt-4b-b"],
          },
          {
            id: "step-4c",
            type: "WRITE",
            title: "쓰기",
            prompt: "표의 핵심 정보를 한 문장으로 요약하세요.",
            body: "표의 핵심 정보를 한 문장으로 요약하세요.",
            rubricRef: "수치와 단위를 포함해 요약",
          },
        ],
      },
    ],
  },
  {
    id: "unit-3",
    title: "정보 추론",
    description: "글에 드러나지 않은 정보를 문맥으로 채웁니다.",
    state: "draft",
    lessons: [
      {
        id: "lesson-5",
        title: "생략된 정보 채우기",
        state: "draft",
        steps: [
          {
            id: "step-5a",
            type: "READING",
            title: "읽기",
            prompt: "대화 일부를 읽고 빠진 상황을 추론하세요.",
            body: "대화 일부를 읽고 빠진 상황을 추론하세요.",
          },
          {
            id: "step-5b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "화자가 다음에 할 행동으로 알맞은 것은?",
            body: "화자가 다음에 할 행동으로 알맞은 것은?",
            options: [
              { id: "opt-5b-a", label: "선택지 A" },
              { id: "opt-5b-b", label: "선택지 B" },
              { id: "opt-5b-c", label: "선택지 C" },
              { id: "opt-5b-d", label: "선택지 D" },
            ],
            correctOptionIds: ["opt-5b-a"],
          },
        ],
      },
    ],
  },
])

const COURSE: CourseFixture = {
  id: "crs-03",
  title: "중급 읽기",
  topic: "읽기",
  level: "중급",
  description:
    "문단의 중심 생각과 세부 정보를 구분하고, 생략된 정보를 추론하며 읽는 중급 코스입니다.",
  publishStatus: "draft",
  thumbnailUrl: null,
  createdAt: "2026-03-02T10:00:00+09:00",
  createdBy: "수진",
  updatedAt: "2026-08-09T15:24:00+09:00",
  updatedBy: "수진",
  units: INITIAL_UNITS,
}

function formatSavedAgo(savedAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - savedAt) / 60_000))
  if (minutes <= 0) return "방금"
  return `${minutes}분 전`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function withCourseIssues(
  units: UnitNode[],
  description: string
): ValidationIssue[] {
  const issues = validateCurriculum(units)
  if (!description.trim()) {
    issues.unshift({
      id: "course-description-empty",
      severity: "warning",
      title: "설명 없음",
      detail: "코스 설명이 비어 있습니다.",
      selection: { kind: "unit", id: units[0]?.id ?? "" },
    })
  }
  return issues
}

function CoursePageChrome({
  title,
  topic,
  level,
  publishStatus,
  savedLabel,
  canPublish,
  errorCount,
  onPreview,
  onPublish,
}: {
  title: string
  topic: string
  level: string
  publishStatus: PublishStatus
  savedLabel: string
  canPublish: boolean
  errorCount: number
  onPreview: () => void
  onPublish: () => void
}) {
  const publishButton = (
    <Button type="button" size="sm" disabled={!canPublish} onClick={onPublish}>
      게시하기
    </Button>
  )

  return (
    <div
      data-slot="course-admin-page-chrome"
      className="flex shrink-0 flex-col gap-3 border-b border-border/60 pb-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">
              {title}
            </h2>
            <Badge variant="secondary">
              {PUBLISH_STATUS_LABEL[publishStatus]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              저장됨 · {savedLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {topic} · {level}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onPreview}>
            미리보기
          </Button>
          {canPublish ? (
            publishButton
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  {publishButton}
                </TooltipTrigger>
                <TooltipContent>
                  오류 {errorCount}건을 해결해야 게시할 수 있습니다
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}

function CourseMetaForm({
  title,
  topic,
  level,
  description,
  thumbnailUrl,
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  onTitleChange,
  onTopicChange,
  onLevelChange,
  onDescriptionChange,
  onThumbnailChange,
}: {
  title: string
  topic: string
  level: string
  description: string
  thumbnailUrl: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  onTitleChange: (value: string) => void
  onTopicChange: (value: string) => void
  onLevelChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onThumbnailChange: (value: string | null) => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <section
      data-slot="course-admin-course-form"
      className="flex flex-col gap-5"
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">
          코스 정보
        </h2>
        <p className="text-sm text-muted-foreground">
          학습자에게 보이는 기본 정보를 수정합니다.
        </p>
      </header>
      <div className="@container grid gap-5 @[40rem]:grid-cols-[10rem_minmax(0,1fr)]">
        <Field>
          <FieldLabel>썸네일</FieldLabel>
          <button
            type="button"
            className="flex aspect-square w-full max-w-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20 text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
            onClick={() => fileInputRef.current?.click()}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <>
                <span className="font-medium text-foreground">썸네일</span>
                <span>업로드</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) {
                onThumbnailChange(null)
                return
              }
              onThumbnailChange(URL.createObjectURL(file))
            }}
          />
          {thumbnailUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-fit"
              onClick={() => onThumbnailChange(null)}
            >
              제거
            </Button>
          ) : null}
        </Field>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="course-title">제목</FieldLabel>
            <Input
              id="course-title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </Field>
          <div className="@container grid gap-5 @[32rem]:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="course-topic">주제</FieldLabel>
              <Select
                items={[...TOPIC_ITEMS]}
                value={topic}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value
                  if (typeof next === "string") onTopicChange(next)
                }}
              >
                <SelectTrigger id="course-topic" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {TOPIC_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="course-level">수준</FieldLabel>
              <Select
                items={[...LEVEL_ITEMS]}
                value={level}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : value
                  if (typeof next === "string") onLevelChange(next)
                }}
              >
                <SelectTrigger id="course-level" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {LEVEL_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </div>
      <Field>
        <FieldLabel htmlFor="course-description">설명</FieldLabel>
        <Textarea
          id="course-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="min-h-28"
        />
      </Field>
      <footer className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
        생성 {formatDate(createdAt)} · {createdBy}
        <span className="mx-2" aria-hidden>
          ·
        </span>
        마지막 수정 {formatDateTime(updatedAt)} · {updatedBy}
      </footer>
    </section>
  )
}

function ReleasePanel({
  publishStatus,
  issues,
  canPublish,
  lastPublishedLabel,
  onNavigate,
  onRevalidate,
  onPublish,
}: {
  publishStatus: PublishStatus
  issues: ValidationIssue[]
  canPublish: boolean
  lastPublishedLabel: string
  onNavigate: (selection: CurriculumSelection) => void
  onRevalidate: () => void
  onPublish: () => void
}) {
  const errors = issues.filter((issue) => issue.severity === "error").length
  const warnings = issues.filter((issue) => issue.severity === "warning").length

  return (
    <div data-slot="course-admin-release" className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
        <header className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">
            게시 상태
          </h2>
          <p className="text-sm text-muted-foreground">
            ● {PUBLISH_STATUS_LABEL[publishStatus]}
            {publishStatus === "draft" ? " (미게시)" : ""}
            <span className="mx-2" aria-hidden>
              ·
            </span>
            마지막 게시 : {lastPublishedLabel}
          </p>
        </header>
        {errors > 0 ? (
          <p className="text-sm text-muted-foreground">
            ⓘ 게시하려면 아래 오류 {errors}건을 모두 해결해야 합니다.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            ⓘ 검증 오류가 없습니다. 게시할 수 있습니다.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRevalidate}
          >
            다시 검증
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canPublish}
            onClick={onPublish}
          >
            게시하기
          </Button>
        </div>
      </section>

      <ContentValidation>
        <ContentValidationHeader>
          <ContentValidationTitle>검증 결과</ContentValidationTitle>
          <ContentValidationSummary>
            오류 {errors} · 경고 {warnings}
          </ContentValidationSummary>
        </ContentValidationHeader>
        <ContentValidationList>
          {issues.length === 0 ? (
            <p className="px-1 py-6 text-sm text-muted-foreground">
              검증 이슈가 없습니다.
            </p>
          ) : (
            issues.map((issue) => (
              <ContentValidationIssue key={issue.id} severity={issue.severity}>
                <ContentValidationIssueTitle>
                  {issue.severity === "error" ? "⛔ " : "⚠ "}
                  {issue.title}
                </ContentValidationIssueTitle>
                <ContentValidationIssueDetail>
                  {issue.detail}
                </ContentValidationIssueDetail>
                <ContentValidationIssueMeta severity={issue.severity} />
                <ContentValidationIssueActions>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => onNavigate(issue.selection)}
                  >
                    이동
                  </Button>
                </ContentValidationIssueActions>
              </ContentValidationIssue>
            ))
          )}
        </ContentValidationList>
      </ContentValidation>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">
            게시 이력
          </h2>
          <a
            href="#audit-log"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            onClick={(event) => event.preventDefault()}
          >
            감사 로그 →
          </a>
        </div>
        <div className="rounded-[1.25rem] border border-border/70 px-4 py-6 text-sm text-muted-foreground">
          {publishStatus === "draft"
            ? "게시된 버전이 없습니다."
            : "가장 최근 게시본이 학습자에게 노출됩니다."}
        </div>
      </section>
    </div>
  )
}

/**
 * Admin course detail: tabbed workspace for course info, curriculum editing, and release tools.
 */
export function CourseAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [tab, setTab] = React.useState("curriculum")
  const [courseTitle, setCourseTitle] = React.useState(COURSE.title)
  const [courseTopic, setCourseTopic] = React.useState(COURSE.topic)
  const [courseLevel, setCourseLevel] = React.useState(COURSE.level)
  const [courseDescription, setCourseDescription] = React.useState(
    COURSE.description
  )
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(
    COURSE.thumbnailUrl
  )
  const [publishStatus, setPublishStatus] = React.useState<PublishStatus>(
    COURSE.publishStatus
  )
  const [lastPublishedAt, setLastPublishedAt] = React.useState<string | null>(
    null
  )
  const [updatedAt, setUpdatedAt] = React.useState(COURSE.updatedAt)
  const [lastSavedAt, setLastSavedAt] = React.useState(() => Date.now())
  const [now, setNow] = React.useState(() => Date.now())
  const [previewMessage, setPreviewMessage] = React.useState<string | null>(
    null
  )
  const [revalidateMessage, setRevalidateMessage] = React.useState<
    string | null
  >(null)
  const [units, setUnits] = React.useState<UnitNode[]>(COURSE.units)
  const [selection, setSelection] = React.useState<CurriculumSelection | null>({
    kind: "lesson",
    id: "lesson-1",
  })

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const issues = React.useMemo(
    () => withCourseIssues(units, courseDescription),
    [units, courseDescription]
  )
  const errorCount = issues.filter((issue) => issue.severity === "error").length
  const canPublish = errorCount === 0

  function markDirty() {
    setLastSavedAt(Date.now())
    setUpdatedAt(new Date().toISOString())
    setPublishStatus((current) =>
      current === "published" ? "published-with-changes" : current
    )
  }

  const handleUnitsChange = React.useCallback((next: UnitNode[]) => {
    setUnits(next)
    setLastSavedAt(Date.now())
    setUpdatedAt(new Date().toISOString())
    setPublishStatus((current) =>
      current === "published" ? "published-with-changes" : current
    )
  }, [])

  const handleSelectionChange = React.useCallback(
    (next: CurriculumSelection | null) => {
      setSelection(next)
    },
    []
  )

  function handleNavigate(next: CurriculumSelection) {
    if (next.kind === "unit" && !next.id) {
      setTab("curriculum")
      return
    }
    setSelection(next)
    setTab("curriculum")
  }

  function handlePublish() {
    if (!canPublish) return
    setPublishStatus("published")
    setLastPublishedAt(new Date().toISOString())
    setLastSavedAt(Date.now())
  }

  return (
    <AdminShell
      data-slot="course-admin"
      activeNav="courses"
      title={courseTitle}
      breadcrumb={[{ label: "코스", href: "#courses" }]}
      contentClassName="min-h-0 gap-3 overflow-hidden sm:gap-4"
      className={cn("h-full min-h-0!", className)}
      {...props}
    >
      <CoursePageChrome
        title={courseTitle}
        topic={courseTopic}
        level={courseLevel}
        publishStatus={publishStatus}
        savedLabel={formatSavedAgo(lastSavedAt, now)}
        canPublish={canPublish}
        errorCount={errorCount}
        onPreview={() =>
          setPreviewMessage(
            "학습자 미리보기는 데모에서 별도 창 대신 안내만 표시합니다."
          )
        }
        onPublish={handlePublish}
      />

      {previewMessage ? (
        <output className="rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {previewMessage}
        </output>
      ) : null}
      {revalidateMessage ? (
        <output className="rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {revalidateMessage}
        </output>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="info">코스 정보</TabsTrigger>
          <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
          <TabsTrigger value="release">
            검증·게시
            {errorCount > 0 ? ` ⚠${errorCount}` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="info"
          className="min-h-0 overflow-auto rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <CourseMetaForm
            title={courseTitle}
            topic={courseTopic}
            level={courseLevel}
            description={courseDescription}
            thumbnailUrl={thumbnailUrl}
            createdAt={COURSE.createdAt}
            createdBy={COURSE.createdBy}
            updatedAt={updatedAt}
            updatedBy={COURSE.updatedBy}
            onTitleChange={(value) => {
              setCourseTitle(value)
              markDirty()
            }}
            onTopicChange={(value) => {
              setCourseTopic(value)
              markDirty()
            }}
            onLevelChange={(value) => {
              setCourseLevel(value)
              markDirty()
            }}
            onDescriptionChange={(value) => {
              setCourseDescription(value)
              markDirty()
            }}
            onThumbnailChange={(value) => {
              setThumbnailUrl(value)
              markDirty()
            }}
          />
        </TabsContent>

        <TabsContent
          value="curriculum"
          className="flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
        >
          <CurriculumBuilder
            units={units}
            onUnitsChange={handleUnitsChange}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            issues={issues}
            className="min-h-0 flex-1"
          />
        </TabsContent>

        <TabsContent
          value="release"
          className="min-h-0 overflow-auto rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <ReleasePanel
            publishStatus={publishStatus}
            issues={issues}
            canPublish={canPublish}
            lastPublishedLabel={
              lastPublishedAt ? formatDateTime(lastPublishedAt) : "없음"
            }
            onNavigate={handleNavigate}
            onRevalidate={() =>
              setRevalidateMessage(
                `검증을 다시 실행했습니다. 오류 ${errorCount}건 · 경고 ${issues.length - errorCount}건`
              )
            }
            onPublish={handlePublish}
          />
        </TabsContent>
      </Tabs>
    </AdminShell>
  )
}

export default CourseAdmin
