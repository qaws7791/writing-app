"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CreditCardIcon } from "@hugeicons/core-free-icons";

import {
  AdminOverview,
  AdminOverviewHeader,
  AdminOverviewItem,
  AdminOverviewItemActions,
  AdminOverviewItemMeta,
  AdminOverviewItemReason,
  AdminOverviewItemTitle,
  AdminOverviewList,
  AdminOverviewMeta,
  AdminOverviewTitle,
} from "@workspace/ui/components/ui/admin-overview";
import {
  AuditLog,
  AuditLogAction,
  AuditLogActor,
  AuditLogEntry,
  AuditLogEnvironment,
  AuditLogHeader,
  AuditLogKind,
  AuditLogList,
  AuditLogMeta,
  AuditLogRestore,
  AuditLogTarget,
  AuditLogTime,
  AuditLogTitle,
} from "@workspace/ui/components/ui/audit-log";
import {
  CohortAssignment,
  CohortAssignmentActions,
  CohortAssignmentDeadline,
  CohortAssignmentHeader,
  CohortAssignmentMembers,
  CohortAssignmentMeta,
  CohortAssignmentTargets,
  CohortAssignmentTitle,
  CohortMember,
  CohortTarget,
  CohortTargetLabel,
  CohortTargetTitle,
} from "@workspace/ui/components/ui/cohort-assignment";
import {
  ContentReview,
  ContentReviewActions,
  ContentReviewAssignee,
  ContentReviewComment,
  ContentReviewCommentAuthor,
  ContentReviewCommentBody,
  ContentReviewCommentMeta,
  ContentReviewComments,
  ContentReviewHeader,
  ContentReviewMeta,
  ContentReviewStatus,
  ContentReviewTitle,
} from "@workspace/ui/components/ui/content-review";
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
} from "@workspace/ui/components/ui/content-validation";
import {
  CurriculumMap,
  CurriculumMapEdge,
  CurriculumMapGap,
  CurriculumMapHeader,
  CurriculumMapHint,
  CurriculumMapLink,
  CurriculumMapList,
  CurriculumMapNode,
  CurriculumMapNodeBody,
  CurriculumMapNodeLabel,
  CurriculumMapTitle,
} from "@workspace/ui/components/ui/curriculum-map";
import {
  CurriculumNode,
  CurriculumNodeActions,
  CurriculumNodeChildren,
  CurriculumNodeCount,
  CurriculumNodeDisclosure,
  CurriculumNodeLabel,
  CurriculumNodeMeta,
  CurriculumTree,
  CurriculumTreeHeader,
  CurriculumTreeList,
  CurriculumTreeTitle,
} from "@workspace/ui/components/ui/curriculum-tree";
import {
  Exemplar,
  ExemplarActions,
  ExemplarAnnotation,
  ExemplarAnnotations,
  ExemplarBody,
  ExemplarLibrary,
  ExemplarLibraryHeader,
  ExemplarLibraryTitle,
  ExemplarList,
  ExemplarMeta,
  ExemplarTitle,
} from "@workspace/ui/components/ui/exemplar-library";
import {
  FeedbackAudit,
  FeedbackAuditActions,
  FeedbackAuditHeader,
  FeedbackAuditList,
  FeedbackAuditMeta,
  FeedbackAuditSample,
  FeedbackAuditSampleBody,
  FeedbackAuditSampleOrigin,
  FeedbackAuditScore,
  FeedbackAuditScoreLabel,
  FeedbackAuditScoreValue,
  FeedbackAuditScores,
  FeedbackAuditTitle,
} from "@workspace/ui/components/ui/feedback-audit";
import {
  InterventionItem,
  InterventionItemActions,
  InterventionItemEvidence,
  InterventionItemName,
  InterventionItemReason,
  InterventionQueue,
  InterventionQueueHeader,
  InterventionQueueList,
  InterventionQueueMeta,
  InterventionQueueTitle,
} from "@workspace/ui/components/ui/intervention-queue";
import {
  RunQueue,
  RunQueueEnvironment,
  RunQueueGroup,
  RunQueueGroupCount,
  RunQueueGroupHeader,
  RunQueueGroupHint,
  RunQueueGroupTitle,
  RunQueueGroups,
  RunQueueHeader,
  RunQueueItem,
  RunQueueItemBody,
  RunQueueItemIcon,
  RunQueueItemProgress,
  RunQueueItemStep,
  RunQueueItemTime,
  RunQueueItemTitle,
  RunQueueList,
  RunQueueMeta,
  RunQueueOutcome,
  RunQueueTitle,
} from "@workspace/ui/components/ui/run-queue";
import {
  StepTrace,
  StepTraceBody,
  StepTraceDuration,
  StepTraceError,
  StepTraceHeader,
  StepTraceList,
  StepTraceMark,
  StepTraceMeta,
  StepTraceStatusBadge,
  StepTraceStep,
  StepTraceStepHeader,
  StepTraceStepTitle,
  StepTraceTitle,
  StepTraceTool,
  StepTraceToolDuration,
  StepTraceToolName,
  StepTraceToolStatus,
  StepTraceTools,
} from "@workspace/ui/components/ui/step-trace";
import {
  ItemAnalysis,
  ItemAnalysisDistractor,
  ItemAnalysisDistractors,
  ItemAnalysisFlag,
  ItemAnalysisFlags,
  ItemAnalysisHeader,
  ItemAnalysisList,
  ItemAnalysisMeta,
  ItemAnalysisPrompt,
  ItemAnalysisRow,
  ItemAnalysisStat,
  ItemAnalysisStatLabel,
  ItemAnalysisStatValue,
  ItemAnalysisStats,
  ItemAnalysisTitle,
} from "@workspace/ui/components/ui/item-analysis";
import {
  ItemBank,
  ItemBankFilters,
  ItemBankHeader,
  ItemBankItem,
  ItemBankItemActions,
  ItemBankItemMeta,
  ItemBankItemTag,
  ItemBankItemTags,
  ItemBankItemTitle,
  ItemBankList,
  ItemBankTitle,
} from "@workspace/ui/components/ui/item-bank";
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
} from "@workspace/ui/components/ui/learner-preview";
import {
  LearnerRecord,
  LearnerRecordAttempts,
  LearnerRecordHeader,
  LearnerRecordMastery,
  LearnerRecordMeta,
  LearnerRecordPath,
  LearnerRecordSection,
  LearnerRecordSectionTitle,
  LearnerRecordTitle,
} from "@workspace/ui/components/ui/learner-record";
import { AvatarFallback } from "@workspace/ui/components/ui/avatar";
import {
  Person,
  PersonAvatar,
  PersonDescription,
  PersonInfo,
  PersonName,
} from "@workspace/ui/components/ui/person";
import {
  LearningAnalytics,
  LearningAnalyticsGrid,
  LearningAnalyticsHeader,
  LearningAnalyticsMeta,
  LearningAnalyticsMetric,
  LearningAnalyticsMetricHint,
  LearningAnalyticsMetricLabel,
  LearningAnalyticsMetricValue,
  LearningAnalyticsRow,
  LearningAnalyticsSeries,
  LearningAnalyticsTitle,
} from "@workspace/ui/components/ui/learning-analytics";
import {
  LessonBuilder,
  LessonBuilderBody,
  LessonBuilderCanvas,
  LessonBuilderHeader,
  LessonBuilderMeta,
  LessonBuilderPalette,
  LessonBuilderPaletteItem,
  LessonBuilderPaletteLabel,
  LessonBuilderStep,
  LessonBuilderStepActions,
  LessonBuilderStepBody,
  LessonBuilderStepIndex,
  LessonBuilderStepType,
  LessonBuilderTitle,
} from "@workspace/ui/components/ui/lesson-builder";
import {
  PromptBuilder,
  PromptBuilderConstraint,
  PromptBuilderConstraints,
  PromptBuilderField,
  PromptBuilderFieldLabel,
  PromptBuilderFieldValue,
  PromptBuilderHeader,
  PromptBuilderSection,
  PromptBuilderSectionTitle,
  PromptBuilderTitle,
} from "@workspace/ui/components/ui/prompt-builder";
import {
  ProvenancePanel,
  ProvenanceList,
  ProvenancePanelHeader,
  ProvenancePanelTitle,
  ProvenanceRow,
  ProvenanceRowActions,
  ProvenanceRowLabel,
  ProvenanceRowMeta,
  ProvenanceRowModel,
  ProvenanceRowStatus,
} from "@workspace/ui/components/ui/provenance-panel";
import {
  PublishWorkflow,
  PublishWorkflowActions,
  PublishWorkflowEnvironment,
  PublishWorkflowHeader,
  PublishWorkflowMeta,
  PublishWorkflowStep,
  PublishWorkflowSteps,
  PublishWorkflowTitle,
} from "@workspace/ui/components/ui/publish-workflow";
import {
  RubricEditor,
  RubricEditorActions,
  RubricEditorCriterion,
  RubricEditorCriterionHeader,
  RubricEditorCriterionLabel,
  RubricEditorHeader,
  RubricEditorLevel,
  RubricEditorLevelDescription,
  RubricEditorLevelLabel,
  RubricEditorLevels,
  RubricEditorList,
  RubricEditorTitle,
  RubricEditorVersion,
  RubricEditorWeight,
} from "@workspace/ui/components/ui/rubric-editor";
import { Step, StepBody, StepHeader, StepTitle } from "@workspace/ui/components/ui/step";
import { Button } from "@workspace/ui/components/ui/button";
import {
  WritingAnalytics,
  WritingAnalyticsCriteria,
  WritingAnalyticsCriterion,
  WritingAnalyticsGenre,
  WritingAnalyticsGrid,
  WritingAnalyticsHeader,
  WritingAnalyticsHint,
  WritingAnalyticsMeta,
  WritingAnalyticsMetric,
  WritingAnalyticsMetricLabel,
  WritingAnalyticsMetricValue,
  WritingAnalyticsTitle,
} from "@workspace/ui/components/ui/writing-analytics";

