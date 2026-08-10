"use client";

import * as React from "react";

import { cn } from "@/registry/luma/lib/utils";
import { AdminShell } from "@/registry/luma/blocks/admin-shell";
import {
  CurriculumBuilder,
  normalizeUnits,
  validateCurriculum,
  type CurriculumSelection,
  type LessonStep,
  type UnitNode,
  type ValidationIssue,
} from "@/registry/luma/blocks/curriculum-builder";
import { Badge } from "@/registry/luma/ui/badge";
import { Button } from "@/registry/luma/ui/button";
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
} from "@/registry/luma/ui/content-validation";
import type { CurriculumNodeState } from "@/registry/luma/ui/curriculum-tree";
import { Field, FieldGroup, FieldLabel } from "@/registry/luma/ui/field";
import { Input } from "@/registry/luma/ui/input";
import {
  LearnerPreview,
  LearnerPreviewDevice,
  LearnerPreviewFrame,
  LearnerPreviewHeader,
  LearnerPreviewPersona,
  LearnerPreviewStage,
  LearnerPreviewState,
  LearnerPreviewTitle,
  LearnerPreviewToolbar,
} from "@/registry/luma/ui/learner-preview";
import {
  PublishWorkflow,
  PublishWorkflowActions,
  PublishWorkflowEnvironment,
  PublishWorkflowHeader,
  PublishWorkflowMeta,
  PublishWorkflowStep,
  PublishWorkflowSteps,
  PublishWorkflowTitle,
} from "@/registry/luma/ui/publish-workflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/luma/ui/select";
import { Step, StepBody, StepHeader, StepTitle } from "@/registry/luma/ui/step";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/luma/ui/tabs";
import { Textarea } from "@/registry/luma/ui/textarea";

type CourseFixture = {
  id: string;
  title: string;
  topic: string;
  level: string;
  description: string;
  listStatus: "preview";
  treeState: CurriculumNodeState;
  units: UnitNode[];
};

const TOPIC_ITEMS = [
  { label: "읽기", value: "읽기" },
  { label: "듣기", value: "듣기" },
  { label: "말하기", value: "말하기" },
  { label: "쓰기", value: "쓰기" },
  { label: "문법", value: "문법" },
  { label: "어휘", value: "어휘" },
  { label: "회화", value: "회화" },
] as const;

const LEVEL_ITEMS = [
  { label: "초급", value: "초급" },
  { label: "중급", value: "중급" },
  { label: "고급", value: "고급" },
] as const;

const INITIAL_UNITS: UnitNode[] = normalizeUnits([
  {
    id: "unit-1",
    title: "문단의 중심 생각",
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
    ],
  },
  {
    id: "unit-2",
    title: "추론하며 읽기",
    description: "글에 드러나지 않은 정보를 문맥으로 채웁니다.",
    state: "draft",
    lessons: [
      {
        id: "lesson-3",
        title: "생략된 정보 채우기",
        state: "draft",
        steps: [
          {
            id: "step-3a",
            type: "READING",
            title: "읽기",
            prompt: "대화 일부를 읽고 빠진 상황을 추론하세요.",
            body: "대화 일부를 읽고 빠진 상황을 추론하세요.",
          },
          {
            id: "step-3b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "화자가 다음에 할 행동으로 알맞은 것은?",
            body: "화자가 다음에 할 행동으로 알맞은 것은?",
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
        title: "필자의 의도",
        state: "ready",
        steps: [
          {
            id: "step-4a",
            type: "READING",
            title: "읽기",
            prompt: "칼럼의 일부입니다. 필자의 태도를 파악하세요.",
            body: "칼럼의 일부입니다. 필자의 태도를 파악하세요.",
          },
          {
            id: "step-4b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "필자의 의도로 가장 알맞은 것은?",
            body: "필자의 의도로 가장 알맞은 것은?",
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
            prompt: "근거가 되는 표현을 문장에서 찾아 적어 보세요.",
            body: "근거가 되는 표현을 문장에서 찾아 적어 보세요.",
          },
          {
            id: "step-4d",
            type: "WRITE",
            title: "힌트 쓰기",
            prompt: "힌트: 접속 표현에 주목하세요.",
            body: "힌트: 접속 표현에 주목하세요.",
          },
        ],
      },
    ],
  },
  {
    id: "unit-3",
    title: "비평적 읽기",
    description: "주장과 근거를 가려 읽고 타당성을 점검합니다.",
    state: "draft",
    lessons: [
      {
        id: "lesson-5",
        title: "주장과 근거 가려내기",
        state: "draft",
        steps: [
          {
            id: "step-5a",
            type: "READING",
            title: "읽기",
            prompt: "짧은 의견문을 읽고 주장 문장을 표시하세요.",
            body: "짧은 의견문을 읽고 주장 문장을 표시하세요.",
          },
          {
            id: "step-5b",
            type: "MULTIPLE_CHOICE",
            title: "객관식",
            prompt: "근거로 쓰인 문장을 고르세요.",
            body: "근거로 쓰인 문장을 고르세요.",
            options: [
              { id: "opt-5b-a", label: "선택지 A" },
              { id: "opt-5b-b", label: "선택지 B" },
              { id: "opt-5b-c", label: "선택지 C" },
              { id: "opt-5b-d", label: "선택지 D" },
            ],
            correctOptionIds: ["opt-5b-a"],
          },
          {
            id: "step-5c",
            type: "WRITE",
            title: "쓰기",
            prompt: "근거가 주장을 얼마나 지지하는지 한 문장으로 평가하세요.",
            body: "근거가 주장을 얼마나 지지하는지 한 문장으로 평가하세요.",
          },
        ],
      },
    ],
  },
]);

const COURSE: CourseFixture = {
  id: "crs-03",
  title: "중급 읽기",
  topic: "읽기",
  level: "중급",
  description:
    "문단의 중심 생각과 세부 정보를 구분하고, 생략된 정보를 추론하며 읽는 중급 코스입니다.",
  listStatus: "preview",
  treeState: "ready",
  units: INITIAL_UNITS,
};

function findPreviewStep(units: UnitNode[]): LessonStep | undefined {
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const step = lesson.steps.find((item) => item.type === "MULTIPLE_CHOICE") ?? lesson.steps[0];
      if (step) return step;
    }
  }
  return undefined;
}

