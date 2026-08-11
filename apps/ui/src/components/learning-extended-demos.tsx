"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/ui/button";
import {
  ArgumentEdge,
  ArgumentMap,
  ArgumentMapCanvas,
  ArgumentMapHeader,
  ArgumentMapHint,
  ArgumentMapTitle,
  ArgumentNode,
  ArgumentNodeBody,
  ArgumentNodeLabel,
} from "@workspace/ui/components/ui/argument-map";
import {
  Checkpoint,
  CheckpointActions,
  CheckpointDescription,
  CheckpointHeader,
  CheckpointHint,
  CheckpointMeta,
  CheckpointObjective,
  CheckpointObjectives,
  CheckpointScore,
  CheckpointTitle,
} from "@workspace/ui/components/ui/checkpoint";
import {
  Draft,
  DraftActions,
  DraftEditor,
  DraftHeader,
  DraftMeter,
  DraftStatus,
  DraftTitle,
} from "@workspace/ui/components/ui/draft";
import {
  FeedbackSummary,
  FeedbackSummaryHeader,
  FeedbackSummaryItem,
  FeedbackSummaryItemBody,
  FeedbackSummaryItemScope,
  FeedbackSummaryItemTitle,
  FeedbackSummaryMeta,
  FeedbackSummaryPriority,
  FeedbackSummaryTitle,
} from "@workspace/ui/components/ui/feedback-summary";
import {
  HintLadder,
  HintLadderHeader,
  HintLadderMeta,
  HintLadderSteps,
  HintLadderTitle,
  HintStep,
  HintStepActions,
  HintStepBody,
  HintStepLabel,
} from "@workspace/ui/components/ui/hint-ladder";
import {
  MistakeJournal,
  MistakeJournalHeader,
  MistakeJournalList,
  MistakeJournalMeta,
  MistakeJournalTitle,
  MistakePattern,
  MistakePatternCount,
  MistakePatternDescription,
  MistakePatternLabel,
} from "@workspace/ui/components/ui/mistake-journal";
import {
  Outline,
  OutlineBlock,
  OutlineBlockBody,
  OutlineBlockHandle,
  OutlineBlockLabel,
  OutlineHeader,
  OutlineHint,
  OutlineList,
  OutlineTitle,
} from "@workspace/ui/components/ui/outline";
import {
  Portfolio,
  PortfolioHeader,
  PortfolioList,
  PortfolioMeta,
  PortfolioPiece,
  PortfolioPieceExcerpt,
  PortfolioPieceMeta,
  PortfolioPieceTitle,
  PortfolioTitle,
} from "@workspace/ui/components/ui/portfolio";
import {
  PracticeQueue,
  PracticeQueueHeader,
  PracticeQueueItem,
  PracticeQueueItemMeta,
  PracticeQueueItemReason,
  PracticeQueueItemTitle,
  PracticeQueueList,
  PracticeQueueMeta,
  PracticeQueueTitle,
} from "@workspace/ui/components/ui/practice-queue";
import {
  Reflection,
  ReflectionActions,
  ReflectionDescription,
  ReflectionField,
  ReflectionFieldInput,
  ReflectionFieldLabel,
  ReflectionFields,
  ReflectionHeader,
  ReflectionTitle,
} from "@workspace/ui/components/ui/reflection";
import {
  RevisionEntry,
  RevisionEntryMark,
  RevisionEntryMeta,
  RevisionEntryTitle,
  RevisionHistory,
  RevisionHistoryHeader,
  RevisionHistoryList,
  RevisionHistoryTitle,
} from "@workspace/ui/components/ui/revision-history";
import {
  Rubric,
  RubricCriterion,
  RubricCriterionDescription,
  RubricCriterionLabel,
  RubricCriterionWeight,
  RubricHeader,
  RubricJudgment,
  RubricJudgmentLabel,
  RubricJudgmentReason,
  RubricLevel,
  RubricLevels,
  RubricList,
  RubricMeta,
  RubricTitle,
} from "@workspace/ui/components/ui/rubric";
import {
  SkillMap,
  SkillMapHeader,
  SkillMapList,
  SkillMapMeta,
  SkillMapTitle,
  SkillNode,
  SkillNodeFocus,
  SkillNodeLabel,
  SkillNodeLevel,
  SkillNodePrereq,
} from "@workspace/ui/components/ui/skill-map";
import {
  SourceItem,
  SourceItemBody,
  SourceItemCitation,
  SourceItemMeta,
  SourceItemTitle,
  SourcePack,
  SourcePackHeader,
  SourcePackList,
  SourcePackMeta,
  SourcePackTitle,
} from "@workspace/ui/components/ui/source-pack";
import {
  Submission,
  SubmissionActions,
  SubmissionHeader,
  SubmissionHint,
  SubmissionMeta,
  SubmissionStatus,
  SubmissionTitle,
} from "@workspace/ui/components/ui/submission";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import {
  TextAnnotation,
  TextAnnotationDocument,
  TextAnnotationItem,
  TextAnnotationItemActions,
  TextAnnotationItemBody,
  TextAnnotationItemLabel,
  TextAnnotationMark,
  TextAnnotationPanel,
} from "@workspace/ui/components/ui/text-annotation";
import {
  WritingBrief,
  WritingBriefCriteria,
  WritingBriefCriterion,
  WritingBriefFact,
  WritingBriefFacts,
  WritingBriefHeader,
  WritingBriefLead,
  WritingBriefRequirement,
  WritingBriefSection,
  WritingBriefSectionTitle,
  WritingBriefTitle,
} from "@workspace/ui/components/ui/writing-brief";