function AdminOverviewDemo() {
  return (
    <AdminOverview className="w-full max-w-lg">
      <AdminOverviewHeader>
        <AdminOverviewTitle>오늘 처리할 항목</AdminOverviewTitle>
        <AdminOverviewMeta>3건</AdminOverviewMeta>
      </AdminOverviewHeader>
      <AdminOverviewList>
        <AdminOverviewItem severity="urgent">
          <AdminOverviewItemTitle>레슨 3 검토 대기</AdminOverviewItemTitle>
          <AdminOverviewItemReason>내일 수업 전 게시가 필요합니다.</AdminOverviewItemReason>
          <AdminOverviewItemMeta severity="urgent" />
          <AdminOverviewItemActions>
            <Button size="sm" variant="outline">
              열기
            </Button>
          </AdminOverviewItemActions>
        </AdminOverviewItem>
        <AdminOverviewItem severity="warning">
          <AdminOverviewItemTitle>문항 12 이탈률 상승</AdminOverviewItemTitle>
          <AdminOverviewItemReason>최근 7일간 완료율이 40% 하락했습니다.</AdminOverviewItemReason>
          <AdminOverviewItemMeta severity="warning" />
        </AdminOverviewItem>
      </AdminOverviewList>
    </AdminOverview>
  );
}