function CourseMetaForm({
  title,
  topic,
  level,
  description,
  onTitleChange,
  onTopicChange,
  onLevelChange,
  onDescriptionChange,
}: {
  title: string;
  topic: string;
  level: string;
  description: string;
  onTitleChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <section data-slot="course-admin-course-form" className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">코스 정보</h2>
        <p className="text-sm text-muted-foreground">학습자에게 보이는 기본 정보를 수정합니다.</p>
      </header>
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
                const next = Array.isArray(value) ? value[0] : value;
                if (typeof next === "string") onTopicChange(next);
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
                const next = Array.isArray(value) ? value[0] : value;
                if (typeof next === "string") onLevelChange(next);
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
        <Field>
          <FieldLabel htmlFor="course-description">설명</FieldLabel>
          <Textarea
            id="course-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="min-h-28"
          />
        </Field>
      </FieldGroup>
    </section>
  );
}

function ToolsPanel({
  issues,
  onNavigate,
  canPublish,
  previewStep,
}: {
  issues: ValidationIssue[];
  onNavigate: (selection: CurriculumSelection) => void;
  canPublish: boolean;
  previewStep?: LessonStep;
}) {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;

  return (
    <Tabs defaultValue="validation" className="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList variant="line" className="w-fit shrink-0 justify-start">
        <TabsTrigger value="validation">검증</TabsTrigger>
        <TabsTrigger value="publish">게시</TabsTrigger>
        <TabsTrigger value="preview">미리보기</TabsTrigger>
      </TabsList>

      <TabsContent value="validation" className="min-h-0 overflow-auto">
        <ContentValidation>
          <ContentValidationHeader>
            <ContentValidationTitle>콘텐츠 검증</ContentValidationTitle>
            <ContentValidationSummary>
              오류 {errors} · 경고 {warnings}
            </ContentValidationSummary>
          </ContentValidationHeader>
          <ContentValidationList>
            {issues.length === 0 ? (
              <p className="px-1 py-6 text-sm text-muted-foreground">검증 이슈가 없습니다.</p>
            ) : (
              issues.map((issue) => (
                <ContentValidationIssue key={issue.id} severity={issue.severity}>
                  <ContentValidationIssueTitle>{issue.title}</ContentValidationIssueTitle>
                  <ContentValidationIssueDetail>{issue.detail}</ContentValidationIssueDetail>
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
      </TabsContent>

      <TabsContent value="publish" className="min-h-0 overflow-auto">
        <PublishWorkflow>
          <PublishWorkflowHeader>
            <PublishWorkflowTitle>게시</PublishWorkflowTitle>
            <PublishWorkflowEnvironment env="preview" />
          </PublishWorkflowHeader>
          <PublishWorkflowSteps>
            <PublishWorkflowStep state="draft" />
            <PublishWorkflowStep state="review" active />
            <PublishWorkflowStep state="scheduled" />
            <PublishWorkflowStep state="published" />
          </PublishWorkflowSteps>
          <PublishWorkflowMeta>
            {canPublish
              ? "Preview에서 검토를 마친 뒤 Live로 승격합니다. Live 원클릭은 막혀 있습니다."
              : `검증 오류 ${errors}건을 해결한 뒤 Preview에 게시할 수 있습니다.`}
          </PublishWorkflowMeta>
          <PublishWorkflowActions>
            <Button size="sm" variant="outline" type="button" disabled={!canPublish}>
              예약
            </Button>
            <Button size="sm" type="button" disabled={!canPublish}>
              Preview 게시
            </Button>
          </PublishWorkflowActions>
        </PublishWorkflow>
      </TabsContent>

      <TabsContent value="preview" className="min-h-0 overflow-auto">
        <LearnerPreview>
          <LearnerPreviewHeader>
            <LearnerPreviewTitle>학습자 미리보기</LearnerPreviewTitle>
          </LearnerPreviewHeader>
          <LearnerPreviewToolbar>
            <LearnerPreviewDevice device="desktop" active />
            <LearnerPreviewDevice device="mobile" />
            <LearnerPreviewPersona persona="novice" active />
            <LearnerPreviewState scenario="correct" />
          </LearnerPreviewToolbar>
          <LearnerPreviewStage device="desktop" className="mt-2">
            <LearnerPreviewFrame className="min-h-40 max-w-md rounded-2xl border border-border/70 bg-muted/30 p-2">
              <Step className="rounded-xl bg-card p-3 shadow-2xs">
                <StepHeader>
                  <StepTitle>{previewStep?.title ?? "주제문 찾기"}</StepTitle>
                </StepHeader>
                <StepBody>
                  {previewStep?.prompt ?? "이 문단의 중심 생각을 가장 잘 나타낸 문장은 무엇입니까?"}
                </StepBody>
              </Step>
            </LearnerPreviewFrame>
          </LearnerPreviewStage>
        </LearnerPreview>
      </TabsContent>
    </Tabs>
  );
}

/**
 * Admin course detail: tabbed workspace for course info, curriculum editing, and release tools.
 */
export function CourseAdmin({ className, ...props }: React.ComponentProps<"div">) {
  const [tab, setTab] = React.useState("curriculum");
  const [courseTitle, setCourseTitle] = React.useState(COURSE.title);
  const [courseTopic, setCourseTopic] = React.useState(COURSE.topic);
  const [courseLevel, setCourseLevel] = React.useState(COURSE.level);
  const [courseDescription, setCourseDescription] = React.useState(COURSE.description);
  const [units, setUnits] = React.useState<UnitNode[]>(COURSE.units);
  const [selection, setSelection] = React.useState<CurriculumSelection | null>({
    kind: "lesson",
    id: "lesson-1",
  });

  const issues = React.useMemo(() => validateCurriculum(units), [units]);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const previewStep = React.useMemo(() => findPreviewStep(units), [units]);

  const handleUnitsChange = React.useCallback((next: UnitNode[]) => {
    setUnits(next);
  }, []);

  const handleSelectionChange = React.useCallback((next: CurriculumSelection | null) => {
    setSelection(next);
  }, []);

  function handleNavigate(next: CurriculumSelection) {
    setSelection(next);
    setTab("curriculum");
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
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <TabsList className="w-fit">
            <TabsTrigger value="info">코스 정보</TabsTrigger>
            <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
            <TabsTrigger value="release">검증·게시</TabsTrigger>
          </TabsList>
          <Badge variant="info">미리보기</Badge>
          {errorCount > 0 ? (
            <Badge variant="destructive" className="tabular-nums">
              오류 {errorCount}
            </Badge>
          ) : null}
        </div>

        <TabsContent
          value="info"
          className="min-h-0 overflow-auto rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <CourseMetaForm
            title={courseTitle}
            topic={courseTopic}
            level={courseLevel}
            description={courseDescription}
            onTitleChange={setCourseTitle}
            onTopicChange={setCourseTopic}
            onLevelChange={setCourseLevel}
            onDescriptionChange={setCourseDescription}
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
            className="min-h-0 flex-1"
          />
        </TabsContent>

        <TabsContent
          value="release"
          className="min-h-0 overflow-auto rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          <ToolsPanel
            issues={issues}
            onNavigate={handleNavigate}
            canPublish={errorCount === 0}
            previewStep={previewStep}
          />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

export default CourseAdmin;