function CheckpointDemo() {
  return (
    <div className="w-full max-w-md">
      <Checkpoint status="in-progress">
        <CheckpointHeader>
          <CheckpointTitle>유닛 2 중간 점검</CheckpointTitle>
          <CheckpointMeta status="in-progress" />
        </CheckpointHeader>
        <CheckpointDescription>
          주장·근거·문단 연결을 한 문단 안에서 설명할 수 있는지 확인합니다.
        </CheckpointDescription>
        <CheckpointObjectives>
          <CheckpointObjective met>주장과 근거를 구분한다</CheckpointObjective>
          <CheckpointObjective>근거가 주장을 뒷받침하는지 판단한다</CheckpointObjective>
          <CheckpointObjective>문단 안 연결어를 고른다</CheckpointObjective>
        </CheckpointObjectives>
        <CheckpointScore label="현재 점수" value="2 / 3" />
        <CheckpointHint>통과하려면 남은 목표를 하나 이상 완료하세요.</CheckpointHint>
        <CheckpointActions>
          <Button>점검 계속하기</Button>
        </CheckpointActions>
      </Checkpoint>
    </div>
  );
}

function PracticeQueueDemo() {
  return (
    <div className="w-full max-w-md">
      <PracticeQueue>
        <PracticeQueueHeader>
          <PracticeQueueTitle>오늘의 연습</PracticeQueueTitle>
          <PracticeQueueMeta>3개 · 약 18분</PracticeQueueMeta>
        </PracticeQueueHeader>
        <PracticeQueueList>
          <PracticeQueueItem priority="high">
            <PracticeQueueItemTitle>근거 연결 다시 쓰기</PracticeQueueItemTitle>
            <PracticeQueueItemReason>
              어제 제출에서 근거-주장 거리가 멀었습니다.
            </PracticeQueueItemReason>
            <PracticeQueueItemMeta priority="high" />
          </PracticeQueueItem>
          <PracticeQueueItem>
            <PracticeQueueItemTitle>반박 문장 고르기</PracticeQueueItemTitle>
            <PracticeQueueItemReason>유닛 1 복습 권장</PracticeQueueItemReason>
            <PracticeQueueItemMeta />
          </PracticeQueueItem>
        </PracticeQueueList>
      </PracticeQueue>
    </div>
  );
}

function MistakeJournalDemo() {
  return (
    <div className="w-full max-w-md">
      <MistakeJournal>
        <MistakeJournalHeader>
          <MistakeJournalTitle>반복 오류</MistakeJournalTitle>
          <MistakeJournalMeta>최근 4주</MistakeJournalMeta>
        </MistakeJournalHeader>
        <MistakeJournalList>
          <MistakePattern state="recurring" count={3}>
            <div className="flex items-center justify-between gap-2">
              <MistakePatternLabel>근거가 주장과 무관함</MistakePatternLabel>
              <MistakePatternCount count={3} />
            </div>
            <MistakePatternDescription>
              통계나 사례를 넣었지만 주장과 직접 연결되지 않았습니다.
            </MistakePatternDescription>
          </MistakePattern>
          <MistakePattern state="emerging" count={1}>
            <div className="flex items-center justify-between gap-2">
              <MistakePatternLabel>문단 전환 없음</MistakePatternLabel>
              <MistakePatternCount count={1} />
            </div>
            <MistakePatternDescription>
              본론 문단 사이에 연결어가 빠졌습니다.
            </MistakePatternDescription>
          </MistakePattern>
        </MistakeJournalList>
      </MistakeJournal>
    </div>
  );
}