function CurriculumTreeDemo() {
  return (
    <CurriculumTree className="w-full max-w-md">
      <CurriculumTreeHeader>
        <CurriculumTreeTitle>설득 글쓰기</CurriculumTreeTitle>
      </CurriculumTreeHeader>
      <CurriculumTreeList>
        <CurriculumNode level="unit" state="ready" selected expanded depth={0}>
          <CurriculumNodeDisclosure expanded />
          <CurriculumNodeLabel>주장과 근거</CurriculumNodeLabel>
          <CurriculumNodeMeta level="unit" state="ready" quiet />
          <CurriculumNodeCount>2</CurriculumNodeCount>
          <CurriculumNodeActions>
            <Button size="icon-sm" variant="ghost" aria-label="메뉴">
              ···
            </Button>
          </CurriculumNodeActions>
          <CurriculumNodeChildren>
            <CurriculumNode level="lesson" state="ready" depth={1}>
              <span className="size-6 shrink-0" aria-hidden />
              <CurriculumNodeLabel>주제문 찾기</CurriculumNodeLabel>
              <CurriculumNodeMeta level="lesson" state="ready" quiet />
            </CurriculumNode>
            <CurriculumNode level="lesson" state="draft" depth={1}>
              <span className="size-6 shrink-0" aria-hidden />
              <CurriculumNodeLabel>반박하기</CurriculumNodeLabel>
              <CurriculumNodeMeta level="lesson" state="draft" quiet />
            </CurriculumNode>
          </CurriculumNodeChildren>
        </CurriculumNode>
      </CurriculumTreeList>
    </CurriculumTree>
  );
}

function CurriculumMapDemo() {
  return (
    <CurriculumMap className="w-full max-w-xl">
      <CurriculumMapHeader>
        <CurriculumMapTitle>개념 연결</CurriculumMapTitle>
        <CurriculumMapHint>누락된 선행 개념을 확인하세요.</CurriculumMapHint>
      </CurriculumMapHeader>
      <CurriculumMapList>
        <CurriculumMapLink>
          <CurriculumMapNode kind="objective">
            <CurriculumMapNodeLabel kind="objective" />
            <CurriculumMapNodeBody>주장을 한 문장으로 표현한다</CurriculumMapNodeBody>
          </CurriculumMapNode>
          <CurriculumMapEdge>선행</CurriculumMapEdge>
          <CurriculumMapNode kind="concept">
            <CurriculumMapNodeLabel kind="concept" />
            <CurriculumMapNodeBody>근거의 종류</CurriculumMapNodeBody>
          </CurriculumMapNode>
        </CurriculumMapLink>
        <CurriculumMapGap kind="missing">반박 개념 연결 누락</CurriculumMapGap>
      </CurriculumMapList>
    </CurriculumMap>
  );
}

function LessonBuilderDemo() {
  return (
    <LessonBuilder className="w-full max-w-2xl">
      <LessonBuilderHeader>
        <LessonBuilderTitle>레슨 2 · 근거 붙이기</LessonBuilderTitle>
        <LessonBuilderMeta>2 스텝 · 초안</LessonBuilderMeta>
      </LessonBuilderHeader>
      <LessonBuilderBody>
        <LessonBuilderPalette>
          <LessonBuilderPaletteLabel>스텝 추가</LessonBuilderPaletteLabel>
          <LessonBuilderPaletteItem>읽기</LessonBuilderPaletteItem>
          <LessonBuilderPaletteItem>객관식</LessonBuilderPaletteItem>
          <LessonBuilderPaletteItem>쓰기</LessonBuilderPaletteItem>
        </LessonBuilderPalette>
        <LessonBuilderCanvas>
          <LessonBuilderStep index={1} selected>
            <LessonBuilderStepIndex>1</LessonBuilderStepIndex>
            <LessonBuilderStepBody>
              <div className="flex flex-col gap-1.5">
                <LessonBuilderStepType>읽기</LessonBuilderStepType>
                <p className="font-medium">주장을 먼저 읽고 근거를 찾아보세요.</p>
              </div>
            </LessonBuilderStepBody>
            <LessonBuilderStepActions>
              <Button size="icon-sm" variant="ghost" aria-label="메뉴">
                ···
              </Button>
            </LessonBuilderStepActions>
          </LessonBuilderStep>
          <LessonBuilderStep index={2}>
            <LessonBuilderStepIndex>2</LessonBuilderStepIndex>
            <LessonBuilderStepBody>
              <div className="flex flex-col gap-1.5">
                <LessonBuilderStepType>객관식</LessonBuilderStepType>
                <p className="font-medium">근거가 주장을 지지하는지 고르세요.</p>
              </div>
            </LessonBuilderStepBody>
          </LessonBuilderStep>
        </LessonBuilderCanvas>
      </LessonBuilderBody>
    </LessonBuilder>
  );
}

