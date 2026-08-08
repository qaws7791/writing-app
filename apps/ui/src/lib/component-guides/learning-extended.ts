import type { ComponentGuideMap } from "./types";

export const learningExtendedGuides: ComponentGuideMap = {
  checkpoint: {
    slug: "checkpoint",
    summary: "유닛·레슨 중간 점검 카드입니다. 목표 달성, 점수, 힌트를 한 화면에 모읍니다.",
    examples: [
      {
        id: "unit-gate",
        title: "유닛 중간 점검",
        description: "유닛 중 · 목표·점수·힌트를 한 카드로 묶는 기본 구성입니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/checkpoint"
import { Button } from "@/components/ui/button"

export function UnitCheckpoint() {
  return (
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
      </CheckpointObjectives>
      <CheckpointScore label="현재 점수" value="2 / 3" />
      <CheckpointHint>통과하려면 남은 목표를 하나 이상 완료하세요.</CheckpointHint>
      <CheckpointActions>
        <Button>점검 계속하기</Button>
      </CheckpointActions>
    </Checkpoint>
  )
}`,
      },
      {
        id: "passed",
        title: "통과 상태",
        description: "모든 목표를 충족하면 passed 상태로 전환합니다.",
        code: `<Checkpoint status="passed">
  <CheckpointHeader>
    <CheckpointTitle>유닛 1 마스터리 통과</CheckpointTitle>
    <CheckpointMeta status="passed" />
  </CheckpointHeader>
  <CheckpointObjectives>
    <CheckpointObjective met>주장 문장 식별</CheckpointObjective>
    <CheckpointObjective met>근거 연결 판단</CheckpointObjective>
  </CheckpointObjectives>
</Checkpoint>`,
      },
      {
        id: "needs-review",
        title: "보완 필요",
        description: "needs-review는 재시도 전 보완이 필요함을 나타냅니다.",
        code: `<Checkpoint status="needs-review">
  <CheckpointMeta status="needs-review" />
  <CheckpointHint>한 목표를 더 완료한 뒤 다시 점검하세요.</CheckpointHint>
</Checkpoint>`,
      },
      {
        id: "objectives",
        title: "목표 목록",
        description: "CheckpointObjective의 met로 달성 여부를 표시합니다.",
        code: `<CheckpointObjectives>
  <CheckpointObjective met>주장과 근거를 구분한다</CheckpointObjective>
  <CheckpointObjective>문장 간 연결어를 고른다</CheckpointObjective>
</CheckpointObjectives>`,
      },
    ],
    usageNotes: [
      "통과 전에는 힌트와 목표만 보여 주고, 재시도·다음 단계 버튼은 CheckpointActions에 모읍니다.",
      "상태 ready·in-progress·passed·needs-review 네 가지로 통과, 진행, 보완 필요를 표현합니다.",
    ],
    accessibility: [
      "CheckpointTitle은 해당 점검의 접근 가능한 제목으로 사용하세요.",
      "목표 달성 여부는 met 속성과 함께 텍스트로도 전달하세요.",
    ],
    props: [
      {
        name: "status",
        type: '"ready" | "in-progress" | "passed" | "needs-review"',
        defaultValue: "ready",
        description: "점검 진행 상태입니다. CheckpointMeta와 함께 쓰면 일관됩니다.",
      },
      {
        name: "met",
        type: "boolean",
        defaultValue: "false",
        description: "CheckpointObjective의 목표 달성 여부를 표시합니다.",
      },
    ],
    related: ["step", "mastery", "practice-queue", "lesson"],
  },
  "practice-queue": {
    slug: "practice-queue",
    summary:
      "복습·연습 항목을 우선순위와 함께 나열하는 큐입니다. 오늘·이번 주·대기 항목을 한눈에 보여 줍니다.",
    examples: [
      {
        id: "daily-queue",
        title: "오늘의 연습",
        description: "오늘 권장되는 연습 항목을 나열합니다.",
        preview: "default",
        code: `import {
  PracticeQueue,
  PracticeQueueHeader,
  PracticeQueueItem,
  PracticeQueueItemMeta,
  PracticeQueueItemReason,
  PracticeQueueItemTitle,
  PracticeQueueList,
  PracticeQueueMeta,
  PracticeQueueTitle,
} from "@/components/ui/practice-queue"

export function DailyPractice() {
  return (
    <PracticeQueue>
      <PracticeQueueHeader>
        <PracticeQueueTitle>오늘의 연습</PracticeQueueTitle>
        <PracticeQueueMeta>3개 · 약 18분</PracticeQueueMeta>
      </PracticeQueueHeader>
      <PracticeQueueList>
        <PracticeQueueItem priority="high">
          <PracticeQueueItemTitle>근거 연결 다시 쓰기</PracticeQueueItemTitle>
          <PracticeQueueItemReason>어제 제출에서 근거-주장 거리가 멀었습니다.</PracticeQueueItemReason>
          <PracticeQueueItemMeta priority="high" />
        </PracticeQueueItem>
        <PracticeQueueItem>
          <PracticeQueueItemTitle>반박 문장 고르기</PracticeQueueItemTitle>
          <PracticeQueueItemReason>유닛 1 복습 권장</PracticeQueueItemReason>
          <PracticeQueueItemMeta />
        </PracticeQueueItem>
      </PracticeQueueList>
    </PracticeQueue>
  )
}`,
      },
      {
        id: "priority-high",
        title: "높은 우선순위",
        description: 'priority="high"는 긴급·집중 연습 항목을 강조합니다.',
        code: `<PracticeQueueItem priority="high">
  <PracticeQueueItemTitle>근거 연결 · 집중 연습</PracticeQueueItemTitle>
  <PracticeQueueItemMeta priority="high" />
</PracticeQueueItem>`,
      },
      {
        id: "hint-actions",
        title: "힌트와 행동",
        description: "큐 하단 PracticeQueueHint와 PracticeQueueActions를 둘 수 있습니다.",
        code: `import { PracticeQueueActions, PracticeQueueHint } from "@/components/ui/practice-queue"
import { Button } from "@/components/ui/button"

<PracticeQueueHint>오늘은 집중 연습 두 개만 완료해도 됩니다.</PracticeQueueHint>
<PracticeQueueActions>
  <Button variant="ghost">나중에</Button>
  <Button>첫 연습 시작</Button>
</PracticeQueueActions>`,
      },
      {
        id: "empty",
        title: "빈 큐",
        description: "항목이 없을 때 PracticeQueueMeta로 안내합니다.",
        code: `<PracticeQueue>
  <PracticeQueueHeader>
    <PracticeQueueTitle>오늘의 연습</PracticeQueueTitle>
    <PracticeQueueMeta>예정된 연습 없음</PracticeQueueMeta>
  </PracticeQueueHeader>
</PracticeQueue>`,
      },
    ],
    usageNotes: [
      "항목 MistakeJournal·SkillMap에서 파생된 이유는 PracticeQueueItemReason에 적습니다.",
      "우선순위 low·normal·high 세 가지로, 큐 헤더 요약은 PracticeQueueMeta에 둡니다.",
    ],
    accessibility: [
      "PracticeQueueList는 순서 있는 목록(ol)으로 항목 순서를 전달하세요.",
      "우선순위 PracticeQueueItemMeta는 시각적 강조 외에 priority prop을 함께 쓰세요.",
    ],
    props: [
      {
        name: "priority",
        type: '"low" | "normal" | "high"',
        defaultValue: "normal",
        description: "PracticeQueueItem과 PracticeQueueItemMeta에 공유됩니다.",
      },
    ],
    related: ["checkpoint", "mistake-journal", "skill-map", "next-action"],
  },
  "mistake-journal": {
    slug: "mistake-journal",
    summary:
      "반복되는 오류 패턴을 기록·추적하는 저널입니다. emerging·recurring·resolved 상태로 분류합니다.",
    examples: [
      {
        id: "pattern-list",
        title: "패턴 목록",
        description: "오류 유형, 횟수, 설명을 MistakePattern으로 나열합니다.",
        preview: "default",
        code: `import {
  MistakeJournal,
  MistakeJournalHeader,
  MistakeJournalList,
  MistakeJournalMeta,
  MistakeJournalTitle,
  MistakePattern,
  MistakePatternCount,
  MistakePatternDescription,
  MistakePatternLabel,
} from "@/components/ui/mistake-journal"

export function MistakePatterns() {
  return (
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
      </MistakeJournalList>
    </MistakeJournal>
  )
}`,
      },
      {
        id: "emerging",
        title: "새로 나타남",
        description: 'state="emerging"은 처음 관찰된 패턴입니다.',
        code: `<MistakePattern state="emerging" count={1}>
  <MistakePatternLabel>문단 전환 없음</MistakePatternLabel>
  <MistakePatternDescription>본론 문단 사이에 연결어가 빠졌습니다.</MistakePatternDescription>
</MistakePattern>`,
      },
      {
        id: "resolved",
        title: "해결됨",
        description: "resolved는 더 이상 반복되지 않는 패턴입니다.",
        code: `<MistakePattern state="resolved" count={0}>
  <MistakePatternLabel>주장 문장 누락</MistakePatternLabel>
</MistakePattern>`,
      },
      {
        id: "actions",
        title: "연습 연결",
        description: "MistakePatternActions로 연습 항목을 연결합니다.",
        code: `import { MistakePatternActions } from "@/components/ui/mistake-journal"
import { Button } from "@/components/ui/button"

<MistakePatternActions>
  <Button size="sm" variant="outline">연습 추가</Button>
</MistakePatternActions>`,
      },
    ],
    usageNotes: [
      "패턴 설명은 구체적 행동 기준으로 쓰고, 횟수는 최근 기간 기준으로 집계합니다.",
      "PracticeQueue와 연동해 recurring 패턴은 자동 연습 항목으로 올리세요.",
    ],
    accessibility: [
      "MistakePatternCount는 시각적 배지만 쓰지 말고 count prop을 함께 전달하세요.",
      "패턴 상태는 state prop과 함께 텍스트로도 구분 가능하게 하세요.",
    ],
    props: [
      {
        name: "state",
        type: '"emerging" | "recurring" | "resolved"',
        defaultValue: "emerging",
        description: "MistakePattern의 상태 분류입니다.",
      },
      {
        name: "count",
        type: "number",
        defaultValue: "—",
        description: "MistakePattern과 MistakePatternCount에 공유되는 발생 횟수입니다.",
      },
    ],
    related: ["practice-queue", "feedback-summary", "skill-map", "item-analysis"],
  },
  "hint-ladder": {
    slug: "hint-ladder",
    summary: "단계별 힌트 사다리입니다. observe·direction·example 단계로 점진적 공개합니다.",
    examples: [
      {
        id: "ladder",
        title: "3단계 사다리",
        description: "revealed prop으로 단계별 공개 여부를 제어합니다.",
        preview: "default",
        code: `import {
  HintLadder,
  HintLadderHeader,
  HintLadderMeta,
  HintLadderSteps,
  HintLadderTitle,
  HintStep,
  HintStepBody,
  HintStepLabel,
} from "@/components/ui/hint-ladder"

export function ArgumentHints() {
  return (
    <HintLadder>
      <HintLadderHeader>
        <HintLadderTitle>근거 연결 힌트</HintLadderTitle>
        <HintLadderMeta>1 / 3 단계</HintLadderMeta>
      </HintLadderHeader>
      <HintLadderSteps>
        <HintStep level="observe" revealed>
          <HintStepLabel />
          <HintStepBody>주장 문장과 근거 문장 사이에 공통 키워드가 있는지 살펴보세요.</HintStepBody>
        </HintStep>
        <HintStep level="direction" revealed={false}>
          <HintStepLabel />
          <HintStepBody>근거가 주장의 어떤 부분을 뒷받침하는지 한 줄로 적어 보세요.</HintStepBody>
        </HintStep>
      </HintLadderSteps>
    </HintLadder>
  )
}`,
      },
      {
        id: "reveal-next",
        title: "다음 힌트 공개",
        description: "HintStepActions로 다음 단계 공개 버튼을 둡니다.",
        code: `import { HintStepActions } from "@/components/ui/hint-ladder"
import { Button } from "@/components/ui/button"

<HintStep level="example" revealed={false}>
  <HintStepBody>예: 「따라서 숙제량을 줄여야 한다」→「주 5일 반복 학습이 부담이 된다」</HintStepBody>
  <HintStepActions>
    <Button size="sm" variant="outline">예시 보기</Button>
  </HintStepActions>
</HintStep>`,
      },
      {
        id: "levels",
        title: "단계 종류",
        description: "level prop은 observe·direction·example 세 가지입니다.",
        code: `<HintStep level="observe" revealed>
  <HintStepLabel />
  <HintStepBody>관찰 단계: 문장 간 공통점을 찾아보세요.</HintStepBody>
</HintStep>`,
      },
      {
        id: "meta-progress",
        title: "진행 표시",
        description: "HintLadderMeta에 공개된 단계 수를 표시합니다.",
        code: `<HintLadderMeta>1 / 3 단계</HintLadderMeta>`,
      },
    ],
    usageNotes: [
      "한 번에 모든 힌트를 보여 주지 말고 revealed 상태를 React state로 관리하세요.",
      "example 단계는 직접 답을 주지 않고, 관찰·방향 힌트 후 마지막에 공개하세요.",
    ],
    accessibility: [
      "숨겨진 단계는 스크린 리더에도 공개 전 내용을 노출하지 않도록 HintStepLabel을 활용하세요.",
      "다음 힌트 버튼에는 공개할 단계를 설명하는 레이블을 붙이세요.",
    ],
    props: [
      {
        name: "level",
        type: '"observe" | "direction" | "example"',
        defaultValue: "observe",
        description: "HintStep의 단계 유형입니다. HintStepLabel이 레이블을 제공합니다.",
      },
      {
        name: "revealed",
        type: "boolean",
        defaultValue: "false",
        description: "false면 내용을 숨기고 공개 전 UI를 표시합니다.",
      },
    ],
    related: ["step", "coaching", "choice", "compose"],
  },
  "writing-brief": {
    slug: "writing-brief",
    summary: "글쓰기 과제 브리프입니다. 제목·안내·분량·독자·기준·요구사항을 한 카드에 모읍니다.",
    examples: [
      {
        id: "assignment",
        title: "과제 브리프",
        description: "WritingBriefFacts와 WritingBriefSection으로 구조화합니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/writing-brief"

export function EssayBrief() {
  return (
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
      <WritingBriefRequirement>출처는 본문에 직접 인용하지 않아도 됩니다.</WritingBriefRequirement>
    </WritingBrief>
  )
}`,
      },
      {
        id: "facts",
        title: "과제 정보",
        description: "WritingBriefFacts는 dt/dd 쌍으로 메타 정보를 나열합니다.",
        code: `<WritingBriefFacts>
  <WritingBriefFact>
    <dt>마감</dt>
    <dd>3월 10일</dd>
  </WritingBriefFact>
</WritingBriefFacts>`,
      },
      {
        id: "criteria",
        title: "평가 기준",
        description: "나중에 Rubric과 연결할 기준 항목을 나열합니다.",
        code: `<WritingBriefCriteria>
  <WritingBriefCriterion>주장이 첫 문장에 분명하다</WritingBriefCriterion>
  <WritingBriefCriterion>근거가 주장과 직접 연결된다</WritingBriefCriterion>
</WritingBriefCriteria>`,
      },
      {
        id: "requirement",
        title: "추가 요구",
        description: "WritingBriefRequirement는 필수·금지 사항을 적습니다.",
        code: `<WritingBriefRequirement>인용 부호 없이 출처를 언급하지 마세요.</WritingBriefRequirement>`,
      },
    ],
    usageNotes: [
      "Draft·Submission과 같은 화면에서 분량·기준은 DraftMeter·Rubric과 연결하세요.",
      "WritingBriefLead는 과제 목적을 한두 문장으로 요약합니다.",
    ],
    accessibility: [
      "WritingBriefFacts의 dt/dd는 용어-값 쌍으로 읽히도록 구조를 유지하세요.",
      "WritingBriefTitle은 해당 과제의 접근 가능한 제목으로 사용하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "WritingBrief 루트의 너비·간격 조정에 사용합니다.",
      },
    ],
    related: ["draft", "source-pack", "rubric", "compose"],
  },
  "source-pack": {
    slug: "source-pack",
    summary:
      "읽기·통계·발췌·외부 자료 묶음입니다. reading·stat·excerpt·external 종류로 분류합니다.",
    examples: [
      {
        id: "pack",
        title: "참고 자료 팩",
        description: "SourceItem kind로 자료 유형을 구분합니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/source-pack"

export function ReadingPack() {
  return (
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
          <SourceItemBody>적절한 복습은 기억 유지에 도움이 되지만, 양이 과하면 역효과가 납니다.</SourceItemBody>
        </SourceItem>
      </SourcePackList>
    </SourcePack>
  )
}`,
      },
      {
        id: "external",
        title: "외부 링크",
        description: 'kind="external"은 링크·외부 자료 항목입니다.',
        code: `<SourceItem kind="external">
  <SourceItemTitle>관련 뉴스 기사</SourceItemTitle>
  <SourceItemMeta kind="external" />
</SourceItem>`,
      },
      {
        id: "citation",
        title: "출처 표기",
        description: "SourceItemCitation은 출처·연도를 italic 스타일로 표시합니다.",
        code: `<SourceItemCitation>2024 교육부 학습 부담 조사</SourceItemCitation>`,
      },
      {
        id: "actions",
        title: "항목 행동",
        description: "SourceItemActions에 북마크·펼치기 등을 둡니다.",
        code: `import { SourceItemActions } from "@/components/ui/source-pack"
import { Button } from "@/components/ui/button"

<SourceItemActions>
  <Button size="sm" variant="outline">자료 열기</Button>
</SourceItemActions>`,
      },
    ],
    usageNotes: [
      "WritingBrief와 같은 화면에서 읽기 자료는 SourcePack으로 제공합니다.",
      "stat·excerpt는 본문 인용 전 SourceItemBody로 내용을 미리 보여 줍니다.",
    ],
    accessibility: [
      "SourceItemMeta는 kind에 맞는 유형 레이블을 제공합니다.",
      "외부 링크 SourceItemActions에는 새 창 여부를 명시하세요.",
    ],
    props: [
      {
        name: "kind",
        type: '"reading" | "stat" | "excerpt" | "external"',
        defaultValue: "reading",
        description: "SourceItem과 SourceItemMeta의 자료 유형입니다.",
      },
    ],
    related: ["writing-brief", "prose", "compose", "argument-map"],
  },
  outline: {
    slug: "outline",
    summary:
      "문단·에세이 개요 편집기입니다. intro·body·conclusion·claim·evidence·example 블록으로 구성합니다.",
    examples: [
      {
        id: "paragraph-outline",
        title: "문단 개요",
        description: "OutlineBlock kind와 OutlineBlockHandle로 드래그 가능한 블록을 만듭니다.",
        preview: "default",
        code: `import {
  Outline,
  OutlineBlock,
  OutlineBlockBody,
  OutlineBlockHandle,
  OutlineBlockLabel,
  OutlineHeader,
  OutlineHint,
  OutlineList,
  OutlineTitle,
} from "@/components/ui/outline"

export function ParagraphOutline() {
  return (
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
  )
}`,
      },
      {
        id: "essay-structure",
        title: "에세이 구조",
        description: "intro·body·conclusion kind로 전체 구조를 잡습니다.",
        code: `<OutlineBlock kind="intro">
  <OutlineBlockLabel />
  <OutlineBlockBody>독자의 관심을 끄는 도입</OutlineBlockBody>
</OutlineBlock>`,
      },
      {
        id: "block-actions",
        title: "블록 행동",
        description: "OutlineBlockActions에 삭제·추가 버튼을 둡니다.",
        code: `import { OutlineBlockActions } from "@/components/ui/outline"
import { Button } from "@/components/ui/button"

<OutlineBlockActions>
  <Button size="icon-sm" variant="ghost">×</Button>
</OutlineBlockActions>`,
      },
      {
        id: "kinds",
        title: "블록 종류",
        description: "claim·evidence·example은 논증 블록, intro·body·conclusion은 문단 구조입니다.",
        code: `<OutlineBlock kind="example">
  <OutlineBlockBody>예: 중학생 62%가 숙제 부담을 호소</OutlineBlockBody>
</OutlineBlock>`,
      },
    ],
    usageNotes: [
      "Sortable과 함께 쓸 때 OutlineBlockHandle을 드래그 핸들로 연결하세요.",
      "ArgumentMap과 같은 논증 구조는 개요 블록과 노드 종류를 맞추면 전환하기 쉽습니다.",
    ],
    accessibility: [
      "OutlineBlockHandle에는 드래그 가능함을 알리는 accessible name을 제공하세요.",
      "OutlineBlockLabel은 kind에 맞는 역할 레이블을 표시합니다.",
    ],
    props: [
      {
        name: "kind",
        type: '"intro" | "body" | "conclusion" | "claim" | "evidence" | "example"',
        defaultValue: "body",
        description: "OutlineBlock의 블록 유형입니다.",
      },
    ],
    related: ["draft", "argument-map", "sortable", "writing-brief"],
  },
  "argument-map": {
    slug: "argument-map",
    summary: "주장·근거·반론·재반박 관계를 시각화하는 논증 맵입니다.",
    examples: [
      {
        id: "structure",
        title: "논증 구조",
        description: "ArgumentNode kind와 ArgumentEdge로 관계를 표현합니다.",
        preview: "default",
        code: `import {
  ArgumentEdge,
  ArgumentMap,
  ArgumentMapCanvas,
  ArgumentMapHeader,
  ArgumentMapHint,
  ArgumentMapTitle,
  ArgumentNode,
  ArgumentNodeBody,
  ArgumentNodeLabel,
} from "@/components/ui/argument-map"

export function ClaimStructure() {
  return (
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
  )
}`,
      },
      {
        id: "rebuttal",
        title: "재반박",
        description: 'kind="rebuttal" 노드로 반론에 대한 응답을 추가합니다.',
        code: `<ArgumentNode kind="rebuttal">
  <ArgumentNodeLabel />
  <ArgumentNodeBody>숙제 양을 줄이되 목적 있는 과제로 대체할 수 있다</ArgumentNodeBody>
</ArgumentNode>`,
      },
      {
        id: "kinds",
        title: "노드 종류",
        description: "kind는 claim·evidence·counter·rebuttal 네 가지입니다.",
        code: `<ArgumentNode kind="evidence">
  <ArgumentNodeLabel kind="evidence" />
  <ArgumentNodeBody>근거 본문</ArgumentNodeBody>
</ArgumentNode>`,
      },
      {
        id: "edge-labels",
        title: "관계 레이블",
        description: "ArgumentEdge children으로 뒷받침·반론 등 관계를 표시합니다.",
        code: `<ArgumentEdge>뒷받침</ArgumentEdge>
<ArgumentEdge>반론</ArgumentEdge>`,
      },
    ],
    usageNotes: [
      "ArgumentNode에는 kind prop을 사용합니다. role은 export API에 없습니다.",
      "Outline의 claim·evidence 블록과 같은 용어를 쓰면 학습 흐름이 자연스럽습니다.",
    ],
    accessibility: [
      "ArgumentNodeLabel은 kind에 맞는 역할 레이블을 제공하고 children으로 덮어쓸 수 있습니다.",
      'ArgumentEdge는 role="presentation"으로 장식적 연결선임을 나타냅니다.',
    ],
    props: [
      {
        name: "kind",
        type: '"claim" | "evidence" | "counter" | "rebuttal"',
        defaultValue: "claim",
        description: "ArgumentNode와 ArgumentNodeLabel의 노드 유형입니다.",
      },
    ],
    related: ["outline", "compose", "source-pack", "writing-brief"],
  },
  draft: {
    slug: "draft",
    summary: "글쓰기 초안 편집 영역입니다. 상태·편집기·분량·저장·제출 준비를 한 프레임에 모읍니다.",
    examples: [
      {
        id: "editor",
        title: "초안 편집",
        description: "DraftEditor와 DraftMeter로 본문·분량을 함께 표시합니다.",
        preview: "default",
        code: `import {
  Draft,
  DraftActions,
  DraftEditor,
  DraftHeader,
  DraftMeter,
  DraftStatus,
  DraftTitle,
} from "@/components/ui/draft"
import { Button } from "@/components/ui/button"

export function FirstDraft() {
  return (
    <Draft status="editing">
      <DraftHeader>
        <DraftTitle>1차 초안</DraftTitle>
        <DraftStatus />
      </DraftHeader>
      <DraftEditor placeholder="주장과 근거를 한 문단으로 작성하세요." />
      <DraftMeter characters={42} paragraphs={1} minCharacters={200} />
      <DraftActions>
        <Button size="sm" variant="outline">저장</Button>
        <Button size="sm">제출 준비</Button>
      </DraftActions>
    </Draft>
  )
}`,
      },
      {
        id: "statuses",
        title: "저장 상태",
        description:
          "status는 DraftStatus에 editing·saving·saved·offline·submittable·submitted가 있습니다.",
        code: `<Draft status="saved">
  <DraftStatus status="saved" />
</Draft>`,
      },
      {
        id: "meter-ready",
        title: "분량 충족",
        description: 'DraftMeter는 minCharacters 충족 시 data-state="ready"가 됩니다.',
        code: `<DraftMeter characters={248} paragraphs={1} minCharacters={200} />`,
      },
      {
        id: "versions",
        title: "버전 탭",
        description: "DraftVersions로 초안 버전 전환 UI를 둡니다.",
        code: `import { DraftVersions } from "@/components/ui/draft"
import { Button } from "@/components/ui/button"

<DraftVersions>
  <Button size="sm" variant="ghost">1차</Button>
  <Button size="sm" variant="outline">2차</Button>
</DraftVersions>`,
      },
    ],
    usageNotes: [
      "Compose는 입력 중 피드백, Draft는 장문 초안·저장 흐름에 맞춥니다.",
      "분량 미달 시 DraftMeter의 data-state와 함께 제출 버튼 disabled를 쓰세요.",
    ],
    accessibility: [
      "DraftEditor(Textarea)의 placeholder만으로는 부족할 때 DraftTitle을 레이블로 연결하세요.",
      "저장·오프라인 상태는 DraftStatus 텍스트로도 전달하세요.",
    ],
    props: [
      {
        name: "status",
        type: '"editing" | "saving" | "saved" | "offline" | "submittable" | "submitted"',
        defaultValue: "editing",
        description: "Draft 루트와 DraftStatus의 저장·제출 상태입니다.",
      },
      {
        name: "minCharacters",
        type: "number",
        defaultValue: "—",
        description: "DraftMeter의 최소 분량 기준입니다.",
      },
    ],
    related: ["writing-brief", "submission", "revision-history", "compose"],
  },
  "text-annotation": {
    slug: "text-annotation",
    summary:
      "본문 인라인 주석과 패널 피드백입니다. spelling·logic 등 kind와 open·accepted 등 state를 표현합니다.",
    examples: [
      {
        id: "inline-panel",
        title: "인라인·패널",
        description: "TextAnnotationMark와 TextAnnotationItem의 kind를 맞춥니다.",
        preview: "default",
        code: `import {
  TextAnnotation,
  TextAnnotationDocument,
  TextAnnotationItem,
  TextAnnotationItemBody,
  TextAnnotationItemLabel,
  TextAnnotationMark,
  TextAnnotationPanel,
} from "@/components/ui/text-annotation"

export function LogicAnnotation() {
  return (
    <TextAnnotation>
      <TextAnnotationDocument>
        숙제를 <TextAnnotationMark kind="logic">없애면</TextAnnotationMark> 학습 부담은 줄지만, 복습
        리듬도 함께 사라질 수 있다.
      </TextAnnotationDocument>
      <TextAnnotationPanel>
        <TextAnnotationItem kind="logic" state="open">
          <TextAnnotationItemLabel />
          <TextAnnotationItemBody>
            「없애면」은 절대적 표현입니다. 「줄이면」처럼 완화해 보세요.
          </TextAnnotationItemBody>
        </TextAnnotationItem>
      </TextAnnotationPanel>
    </TextAnnotation>
  )
}`,
      },
      {
        id: "states",
        title: "피드백 상태",
        description: "state는 open·accepted·rejected·resolved입니다.",
        code: `<TextAnnotationItem kind="logic" state="accepted">
  <TextAnnotationItemLabel />
  <TextAnnotationItemBody>수용된 제안</TextAnnotationItemBody>
</TextAnnotationItem>`,
      },
      {
        id: "kinds",
        title: "주석 종류",
        description: "kind는 spelling·spacing·agreement·logic·expression입니다.",
        code: `<TextAnnotationMark kind="spelling">맞춤법</TextAnnotationMark>`,
      },
      {
        id: "actions",
        title: "수용·거절",
        description: "TextAnnotationItemActions에 수락·거절 버튼을 둡니다.",
        code: `import { TextAnnotationItemActions } from "@/components/ui/text-annotation"
import { Button } from "@/components/ui/button"

<TextAnnotationItemActions>
  <Button size="sm" variant="outline">수용</Button>
  <Button size="sm" variant="ghost">거절</Button>
</TextAnnotationItemActions>`,
      },
    ],
    usageNotes: [
      "AI·교사 피드백을 본문에 연결할 때 mark와 item의 kind를 일치시키세요.",
      "accepted·resolved 이후에는 mark에도 동일 state를 반영하세요.",
    ],
    accessibility: [
      "TextAnnotationItemLabel은 kind·state를 텍스트로도 전달합니다.",
      "수용·거절 버튼에는 변경 내용을 설명하는 레이블을 붙이세요.",
    ],
    props: [
      {
        name: "kind",
        type: '"spelling" | "spacing" | "agreement" | "logic" | "expression"',
        defaultValue: "spelling",
        description: "TextAnnotationMark와 TextAnnotationItem의 주석 유형입니다.",
      },
      {
        name: "state",
        type: '"open" | "accepted" | "rejected" | "resolved"',
        defaultValue: "open",
        description: "피드백 처리 상태입니다.",
      },
    ],
    related: ["draft", "feedback-summary", "coaching", "compose"],
  },
  rubric: {
    slug: "rubric",
    summary: "채점 루브릭 표면입니다. 항목·수준·가중치·판정을 구조화합니다.",
    examples: [
      {
        id: "criterion",
        title: "기준 항목",
        description: "RubricCriterion 단위로 수준과 RubricJudgment를 구성합니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/rubric"

export function EssayRubric() {
  return (
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
            <RubricLevel active>미흡</RubricLevel>
            <RubricLevel>보통</RubricLevel>
            <RubricLevel>우수</RubricLevel>
          </RubricLevels>
          <RubricJudgment>
            <RubricJudgmentLabel>판정</RubricJudgmentLabel>
            <RubricJudgmentReason>주장은 분명하나 근거 연결이 약합니다.</RubricJudgmentReason>
          </RubricJudgment>
        </RubricCriterion>
      </RubricList>
    </Rubric>
  )
}`,
      },
      {
        id: "levels",
        title: "수준 선택",
        description: "RubricLevel은 button이며 active와 aria-pressed를 사용합니다.",
        code: `<RubricLevels>
  <RubricLevel active aria-pressed={true}>보통</RubricLevel>
  <RubricLevel>우수</RubricLevel>
</RubricLevels>`,
      },
      {
        id: "weight",
        title: "가중치",
        description: "RubricCriterion weight prop과 RubricCriterionWeight를 함께 씁니다.",
        code: `<RubricCriterion weight={30}>
  <RubricCriterionWeight weight={30} />
</RubricCriterion>`,
      },
      {
        id: "judgment",
        title: "판정 사유",
        description: "RubricJudgmentReason에 채점 근거를 적습니다.",
        code: `<RubricJudgment>
  <RubricJudgmentLabel>판정</RubricJudgmentLabel>
  <RubricJudgmentReason>근거 문장이 주장과 직접 연결됩니다.</RubricJudgmentReason>
</RubricJudgment>`,
      },
    ],
    usageNotes: [
      "WritingBrief의 WritingBriefCriterion과 같은 문구를 쓰면 학습자·채점자 기준이 일치합니다.",
      "RubricEditor는 편집, Rubric은 읽기·채점 표면에 맞춥니다.",
    ],
    accessibility: [
      "RubricLevel은 aria-pressed로 선택 상태를 전달하세요.",
      "가중치 RubricCriterionWeight는 퍼센트 값을 텍스트로도 읽히게 하세요.",
    ],
    props: [
      {
        name: "active",
        type: "boolean",
        defaultValue: "false",
        description: "RubricLevel의 선택 상태입니다.",
      },
      {
        name: "weight",
        type: "number",
        defaultValue: "—",
        description: "RubricCriterion의 항목 가중치(%)입니다.",
      },
    ],
    related: ["writing-brief", "feedback-summary", "submission", "rubric-editor"],
  },
  "feedback-summary": {
    slug: "feedback-summary",
    summary: "수정 우선순위가 정리된 피드백 요약입니다. high·medium·low로 중요도를 구분합니다.",
    examples: [
      {
        id: "priorities",
        title: "수정 우선순위",
        description: "FeedbackSummaryPriority 안에 priority별 항목을 나열합니다.",
        preview: "default",
        code: `import {
  FeedbackSummary,
  FeedbackSummaryHeader,
  FeedbackSummaryItem,
  FeedbackSummaryItemBody,
  FeedbackSummaryItemScope,
  FeedbackSummaryItemTitle,
  FeedbackSummaryMeta,
  FeedbackSummaryPriority,
  FeedbackSummaryTitle,
} from "@/components/ui/feedback-summary"

export function RevisionPriorities() {
  return (
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
          <FeedbackSummaryItemBody>결론 문장이 주장을 다시 짚어 주면 좋습니다.</FeedbackSummaryItemBody>
        </FeedbackSummaryItem>
      </FeedbackSummaryPriority>
    </FeedbackSummary>
  )
}`,
      },
      {
        id: "low-priority",
        title: "낮은 우선순위",
        description: 'priority="low"는 선택적 개선 항목입니다.',
        code: `<FeedbackSummaryItem priority="low">
  <FeedbackSummaryItemTitle>어휘 다양화</FeedbackSummaryItemTitle>
  <FeedbackSummaryItemScope priority="low" />
</FeedbackSummaryItem>`,
      },
      {
        id: "actions",
        title: "다음 행동",
        description: "FeedbackSummaryActions에 수정·기록 보기를 둡니다.",
        code: `import { FeedbackSummaryActions } from "@/components/ui/feedback-summary"
import { Button } from "@/components/ui/button"

<FeedbackSummaryActions>
  <Button size="sm">수정하기</Button>
</FeedbackSummaryActions>`,
      },
      {
        id: "empty",
        title: "피드백 없음",
        description: "항목이 없을 때 Meta로 안내합니다.",
        code: `<FeedbackSummaryMeta>피드백 없음</FeedbackSummaryMeta>`,
      },
    ],
    usageNotes: [
      "TextAnnotation·Rubric 결과를 FeedbackSummaryItem으로 묶고 priority를 부여하세요.",
      "high는 1–2개로 제한하고 medium·low는 보조 개선으로 분류하세요.",
    ],
    accessibility: [
      "FeedbackSummaryItemScope는 priority를 텍스트로도 전달합니다.",
      "우선순위 목록은 ol(FeedbackSummaryPriority) 구조를 유지하세요.",
    ],
    props: [
      {
        name: "priority",
        type: '"high" | "medium" | "low"',
        defaultValue: "medium",
        description: "FeedbackSummaryItem과 FeedbackSummaryItemScope에 공유됩니다.",
      },
    ],
    related: ["text-annotation", "rubric", "submission", "revision-history"],
  },
  "revision-history": {
    slug: "revision-history",
    summary: "초안·수정·최종 제출 타임라인입니다. draft·revision·final state로 구분합니다.",
    examples: [
      {
        id: "timeline",
        title: "수정 기록",
        description: "RevisionEntry state와 RevisionEntryMeta로 날짜를 표시합니다.",
        preview: "default",
        code: `import {
  RevisionEntry,
  RevisionEntryMark,
  RevisionEntryMeta,
  RevisionEntryTitle,
  RevisionHistory,
  RevisionHistoryHeader,
  RevisionHistoryList,
  RevisionHistoryTitle,
} from "@/components/ui/revision-history"

export function DraftTimeline() {
  return (
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
  )
}`,
      },
      {
        id: "compare",
        title: "버전 비교",
        description: "RevisionHistoryCompare에 diff·나란히 보기를 둡니다.",
        code: `import { RevisionHistoryCompare } from "@/components/ui/revision-history"

<RevisionHistoryCompare>
  {/* 두 버전 diff UI */}
</RevisionHistoryCompare>`,
      },
      {
        id: "entry-actions",
        title: "항목 행동",
        description: "RevisionEntryActions에 보기·복원을 둡니다.",
        code: `import { RevisionEntryActions } from "@/components/ui/revision-history"
import { Button } from "@/components/ui/button"

<RevisionEntryActions>
  <Button size="sm" variant="ghost">보기</Button>
</RevisionEntryActions>`,
      },
      {
        id: "states",
        title: "상태 구분",
        description: "revision·final은 수정·최종 제출을 시각적으로 구분합니다.",
        code: `<RevisionEntry state="final">
  <RevisionEntryTitle>최종 제출</RevisionEntryTitle>
</RevisionEntry>`,
      },
    ],
    usageNotes: [
      "Draft의 DraftVersions는 편집 중 전환, History는 제출 후 감사 추적에 맞춥니다.",
      "Submission state가 revision-requested일 때 History와 수정 항목을 함께 보여 주세요.",
    ],
    accessibility: [
      "RevisionHistoryList는 ol로 시간 순서를 전달하세요.",
      "RevisionEntryTitle은 각 버전의 고유 제목으로 사용하세요.",
    ],
    props: [
      {
        name: "state",
        type: '"draft" | "revision" | "final"',
        defaultValue: "draft",
        description: "RevisionEntry의 버전 상태입니다.",
      },
    ],
    related: ["draft", "submission", "feedback-summary", "portfolio"],
  },
  submission: {
    slug: "submission",
    summary: "과제 제출 상태 카드입니다. draft부터 graded까지 제출·검토·재제출 흐름을 표현합니다.",
    examples: [
      {
        id: "revision-requested",
        title: "수정 요청",
        description: "SubmissionStatus state와 Hint·Actions를 함께 씁니다.",
        preview: "default",
        code: `import {
  Submission,
  SubmissionActions,
  SubmissionHeader,
  SubmissionHint,
  SubmissionMeta,
  SubmissionStatus,
  SubmissionTitle,
} from "@/components/ui/submission"
import { Button } from "@/components/ui/button"

export function EssaySubmission() {
  return (
    <Submission>
      <SubmissionHeader>
        <SubmissionTitle>숙제 폐지 찬반 · 1차 제출</SubmissionTitle>
        <SubmissionStatus state="revision-requested" />
      </SubmissionHeader>
      <SubmissionMeta>제출 3월 5일 · 248자</SubmissionMeta>
      <SubmissionHint>근거 연결을 보완한 뒤 재제출해 주세요.</SubmissionHint>
      <SubmissionActions>
        <Button size="sm">수정하기</Button>
        <Button size="sm" variant="outline">기록 보기</Button>
      </SubmissionActions>
    </Submission>
  )
}`,
      },
      {
        id: "graded",
        title: "채점 완료",
        description: 'state="graded"일 때 Rubric·FeedbackSummary와 연결합니다.',
        code: `<SubmissionStatus state="graded" />`,
      },
      {
        id: "in-review",
        title: "검토 중",
        description: "제출 후 in-review 상태의 대기 UI를 구성합니다.",
        code: `<SubmissionStatus state="in-review" />
<SubmissionHint>교사 검토가 진행 중입니다.</SubmissionHint>`,
      },
      {
        id: "resubmitted",
        title: "재제출",
        description: "resubmitted는 수정 후 다시 제출했음을 나타냅니다.",
        code: `<SubmissionStatus state="resubmitted" />
<SubmissionMeta>재제출 3월 8일 · 268자</SubmissionMeta>`,
      },
    ],
    usageNotes: [
      "SubmissionHint는 다음에 할 일을 한 문장으로 안내합니다.",
      "destructive 톤은 revision-requested에, 중립·긍정은 graded에 맞춥니다.",
    ],
    accessibility: [
      "SubmissionStatus는 현재 상태를 텍스트로 명확히 전달합니다.",
      "수정·기록 보기 버튼은 SubmissionTitle 아래 논리적 순서로 배치하세요.",
    ],
    props: [
      {
        name: "state",
        type: '"draft" | "submitted" | "in-review" | "revision-requested" | "resubmitted" | "graded"',
        defaultValue: "draft",
        description: "SubmissionStatus의 제출·검토 상태입니다.",
      },
    ],
    related: ["draft", "feedback-summary", "revision-history", "rubric"],
  },
  reflection: {
    slug: "reflection",
    summary: "제출 후 메타인지 성찰 폼입니다. 질문 필드와 Textarea 입력을 구조화합니다.",
    examples: [
      {
        id: "post-submit",
        title: "제출 후 성찰",
        description: "ReflectionField와 ReflectionFieldInput 안에 Textarea를 둡니다.",
        preview: "default",
        code: `import {
  Reflection,
  ReflectionActions,
  ReflectionDescription,
  ReflectionField,
  ReflectionFieldInput,
  ReflectionFieldLabel,
  ReflectionFields,
  ReflectionHeader,
  ReflectionTitle,
} from "@/components/ui/reflection"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function PostSubmitReflection() {
  return (
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
  )
}`,
      },
      {
        id: "multiple-fields",
        title: "여러 질문",
        description: "ReflectionFields에 질문을 추가합니다.",
        code: `<ReflectionFields>
  <ReflectionField>
    <ReflectionFieldLabel>배운 점</ReflectionFieldLabel>
    <ReflectionFieldInput><Textarea /></ReflectionFieldInput>
  </ReflectionField>
  <ReflectionField>
    <ReflectionFieldLabel>다음에 바꿀 점</ReflectionFieldLabel>
    <ReflectionFieldInput><Textarea /></ReflectionFieldInput>
  </ReflectionField>
</ReflectionFields>`,
      },
      {
        id: "hint",
        title: "작성 힌트",
        description: "ReflectionHint로 예시 답변을 안내합니다.",
        code: `import { ReflectionHint } from "@/components/ui/reflection"

<ReflectionHint>한 문장으로 구체적으로 적어 보세요.</ReflectionHint>`,
      },
      {
        id: "optional",
        title: "선택 저장",
        description: "ReflectionActions에 건너뛰기를 둘 수 있습니다.",
        code: `<ReflectionActions>
  <Button variant="ghost">건너뛰기</Button>
  <Button>저장</Button>
</ReflectionActions>`,
      },
    ],
    usageNotes: [
      "Reflection은 필수 제출 흐름과 분리해 선택적으로 둡니다.",
      "질문은 2–3개로 제한하고 ReflectionDescription으로 목적을 설명하세요.",
    ],
    accessibility: [
      "ReflectionFieldLabel과 Textarea는 id/htmlFor 또는 aria-labelledby로 연결하세요.",
      "건너뛰기는 필수가 아님을 명확히 표시하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "ReflectionFieldInput과 Textarea 사이 간격·너비 조정에 사용합니다.",
      },
    ],
    related: ["submission", "step", "insight", "goal"],
  },
  "skill-map": {
    slug: "skill-map",
    summary:
      "학습자의 개념·기술 숙달 지도입니다. emerging~fluent level과 focus·선행 관계를 표현합니다.",
    examples: [
      {
        id: "concepts",
        title: "개념 맵",
        description: "SkillNode level과 SkillNodePrereq로 선행 관계를 표시합니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/skill-map"

export function ArgumentSkills() {
  return (
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
  )
}`,
      },
      {
        id: "focus",
        title: "집중 연습",
        description: "focus prop과 SkillNodeFocus로 현재 집중 개념을 강조합니다.",
        code: `<SkillNode level="developing" focus>
  <SkillNodeFocus>집중 연습</SkillNodeFocus>
</SkillNode>`,
      },
      {
        id: "levels",
        title: "숙달 수준",
        description: "level은 emerging·developing·secure·fluent입니다.",
        code: `<SkillNode level="fluent">
  <SkillNodeLabel>논증 구조 설계</SkillNodeLabel>
  <SkillNodeLevel />
</SkillNode>`,
      },
      {
        id: "practice-link",
        title: "연습 연결",
        description: "SkillMapMeta 아래 PracticeQueue로 연습 항목을 연결합니다.",
        code: `<SkillMapMeta>4개 개념 · 1개 집중</SkillMapMeta>`,
      },
    ],
    usageNotes: [
      "Mastery·Goal과 같은 화면에서 SkillMap을 보조 지도로 둡니다.",
      "focus는 한 시점에 하나의 SkillNode에만 true로 두세요.",
    ],
    accessibility: [
      "SkillNodeLevel은 level prop을 텍스트로도 전달합니다.",
      "선행 관계 SkillNodePrereq를 읽기 순서에 포함하세요.",
    ],
    props: [
      {
        name: "level",
        type: '"emerging" | "developing" | "secure" | "fluent"',
        defaultValue: "emerging",
        description: "SkillNode와 SkillNodeLevel의 숙달 수준입니다.",
      },
      {
        name: "focus",
        type: "boolean",
        defaultValue: "false",
        description: "true면 집중 연습 대상으로 강조 표시합니다.",
      },
    ],
    related: ["mastery", "practice-queue", "goal", "path"],
  },
  portfolio: {
    slug: "portfolio",
    summary:
      "학습자 글·작품 모음입니다. private·cohort·public visibility로 공개 범위를 표현합니다.",
    examples: [
      {
        id: "pieces",
        title: "글 모음",
        description: "PortfolioPiece visibility로 공개·코호트·비공개를 구분합니다.",
        preview: "default",
        code: `import {
  Portfolio,
  PortfolioHeader,
  PortfolioList,
  PortfolioMeta,
  PortfolioPiece,
  PortfolioPieceExcerpt,
  PortfolioPieceMeta,
  PortfolioPieceTitle,
  PortfolioTitle,
} from "@/components/ui/portfolio"

export function WritingPortfolio() {
  return (
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
          <PortfolioPieceExcerpt>모든 숙제를 없애면 복습 리듬이 사라질 수 있다…</PortfolioPieceExcerpt>
        </PortfolioPiece>
      </PortfolioList>
    </Portfolio>
  )
}`,
      },
      {
        id: "feedback",
        title: "피드백 요약",
        description: "PortfolioPieceFeedback에 채점·코멘트 요약을 둡니다.",
        code: `import { PortfolioPieceFeedback } from "@/components/ui/portfolio"

<PortfolioPieceFeedback>우수 · 근거 연결 보완</PortfolioPieceFeedback>`,
      },
      {
        id: "public",
        title: "공개 글",
        description: 'visibility="public"은 전체 공개 작품입니다.',
        code: `<PortfolioPiece visibility="public">
  <PortfolioPieceMeta visibility="public" />
</PortfolioPiece>`,
      },
      {
        id: "actions",
        title: "작품 행동",
        description: "PortfolioPieceActions에 열기·공유를 둡니다.",
        code: `import { PortfolioPieceActions } from "@/components/ui/portfolio"
import { Button } from "@/components/ui/button"

<PortfolioPieceActions>
  <Button size="sm" variant="outline">글 열기</Button>
</PortfolioPieceActions>`,
      },
    ],
    usageNotes: [
      'Submission·Draft에서 완료된 작품을 PortfolioPiece로 올릴 때 visibility="private"가 기본입니다.',
      "PortfolioPieceExcerpt는 한두 문장 미리보기로 제한하세요.",
    ],
    accessibility: [
      "PortfolioPieceMeta는 visibility를 텍스트로도 전달합니다.",
      "글 열기·공유는 PortfolioPieceTitle과 연결된 행동임을 명시하세요.",
    ],
    props: [
      {
        name: "visibility",
        type: '"private" | "cohort" | "public"',
        defaultValue: "private",
        description: "PortfolioPiece와 PortfolioPieceMeta의 공개 범위입니다.",
      },
    ],
    related: ["submission", "learner-record", "revision-history", "draft"],
  },
};