function HintLadderDemo() {
  const [revealed, setRevealed] = useState(1);

  return (
    <div className="w-full max-w-md">
      <HintLadder>
        <HintLadderHeader>
          <HintLadderTitle>근거 연결 힌트</HintLadderTitle>
          <HintLadderMeta>{revealed} / 3 단계</HintLadderMeta>
        </HintLadderHeader>
        <HintLadderSteps>
          <HintStep level="observe" revealed>
            <HintStepLabel />
            <HintStepBody>
              주장 문장과 근거 문장 사이에 공통 키워드가 있는지 살펴보세요.
            </HintStepBody>
          </HintStep>
          <HintStep level="direction" revealed={revealed >= 2}>
            <HintStepLabel />
            <HintStepBody>근거가 주장의 어떤 부분을 뒷받침하는지 한 줄로 적어 보세요.</HintStepBody>
            {revealed < 2 && (
              <HintStepActions>
                <Button size="sm" variant="outline" onClick={() => setRevealed(2)}>
                  다음 힌트
                </Button>
              </HintStepActions>
            )}
          </HintStep>
          <HintStep level="example" revealed={revealed >= 3}>
            <HintStepLabel />
            <HintStepBody>
              예: 「따라서 숙제량을 줄여야 한다」→「주 5일 반복 학습이 부담이 된다」
            </HintStepBody>
            {revealed === 2 && (
              <HintStepActions>
                <Button size="sm" variant="outline" onClick={() => setRevealed(3)}>
                  예시 보기
                </Button>
              </HintStepActions>
            )}
          </HintStep>
        </HintLadderSteps>
      </HintLadder>
    </div>
  );
}

function WritingBriefDemo() {
  return (
    <div className="w-full max-w-lg">
      <WritingBrief>
        <WritingBriefHeader>
          <WritingBriefTitle>숙제 폐지 찬반: 내 입장 쓰기</WritingBriefTitle>
          <WritingBriefLead>
            주장과 근거를 한 문단 안에서 연결하는 짧은 논설문을 작성합니다.
          </WritingBriefLead>
        </WritingBriefHeader>
        <WritingBriefFacts>
          <WritingBriefFact>
            <dt className="text-xs text-muted-foreground">분량</dt>
            <dd className="text-sm">200–300자 · 1문단</dd>
          </WritingBriefFact>
          <WritingBriefFact>
            <dt className="text-xs text-muted-foreground">독자</dt>
            <dd className="text-sm">같은 반 친구</dd>
          </WritingBriefFact>
        </WritingBriefFacts>
        <WritingBriefSection>
          <WritingBriefSectionTitle>평가 기준</WritingBriefSectionTitle>
          <WritingBriefCriteria>
            <WritingBriefCriterion>주장이 첫 문장에 분명하다</WritingBriefCriterion>
            <WritingBriefCriterion>근거가 주장과 직접 연결된다</WritingBriefCriterion>
          </WritingBriefCriteria>
        </WritingBriefSection>
        <WritingBriefRequirement>
          출처는 본문에 직접 인용하지 않아도 됩니다.
        </WritingBriefRequirement>
      </WritingBrief>
    </div>
  );
}

function SourcePackDemo() {
  return (
    <div className="w-full max-w-md">
      <SourcePack>
        <SourcePackHeader>
          <SourcePackTitle>참고 자료</SourcePackTitle>
          <SourcePackMeta>3개</SourcePackMeta>
        </SourcePackHeader>
        <SourcePackList>
          <SourceItem kind="stat">
            <SourceItemTitle>주 5일 숙제 부담</SourceItemTitle>
            <SourceItemMeta kind="stat" />
            <SourceItemBody>중학생 62%가 「숙제가 너무 많다」고 응답했습니다.</SourceItemBody>
            <SourceItemCitation>2024 교육부 학습 부담 조사</SourceItemCitation>
          </SourceItem>
          <SourceItem kind="excerpt">
            <SourceItemTitle>반복 학습의 역할</SourceItemTitle>
            <SourceItemMeta kind="excerpt" />
            <SourceItemBody>
              적절한 복습은 기억 유지에 도움이 되지만, 양이 과하면 역효과가 납니다.
            </SourceItemBody>
          </SourceItem>
        </SourcePackList>
      </SourcePack>
    </div>
  );
}