function ItemBankDemo() {
  return (
    <ItemBank className="w-full max-w-lg">
      <ItemBankHeader>
        <ItemBankTitle>문항 은행</ItemBankTitle>
        <ItemBankFilters>
          <Button size="sm" variant="outline">
            필터
          </Button>
        </ItemBankFilters>
      </ItemBankHeader>
      <ItemBankList>
        <ItemBankItem status="ready">
          <ItemBankItemTitle>주장-근거 거리 판단</ItemBankItemTitle>
          <ItemBankItemMeta status="ready" />
          <ItemBankItemTags>
            <ItemBankItemTag>객관식</ItemBankItemTag>
            <ItemBankItemTag>설득</ItemBankItemTag>
          </ItemBankItemTags>
          <ItemBankItemActions>
            <Button size="sm" variant="ghost">
              미리보기
            </Button>
          </ItemBankItemActions>
        </ItemBankItem>
        <ItemBankItem status="draft">
          <ItemBankItemTitle>반박 문장 고르기</ItemBankItemTitle>
          <ItemBankItemMeta status="draft" />
        </ItemBankItem>
      </ItemBankList>
    </ItemBank>
  );
}

function PromptBuilderDemo() {
  return (
    <PromptBuilder className="w-full max-w-md">
      <PromptBuilderHeader>
        <PromptBuilderTitle>코칭 프롬프트</PromptBuilderTitle>
      </PromptBuilderHeader>
      <PromptBuilderSection>
        <PromptBuilderSectionTitle>역할</PromptBuilderSectionTitle>
        <PromptBuilderField>
          <PromptBuilderFieldLabel>시스템</PromptBuilderFieldLabel>
          <PromptBuilderFieldValue>논리 코치. 직접 답을 주지 않는다.</PromptBuilderFieldValue>
        </PromptBuilderField>
      </PromptBuilderSection>
      <PromptBuilderConstraints>
        <PromptBuilderConstraint>근거를 인용하도록 유도</PromptBuilderConstraint>
        <PromptBuilderConstraint>학습자 글을 그대로 인용</PromptBuilderConstraint>
      </PromptBuilderConstraints>
    </PromptBuilder>
  );
}

function RubricEditorDemo() {
  return (
    <RubricEditor className="w-full max-w-lg">
      <RubricEditorHeader>
        <RubricEditorTitle>설득문 루브릭</RubricEditorTitle>
        <RubricEditorVersion>v2</RubricEditorVersion>
      </RubricEditorHeader>
      <RubricEditorList>
        <RubricEditorCriterion expanded>
          <RubricEditorCriterionHeader>
            <RubricEditorCriterionLabel>주장의 명확성</RubricEditorCriterionLabel>
            <RubricEditorWeight>30%</RubricEditorWeight>
          </RubricEditorCriterionHeader>
          <RubricEditorLevels>
            <RubricEditorLevel tier="high">
              <RubricEditorLevelLabel>우수</RubricEditorLevelLabel>
              <RubricEditorLevelDescription>한 문장으로 분명한 주장</RubricEditorLevelDescription>
            </RubricEditorLevel>
            <RubricEditorLevel tier="mid">
              <RubricEditorLevelLabel>보통</RubricEditorLevelLabel>
              <RubricEditorLevelDescription>주장은 있으나 모호함</RubricEditorLevelDescription>
            </RubricEditorLevel>
          </RubricEditorLevels>
        </RubricEditorCriterion>
      </RubricEditorList>
      <RubricEditorActions>
        <Button size="sm">저장</Button>
      </RubricEditorActions>
    </RubricEditor>
  );
}

function ExemplarLibraryDemo() {
  return (
    <ExemplarLibrary className="w-full max-w-lg">
      <ExemplarLibraryHeader>
        <ExemplarLibraryTitle>모범 답안</ExemplarLibraryTitle>
      </ExemplarLibraryHeader>
      <ExemplarList>
        <Exemplar kind="good">
          <ExemplarTitle>주장-근거 정렬</ExemplarTitle>
          <ExemplarMeta kind="good" />
          <ExemplarBody>주장을 먼저 밝히고, 조사 근거를 바로 이어 붙였습니다.</ExemplarBody>
          <ExemplarAnnotations>
            <ExemplarAnnotation>주장이 첫 문장에 있습니다.</ExemplarAnnotation>
          </ExemplarAnnotations>
          <ExemplarActions>
            <Button size="sm" variant="outline">
              루브릭에 연결
            </Button>
          </ExemplarActions>
        </Exemplar>
      </ExemplarList>
    </ExemplarLibrary>
  );
}

function LearnerPreviewDemo() {
  return (
    <LearnerPreview className="w-full max-w-xl">
      <LearnerPreviewHeader>
        <LearnerPreviewTitle>학습자 미리보기</LearnerPreviewTitle>
        <LearnerPreviewToolbar>
          <LearnerPreviewDevice device="desktop" active />
          <LearnerPreviewDevice device="mobile" />
          <LearnerPreviewPersona persona="novice" active />
          <LearnerPreviewState scenario="correct" />
        </LearnerPreviewToolbar>
      </LearnerPreviewHeader>
      <LearnerPreviewStage device="desktop">
        <LearnerPreviewFrame>
          <Step className="p-4">
            <StepHeader>
              <StepTitle>주장을 고르세요</StepTitle>
            </StepHeader>
            <StepBody>숙제를 줄이면 학습 부담이 줄어든다.</StepBody>
          </Step>
        </LearnerPreviewFrame>
      </LearnerPreviewStage>
    </LearnerPreview>
  );
}

