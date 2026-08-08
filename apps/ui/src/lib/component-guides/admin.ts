import type { ComponentGuideMap } from "./types";

export const adminGuides: ComponentGuideMap = {
  "admin-overview": {
    slug: "admin-overview",
    summary:
      "관리자 대시보드의 오늘 처리할 항목 목록입니다. 검토·개입·게시 대기 등 우선순위가 다른 작업을 조용한 톤으로 한눈에 보여 줍니다.",
    examples: [
      {
        id: "priority-queue",
        title: "우선순위 대기열",
        description: "긴급·주의·정보 심각도로 오늘 처리할 항목을 나열합니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/admin-overview"
import { Button } from "@/components/ui/button"

export function AdminDashboard() {
  return (
    <AdminOverview>
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
            <Button size="sm" variant="outline">열기</Button>
          </AdminOverviewItemActions>
        </AdminOverviewItem>
      </AdminOverviewList>
    </AdminOverview>
  )
}`,
      },
      {
        id: "severity-states",
        title: "심각도 상태",
        description: "info·warning·urgent로 시각적 강조만 달리하고 과장된 색은 쓰지 않습니다.",
        code: `<AdminOverviewList>
  <AdminOverviewItem severity="info">…</AdminOverviewItem>
  <AdminOverviewItem severity="warning">…</AdminOverviewItem>
  <AdminOverviewItem severity="urgent">…</AdminOverviewItem>
</AdminOverviewList>`,
      },
      {
        id: "inline-actions",
        title: "항목별 행동",
        description: "각 항목 오른쪽에 열기·할당 등 1차 행동을 둡니다.",
        code: `<AdminOverviewItemActions>
  <Button size="sm" variant="ghost">나중에</Button>
  <Button size="sm" variant="outline">열기</Button>
</AdminOverviewItemActions>`,
      },
      {
        id: "meta-count",
        title: "건수 메타",
        description: "헤더에 남은 건수를 tabular-nums로 표시합니다.",
        code: `<AdminOverviewHeader>
  <AdminOverviewTitle>개입 대기</AdminOverviewTitle>
  <AdminOverviewMeta>12건</AdminOverviewMeta>
</AdminOverviewHeader>`,
      },
    ],
    usageNotes: [
      "대시보드는 알림 폭탄이 아니라 처리 순서를 정리하는 도구입니다. 한 화면에 5~7건 이하로 유지하세요.",
      "심각도는 색상보다 테두리·배경 농도로만 구분하고, 보라색 SaaS 톤은 피하세요.",
    ],
    accessibility: [
      "AdminOverviewItemTitle이 각 항목의 접근 가능한 제목 역할을 합니다.",
      "긴급 항목은 색만으로 구분하지 말고 AdminOverviewItemMeta 텍스트로도 전달하세요.",
    ],
    props: [
      {
        name: "severity",
        type: '"info" | "warning" | "urgent"',
        defaultValue: '"info"',
        description: "AdminOverviewItem의 우선순위를 나타냅니다.",
      },
    ],
    related: ["intervention-queue", "content-review", "publish-workflow"],
  },
  "curriculum-tree": {
    slug: "curriculum-tree",
    summary:
      "과정·단원·레슨·스텝 계층을 트리로 탐색하고 상태(초안·준비·잠김·게시)를 확인하는 관리자 내비게이션입니다.",
    examples: [
      {
        id: "course-hierarchy",
        title: "과정 계층",
        description: "course → unit → lesson → step 깊이에 따라 들여쓰기됩니다.",
        preview: "default",
        code: `import {
  CurriculumNode,
  CurriculumNodeChildren,
  CurriculumNodeLabel,
  CurriculumNodeMeta,
  CurriculumTree,
  CurriculumTreeHeader,
  CurriculumTreeList,
  CurriculumTreeTitle,
} from "@/components/ui/curriculum-tree"

export function CurriculumNav() {
  return (
    <CurriculumTree>
      <CurriculumTreeHeader>
        <CurriculumTreeTitle>설득 글쓰기</CurriculumTreeTitle>
      </CurriculumTreeHeader>
      <CurriculumTreeList>
        <CurriculumNode level="course" state="published">
          <CurriculumNodeLabel>설득 글쓰기</CurriculumNodeLabel>
          <CurriculumNodeMeta level="course" state="published" />
          <CurriculumNodeChildren>
            <CurriculumNode level="unit" state="ready">
              <CurriculumNodeLabel>주장과 근거</CurriculumNodeLabel>
              <CurriculumNodeMeta level="unit" state="ready" />
            </CurriculumNode>
          </CurriculumNodeChildren>
        </CurriculumNode>
      </CurriculumTreeList>
    </CurriculumTree>
  )
}`,
      },
      {
        id: "node-states",
        title: "노드 상태",
        description: "draft·ready·locked·published로 편집·게시 흐름을 표시합니다.",
        code: `<CurriculumNode level="lesson" state="draft">…</CurriculumNode>
<CurriculumNode level="lesson" state="published">…</CurriculumNode>`,
      },
      {
        id: "reorder",
        title: "순서 변경",
        description: "행 전체를 드래그해 순서를 바꿉니다. 메뉴의 위로/아래로도 제공합니다.",
        code: `<CurriculumNode level="unit">
  <CurriculumNodeLabel>단원 2</CurriculumNodeLabel>
</CurriculumNode>`,
      },
      {
        id: "node-actions",
        title: "노드 작업",
        description: "호버 시 CurriculumNodeActions에 더보기·추가를 둡니다.",
        code: `<CurriculumNodeActions>
  <Button size="icon-sm" variant="ghost">···</Button>
</CurriculumNodeActions>`,
      },
    ],
    usageNotes: [
      "트리는 좌측 내비에 두고, 선택한 노드의 편집은 오른쪽 패널(레슨 빌더 등)에서 처리하세요.",
      "노드는 한 줄로 유지하세요. 제목은 truncate하고, 상태·카운트는 오른쪽에 붙입니다.",
      "published 노드는 배경만 살짝 강조하고, 잠김(locked)은 opacity로만 구분합니다.",
      "순서 변경은 행 전체 드래그를 기본으로 하고, 접기·메뉴·이름 수정 컨트롤에서는 드래그를 막으세요.",
    ],
    accessibility: [
      "CurriculumNodeLabel이 각 노드의 접근 가능한 이름입니다.",
      "포인터 드래그와 별도로 키보드 순서 변경(메뉴의 위로/아래 또는 Alt↑/Alt↓)을 제공하세요.",
    ],
    props: [
      {
        name: "level",
        type: '"course" | "unit" | "lesson" | "step"',
        defaultValue: '"course"',
        description: "CurriculumNode의 계층 깊이와 들여쓰기를 결정합니다.",
      },
    ],
    related: ["curriculum-map", "lesson-builder", "publish-workflow"],
  },
  "curriculum-map": {
    slug: "curriculum-map",
    summary:
      "목표·개념·레슨·체크포인트 간 선행 관계를 맵으로 보여 주고, 누락·과잉 연결을 CurriculumMapGap으로 표시합니다.",
    examples: [
      {
        id: "concept-chain",
        title: "개념 연결",
        description: "CurriculumMapLink 안에 노드와 CurriculumMapEdge로 관계를 표현합니다.",
        preview: "default",
        code: `import {
  CurriculumMap,
  CurriculumMapEdge,
  CurriculumMapHeader,
  CurriculumMapLink,
  CurriculumMapList,
  CurriculumMapNode,
  CurriculumMapNodeBody,
  CurriculumMapNodeLabel,
  CurriculumMapTitle,
} from "@/components/ui/curriculum-map"

export function ConceptMap() {
  return (
    <CurriculumMap>
      <CurriculumMapHeader>
        <CurriculumMapTitle>개념 연결</CurriculumMapTitle>
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
      </CurriculumMapList>
    </CurriculumMap>
  )
}`,
      },
      {
        id: "missing-gap",
        title: "누락 표시",
        description: 'kind="missing"으로 선행 개념 누락을 강조합니다.',
        code: `<CurriculumMapGap kind="missing">반박 개념 연결 누락</CurriculumMapGap>`,
      },
      {
        id: "node-kinds",
        title: "노드 종류",
        description: "objective·concept·lesson·checkpoint로 역할을 구분합니다.",
        code: `<CurriculumMapNode kind="checkpoint">
  <CurriculumMapNodeLabel kind="checkpoint" />
  <CurriculumMapNodeBody>유닛 1 마무리</CurriculumMapNodeBody>
</CurriculumMapNode>`,
      },
      {
        id: "map-hint",
        title: "맵 안내",
        description: "CurriculumMapHint로 맵 해석 방법을 짧게 안내합니다.",
        code: `<CurriculumMapHeader>
  <CurriculumMapTitle>선행 관계</CurriculumMapTitle>
  <CurriculumMapHint>누락된 선행 개념을 확인하세요.</CurriculumMapHint>
</CurriculumMapHeader>`,
      },
    ],
    usageNotes: [
      "맵은 전체 과정 설계·검토용입니다. 학습자 화면에는 Path 컴포넌트를 사용하세요.",
      "누락(missing)과 과잉(excess) gap을 함께 보여 주어 커리큘럼 균형을 점검하세요.",
    ],
    accessibility: [
      'CurriculumMapEdge는 role="presentation"이므로 관계는 노드 본문 텍스트로도 설명하세요.',
      "gap 메시지는 스크린 리더가 읽을 수 있는 완전한 문장으로 작성하세요.",
    ],
    props: [
      {
        name: "kind",
        type: '"objective" | "concept" | "lesson" | "checkpoint"',
        defaultValue: '"concept"',
        description: "CurriculumMapNode의 역할 종류입니다.",
      },
    ],
    related: ["curriculum-tree", "path", "content-validation"],
  },
  "lesson-builder": {
    slug: "lesson-builder",
    summary:
      "레슨 편집 캔버스입니다. 팔레트에서 스텝 유형을 고르고, 캔버스에 배치하며, 인스펙터에서 속성을 수정합니다.",
    examples: [
      {
        id: "builder-layout",
        title: "빌더 레이아웃",
        description: "팔레트·캔버스·인스펙터 3열 구성의 기본 편집 화면입니다.",
        preview: "default",
        code: `import {
  LessonBuilder,
  LessonBuilderCanvas,
  LessonBuilderHeader,
  LessonBuilderInspector,
  LessonBuilderInspectorField,
  LessonBuilderInspectorLabel,
  LessonBuilderInspectorValue,
  LessonBuilderMeta,
  LessonBuilderPalette,
  LessonBuilderPaletteItem,
  LessonBuilderStep,
  LessonBuilderStepBody,
  LessonBuilderTitle,
} from "@/components/ui/lesson-builder"

export function LessonEditor() {
  return (
    <LessonBuilder>
      <LessonBuilderHeader>
        <LessonBuilderTitle>레슨 2 · 근거 붙이기</LessonBuilderTitle>
        <LessonBuilderMeta>4 스텝 · 초안</LessonBuilderMeta>
      </LessonBuilderHeader>
      <LessonBuilderPalette>
        <LessonBuilderPaletteItem active>읽기</LessonBuilderPaletteItem>
        <LessonBuilderPaletteItem>객관식</LessonBuilderPaletteItem>
      </LessonBuilderPalette>
      <LessonBuilderCanvas>
        <LessonBuilderStep index={1} selected>
          <LessonBuilderStepBody>주장을 먼저 읽고 근거를 찾아보세요.</LessonBuilderStepBody>
        </LessonBuilderStep>
      </LessonBuilderCanvas>
      <LessonBuilderInspector>
        <LessonBuilderInspectorField>
          <LessonBuilderInspectorLabel>스텝 유형</LessonBuilderInspectorLabel>
          <LessonBuilderInspectorValue>읽기</LessonBuilderInspectorValue>
        </LessonBuilderInspectorField>
      </LessonBuilderInspector>
    </LessonBuilder>
  )
}`,
      },
      {
        id: "step-selection",
        title: "스텝 선택",
        description: "selected로 현재 편집 중인 스텝을 ring으로 표시합니다.",
        code: `<LessonBuilderStep index={2} selected>
  <LessonBuilderStepBody>…</LessonBuilderStepBody>
</LessonBuilderStep>`,
      },
      {
        id: "palette-active",
        title: "팔레트 활성",
        description: "active 팔레트 항목은 현재 추가할 스텝 유형을 나타냅니다.",
        code: `<LessonBuilderPaletteItem active>쓰기</LessonBuilderPaletteItem>`,
      },
      {
        id: "step-actions",
        title: "스텝 작업",
        description: "LessonBuilderStepActions에 복제·삭제를 둡니다.",
        code: `<LessonBuilderStepActions>
  <Button size="icon-sm" variant="ghost">···</Button>
</LessonBuilderStepActions>`,
      },
    ],
    usageNotes: [
      "빌더는 관리자 전용입니다. 학습자 경험은 LearnerPreview로 별도 확인하세요.",
      "팔레트 항목은 Step·Choice·Compose 등 학습 컴포넌트 유형과 1:1로 대응시키세요.",
    ],
    accessibility: [
      "LessonBuilderStep의 index가 시각적 순서 번호입니다. 스크린 리더용 레이블도 함께 제공하세요.",
      "선택된 스텝은 selected prop과 포커스 상태가 일치해야 합니다.",
    ],
    props: [
      {
        name: "selected",
        type: "boolean",
        defaultValue: "false",
        description: "LessonBuilderStep이 현재 편집 대상인지 나타냅니다.",
      },
    ],
    related: ["step", "learner-preview", "content-validation"],
  },
  "item-bank": {
    slug: "item-bank",
    summary:
      "재사용 가능한 문항(객관식·쓰기 등)을 검색·필터하고 draft·ready·retired 상태로 관리하는 은행입니다.",
    examples: [
      {
        id: "bank-list",
        title: "문항 목록",
        description: "제목·상태·태그·행동으로 문항을 한 줄에 요약합니다.",
        preview: "default",
        code: `import {
  ItemBank,
  ItemBankHeader,
  ItemBankItem,
  ItemBankItemMeta,
  ItemBankItemTag,
  ItemBankItemTags,
  ItemBankItemTitle,
  ItemBankList,
  ItemBankTitle,
} from "@/components/ui/item-bank"

export function QuestionBank() {
  return (
    <ItemBank>
      <ItemBankHeader>
        <ItemBankTitle>문항 은행</ItemBankTitle>
      </ItemBankHeader>
      <ItemBankList>
        <ItemBankItem status="ready">
          <ItemBankItemTitle>주장-근거 거리 판단</ItemBankItemTitle>
          <ItemBankItemMeta status="ready" />
          <ItemBankItemTags>
            <ItemBankItemTag>객관식</ItemBankItemTag>
          </ItemBankItemTags>
        </ItemBankItem>
      </ItemBankList>
    </ItemBank>
  )
}`,
      },
      {
        id: "item-filters",
        title: "필터",
        description: "ItemBankFilters에 검색·태그·상태 필터를 배치합니다.",
        code: `<ItemBankFilters>
  <Button size="sm" variant="outline">필터</Button>
</ItemBankFilters>`,
      },
      {
        id: "item-status",
        title: "문항 상태",
        description: "draft·ready·retired로 문항 수명 주기를 표시합니다.",
        code: `<ItemBankItem status="retired">
  <ItemBankItemMeta status="retired" />
</ItemBankItem>`,
      },
      {
        id: "item-actions",
        title: "문항 행동",
        description: "미리보기·레슨에 추가 등 1차 행동을 ItemBankItemActions에 둡니다.",
        code: `<ItemBankItemActions>
  <Button size="sm" variant="ghost">미리보기</Button>
</ItemBankItemActions>`,
      },
    ],
    usageNotes: [
      "은행 문항은 레슨 빌더와 item-analysis를 통해 품질을 주기적으로 점검하세요.",
      "retired 문항은 기존 레슨에 남아 있을 수 있으므로 대체 문항 링크를 유지하세요.",
    ],
    accessibility: [
      "ItemBankItemTitle이 각 문항의 접근 가능한 이름입니다.",
      "태그는 ItemBankItemTag 텍스트로 읽히므로 약어보다 전체 용어를 쓰세요.",
    ],
    props: [
      {
        name: "status",
        type: '"draft" | "ready" | "retired"',
        defaultValue: '"draft"',
        description: "ItemBankItem의 게시·사용 가능 상태입니다.",
      },
    ],
    related: ["item-analysis", "lesson-builder", "choice"],
  },
  "prompt-builder": {
    slug: "prompt-builder",
    summary:
      "AI 코칭·채점·힌트 생성에 쓰는 프롬프트를 역할·필드·제약 조건으로 구조화해 편집하는 관리자 도구입니다.",
    examples: [
      {
        id: "prompt-sections",
        title: "프롬프트 섹션",
        description: "역할·맥락·출력 형식을 PromptBuilderSection으로 나눕니다.",
        preview: "default",
        code: `import {
  PromptBuilder,
  PromptBuilderField,
  PromptBuilderFieldLabel,
  PromptBuilderFieldValue,
  PromptBuilderHeader,
  PromptBuilderSection,
  PromptBuilderSectionTitle,
  PromptBuilderTitle,
} from "@/components/ui/prompt-builder"

export function CoachingPrompt() {
  return (
    <PromptBuilder>
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
    </PromptBuilder>
  )
}`,
      },
      {
        id: "constraints",
        title: "제약 조건",
        description: "PromptBuilderConstraints로 반드시 지켜야 할 규칙을 나열합니다.",
        code: `<PromptBuilderConstraints>
  <PromptBuilderConstraint>근거를 인용하도록 유도</PromptBuilderConstraint>
  <PromptBuilderConstraint>학습자 글을 그대로 인용</PromptBuilderConstraint>
</PromptBuilderConstraints>`,
      },
      {
        id: "field-pairs",
        title: "필드 쌍",
        description: "PromptBuilderFieldLabel과 PromptBuilderFieldValue로 키-값을 표시합니다.",
        code: `<PromptBuilderField>
  <PromptBuilderFieldLabel>온도</PromptBuilderFieldLabel>
  <PromptBuilderFieldValue>0.3</PromptBuilderFieldValue>
</PromptBuilderField>`,
      },
      {
        id: "version-note",
        title: "버전 메모",
        description: "헤더 옆에 provenance-panel 링크로 변경 이력을 연결하세요.",
        code: `<PromptBuilderHeader>
  <PromptBuilderTitle>힌트 프롬프트 v3</PromptBuilderTitle>
</PromptBuilderHeader>`,
      },
    ],
    usageNotes: [
      "프롬프트 변경은 provenance-panel과 audit-log에 기록되어야 합니다.",
      "제약 조건은 짧은 문장으로, 모델이 무시하기 쉬운 장문 지시는 피하세요.",
    ],
    accessibility: [
      "PromptBuilderSectionTitle이 각 섹션의 제목 역할을 합니다.",
      "필드 값은 읽기 전용일 때도 명확한 레이블을 유지하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "PromptBuilder 전체 너비·간격을 조정합니다.",
      },
    ],
    related: ["provenance-panel", "coaching", "feedback-audit"],
  },
  "rubric-editor": {
    slug: "rubric-editor",
    summary:
      "쓰기·프로젝트 채점용 루브릭을 기준·가중치·수준·예시로 편집합니다. 버전과 함께 관리합니다.",
    examples: [
      {
        id: "criterion-levels",
        title: "기준과 수준",
        description: "RubricEditorCriterion 안에 수준(tier)별 설명을 배치합니다.",
        preview: "default",
        code: `import {
  RubricEditor,
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
} from "@/components/ui/rubric-editor"

export function WritingRubric() {
  return (
    <RubricEditor>
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
          </RubricEditorLevels>
        </RubricEditorCriterion>
      </RubricEditorList>
    </RubricEditor>
  )
}`,
      },
      {
        id: "criterion-expand",
        title: "기준 펼침",
        description: "expanded로 현재 편집 중인 기준을 강조합니다.",
        code: `<RubricEditorCriterion expanded>…</RubricEditorCriterion>`,
      },
      {
        id: "level-tiers",
        title: "수준 tier",
        description: "low·mid·high tier로 수준별 시각적 구분을 줍니다.",
        code: `<RubricEditorLevel tier="low">…</RubricEditorLevel>
<RubricEditorLevel tier="mid">…</RubricEditorLevel>
<RubricEditorLevel tier="high">…</RubricEditorLevel>`,
      },
      {
        id: "rubric-example",
        title: "수준 예시",
        description: "RubricEditorExample에 해당 수준의 모범 문장을 인용합니다.",
        code: `<RubricEditorExample>주장을 먼저 밝히고 근거를 이어 붙였다.</RubricEditorExample>`,
      },
    ],
    usageNotes: [
      "루브릭 변경은 writing-analytics와 feedback-audit 점수에 영향을 주므로 버전을 명시하세요.",
      "가중치 합이 100%인지 RubricEditorWeight 옆에 검증 표시를 두세요.",
    ],
    accessibility: [
      "RubricEditorCriterionLabel이 각 채점 기준의 제목입니다.",
      "수준 설명은 tier 색상 없이도 이해되도록 RubricEditorLevelLabel 텍스트를 충분히 쓰세요.",
    ],
    props: [
      {
        name: "tier",
        type: '"low" | "mid" | "high"',
        defaultValue: '"mid"',
        description: "RubricEditorLevel의 성취 수준 구간입니다.",
      },
    ],
    related: ["exemplar-library", "writing-analytics", "compose"],
  },
  "exemplar-library": {
    slug: "exemplar-library",
    summary:
      "좋은·경계·반례 모범 답안을 수집하고 주석과 함께 루브릭·채점에 연결하는 라이브러리입니다.",
    examples: [
      {
        id: "good-exemplar",
        title: "모범 답안",
        description: 'kind="good" exemplar에 본문과 주석을 붙입니다.',
        preview: "default",
        code: `import {
  Exemplar,
  ExemplarAnnotation,
  ExemplarAnnotations,
  ExemplarBody,
  ExemplarLibrary,
  ExemplarLibraryHeader,
  ExemplarLibraryTitle,
  ExemplarList,
  ExemplarMeta,
  ExemplarTitle,
} from "@/components/ui/exemplar-library"

export function ExemplarPanel() {
  return (
    <ExemplarLibrary>
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
        </Exemplar>
      </ExemplarList>
    </ExemplarLibrary>
  )
}`,
      },
      {
        id: "exemplar-kinds",
        title: "답안 종류",
        description: "good·borderline·counter로 교육적 용도를 구분합니다.",
        code: `<Exemplar kind="borderline">…</Exemplar>
<Exemplar kind="counter">…</Exemplar>`,
      },
      {
        id: "exemplar-actions",
        title: "루브릭 연결",
        description: "ExemplarActions에서 RubricEditorExample로 연결합니다.",
        code: `<ExemplarActions>
  <Button size="sm" variant="outline">루브릭에 연결</Button>
</ExemplarActions>`,
      },
      {
        id: "annotation-list",
        title: "주석 목록",
        description: "ExemplarAnnotations에 교사·AI 피드백 포인트를 나열합니다.",
        code: `<ExemplarAnnotations>
  <ExemplarAnnotation>근거가 구체적 조사를 인용합니다.</ExemplarAnnotation>
</ExemplarAnnotations>`,
      },
    ],
    usageNotes: [
      "모범 답안은 학습자에게 그대로 노출하기보다 채점·코칭 참고용으로 사용하세요.",
      "AI 생성 exemplar는 provenance-panel에서 출처를 확인한 뒤만 라이브러리에 추가하세요.",
    ],
    accessibility: [
      "ExemplarTitle이 각 답안의 제목입니다.",
      "주석은 본문과 구분되어 ExemplarAnnotation으로 읽히도록 작성하세요.",
    ],
    props: [
      {
        name: "kind",
        type: '"good" | "borderline" | "counter"',
        defaultValue: '"good"',
        description: "Exemplar의 교육적 분류입니다.",
      },
    ],
    related: ["rubric-editor", "prose", "feedback-audit"],
  },
  "learner-preview": {
    slug: "learner-preview",
    summary:
      "관리자가 레슨·스텝을 학습자 관점에서 미리 봅니다. 기기·페르소나·시나리오(정답·오답 등)를 전환할 수 있습니다.",
    examples: [
      {
        id: "device-preview",
        title: "기기 미리보기",
        description: "desktop·mobile 기기 프레임 안에 실제 Step을 렌더합니다.",
        preview: "default",
        code: `import {
  LearnerPreview,
  LearnerPreviewDevice,
  LearnerPreviewFrame,
  LearnerPreviewHeader,
  LearnerPreviewStage,
  LearnerPreviewTitle,
  LearnerPreviewToolbar,
} from "@/components/ui/learner-preview"
import { Step, StepBody, StepHeader, StepTitle } from "@/components/ui/step"

export function LessonPreview() {
  return (
    <LearnerPreview>
      <LearnerPreviewHeader>
        <LearnerPreviewTitle>학습자 미리보기</LearnerPreviewTitle>
        <LearnerPreviewToolbar>
          <LearnerPreviewDevice device="desktop" active />
          <LearnerPreviewDevice device="mobile" />
        </LearnerPreviewToolbar>
      </LearnerPreviewHeader>
      <LearnerPreviewStage device="desktop">
        <LearnerPreviewFrame>
          <Step>
            <StepHeader><StepTitle>주장을 고르세요</StepTitle></StepHeader>
            <StepBody>숙제를 줄이면 학습 부담이 줄어든다.</StepBody>
          </Step>
        </LearnerPreviewFrame>
      </LearnerPreviewStage>
    </LearnerPreview>
  )
}`,
      },
      {
        id: "persona-toggle",
        title: "페르소나",
        description: "novice·fluent 등 학습자 유형별 UI 차이를 시뮬레이션합니다.",
        code: `<LearnerPreviewPersona persona="novice" active />
<LearnerPreviewPersona persona="fluent" />`,
      },
      {
        id: "scenario-state",
        title: "시나리오",
        description: "correct·incorrect·hint 등 채점 전후 상태를 미리 봅니다.",
        code: `<LearnerPreviewState scenario="incorrect" active />
<LearnerPreviewState scenario="offline" />`,
      },
      {
        id: "mobile-stage",
        title: "모바일 프레임",
        description: 'LearnerPreviewStage device="mobile"로 좁은 화면을 확인합니다.',
        code: `<LearnerPreviewStage device="mobile">
  <LearnerPreviewFrame>…</LearnerPreviewFrame>
</LearnerPreviewStage>`,
      },
    ],
    usageNotes: [
      "미리보기는 Sandbox·Preview 환경 데이터를 사용하고 Live 학습자 기록과 분리하세요.",
      "레슨 빌더 저장 후 LearnerPreview로 반드시 한 번 확인하는 흐름을 권장합니다.",
    ],
    accessibility: [
      "LearnerPreviewDevice·Persona·State 토글은 aria-pressed로 선택 상태를 전달합니다.",
      "프레임 안 Step은 실제 학습 화면과 동일한 접근성 규칙을 따르세요.",
    ],
    props: [
      {
        name: "device",
        type: '"desktop" | "mobile"',
        defaultValue: '"desktop"',
        description: "LearnerPreviewStage의 프레임 너비입니다.",
      },
    ],
    related: ["lesson-builder", "step", "lesson"],
  },
  "content-validation": {
    slug: "content-validation",
    summary:
      "레슨·문항 저장 전 구조적 오류와 경고를 자동 검증합니다. error·warning·info 심각도로 이슈를 나열합니다.",
    examples: [
      {
        id: "validation-list",
        title: "검증 목록",
        description: "요약 건수와 함께 이슈별 제목·상세·심각도를 표시합니다.",
        preview: "default",
        code: `import {
  ContentValidation,
  ContentValidationHeader,
  ContentValidationIssue,
  ContentValidationIssueDetail,
  ContentValidationIssueMeta,
  ContentValidationIssueTitle,
  ContentValidationList,
  ContentValidationSummary,
  ContentValidationTitle,
} from "@/components/ui/content-validation"

export function ValidationPanel() {
  return (
    <ContentValidation>
      <ContentValidationHeader>
        <ContentValidationTitle>콘텐츠 검증</ContentValidationTitle>
        <ContentValidationSummary>오류 1 · 경고 2</ContentValidationSummary>
      </ContentValidationHeader>
      <ContentValidationList>
        <ContentValidationIssue severity="error">
          <ContentValidationIssueTitle>빈 선택지</ContentValidationIssueTitle>
          <ContentValidationIssueDetail>스텝 3의 선택지 C가 비어 있습니다.</ContentValidationIssueDetail>
          <ContentValidationIssueMeta severity="error" />
        </ContentValidationIssue>
      </ContentValidationList>
    </ContentValidation>
  )
}`,
      },
      {
        id: "issue-severity",
        title: "이슈 심각도",
        description: "error는 게시 차단, warning은 확인 후 진행을 권장합니다.",
        code: `<ContentValidationIssue severity="warning">…</ContentValidationIssue>
<ContentValidationIssue severity="info">…</ContentValidationIssue>`,
      },
      {
        id: "jump-to-issue",
        title: "이슈 이동",
        description: "ContentValidationIssueActions에서 해당 스텝으로 이동합니다.",
        code: `<ContentValidationIssueActions>
  <Button size="sm" variant="outline">이동</Button>
</ContentValidationIssueActions>`,
      },
      {
        id: "pre-publish",
        title: "게시 전 검증",
        description: "publish-workflow 시작 전 ContentValidationSummary가 0 오류인지 확인하세요.",
        code: `<ContentValidationSummary>오류 0 · 경고 1</ContentValidationSummary>`,
      },
    ],
    usageNotes: [
      "자동 검증은 구조·접근성·힌트 과다 등 규칙 기반이며, 교육적 품질은 content-review가 담당합니다.",
      "오류 0건이어도 warning은 publish-workflow 승인 전에 검토하세요.",
    ],
    accessibility: [
      "ContentValidationIssueTitle과 ContentValidationIssueDetail이 이슈를 완전히 설명해야 합니다.",
      "심각도는 ContentValidationIssueMeta 텍스트(오류·경고·정보)로도 전달됩니다.",
    ],
    props: [
      {
        name: "severity",
        type: '"error" | "warning" | "info"',
        defaultValue: '"info"',
        description: "ContentValidationIssue의 차단·권고 수준입니다.",
      },
    ],
    related: ["lesson-builder", "publish-workflow", "content-review"],
  },
  "content-review": {
    slug: "content-review",
    summary:
      "동료·교사 검토 워크플로입니다. diff·댓글·담당자·상태(pending·changes-requested·approved)로 승인 흐름을 관리합니다.",
    examples: [
      {
        id: "review-thread",
        title: "검토 스레드",
        description: "댓글·담당자·상태로 검토 진행 상황을 표시합니다.",
        preview: "default",
        code: `import {
  ContentReview,
  ContentReviewComment,
  ContentReviewCommentAuthor,
  ContentReviewCommentBody,
  ContentReviewComments,
  ContentReviewHeader,
  ContentReviewStatus,
  ContentReviewTitle,
} from "@/components/ui/content-review"

export function LessonReview() {
  return (
    <ContentReview>
      <ContentReviewHeader>
        <ContentReviewTitle>레슨 2 검토</ContentReviewTitle>
        <ContentReviewStatus status="changes-requested" />
      </ContentReviewHeader>
      <ContentReviewComments>
        <ContentReviewComment>
          <ContentReviewCommentAuthor>박편집</ContentReviewCommentAuthor>
          <ContentReviewCommentBody>스텝 2 안내 문장을 더 짧게 다듬어 주세요.</ContentReviewCommentBody>
        </ContentReviewComment>
      </ContentReviewComments>
    </ContentReview>
  )
}`,
      },
      {
        id: "review-status",
        title: "검토 상태",
        description: "pending·changes-requested·approved로 워크플로 단계를 표시합니다.",
        code: `<ContentReviewStatus status="approved" />
<ContentReviewStatus status="pending" />`,
      },
      {
        id: "resolved-comment",
        title: "해결된 댓글",
        description: "resolved로 처리된 댓글은 opacity를 낮춥니다.",
        code: `<ContentReviewComment resolved>
  <ContentReviewCommentBody>반영 완료</ContentReviewCommentBody>
</ContentReviewComment>`,
      },
      {
        id: "review-actions",
        title: "승인 행동",
        description: "ContentReviewActions에 승인·변경 요청을 둡니다.",
        code: `<ContentReviewActions>
  <Button variant="outline">변경 요청</Button>
  <Button>승인</Button>
</ContentReviewActions>`,
      },
    ],
    usageNotes: [
      "검토는 publish-workflow의 review 단계와 연결하세요. 승인 없이 Live 게시를 막으세요.",
      "ContentReviewDiff는 compare 컴포넌트와 함께 쓰면 변경 범위 파악이 쉽습니다.",
    ],
    accessibility: [
      "ContentReviewCommentAuthor와 ContentReviewCommentBody 순서로 댓글을 읽을 수 있어야 합니다.",
      "상태 뱃지는 ContentReviewStatus 텍스트로도 전달됩니다.",
    ],
    props: [
      {
        name: "status",
        type: '"pending" | "changes-requested" | "approved"',
        defaultValue: '"pending"',
        description: "ContentReviewStatus의 검토 진행 상태입니다.",
      },
    ],
    related: ["publish-workflow", "compare", "content-validation"],
  },
  "publish-workflow": {
    slug: "publish-workflow",
    summary:
      "초안→검토→예약→게시→롤백 단계와 Sandbox·Test·Preview·Live 환경을 관리하는 게시 워크플로입니다.",
    examples: [
      {
        id: "env-steps",
        title: "환경과 단계",
        description: "PublishWorkflowEnvironment와 단계 목록으로 현재 게시 위치를 표시합니다.",
        preview: "default",
        code: `import {
  PublishWorkflow,
  PublishWorkflowActions,
  PublishWorkflowEnvironment,
  PublishWorkflowHeader,
  PublishWorkflowMeta,
  PublishWorkflowStep,
  PublishWorkflowSteps,
  PublishWorkflowTitle,
} from "@/components/ui/publish-workflow"
import { Button } from "@/components/ui/button"

export function PublishPanel() {
  return (
    <PublishWorkflow>
      <PublishWorkflowHeader>
        <PublishWorkflowTitle>게시</PublishWorkflowTitle>
        <PublishWorkflowEnvironment env="preview" />
      </PublishWorkflowHeader>
      <PublishWorkflowSteps>
        <PublishWorkflowStep state="draft" />
        <PublishWorkflowStep state="review" active />
        <PublishWorkflowStep state="published" />
      </PublishWorkflowSteps>
      <PublishWorkflowMeta>Preview 환경에서 검토 후 Live로 승격합니다.</PublishWorkflowMeta>
      <PublishWorkflowActions>
        <Button size="sm">Preview 게시</Button>
      </PublishWorkflowActions>
    </PublishWorkflow>
  )
}`,
      },
      {
        id: "environment-badge",
        title: "환경 뱃지",
        description: "sandbox·test·preview·live 중 현재 대상 환경을 표시합니다.",
        code: `<PublishWorkflowEnvironment env="live" />
<PublishWorkflowEnvironment env="sandbox" />`,
      },
      {
        id: "step-active",
        title: "현재 단계",
        description: 'active와 aria-current="step"으로 진행 중 단계를 표시합니다.',
        code: `<PublishWorkflowStep state="review" active />`,
      },
      {
        id: "rollback",
        title: "롤백",
        description: "rolled-back 상태로 Live 문제 발생 시 이전 버전 복구를 기록합니다.",
        code: `<PublishWorkflowStep state="rolled-back" />
<PublishWorkflowMeta>Live v12 → v11로 롤백됨</PublishWorkflowMeta>`,
      },
    ],
    usageNotes: [
      "Live 게시는 content-validation 오류 0건·content-review 승인·provenance 검증 후에만 허용하세요.",
      "환경 승격 순서는 sandbox → test → preview → live를 기본으로 하고, 건너뛰기는 audit-log에 사유를 남기세요.",
    ],
    accessibility: [
      'PublishWorkflowStep active는 aria-current="step"으로 현재 단계를 전달합니다.',
      "환경 이름은 PublishWorkflowEnvironment 텍스트(Sandbox·Live 등)로 읽혀야 합니다.",
    ],
    props: [
      {
        name: "env",
        type: '"sandbox" | "test" | "preview" | "live"',
        defaultValue: '"sandbox"',
        description: "PublishWorkflowEnvironment의 배포 대상 환경입니다.",
      },
    ],
    related: ["audit-log", "provenance-panel", "content-review"],
  },
  "provenance-panel": {
    slug: "provenance-panel",
    summary: "콘텐츠·힌트·피드백의 출처(사람·AI·외부)와 모델·검증 상태를 추적하는 패널입니다.",
    examples: [
      {
        id: "source-rows",
        title: "출처 행",
        description: "human·ai·external 출처별로 작성자·모델·검증 상태를 나열합니다.",
        preview: "default",
        code: `import {
  ProvenancePanel,
  ProvenanceList,
  ProvenancePanelHeader,
  ProvenancePanelTitle,
  ProvenanceRow,
  ProvenanceRowLabel,
  ProvenanceRowMeta,
  ProvenanceRowModel,
  ProvenanceRowStatus,
} from "@/components/ui/provenance-panel"

export function ProvenanceView() {
  return (
    <ProvenancePanel>
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
          <ProvenanceRowModel>claude-sonnet</ProvenanceRowModel>
          <ProvenanceRowStatus verified={false}>미검증</ProvenanceRowStatus>
        </ProvenanceRow>
      </ProvenanceList>
    </ProvenancePanel>
  )
}`,
      },
      {
        id: "unverified-ai",
        title: "미검증 AI",
        description: "verified={false}와 dashed border로 검토 대기 AI 생성물을 표시합니다.",
        code: `<ProvenanceRow source="ai" verified={false}>
  <ProvenanceRowActions>
    <Button size="sm" variant="outline">검토</Button>
  </ProvenanceRowActions>
</ProvenanceRow>`,
      },
      {
        id: "model-id",
        title: "모델 ID",
        description: "ProvenanceRowModel에 사용 모델과 버전을 monospace로 기록합니다.",
        code: `<ProvenanceRowModel>gpt-4.1-mini · 2026-02</ProvenanceRowModel>`,
      },
      {
        id: "external-source",
        title: "외부 출처",
        description: 'source="external"로 가져온 자료·이미지 출처를 표시합니다.',
        code: `<ProvenanceRow source="external">
  <ProvenanceRowMeta>출처: 글쓰기 워크북 p.42</ProvenanceRowMeta>
</ProvenanceRow>`,
      },
    ],
    usageNotes: [
      "AI 생성 콘텐츠는 verified 전까지 publish-workflow Live 단계로 올리지 마세요.",
      "provenance 변경은 audit-log에 actor·환경과 함께 자동 기록하는 것을 권장합니다.",
    ],
    accessibility: [
      "ProvenanceRowLabel이 출처 유형(사람 작성·AI 생성)을 텍스트로 전달합니다.",
      "미검증 상태는 ProvenanceRowStatus 텍스트와 dashed border로 이중 표시하세요.",
    ],
    props: [
      {
        name: "source",
        type: '"human" | "ai" | "external"',
        defaultValue: '"human"',
        description: "ProvenanceRow의 콘텐츠 출처 유형입니다.",
      },
    ],
    related: ["audit-log", "feedback-audit", "publish-workflow"],
  },
  person: {
    slug: "person",
    summary:
      "아바타·이름·보조 설명으로 사람을 표현합니다. 목록은 가로 배치, 프로필 히어로는 세로 배치를 씁니다.",
    examples: [
      {
        id: "basic-person",
        title: "기본 구성",
        description: "아바타와 이름·이메일을 한 행으로 배치합니다.",
        preview: "default",
        code: `import { AvatarFallback } from "@/components/ui/avatar"
import {
  Person,
  PersonAvatar,
  PersonDescription,
  PersonInfo,
  PersonName,
} from "@/components/ui/person"

export function UserCell() {
  return (
    <Person>
      <PersonAvatar size="sm">
        <AvatarFallback>이</AvatarFallback>
      </PersonAvatar>
      <PersonInfo>
        <PersonName>이서연</PersonName>
        <PersonDescription>seoyeon.lee@example.com</PersonDescription>
      </PersonInfo>
    </Person>
  )
}`,
      },
      {
        id: "table-cell",
        title: "테이블 셀",
        description: "데이터 테이블의 사용자 열에서 truncate가 유지되도록 PersonInfo를 사용합니다.",
        code: `<Person className="max-w-[16rem]">
  <PersonAvatar size="sm">
    <AvatarFallback>박</AvatarFallback>
  </PersonAvatar>
  <PersonInfo>
    <PersonName>박민준</PersonName>
    <PersonDescription>minjun.park@example.com</PersonDescription>
  </PersonInfo>
</Person>`,
      },
      {
        id: "profile-hero",
        title: "프로필 히어로",
        description: 'orientation="vertical"과 큰 아바타로 학습자 프로필 상단 정체성을 구성합니다.',
        code: `<Person orientation="vertical">
  <PersonAvatar size="xl">
    <AvatarFallback>민</AvatarFallback>
  </PersonAvatar>
  <PersonInfo>
    <PersonName>민지</PersonName>
    <PersonDescription>논증 글쓰기를 또렷하게 쓰는 것이 목표예요</PersonDescription>
  </PersonInfo>
</Person>`,
      },
      {
        id: "with-actions",
        title: "행동과 함께",
        description: "Person은 정체성만 담당하고, 메뉴·배지는 옆에 별도로 둡니다.",
        code: `<div className="flex items-center justify-between gap-3">
  <Person>…</Person>
  <Button size="sm" variant="outline">기록 보기</Button>
</div>`,
      },
    ],
    usageNotes: [
      "이름·이메일처럼 긴 텍스트는 PersonName·PersonDescription의 truncate에 맡기고 고정 너비를 피하세요.",
      "역할·상태는 Badge로 옆에 두고 Person 안에 넣지 마세요.",
      "프로필 화면에서는 vertical과 xl 아바타를 쓰고, 목록·테이블에서는 horizontal과 sm을 유지하세요.",
    ],
    accessibility: [
      "PersonName이 사람을 식별하는 주 텍스트입니다.",
      "행 전체가 버튼이면 Person을 감싼 컨트롤에 명확한 이름을 제공하세요.",
    ],
    props: [
      {
        name: "Person.orientation",
        type: '"horizontal" | "vertical"',
        defaultValue: '"horizontal"',
        description: "가로 목록 행과 세로 프로필 히어로 레이아웃을 고릅니다.",
      },
      {
        name: "PersonAvatar.size",
        type: '"default" | "sm" | "lg" | "xl"',
        defaultValue: '"sm"',
        description: "아바타 크기입니다. 테이블·목록은 sm, 프로필 히어로는 xl을 씁니다.",
      },
    ],
    related: ["avatar", "learner-record", "intervention-queue"],
  },
  "learner-record": {
    slug: "learner-record",
    summary:
      "개별 학습자의 진행 경로·숙련·시도·제출·지원 이력을 관리자가 조회하는 기록 패널입니다.",
    examples: [
      {
        id: "record-sections",
        title: "기록 섹션",
        description: "진행·숙련·시도를 LearnerRecordSection으로 구분합니다.",
        preview: "default",
        code: `import {
  LearnerRecord,
  LearnerRecordAttempts,
  LearnerRecordHeader,
  LearnerRecordMastery,
  LearnerRecordMeta,
  LearnerRecordPath,
  LearnerRecordSection,
  LearnerRecordSectionTitle,
  LearnerRecordTitle,
} from "@/components/ui/learner-record"

export function StudentRecord() {
  return (
    <LearnerRecord>
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
  )
}`,
      },
      {
        id: "submissions",
        title: "제출 이력",
        description: "LearnerRecordSubmissions에 쓰기·프로젝트 제출을 모읍니다.",
        code: `<LearnerRecordSubmissions>
  설득문 v2 · 3월 1일 · 루브릭 3.4
</LearnerRecordSubmissions>`,
      },
      {
        id: "support-notes",
        title: "지원 메모",
        description: "LearnerRecordSupport에 개입·코칭 기록을 남깁니다.",
        code: `<LearnerRecordSupport>
  3월 2일 · 반복 오답 후 1:1 코칭
</LearnerRecordSupport>`,
      },
      {
        id: "link-intervention",
        title: "개입 연결",
        description: "intervention-queue 항목에서 LearnerRecord로 바로 이동하세요.",
        code: `<LearnerRecordHeader>
  <LearnerRecordTitle>최지우</LearnerRecordTitle>
  <LearnerRecordMeta>개입 대기 · repeated-errors</LearnerRecordMeta>
</LearnerRecordHeader>`,
      },
    ],
    usageNotes: [
      "학습자 기록은 FERPA 등 개인정보 규정에 맞게 접근 권한을 제한하세요.",
      "기록 화면은 조용한 톤을 유지하고, 순위·경쟁 요소는 standing 컴포넌트와 분리하세요.",
    ],
    accessibility: [
      "LearnerRecordSectionTitle이 각 섹션의 제목입니다.",
      "숫자(정답률·시도)는 tabular-nums로 정렬되어 시각·스크린 리더 모두 읽기 쉽습니다.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "LearnerRecord 패널 너비·간격을 조정합니다.",
      },
    ],
    related: ["intervention-queue", "mastery", "cohort-assignment"],
  },
  "cohort-assignment": {
    slug: "cohort-assignment",
    summary:
      "반·코hort에 과정·레슨·쓰기 과제를 배포하고, 구성원·마감·예외를 관리하는 배정 패널입니다.",
    examples: [
      {
        id: "cohort-targets",
        title: "코hort 배정",
        description: "구성원·대상·마감을 한 패널에 모읍니다.",
        preview: "default",
        code: `import {
  CohortAssignment,
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
} from "@/components/ui/cohort-assignment"

export function ClassAssignment() {
  return (
    <CohortAssignment>
      <CohortAssignmentHeader>
        <CohortAssignmentTitle>3반 과제</CohortAssignmentTitle>
        <CohortAssignmentMeta>28명</CohortAssignmentMeta>
      </CohortAssignmentHeader>
      <CohortAssignmentMembers>
        <CohortMember>이서연</CohortMember>
        <CohortMember>박민준</CohortMember>
      </CohortAssignmentMembers>
      <CohortAssignmentTargets>
        <CohortTarget kind="lesson">
          <CohortTargetLabel kind="lesson" />
          <CohortTargetTitle>레슨 2 · 근거 붙이기</CohortTargetTitle>
        </CohortTarget>
      </CohortAssignmentTargets>
      <CohortAssignmentDeadline>마감 · 3월 10일</CohortAssignmentDeadline>
    </CohortAssignment>
  )
}`,
      },
      {
        id: "target-kinds",
        title: "대상 종류",
        description: "course·lesson·writing으로 배정 단위를 구분합니다.",
        code: `<CohortTarget kind="writing">
  <CohortTargetTitle>설득문 1차 초고</CohortTargetTitle>
</CohortTarget>`,
      },
      {
        id: "exceptions",
        title: "예외 학습자",
        description: "CohortAssignmentExceptions에 연장·면제를 기록합니다.",
        code: `<CohortAssignmentExceptions>
  <CohortAssignmentException>이서연 · 마감 +3일</CohortAssignmentException>
</CohortAssignmentExceptions>`,
      },
      {
        id: "deploy-action",
        title: "배포",
        description: "Preview 환경에서 먼저 배포한 뒤 Live로 승격하세요.",
        code: `<CohortAssignmentActions>
  <Button size="sm" variant="outline">Preview 배포</Button>
  <Button size="sm">배포</Button>
</CohortAssignmentActions>`,
      },
    ],
    usageNotes: [
      "배포 전 learner-preview로 대상 레슨을 확인하세요.",
      "예외 학습자는 learner-record와 연동해 사유를 추적하세요.",
    ],
    accessibility: [
      "CohortTargetTitle이 각 배정 대상의 이름입니다.",
      "CohortMember 칩은 ul/li 구조로 스크린 리더가 구성원 수를 파악할 수 있습니다.",
    ],
    props: [
      {
        name: "kind",
        type: '"course" | "lesson" | "writing"',
        defaultValue: '"course"',
        description: "CohortTarget의 배정 대상 유형입니다.",
      },
    ],
    related: ["learner-record", "lesson", "publish-workflow"],
  },
  "intervention-queue": {
    slug: "intervention-queue",
    summary:
      "반복 오답·미접속·지각 제출 등 개입이 필요한 학습자를 우선순위 큐로 보여 주는 관리자 목록입니다.",
    examples: [
      {
        id: "intervention-list",
        title: "개입 목록",
        description: "reason별로 학습자·근거·행동을 한 항목에 모읍니다.",
        preview: "default",
        code: `import {
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
} from "@/components/ui/intervention-queue"
import { Button } from "@/components/ui/button"

export function InterventionPanel() {
  return (
    <InterventionQueue>
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
            <Button size="sm" variant="outline">코칭 보내기</Button>
          </InterventionItemActions>
        </InterventionItem>
      </InterventionQueueList>
    </InterventionQueue>
  )
}`,
      },
      {
        id: "reason-types",
        title: "개입 사유",
        description: "repeated-errors·inactive·late-submission으로 트리거를 구분합니다.",
        code: `<InterventionItem reason="inactive">…</InterventionItem>
<InterventionItem reason="late-submission">…</InterventionItem>`,
      },
      {
        id: "evidence-detail",
        title: "근거 상세",
        description: "InterventionItemEvidence에 구체적 수치·기간을 tabular-nums로 표시합니다.",
        code: `<InterventionItemEvidence>7일간 미접속 · 마지막 레슨 2</InterventionItemEvidence>`,
      },
      {
        id: "queue-priority",
        title: "우선순위",
        description: "admin-overview urgent 항목과 intervention-queue를 동기화하세요.",
        code: `<InterventionQueueMeta>긴급 1 · 일반 4</InterventionQueueMeta>`,
      },
    ],
    usageNotes: [
      "개입 큐는 알림이 아니라 교사의 다음 행동 목록입니다. 하루 처리 가능한 건수로 제한하세요.",
      "코칭 보내기 전 learner-record에서 맥락을 확인하세요.",
    ],
    accessibility: [
      "InterventionItemName이 각 항목의 학습자 이름입니다.",
      "InterventionItemReason 텍스트로 사유가 색상 없이도 전달됩니다.",
    ],
    props: [
      {
        name: "reason",
        type: '"repeated-errors" | "inactive" | "late-submission"',
        defaultValue: '"inactive"',
        description: "InterventionItem의 개입 트리거 유형입니다.",
      },
    ],
    related: ["admin-overview", "learner-record", "coaching"],
  },
  "learning-analytics": {
    slug: "learning-analytics",
    summary:
      "코hort·과정 단위의 완료율·시도·추이 등 학습 지표를 요약하고 항목별 시리즈를 보여 주는 분석 패널입니다.",
    examples: [
      {
        id: "metric-grid",
        title: "지표 그리드",
        description: "LearningAnalyticsGrid에 핵심 KPI를 카드 형태로 배치합니다.",
        preview: "default",
        code: `import {
  LearningAnalytics,
  LearningAnalyticsGrid,
  LearningAnalyticsHeader,
  LearningAnalyticsMeta,
  LearningAnalyticsMetric,
  LearningAnalyticsMetricHint,
  LearningAnalyticsMetricLabel,
  LearningAnalyticsMetricValue,
  LearningAnalyticsTitle,
} from "@/components/ui/learning-analytics"

export function CohortAnalytics() {
  return (
    <LearningAnalytics>
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
      </LearningAnalyticsGrid>
    </LearningAnalytics>
  )
}`,
      },
      {
        id: "series-rows",
        title: "항목별 시리즈",
        description: "LearningAnalyticsSeries·Row로 레슨별 완료율을 나열합니다.",
        code: `<LearningAnalyticsSeries>
  <LearningAnalyticsRow>
    <span>레슨 1</span>
    <span>92%</span>
  </LearningAnalyticsRow>
</LearningAnalyticsSeries>`,
      },
      {
        id: "metric-hint",
        title: "변화 힌트",
        description: "LearningAnalyticsMetricHint에 전기 대비 변화를 표시합니다.",
        code: `<LearningAnalyticsMetricHint>-2%p vs 지난주</LearningAnalyticsMetricHint>`,
      },
      {
        id: "drill-down",
        title: "하위 분석",
        description: "이탈이 큰 레슨은 item-analysis로 드릴다운하세요.",
        code: `<LearningAnalyticsRow>
  <span>레슨 2</span>
  <span>54%</span>
  <Button size="sm" variant="ghost">문항 분석</Button>
</LearningAnalyticsRow>`,
      },
    ],
    usageNotes: [
      "집계 지표는 개인 순위 노출 없이 cohort 단위로 기본 표시하세요.",
      "chart 컴ponent와 병행할 때 LearningAnalyticsGrid는 핵심 숫자만, 차트는 추이에 사용하세요.",
    ],
    accessibility: [
      "LearningAnalyticsMetricLabel과 LearningAnalyticsMetricValue가 쌍으로 읽혀야 합니다.",
      "퍼센트·변화량은 tabular-nums로 정렬하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "LearningAnalytics 패널 레이아웃을 조정합니다.",
      },
    ],
    related: ["item-analysis", "writing-analytics", "chart"],
  },
  "item-analysis": {
    slug: "item-analysis",
    summary:
      "개별 문항의 정답률·소요 시간·오답 분포·플래그(이탈·힌트 과다 등)를 분석하는 관리자 도구입니다.",
    examples: [
      {
        id: "item-row",
        title: "문항 분석 행",
        description: "프롬프트·통계·오답·플래그를 한 행에 모읍니다.",
        preview: "default",
        code: `import {
  ItemAnalysis,
  ItemAnalysisFlag,
  ItemAnalysisFlags,
  ItemAnalysisHeader,
  ItemAnalysisList,
  ItemAnalysisPrompt,
  ItemAnalysisRow,
  ItemAnalysisStat,
  ItemAnalysisStatLabel,
  ItemAnalysisStatValue,
  ItemAnalysisStats,
  ItemAnalysisTitle,
} from "@/components/ui/item-analysis"

export function QuestionAnalysis() {
  return (
    <ItemAnalysis>
      <ItemAnalysisHeader>
        <ItemAnalysisTitle>문항 분석</ItemAnalysisTitle>
      </ItemAnalysisHeader>
      <ItemAnalysisList>
        <ItemAnalysisRow>
          <ItemAnalysisPrompt>다음 중 반박의 핵심은?</ItemAnalysisPrompt>
          <ItemAnalysisStats>
            <ItemAnalysisStat>
              <ItemAnalysisStatLabel>정답률</ItemAnalysisStatLabel>
              <ItemAnalysisStatValue>42%</ItemAnalysisStatValue>
            </ItemAnalysisStat>
          </ItemAnalysisStats>
          <ItemAnalysisFlags>
            <ItemAnalysisFlag flag="high-dropout" />
          </ItemAnalysisFlags>
        </ItemAnalysisRow>
      </ItemAnalysisList>
    </ItemAnalysis>
  )
}`,
      },
      {
        id: "distractor-bias",
        title: "오답 분포",
        description: "ItemAnalysisDistractors로 선택지별 선택 비율을 표시합니다.",
        code: `<ItemAnalysisDistractors>
  <ItemAnalysisDistractor selected>감정 호소 · 38%</ItemAnalysisDistractor>
  <ItemAnalysisDistractor>전제 지적 · 12%</ItemAnalysisDistractor>
</ItemAnalysisDistractors>`,
      },
      {
        id: "analysis-flags",
        title: "품질 플래그",
        description: "high-dropout·hint-heavy·retry-heavy·distractor-bias 플래그를 확인합니다.",
        code: `<ItemAnalysisFlags>
  <ItemAnalysisFlag flag="distractor-bias" />
  <ItemAnalysisFlag flag="hint-heavy" />
</ItemAnalysisFlags>`,
      },
      {
        id: "bank-link",
        title: "은행 연결",
        description: "문제 문항은 item-bank에서 retired 처리 후 대체 문항을 연결하세요.",
        code: `<ItemAnalysisMeta>객관식 · item-bank #128 · n=256</ItemAnalysisMeta>`,
      },
    ],
    usageNotes: [
      "플래그가 붙은 문항은 lesson-builder와 content-validation에서 함께 점검하세요.",
      "소표본(n<30)일 때는 ItemAnalysisMeta에 표본 수를 명시해 해석을 제한하세요.",
    ],
    accessibility: [
      "ItemAnalysisPrompt가 문항 내용의 접근 가능한 요약입니다.",
      "플래그는 ItemAnalysisFlag 텍스트(높은 이탈 등)로도 전달됩니다.",
    ],
    props: [
      {
        name: "flag",
        type: '"high-dropout" | "hint-heavy" | "retry-heavy" | "distractor-bias"',
        defaultValue: '"high-dropout"',
        description: "ItemAnalysisFlag의 품질 경고 유형입니다.",
      },
    ],
    related: ["item-bank", "learning-analytics", "choice"],
  },
  "writing-analytics": {
    slug: "writing-analytics",
    summary: "쓰기 과제·장르·루브릭 기준별 평균 점수와 길이 등 집계를 보여 주는 분석 패널입니다.",
    examples: [
      {
        id: "writing-metrics",
        title: "쓰기 지표",
        description: "평균 길이·루브릭 점수·장르를 그리드로 표시합니다.",
        preview: "default",
        code: `import {
  WritingAnalytics,
  WritingAnalyticsCriteria,
  WritingAnalyticsCriterion,
  WritingAnalyticsGenre,
  WritingAnalyticsGrid,
  WritingAnalyticsHeader,
  WritingAnalyticsMetric,
  WritingAnalyticsMetricLabel,
  WritingAnalyticsMetricValue,
  WritingAnalyticsTitle,
} from "@/components/ui/writing-analytics"

export function WritingReport() {
  return (
    <WritingAnalytics>
      <WritingAnalyticsHeader>
        <WritingAnalyticsTitle>쓰기 분석</WritingAnalyticsTitle>
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
      </WritingAnalyticsCriteria>
      <WritingAnalyticsGenre>설득</WritingAnalyticsGenre>
    </WritingAnalytics>
  )
}`,
      },
      {
        id: "criterion-breakdown",
        title: "기준별 분해",
        description: "WritingAnalyticsCriteria에 rubric-editor 기준별 평균을 나열합니다.",
        code: `<WritingAnalyticsCriteria>
  <WritingAnalyticsCriterion>근거 적절성 · 2.8</WritingAnalyticsCriterion>
  <WritingAnalyticsCriterion>구조 · 3.5</WritingAnalyticsCriterion>
</WritingAnalyticsCriteria>`,
      },
      {
        id: "genre-filter",
        title: "장르",
        description: "WritingAnalyticsGenre로 설득·설명 등 장르별 필터를 표시합니다.",
        code: `<WritingAnalyticsGenre>설득 · 3반 · 2주차</WritingAnalyticsGenre>`,
      },
      {
        id: "action-hint",
        title: "개선 힌트",
        description: "WritingAnalyticsHint에 교사·코치용 다음 행동을 제안합니다.",
        code: `<WritingAnalyticsHint>근거 적절성 점수가 낮습니다. 레슨 2를 복습하세요.</WritingAnalyticsHint>`,
      },
    ],
    usageNotes: [
      "집계는 cohort 단위 기본, 개인 점수는 learner-record에서만 상세 조회하세요.",
      "루브릭 버전 변경 시 WritingAnalyticsMeta에 버전을 표시하세요.",
    ],
    accessibility: [
      "WritingAnalyticsMetricLabel과 WritingAnalyticsMetricValue가 쌍으로 읽혀야 합니다.",
      "WritingAnalyticsHint는 보조 설명이므로 metric 값 다음에 배치하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "WritingAnalytics 패널 너비를 조정합니다.",
      },
    ],
    related: ["rubric-editor", "compose", "learning-analytics"],
  },
  "feedback-audit": {
    slug: "feedback-audit",
    summary:
      "AI·교사 피드백 샘플을 정확성·근거·어조·범위·효과 기준으로 감사하고 품질 점수를 기록합니다.",
    examples: [
      {
        id: "audit-sample",
        title: "피드백 샘플",
        description: "origin별 샘플 본문과 점수 dl을 표시합니다.",
        preview: "default",
        code: `import {
  FeedbackAudit,
  FeedbackAuditHeader,
  FeedbackAuditList,
  FeedbackAuditSample,
  FeedbackAuditSampleBody,
  FeedbackAuditSampleOrigin,
  FeedbackAuditScore,
  FeedbackAuditScoreLabel,
  FeedbackAuditScoreValue,
  FeedbackAuditScores,
  FeedbackAuditTitle,
} from "@/components/ui/feedback-audit"

export function FeedbackQuality() {
  return (
    <FeedbackAudit>
      <FeedbackAuditHeader>
        <FeedbackAuditTitle>피드백 감사</FeedbackAuditTitle>
      </FeedbackAuditHeader>
      <FeedbackAuditList>
        <FeedbackAuditSample origin="ai">
          <FeedbackAuditSampleOrigin origin="ai" />
          <FeedbackAuditSampleBody>
            근거가 주장과 직접 연결되지 않았습니다.
          </FeedbackAuditSampleBody>
          <FeedbackAuditScores>
            <FeedbackAuditScore kind="accuracy">
              <FeedbackAuditScoreLabel kind="accuracy" />
              <FeedbackAuditScoreValue>4.2</FeedbackAuditScoreValue>
            </FeedbackAuditScore>
          </FeedbackAuditScores>
        </FeedbackAuditSample>
      </FeedbackAuditList>
    </FeedbackAudit>
  )
}`,
      },
      {
        id: "origin-compare",
        title: "출처 비교",
        description: "ai·teacher origin을 나란히 감사해 품질 차이를 확인합니다.",
        code: `<FeedbackAuditSample origin="teacher">…</FeedbackAuditSample>
<FeedbackAuditSample origin="ai">…</FeedbackAuditSample>`,
      },
      {
        id: "score-dimensions",
        title: "점수 차원",
        description: "accuracy·evidence·tone·scope·effect 다섯 축으로 평가합니다.",
        code: `<FeedbackAuditScores>
  <FeedbackAuditScore kind="tone">…</FeedbackAuditScore>
  <FeedbackAuditScore kind="scope">…</FeedbackAuditScore>
</FeedbackAuditScores>`,
      },
      {
        id: "provenance-link",
        title: "출처 추적",
        description: "AI 샘플은 provenance-panel·audit-log와 연결해 모델·환경을 추적하세요.",
        code: `<FeedbackAuditMeta>Sandbox · claude-sonnet · 샘플 24건</FeedbackAuditMeta>`,
      },
    ],
    usageNotes: [
      "감사 점수가 기준 이하인 AI 프롬프트는 prompt-builder에서 수정하고 provenance를 갱신하세요.",
      "Live 환경 피드백은 정기 샘플링으로 feedback-audit에 적재하는 것을 권장합니다.",
    ],
    accessibility: [
      "FeedbackAuditScoreLabel과 FeedbackAuditScoreValue가 dl 구조로 읽혀야 합니다.",
      "FeedbackAuditSampleOrigin이 AI·교사 구분을 텍스트로 전달합니다.",
    ],
    props: [
      {
        name: "origin",
        type: '"ai" | "teacher"',
        defaultValue: '"ai"',
        description: "FeedbackAuditSample의 피드백 출처입니다.",
      },
    ],
    related: ["provenance-panel", "audit-log", "coaching"],
  },
  "audit-log": {
    slug: "audit-log",
    summary:
      "게시·롤백·AI 생성·권한 변경 등 관리자·시스템 행위를 actor·대상·환경·시간과 함께 기록하는 감사 로그입니다.",
    examples: [
      {
        id: "log-entries",
        title: "로그 항목",
        description:
          "actor·action·target·kind·environment·time으로 각 이벤트를 요약하고, 선택 행을 강조합니다.",
        preview: "default",
        code: `import {
  AuditLog,
  AuditLogAction,
  AuditLogActor,
  AuditLogEntry,
  AuditLogEnvironment,
  AuditLogHeader,
  AuditLogKind,
  AuditLogList,
  AuditLogMeta,
  AuditLogTarget,
  AuditLogTime,
  AuditLogTitle,
} from "@/components/ui/audit-log"

export function AdminAuditLog() {
  return (
    <AuditLog>
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
      </AuditLogList>
    </AuditLog>
  )
}`,
      },
      {
        id: "kind-chip",
        title: "행위 유형",
        description:
          "AuditLogKind로 게시·권한·콘텐츠·AI·복원 유형을 텍스트 라벨과 함께 표시합니다.",
        code: `<AuditLogKind kind="publish" />
<AuditLogKind kind="permission" />
<AuditLogKind kind="ai" />
<AuditLogKind kind="restore" />`,
      },
      {
        id: "environment-tag",
        title: "환경 태그",
        description: "sandbox·test·preview·live 중 이벤트 발생 환경을 표시합니다.",
        code: `<AuditLogEnvironment env="live" />
<AuditLogEnvironment env="sandbox" />`,
      },
      {
        id: "system-actor",
        title: "시스템 행위",
        description: "AI 생성·스케줄 게시 등은 AuditLogActor를 시스템으로 기록합니다.",
        code: `<AuditLogEntry>
  <AuditLogActor>시스템</AuditLogActor>
  <AuditLogAction>AI 힌트 생성</AuditLogAction>
  <AuditLogKind kind="ai" />
  <AuditLogEnvironment env="sandbox" />
</AuditLogEntry>`,
      },
      {
        id: "restore-action",
        title: "복원",
        description: "AuditLogRestore로 특정 버전 복구 링크를 제공합니다(고위험 행동).",
        code: `<AuditLogEntry>
  <AuditLogAction>레슨 2 삭제</AuditLogAction>
  <AuditLogKind kind="restore" />
  <AuditLogRestore>복원</AuditLogRestore>
</AuditLogEntry>`,
      },
    ],
    usageNotes: [
      "Live 환경의 모든 publish-workflow·권한 변경은 반드시 audit-log에 남기세요.",
      "복원(AuditLogRestore)은 확인 dialog와 함께 제공하고, 복원 자체도 새 log entry로 기록하세요.",
      "필터 결과가 없을 때는 AuditLogEmpty 안에 Empty 컴포넌트를 조합하세요.",
      "행 선택·상세 패널이 있으면 AuditLogEntry selected로 현재 항목을 표시하세요.",
    ],
    accessibility: [
      "AuditLogTime은 time 요소와 dateTime 속성으로 타임스탬프를 전달합니다.",
      "AuditLogAction과 AuditLogTarget이 함께 읽혀 행위 맥락이 분명해야 합니다.",
      "AuditLogKind는 색만으로 구분하지 않고 텍스트 라벨을 함께 제공합니다.",
      "클릭 가능한 행에는 keyboard focus와 활성화 동작을 함께 제공하세요.",
    ],
    props: [
      {
        name: "env",
        type: '"sandbox" | "test" | "preview" | "live"',
        defaultValue: '"sandbox"',
        description: "AuditLogEnvironment의 이벤트 발생 환경입니다.",
      },
      {
        name: "kind",
        type: '"publish" | "permission" | "content" | "ai" | "restore"',
        defaultValue: '"content"',
        description: "AuditLogKind의 행위 유형입니다.",
      },
      {
        name: "selected",
        type: "boolean",
        defaultValue: "false",
        description: "AuditLogEntry의 선택 강조 상태입니다.",
      },
    ],
    related: ["publish-workflow", "provenance-panel", "feedback-audit"],
  },
  "run-queue": {
    slug: "run-queue",
    summary:
      "에이전트 실행을 상태 그룹으로 묶어 모니터링합니다. 환경·진행률·결과 배지로 읽기 전용 큐를 구성합니다.",
    examples: [
      {
        id: "grouped-queue",
        title: "상태별 그룹",
        description: "실행 중·대기·실패·완료 그룹으로 실행 행을 나눕니다.",
        preview: "default",
        code: `import {
  RunQueue,
  RunQueueGroup,
  RunQueueGroupCount,
  RunQueueGroupHeader,
  RunQueueGroupTitle,
  RunQueueGroups,
  RunQueueHeader,
  RunQueueItem,
  RunQueueItemBody,
  RunQueueItemProgress,
  RunQueueItemStep,
  RunQueueItemTitle,
  RunQueueList,
  RunQueueMeta,
  RunQueueOutcome,
  RunQueueTitle,
} from "@/components/ui/run-queue"

export function AgentRuns() {
  return (
    <RunQueue>
      <RunQueueHeader>
        <RunQueueTitle>실행 큐</RunQueueTitle>
        <RunQueueMeta>2건</RunQueueMeta>
      </RunQueueHeader>
      <RunQueueGroups>
        <RunQueueGroup status="running">
          <RunQueueGroupHeader>
            <RunQueueGroupTitle status="running">
              실행 중
              <RunQueueGroupCount>1</RunQueueGroupCount>
            </RunQueueGroupTitle>
          </RunQueueGroupHeader>
          <RunQueueList>
            <RunQueueItem status="running">
              <RunQueueItemBody>
                <RunQueueItemTitle>고위험 결제 세션 심사</RunQueueItemTitle>
                <RunQueueItemStep>4/6 단계</RunQueueItemStep>
              </RunQueueItemBody>
              <RunQueueItemProgress value={62} />
              <RunQueueOutcome outcome="on-track" />
            </RunQueueItem>
          </RunQueueList>
        </RunQueueGroup>
      </RunQueueGroups>
    </RunQueue>
  )
}`,
      },
      {
        id: "environment",
        title: "환경 배지",
        description: "Production·Staging·Development를 점으로 구분해 표시합니다.",
        code: `<RunQueueEnvironment environment="production" />
<RunQueueEnvironment environment="staging" />
<RunQueueEnvironment environment="development" />`,
      },
      {
        id: "outcomes",
        title: "결과 상태",
        description: "정상·승인 필요·재시도·에스컬레이션·완료를 텍스트와 톤으로 전달합니다.",
        code: `<RunQueueOutcome outcome="on-track" />
<RunQueueOutcome outcome="needs-approval" />
<RunQueueOutcome outcome="escalated" />`,
      },
      {
        id: "empty",
        title: "빈 큐",
        description: "필터 결과가 없을 때 RunQueueEmpty로 안내합니다.",
        code: `<RunQueueEmpty>조건에 맞는 실행이 없습니다</RunQueueEmpty>`,
      },
    ],
    usageNotes: [
      "통계 카드보다 실행 큐를 먼저 두고, 실패·승인 대기가 위에 오도록 정렬하세요.",
      "색만으로 상태를 구분하지 말고 RunQueueOutcome·그룹 제목 텍스트를 함께 제공하세요.",
    ],
    accessibility: [
      "진행률은 RunQueueItemProgress의 progressbar 역할과 aria-valuenow로 전달합니다.",
      "클릭 가능한 행에는 keyboard focus와 aria-pressed를 함께 제공하세요.",
    ],
    props: [
      {
        name: "status",
        type: '"running" | "waiting" | "failed" | "completed"',
        defaultValue: '"running"',
        description: "RunQueueGroup·RunQueueItem의 실행 상태입니다.",
      },
      {
        name: "environment",
        type: "RunQueueEnv",
        defaultValue: '"production"',
        description: "RunQueueEnvironment의 배포 환경입니다.",
      },
      {
        name: "outcome",
        type: "RunQueueOutcomeKind",
        defaultValue: '"on-track"',
        description: "RunQueueOutcome의 운영 결과 상태입니다.",
      },
    ],
    related: ["step-trace", "audit-log", "provenance-panel"],
  },
  "step-trace": {
    slug: "step-trace",
    summary:
      "에이전트 실행의 단계·도구 호출·오류를 읽기 전용 타임라인으로 보여 줍니다. 장시간 작업을 단일 로딩으로 뭉개지 않습니다.",
    examples: [
      {
        id: "failed-trace",
        title: "실패 스텝",
        description: "완료·실패·대기 단계를 표시하고 실패한 도구 호출과 오류를 펼칩니다.",
        preview: "default",
        code: `import {
  StepTrace,
  StepTraceBody,
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
  StepTraceToolName,
  StepTraceToolStatus,
  StepTraceTools,
} from "@/components/ui/step-trace"

export function RefundTrace() {
  return (
    <StepTrace>
      <StepTraceHeader>
        <StepTraceTitle>Step Trace</StepTraceTitle>
        <StepTraceMeta>3/6 단계에서 실패</StepTraceMeta>
      </StepTraceHeader>
      <StepTraceList>
        <StepTraceStep status="failed">
          <StepTraceMark status="failed" />
          <StepTraceBody>
            <StepTraceStepHeader>
              <StepTraceStepTitle>부분 캡처 환불 요청</StepTraceStepTitle>
              <StepTraceStatusBadge status="failed" />
            </StepTraceStepHeader>
            <StepTraceTools>
              <StepTraceTool>
                <StepTraceToolName>payments.refunds.create</StepTraceToolName>
                <StepTraceToolStatus status="failed" />
              </StepTraceTool>
            </StepTraceTools>
            <StepTraceError>processor_declined</StepTraceError>
          </StepTraceBody>
        </StepTraceStep>
      </StepTraceList>
    </StepTrace>
  )
}`,
      },
      {
        id: "tool-calls",
        title: "도구 호출",
        description: "StepTraceTools로 API·도구 호출 이름·시간·상태를 중첩 표시합니다.",
        code: `<StepTraceTools>
  <StepTraceTool>
    <StepTraceToolName>orders.lookup</StepTraceToolName>
    <StepTraceToolDuration>420ms</StepTraceToolDuration>
    <StepTraceToolStatus status="succeeded" />
  </StepTraceTool>
</StepTraceTools>`,
      },
      {
        id: "statuses",
        title: "단계 상태",
        description: "completed·running·failed·pending·cancelled를 마크와 배지로 함께 전달합니다.",
        code: `<StepTraceStep status="running">
  <StepTraceMark status="running" />
  <StepTraceStatusBadge status="running" />
</StepTraceStep>`,
      },
      {
        id: "read-only",
        title: "읽기 전용",
        description: "미션 컨트롤에서는 재시도·승인 버튼을 넣지 않고 추적만 제공합니다.",
        code: `<StepTraceMeta>읽기 전용 · Live</StepTraceMeta>`,
      },
    ],
    usageNotes: [
      "retrieving → tool → generating → complete/error처럼 단계를 분리하고 하나의 loading blob으로 합치지 마세요.",
      "오류는 StepTraceError로 눈에 띄게 하되, 쓰기 행동(재시도)은 읽기 전용 화면에서 숨기세요.",
    ],
    accessibility: [
      "StepTraceError는 role=alert로 실패를 전달합니다.",
      "StepTraceStatusBadge는 색과 함께 텍스트 라벨을 제공합니다.",
    ],
    props: [
      {
        name: "status",
        type: '"completed" | "running" | "failed" | "pending" | "cancelled"',
        defaultValue: '"pending"',
        description: "StepTraceStep·StepTraceMark·StepTraceStatusBadge의 단계 상태입니다.",
      },
      {
        name: "status",
        type: "StepTraceToolKind",
        defaultValue: '"succeeded"',
        description: "StepTraceToolStatus의 도구 호출 결과입니다.",
      },
    ],
    related: ["run-queue", "provenance-panel", "audit-log"],
  },
};