function OutlineDemo() {
  return (
    <div className="w-full max-w-md">
      <Outline>
        <OutlineHeader>
          <OutlineTitle>문단 개요</OutlineTitle>
        </OutlineHeader>
        <OutlineHint>블록을 드래그해 순서를 바꿀 수 있습니다.</OutlineHint>
        <OutlineList>
          <OutlineBlock kind="claim">
            <OutlineBlockHandle />
            <OutlineBlockLabel />
            <OutlineBlockBody>숙제량을 줄여야 한다</OutlineBlockBody>
          </OutlineBlock>
          <OutlineBlock kind="evidence">
            <OutlineBlockHandle />
            <OutlineBlockLabel />
            <OutlineBlockBody>주 5일 반복이 학습 부담을 키운다</OutlineBlockBody>
          </OutlineBlock>
          <OutlineBlock kind="conclusion">
            <OutlineBlockHandle />
            <OutlineBlockLabel />
            <OutlineBlockBody>양보다 목적 있는 과제가 필요하다</OutlineBlockBody>
          </OutlineBlock>
        </OutlineList>
      </Outline>
    </div>
  );
}

function ArgumentMapDemo() {
  return (
    <div className="w-full max-w-md">
      <ArgumentMap>
        <ArgumentMapHeader>
          <ArgumentMapTitle>논증 구조</ArgumentMapTitle>
        </ArgumentMapHeader>
        <ArgumentMapHint>주장·근거·반론·재반박의 관계를 정리합니다.</ArgumentMapHint>
        <ArgumentMapCanvas>
          <ArgumentNode kind="claim">
            <ArgumentNodeLabel />
            <ArgumentNodeBody>숙제량을 줄여야 한다</ArgumentNodeBody>
          </ArgumentNode>
          <ArgumentEdge>뒷받침</ArgumentEdge>
          <ArgumentNode kind="evidence">
            <ArgumentNodeLabel />
            <ArgumentNodeBody>주 5일 반복이 학습 부담을 키운다</ArgumentNodeBody>
          </ArgumentNode>
          <ArgumentEdge>반론</ArgumentEdge>
          <ArgumentNode kind="counter">
            <ArgumentNodeLabel />
            <ArgumentNodeBody>숙제 없이는 복습 리듬이 사라진다</ArgumentNodeBody>
          </ArgumentNode>
        </ArgumentMapCanvas>
      </ArgumentMap>
    </div>
  );
}

function DraftDemo() {
  const [value, setValue] = useState(
    "숙제를 줄여야 한다. 주 5일 반복 과제가 학습 부담을 키우기 때문이다.",
  );

  return (
    <div className="w-full max-w-lg">
      <Draft status="editing">
        <DraftHeader>
          <DraftTitle>1차 초안</DraftTitle>
          <DraftStatus />
        </DraftHeader>
        <DraftEditor
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="주장과 근거를 한 문단으로 작성하세요."
        />
        <DraftMeter characters={value.length} paragraphs={1} minCharacters={200} />
        <DraftActions>
          <Button size="sm" variant="outline">
            저장
          </Button>
          <Button size="sm" disabled={value.length < 200}>
            제출 준비
          </Button>
        </DraftActions>
      </Draft>
    </div>
  );
}

function TextAnnotationDemo() {
  return (
    <div className="w-full max-w-lg">
      <TextAnnotation>
        <TextAnnotationDocument>
          숙제를 <TextAnnotationMark kind="logic">없애면</TextAnnotationMark> 학습 부담은 줄지만,
          복습 리듬도 함께 사라질 수 있다.
        </TextAnnotationDocument>
        <TextAnnotationPanel>
          <TextAnnotationItem kind="logic" state="open">
            <TextAnnotationItemLabel />
            <TextAnnotationItemBody>
              「없애면」은 절대적 표현입니다. 「줄이면」처럼 완화해 보세요.
            </TextAnnotationItemBody>
            <TextAnnotationItemActions>
              <Button size="sm" variant="outline">
                수용
              </Button>
              <Button size="sm" variant="ghost">
                거절
              </Button>
            </TextAnnotationItemActions>
          </TextAnnotationItem>
        </TextAnnotationPanel>
      </TextAnnotation>
    </div>
  );
}