function ContentValidationDemo() {
  return (
    <ContentValidation className="w-full max-w-lg">
      <ContentValidationHeader>
        <ContentValidationTitle>콘텐츠 검증</ContentValidationTitle>
        <ContentValidationSummary>오류 1 · 경고 2</ContentValidationSummary>
      </ContentValidationHeader>
      <ContentValidationList>
        <ContentValidationIssue severity="error">
          <ContentValidationIssueTitle>빈 선택지</ContentValidationIssueTitle>
          <ContentValidationIssueDetail>
            스텝 3의 선택지 C가 비어 있습니다.
          </ContentValidationIssueDetail>
          <ContentValidationIssueMeta severity="error" />
          <ContentValidationIssueActions>
            <Button size="sm" variant="outline">
              이동
            </Button>
          </ContentValidationIssueActions>
        </ContentValidationIssue>
        <ContentValidationIssue severity="warning">
          <ContentValidationIssueTitle>힌트 과다</ContentValidationIssueTitle>
          <ContentValidationIssueDetail>연속 3스텝에 힌트가 있습니다.</ContentValidationIssueDetail>
          <ContentValidationIssueMeta severity="warning" />
        </ContentValidationIssue>
      </ContentValidationList>
    </ContentValidation>
  );
}

function ContentReviewDemo() {
  return (
    <ContentReview className="w-full max-w-lg">
      <ContentReviewHeader>
        <ContentReviewTitle>레슨 2 검토</ContentReviewTitle>
        <ContentReviewMeta>담당 · 김교사</ContentReviewMeta>
        <ContentReviewStatus status="changes-requested" />
      </ContentReviewHeader>
      <ContentReviewComments>
        <ContentReviewComment>
          <ContentReviewCommentAuthor>박편집</ContentReviewCommentAuthor>
          <ContentReviewCommentBody>
            스텝 2 안내 문장을 더 짧게 다듬어 주세요.
          </ContentReviewCommentBody>
          <ContentReviewCommentMeta>2시간 전</ContentReviewCommentMeta>
        </ContentReviewComment>
      </ContentReviewComments>
      <ContentReviewAssignee>김교사</ContentReviewAssignee>
      <ContentReviewActions>
        <Button size="sm">승인</Button>
      </ContentReviewActions>
    </ContentReview>
  );
}

function PublishWorkflowDemo() {
  return (
    <PublishWorkflow className="w-full max-w-lg">
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
      <PublishWorkflowMeta>Preview 환경에서 검토 후 Live로 승격합니다.</PublishWorkflowMeta>
      <PublishWorkflowActions>
        <Button size="sm" variant="outline">
          예약
        </Button>
        <Button size="sm">Preview 게시</Button>
      </PublishWorkflowActions>
    </PublishWorkflow>
  );
}

function ProvenancePanelDemo() {
  return (
    <ProvenancePanel className="w-full max-w-lg">
      <ProvenancePanelHeader>
        <ProvenancePanelTitle>출처 · 생성 이력</ProvenancePanelTitle>
      </ProvenancePanelHeader>
      <ProvenanceList>
        <ProvenanceRow source="human" verified>
          <ProvenanceRowLabel source="human" />
          <ProvenanceRowMeta>김교사 · 2026-03-01</ProvenanceRowMeta>
          <ProvenanceRowStatus verified>검증됨</ProvenanceRowStatus>
        </ProvenanceRow>
        <ProvenanceRow source="ai" verified={false}>
          <ProvenanceRowLabel source="ai" />
          <ProvenanceRowMeta>힌트 문장 생성</ProvenanceRowMeta>
          <ProvenanceRowModel>claude-sonnet</ProvenanceRowModel>
          <ProvenanceRowActions>
            <Button size="sm" variant="outline">
              검토
            </Button>
          </ProvenanceRowActions>
        </ProvenanceRow>
      </ProvenanceList>
    </ProvenancePanel>
  );
}

function PersonDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Person>
        <PersonAvatar size="sm">
          <AvatarFallback>이</AvatarFallback>
        </PersonAvatar>
        <PersonInfo>
          <PersonName>이서연</PersonName>
          <PersonDescription>seoyeon.lee@example.com</PersonDescription>
        </PersonInfo>
      </Person>
      <Person>
        <PersonAvatar size="sm">
          <AvatarFallback>박</AvatarFallback>
        </PersonAvatar>
        <PersonInfo>
          <PersonName>박민준</PersonName>
          <PersonDescription>minjun.park@example.com</PersonDescription>
        </PersonInfo>
      </Person>
    </div>
  );
}

function LearnerRecordDemo() {
  return (
    <LearnerRecord className="w-full max-w-lg">
      <LearnerRecordHeader>
        <LearnerRecordTitle>이서연</LearnerRecordTitle>
        <LearnerRecordMeta>2학년 · 3반</LearnerRecordMeta>
      </LearnerRecordHeader>
      <LearnerRecordSection>
        <LearnerRecordSectionTitle>진행</LearnerRecordSectionTitle>
        <LearnerRecordPath>유닛 2 · 레슨 3 진행 중</LearnerRecordPath>
      </LearnerRecordSection>
      <LearnerRecordSection>
        <LearnerRecordSectionTitle>숙련</LearnerRecordSectionTitle>
        <LearnerRecordMastery>주장-근거 연결 · 숙련</LearnerRecordMastery>
        <LearnerRecordAttempts>최근 시도 4회 · 정답률 75%</LearnerRecordAttempts>
      </LearnerRecordSection>
    </LearnerRecord>
  );
}

function CohortAssignmentDemo() {
  return (
    <CohortAssignment className="w-full max-w-lg">
      <CohortAssignmentHeader>
        <CohortAssignmentTitle>3반 과제</CohortAssignmentTitle>
        <CohortAssignmentMeta>28명</CohortAssignmentMeta>
      </CohortAssignmentHeader>
      <CohortAssignmentMembers>
        <CohortMember>이서연</CohortMember>
        <CohortMember>박민준</CohortMember>
        <CohortMember>+26</CohortMember>
      </CohortAssignmentMembers>
      <CohortAssignmentTargets>
        <CohortTarget kind="lesson">
          <CohortTargetLabel kind="lesson" />
          <CohortTargetTitle>레슨 2 · 근거 붙이기</CohortTargetTitle>
        </CohortTarget>
      </CohortAssignmentTargets>
      <CohortAssignmentDeadline>마감 · 3월 10일</CohortAssignmentDeadline>
      <CohortAssignmentActions>
        <Button size="sm">배포</Button>
      </CohortAssignmentActions>
    </CohortAssignment>
  );
}

function InterventionQueueDemo() {
  return (
    <InterventionQueue className="w-full max-w-lg">
      <InterventionQueueHeader>
        <InterventionQueueTitle>개입 대기</InterventionQueueTitle>
        <InterventionQueueMeta>2명</InterventionQueueMeta>
      </InterventionQueueHeader>
      <InterventionQueueList>
        <InterventionItem reason="repeated-errors">
          <InterventionItemName>최지우</InterventionItemName>
          <InterventionItemReason reason="repeated-errors" />
          <InterventionItemEvidence>같은 문항 3회 오답</InterventionItemEvidence>
          <InterventionItemActions>
            <Button size="sm" variant="outline">
              코칭 보내기
            </Button>
          </InterventionItemActions>
        </InterventionItem>
        <InterventionItem reason="inactive">
          <InterventionItemName>한도윤</InterventionItemName>
          <InterventionItemReason reason="inactive" />
          <InterventionItemEvidence>7일간 미접속</InterventionItemEvidence>
        </InterventionItem>
      </InterventionQueueList>
    </InterventionQueue>
  );
}

function LearningAnalyticsDemo() {
  return (
    <LearningAnalytics className="w-full max-w-lg">
      <LearningAnalyticsHeader>
        <LearningAnalyticsTitle>학습 분석</LearningAnalyticsTitle>
        <LearningAnalyticsMeta>최근 7일</LearningAnalyticsMeta>
      </LearningAnalyticsHeader>
      <LearningAnalyticsGrid>
        <LearningAnalyticsMetric>
          <LearningAnalyticsMetricLabel>완료율</LearningAnalyticsMetricLabel>
          <LearningAnalyticsMetricValue>68%</LearningAnalyticsMetricValue>
          <LearningAnalyticsMetricHint>+4%p</LearningAnalyticsMetricHint>
        </LearningAnalyticsMetric>
        <LearningAnalyticsMetric>
          <LearningAnalyticsMetricLabel>평균 시도</LearningAnalyticsMetricLabel>
          <LearningAnalyticsMetricValue>2.1</LearningAnalyticsMetricValue>
        </LearningAnalyticsMetric>
      </LearningAnalyticsGrid>
      <LearningAnalyticsSeries>
        <LearningAnalyticsRow>
          <span>레슨 1</span>
          <span className="tabular-nums">92%</span>
        </LearningAnalyticsRow>
        <LearningAnalyticsRow>
          <span>레슨 2</span>
          <span className="tabular-nums">54%</span>
        </LearningAnalyticsRow>
      </LearningAnalyticsSeries>
    </LearningAnalytics>
  );
}

function ItemAnalysisDemo() {
  return (
    <ItemAnalysis className="w-full max-w-lg">
      <ItemAnalysisHeader>
        <ItemAnalysisTitle>문항 분석</ItemAnalysisTitle>
        <ItemAnalysisMeta>객관식 · n=128</ItemAnalysisMeta>
      </ItemAnalysisHeader>
      <ItemAnalysisList>
        <ItemAnalysisRow>
          <ItemAnalysisPrompt>다음 중 반박의 핵심은?</ItemAnalysisPrompt>
          <ItemAnalysisStats>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>정답률</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>42%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>평균 시간</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>48s</ItemAnalysisStatValue>
            </ItemAnalysisStat>
          </ItemAnalysisStats>
          <ItemAnalysisDistractors>
            <ItemAnalysisDistractor selected>감정 호소</ItemAnalysisDistractor>
            <ItemAnalysisDistractor>전제 지적</ItemAnalysisDistractor>
          </ItemAnalysisDistractors>
          <ItemAnalysisFlags>
            <ItemAnalysisFlag flag="high-dropout" />
            <ItemAnalysisFlag flag="distractor-bias" />
          </ItemAnalysisFlags>
        </ItemAnalysisRow>
      </ItemAnalysisList>
    </ItemAnalysis>
  );
}