function RubricDemo() {
  const [level, setLevel] = useState(1);

  return (
    <div className="w-full max-w-md">
      <Rubric>
        <RubricHeader>
          <RubricTitle>논설문 채점 기준</RubricTitle>
          <RubricMeta>1 / 2 항목</RubricMeta>
        </RubricHeader>
        <RubricList>
          <RubricCriterion weight={50}>
            <div className="flex items-baseline justify-between gap-2">
              <RubricCriterionLabel>주장의 명확성</RubricCriterionLabel>
              <RubricCriterionWeight weight={50} />
            </div>
            <RubricCriterionDescription>첫 문장에 입장이 분명한가</RubricCriterionDescription>
            <RubricLevels>
              {["미흡", "보통", "우수"].map((label, index) => (
                <RubricLevel key={label} active={level === index} onClick={() => setLevel(index)}>
                  {label}
                </RubricLevel>
              ))}
            </RubricLevels>
            <RubricJudgment>
              <RubricJudgmentLabel>판정</RubricJudgmentLabel>
              <RubricJudgmentReason>주장은 분명하나 근거 연결이 약합니다.</RubricJudgmentReason>
            </RubricJudgment>
          </RubricCriterion>
        </RubricList>
      </Rubric>
    </div>
  );
}

function FeedbackSummaryDemo() {
  return (
    <div className="w-full max-w-md">
      <FeedbackSummary>
        <FeedbackSummaryHeader>
          <FeedbackSummaryTitle>수정 우선순위</FeedbackSummaryTitle>
          <FeedbackSummaryMeta>3건</FeedbackSummaryMeta>
        </FeedbackSummaryHeader>
        <FeedbackSummaryPriority>
          <FeedbackSummaryItem priority="high">
            <FeedbackSummaryItemTitle>근거-주장 연결</FeedbackSummaryItemTitle>
            <FeedbackSummaryItemScope priority="high" />
            <FeedbackSummaryItemBody>
              두 번째 문장이 주장의 어떤 부분을 뒷받침하는지 드러내세요.
            </FeedbackSummaryItemBody>
          </FeedbackSummaryItem>
          <FeedbackSummaryItem priority="medium">
            <FeedbackSummaryItemTitle>문단 마무리</FeedbackSummaryItemTitle>
            <FeedbackSummaryItemScope priority="medium" />
            <FeedbackSummaryItemBody>
              결론 문장이 주장을 다시 짚어 주면 좋습니다.
            </FeedbackSummaryItemBody>
          </FeedbackSummaryItem>
        </FeedbackSummaryPriority>
      </FeedbackSummary>
    </div>
  );
}

function RevisionHistoryDemo() {
  return (
    <div className="w-full max-w-md">
      <RevisionHistory>
        <RevisionHistoryHeader>
          <RevisionHistoryTitle>수정 기록</RevisionHistoryTitle>
        </RevisionHistoryHeader>
        <RevisionHistoryList>
          <RevisionEntry state="draft">
            <RevisionEntryMark />
            <RevisionEntryTitle>1차 초안</RevisionEntryTitle>
            <RevisionEntryMeta>3월 4일</RevisionEntryMeta>
          </RevisionEntry>
          <RevisionEntry state="revision">
            <RevisionEntryMark />
            <RevisionEntryTitle>피드백 반영</RevisionEntryTitle>
            <RevisionEntryMeta>3월 6일</RevisionEntryMeta>
          </RevisionEntry>
          <RevisionEntry state="final">
            <RevisionEntryMark />
            <RevisionEntryTitle>최종 제출</RevisionEntryTitle>
            <RevisionEntryMeta>3월 7일</RevisionEntryMeta>
          </RevisionEntry>
        </RevisionHistoryList>
      </RevisionHistory>
    </div>
  );
}

function SubmissionDemo() {
  return (
    <div className="w-full max-w-md">
      <Submission>
        <SubmissionHeader>
          <SubmissionTitle>숙제 폐지 찬반 · 1차 제출</SubmissionTitle>
          <SubmissionStatus state="revision-requested" />
        </SubmissionHeader>
        <SubmissionMeta>제출 3월 5일 · 248자</SubmissionMeta>
        <SubmissionHint>근거 연결을 보완한 뒤 재제출해 주세요.</SubmissionHint>
        <SubmissionActions>
          <Button size="sm">수정하기</Button>
          <Button size="sm" variant="outline">
            기록 보기
          </Button>
        </SubmissionActions>
      </Submission>
    </div>
  );
}