function WritingAnalyticsDemo() {
  return (
    <WritingAnalytics className="w-full max-w-lg">
      <WritingAnalyticsHeader>
        <WritingAnalyticsTitle>쓰기 분석</WritingAnalyticsTitle>
        <WritingAnalyticsMeta>설득문 · 3반</WritingAnalyticsMeta>
      </WritingAnalyticsHeader>
      <WritingAnalyticsGrid>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>평균 길이</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>142자</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
        <WritingAnalyticsMetric>
          <WritingAnalyticsMetricLabel>루브릭 평균</WritingAnalyticsMetricLabel>
          <WritingAnalyticsMetricValue>3.2</WritingAnalyticsMetricValue>
        </WritingAnalyticsMetric>
      </WritingAnalyticsGrid>
      <WritingAnalyticsCriteria>
        <WritingAnalyticsCriterion>주장 명확성 · 3.4</WritingAnalyticsCriterion>
        <WritingAnalyticsCriterion>근거 적절성 · 2.8</WritingAnalyticsCriterion>
      </WritingAnalyticsCriteria>
      <WritingAnalyticsGenre>설득</WritingAnalyticsGenre>
      <WritingAnalyticsHint>근거 적절성 점수가 낮습니다. 레슨 2를 복습하세요.</WritingAnalyticsHint>
    </WritingAnalytics>
  );
}

function FeedbackAuditDemo() {
  return (
    <FeedbackAudit className="w-full max-w-lg">
      <FeedbackAuditHeader>
        <FeedbackAuditTitle>피드백 감사</FeedbackAuditTitle>
        <FeedbackAuditMeta>샘플 24건</FeedbackAuditMeta>
      </FeedbackAuditHeader>
      <FeedbackAuditList>
        <FeedbackAuditSample origin="ai">
          <FeedbackAuditSampleOrigin origin="ai" />
          <FeedbackAuditSampleBody>
            근거가 주장과 직접 연결되지 않았습니다. 조사 결과를 인용해 보세요.
          </FeedbackAuditSampleBody>
          <FeedbackAuditScores>
            <FeedbackAuditScore kind="accuracy">
              <FeedbackAuditScoreLabel kind="accuracy" />
              <FeedbackAuditScoreValue>4.2</FeedbackAuditScoreValue>
            </FeedbackAuditScore>
            <FeedbackAuditScore kind="tone">
              <FeedbackAuditScoreLabel kind="tone" />
              <FeedbackAuditScoreValue>4.8</FeedbackAuditScoreValue>
            </FeedbackAuditScore>
          </FeedbackAuditScores>
        </FeedbackAuditSample>
      </FeedbackAuditList>
      <FeedbackAuditActions>
        <Button size="sm" variant="outline">
          샘플 추가
        </Button>
      </FeedbackAuditActions>
    </FeedbackAudit>
  );
}

function AuditLogDemo() {
  return (
    <AuditLog className="w-full max-w-lg">
      <AuditLogHeader>
        <AuditLogTitle>감사 로그</AuditLogTitle>
        <AuditLogMeta>최근 30일 · 3건</AuditLogMeta>
      </AuditLogHeader>
      <AuditLogList>
        <AuditLogEntry selected>
          <AuditLogActor>김교사</AuditLogActor>
          <AuditLogAction>레슨 2를 Preview에 게시</AuditLogAction>
          <AuditLogTarget>설득 글쓰기 · 레슨 2</AuditLogTarget>
          <AuditLogKind kind="publish" />
          <AuditLogEnvironment env="preview" />
          <AuditLogTime dateTime="2026-03-01T14:22:00">2시간 전</AuditLogTime>
        </AuditLogEntry>
        <AuditLogEntry>
          <AuditLogActor>시스템</AuditLogActor>
          <AuditLogAction>AI 힌트 생성 기록</AuditLogAction>
          <AuditLogTarget>스텝 3 · 힌트</AuditLogTarget>
          <AuditLogKind kind="ai" />
          <AuditLogEnvironment env="sandbox" />
          <AuditLogTime dateTime="2026-03-01T10:05:00">6시간 전</AuditLogTime>
        </AuditLogEntry>
        <AuditLogEntry>
          <AuditLogActor>이운영</AuditLogActor>
          <AuditLogAction>Live 레슨 초안을 이전 버전으로 되돌림</AuditLogAction>
          <AuditLogTarget>중급 읽기 · 레슨 4</AuditLogTarget>
          <AuditLogKind kind="restore" />
          <AuditLogEnvironment env="live" />
          <AuditLogTime dateTime="2026-02-28T18:40:00">어제</AuditLogTime>
          <AuditLogRestore>복원</AuditLogRestore>
        </AuditLogEntry>
      </AuditLogList>
    </AuditLog>
  );
}

function RunQueueDemo() {
  return (
    <RunQueue className="w-full max-w-xl">
      <RunQueueHeader>
        <RunQueueTitle>실행 큐</RunQueueTitle>
        <RunQueueMeta>3건</RunQueueMeta>
      </RunQueueHeader>
      <RunQueueGroups>
        <RunQueueGroup status="running">
          <RunQueueGroupHeader>
            <RunQueueGroupTitle status="running">
              실행 중<RunQueueGroupCount>1</RunQueueGroupCount>
            </RunQueueGroupTitle>
            <RunQueueGroupHint status="running" />
          </RunQueueGroupHeader>
          <RunQueueList>
            <RunQueueItem status="running">
              <RunQueueItemIcon>
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              </RunQueueItemIcon>
              <RunQueueItemBody>
                <RunQueueItemTitle>고위험 결제 세션 실시간 심사</RunQueueItemTitle>
                <RunQueueItemStep>Fraud Screener · 4/6 단계</RunQueueItemStep>
              </RunQueueItemBody>
              <RunQueueEnvironment environment="production" />
              <RunQueueItemTime dateTime="2026-08-04T04:26:00">2분 전</RunQueueItemTime>
              <RunQueueItemProgress value={62} />
              <RunQueueOutcome outcome="on-track" />
            </RunQueueItem>
          </RunQueueList>
        </RunQueueGroup>
        <RunQueueGroup status="failed">
          <RunQueueGroupHeader>
            <RunQueueGroupTitle status="failed">
              실패
              <RunQueueGroupCount>1</RunQueueGroupCount>
            </RunQueueGroupTitle>
          </RunQueueGroupHeader>
          <RunQueueList>
            <RunQueueItem status="failed">
              <RunQueueItemIcon>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
              </RunQueueItemIcon>
              <RunQueueItemBody>
                <RunQueueItemTitle>ORD-99214 중복 결제 환불 처리</RunQueueItemTitle>
                <RunQueueItemStep>Refund Resolver · 3/6 단계</RunQueueItemStep>
              </RunQueueItemBody>
              <RunQueueEnvironment environment="production" />
              <RunQueueItemTime dateTime="2026-08-04T04:20:00">8분 전</RunQueueItemTime>
              <RunQueueItemProgress value={48} />
              <RunQueueOutcome outcome="escalated" />
            </RunQueueItem>
          </RunQueueList>
        </RunQueueGroup>
      </RunQueueGroups>
    </RunQueue>
  );
}