function ReflectionDemo() {
  return (
    <div className="w-full max-w-md">
      <Reflection>
        <ReflectionHeader>
          <ReflectionTitle>제출 후 되돌아보기</ReflectionTitle>
          <ReflectionDescription>
            이번 글쓰기에서 배운 점과 다음에 바꿀 점을 적어 보세요.
          </ReflectionDescription>
        </ReflectionHeader>
        <ReflectionFields>
          <ReflectionField>
            <ReflectionFieldLabel>가장 어려웠던 부분</ReflectionFieldLabel>
            <ReflectionFieldInput>
              <Textarea placeholder="근거를 주장과 연결하는 부분이…" />
            </ReflectionFieldInput>
          </ReflectionField>
        </ReflectionFields>
        <ReflectionActions>
          <Button size="sm">저장</Button>
        </ReflectionActions>
      </Reflection>
    </div>
  );
}

function SkillMapDemo() {
  return (
    <div className="w-full max-w-md">
      <SkillMap>
        <SkillMapHeader>
          <SkillMapTitle>논증 기술</SkillMapTitle>
          <SkillMapMeta>4개 개념</SkillMapMeta>
        </SkillMapHeader>
        <SkillMapList>
          <SkillNode level="secure">
            <SkillNodeLabel>주장 세우기</SkillNodeLabel>
            <SkillNodeLevel />
          </SkillNode>
          <SkillNode level="developing" focus>
            <div className="flex flex-wrap items-center gap-2">
              <SkillNodeLabel>근거 연결</SkillNodeLabel>
              <SkillNodeFocus>집중 연습</SkillNodeFocus>
            </div>
            <SkillNodeLevel />
            <SkillNodePrereq>선행: 주장 세우기</SkillNodePrereq>
          </SkillNode>
          <SkillNode level="emerging">
            <SkillNodeLabel>반박 구성</SkillNodeLabel>
            <SkillNodeLevel />
            <SkillNodePrereq>선행: 근거 연결</SkillNodePrereq>
          </SkillNode>
        </SkillMapList>
      </SkillMap>
    </div>
  );
}

function PortfolioDemo() {
  return (
    <div className="w-full max-w-md">
      <Portfolio>
        <PortfolioHeader>
          <PortfolioTitle>나의 글 모음</PortfolioTitle>
          <PortfolioMeta>2편</PortfolioMeta>
        </PortfolioHeader>
        <PortfolioList>
          <PortfolioPiece visibility="cohort">
            <PortfolioPieceTitle>숙제 폐지 찬반</PortfolioPieceTitle>
            <PortfolioPieceMeta visibility="cohort">3월 7일 · 268자</PortfolioPieceMeta>
            <PortfolioPieceExcerpt>
              숙제를 줄여야 한다. 주 5일 반복 과제가 학습 부담을 키우기 때문이다…
            </PortfolioPieceExcerpt>
          </PortfolioPiece>
          <PortfolioPiece visibility="private">
            <PortfolioPieceTitle>자기반박 연습</PortfolioPieceTitle>
            <PortfolioPieceMeta visibility="private">2월 28일 · 초안</PortfolioPieceMeta>
            <PortfolioPieceExcerpt>
              모든 숙제를 없애면 복습 리듬이 사라질 수 있다…
            </PortfolioPieceExcerpt>
          </PortfolioPiece>
        </PortfolioList>
      </Portfolio>
    </div>
  );
}

export const LEARNING_EXTENDED_PREVIEWS: Record<string, () => ReactNode> = {
  checkpoint: () => <CheckpointDemo />,
  "practice-queue": () => <PracticeQueueDemo />,
  "mistake-journal": () => <MistakeJournalDemo />,
  "hint-ladder": () => <HintLadderDemo />,
  "writing-brief": () => <WritingBriefDemo />,
  "source-pack": () => <SourcePackDemo />,
  outline: () => <OutlineDemo />,
  "argument-map": () => <ArgumentMapDemo />,
  draft: () => <DraftDemo />,
  "text-annotation": () => <TextAnnotationDemo />,
  rubric: () => <RubricDemo />,
  "feedback-summary": () => <FeedbackSummaryDemo />,
  "revision-history": () => <RevisionHistoryDemo />,
  submission: () => <SubmissionDemo />,
  reflection: () => <ReflectionDemo />,
  "skill-map": () => <SkillMapDemo />,
  portfolio: () => <PortfolioDemo />,
};

export function isLearningExtendedPreview(slug: string) {
  return slug in LEARNING_EXTENDED_PREVIEWS;
}

export function LearningExtendedPreview({ slug }: { slug: string }) {
  const render = LEARNING_EXTENDED_PREVIEWS[slug];
  if (!render) return null;
  return <div className="flex w-full justify-center py-2">{render()}</div>;
}