function StepTraceDemo() {
  return (
    <StepTrace className="w-full max-w-lg">
      <StepTraceHeader>
        <StepTraceTitle>Step Trace</StepTraceTitle>
        <StepTraceMeta>3/6 단계에서 실패</StepTraceMeta>
      </StepTraceHeader>
      <StepTraceList>
        <StepTraceStep status="completed">
          <StepTraceMark status="completed" />
          <StepTraceBody>
            <StepTraceStepHeader>
              <StepTraceStepTitle>환불 접근 방식 계획</StepTraceStepTitle>
              <StepTraceDuration>14s</StepTraceDuration>
            </StepTraceStepHeader>
            <StepTraceTools>
              <StepTraceTool>
                <StepTraceToolName>orders.lookup</StepTraceToolName>
                <div className="flex items-center gap-2">
                  <StepTraceToolDuration>420ms</StepTraceToolDuration>
                  <StepTraceToolStatus status="succeeded" />
                </div>
              </StepTraceTool>
            </StepTraceTools>
          </StepTraceBody>
        </StepTraceStep>
        <StepTraceStep status="failed">
          <StepTraceMark status="failed" />
          <StepTraceBody>
            <StepTraceStepHeader>
              <StepTraceStepTitle>부분 캡처 환불 요청</StepTraceStepTitle>
              <div className="flex items-center gap-2">
                <StepTraceDuration>6s</StepTraceDuration>
                <StepTraceStatusBadge status="failed" />
              </div>
            </StepTraceStepHeader>
            <StepTraceTools>
              <StepTraceTool>
                <StepTraceToolName>payments.refunds.create</StepTraceToolName>
                <div className="flex items-center gap-2">
                  <StepTraceToolDuration>890ms</StepTraceToolDuration>
                  <StepTraceToolStatus status="failed" />
                </div>
              </StepTraceTool>
            </StepTraceTools>
            <StepTraceError>
              processor_declined: partial capture on original card is not allowed.
            </StepTraceError>
          </StepTraceBody>
        </StepTraceStep>
        <StepTraceStep status="pending">
          <StepTraceMark status="pending">3</StepTraceMark>
          <StepTraceBody>
            <StepTraceStepHeader>
              <StepTraceStepTitle>대체 환불 경로 제안</StepTraceStepTitle>
              <StepTraceStatusBadge status="pending" />
            </StepTraceStepHeader>
          </StepTraceBody>
        </StepTraceStep>
      </StepTraceList>
    </StepTrace>
  );
}

const ADMIN_PREVIEWS: Record<string, () => ReactNode> = {
  "admin-overview": () => <AdminOverviewDemo />,
  "curriculum-tree": () => <CurriculumTreeDemo />,
  "curriculum-map": () => <CurriculumMapDemo />,
  "lesson-builder": () => <LessonBuilderDemo />,
  "item-bank": () => <ItemBankDemo />,
  "prompt-builder": () => <PromptBuilderDemo />,
  "rubric-editor": () => <RubricEditorDemo />,
  "exemplar-library": () => <ExemplarLibraryDemo />,
  "learner-preview": () => <LearnerPreviewDemo />,
  "content-validation": () => <ContentValidationDemo />,
  "content-review": () => <ContentReviewDemo />,
  "publish-workflow": () => <PublishWorkflowDemo />,
  "provenance-panel": () => <ProvenancePanelDemo />,
  person: () => <PersonDemo />,
  "learner-record": () => <LearnerRecordDemo />,
  "cohort-assignment": () => <CohortAssignmentDemo />,
  "intervention-queue": () => <InterventionQueueDemo />,
  "learning-analytics": () => <LearningAnalyticsDemo />,
  "item-analysis": () => <ItemAnalysisDemo />,
  "writing-analytics": () => <WritingAnalyticsDemo />,
  "feedback-audit": () => <FeedbackAuditDemo />,
  "audit-log": () => <AuditLogDemo />,
  "run-queue": () => <RunQueueDemo />,
  "step-trace": () => <StepTraceDemo />,
};

export function isAdminPreview(slug: string) {
  return slug in ADMIN_PREVIEWS;
}

export function AdminPreview({ slug }: { slug: string }) {
  const render = ADMIN_PREVIEWS[slug];
  if (!render) return null;
  return <div className="flex w-full justify-center py-2">{render()}</div>;
}
