import type { ComponentGuideMap } from "./types";

export const learningGuides: ComponentGuideMap = {
  step: {
    slug: "step",
    summary:
      "레슨 안 활동 단위의 공통 프레임입니다. 읽기·객관식·쓰기 등 모든 스텝이 Step으로 제목·본문·행동을 구성합니다.",
    examples: [
      {
        id: "reading-frame",
        title: "읽기 프레임",
        description: "제목과 본문 영역으로 읽기 스텝의 골격을 만듭니다.",
        preview: "default",
        code: `import { Step, StepActions, StepBody, StepHeader, StepTitle } from "@/components/learning/step"
import { Button } from "@/components/primitives/button"

export function ReadingStep() {
  return (
    <Step>
      <StepHeader>
        <StepTitle>주장과 근거의 거리</StepTitle>
      </StepHeader>
      <StepBody>본문 콘텐츠</StepBody>
      <StepActions>
        <Button>확인</Button>
      </StepActions>
    </Step>
  )
}`,
      },
      {
        id: "with-media",
        title: "삽화 포함",
        description: "본문 위에 시각 자료를 둘 때 StepMedia를 사용합니다.",
        code: `import { Step, StepBody, StepHeader, StepMedia, StepTitle } from "@/components/learning/step"

<Step>
  <StepHeader><StepTitle>비유의 힘</StepTitle></StepHeader>
  <StepMedia><img src="/figures/metaphor.svg" alt="" /></StepMedia>
  <StepBody>본문</StepBody>
</Step>`,
      },
      {
        id: "question-prompt",
        title: "질문형 제목",
        description: "객관식·구간 선택처럼 질문이 중심일 때는 StepTitle에 질문을 둡니다.",
        code: `import { Step, StepBody, StepHeader, StepTitle } from "@/components/learning/step"

<Step>
  <StepHeader>
    <StepTitle>다음 중 반박의 핵심을 가장 잘 담은 문장은?</StepTitle>
  </StepHeader>
  <StepBody>선택지 영역</StepBody>
</Step>`,
      },
      {
        id: "footer-actions",
        title: "하단 행동",
        description: "확인하기·계속하기·건너뛰기는 StepActions에 모아 한 흐름으로 둡니다.",
        code: `import { StepActions, StepFooter } from "@/components/learning/step"
import { Button } from "@/components/primitives/button"

<StepFooter>
  <StepActions>
    <Button variant="ghost">피드백 없이 계속하기</Button>
    <Button>확인하기</Button>
  </StepActions>
</StepFooter>`,
      },
    ],
    usageNotes: [
      "스텝 타입마다 새 프레임을 만들지 말고 Step 위에 도메인 표면(Prose, Choice, Compose 등)을 올립니다.",
      "한 스텝의 Primary 행동은 LessonActions 안 전체 너비 버튼 하나로 유지합니다.",
    ],
    accessibility: [
      "StepTitle은 해당 활동의 접근 가능한 제목으로 사용하세요.",
      "확인·제출 버튼은 비활성 이유를 텍스트로도 전달하세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "프레임 너비나 간격을 조정할 때 사용합니다.",
      },
    ],
    related: ["lesson", "insight", "prose", "choice"],
  },
  choice: {
    slug: "choice",
    summary:
      "객관식과 선택형 활동의 선택지입니다. idle·selected·correct·incorrect·missed 상태로 채점 전후를 표현합니다.",
    examples: [
      {
        id: "single-select",
        title: "단일 선택",
        description: "객관식에서 하나만 고르는 기본 구성입니다.",
        preview: "default",
        code: `import { Choice, ChoiceContent, ChoiceGroup, ChoiceLabel } from "@/components/learning/choice"

export function MultipleChoice() {
  return (
    <ChoiceGroup type="single">
      <Choice mode="single" selected>
        <ChoiceContent>
          <ChoiceLabel>주장을 먼저 밝히고 근거를 붙인다</ChoiceLabel>
        </ChoiceContent>
      </Choice>
      <Choice mode="single">
        <ChoiceContent>
          <ChoiceLabel>감정을 강조해 설득력을 높인다</ChoiceLabel>
        </ChoiceContent>
      </Choice>
    </ChoiceGroup>
  )
}`,
      },
      {
        id: "graded",
        title: "채점 상태",
        description:
          "서버 채점 결과를 state로 표시합니다. 정답은 과장된 색 대신 농도 차이로 구분합니다.",
        code: `<Choice state="correct" selected>
  <ChoiceContent><ChoiceLabel>정답 선택지</ChoiceLabel></ChoiceContent>
</Choice>
<Choice state="incorrect" selected>
  <ChoiceContent><ChoiceLabel>오답 선택지</ChoiceLabel></ChoiceContent>
</Choice>
<Choice state="missed">
  <ChoiceContent><ChoiceLabel>놓친 정답</ChoiceLabel></ChoiceContent>
</Choice>`,
      },
      {
        id: "with-description",
        title: "설명 포함",
        description: "선택지에 짧은 부연이 필요할 때 ChoiceDescription을 둡니다.",
        code: `<Choice>
  <ChoiceContent>
    <ChoiceLabel>자기반박</ChoiceLabel>
    <ChoiceDescription>내 주장의 약한 고리를 먼저 드러낸다</ChoiceDescription>
  </ChoiceContent>
</Choice>`,
      },
      {
        id: "locked",
        title: "잠금",
        description: "확인 후에는 locked로 재선택을 막습니다.",
        code: `<Choice state="locked" selected>
  <ChoiceContent><ChoiceLabel>제출된 선택</ChoiceLabel></ChoiceContent>
</Choice>`,
      },
    ],
    usageNotes: [
      "정답 ID는 UI 위치가 아니라 서버 채점 결과로만 표시하세요.",
      "Segment·Token의 상태 언어와 맞춰 학습자가 피드백을 재학습하지 않게 합니다.",
      "선택은 배경·테두리로 전달하고, 앞쪽 라디오 표시는 두지 않습니다.",
    ],
    accessibility: [
      "단일 선택은 role=radiogroup/radio, 다중은 group/checkbox를 사용합니다.",
      "색만으로 정오답을 구분하지 말고 테두리·배경·aria-checked를 함께 둡니다.",
    ],
    props: [
      {
        name: "state",
        type: '"idle" | "selected" | "correct" | "incorrect" | "missed" | "locked"',
        defaultValue: '"idle"',
        description: "선택·채점·잠금 상태를 시각적으로 전달합니다.",
      },
      {
        name: "mode",
        type: '"single" | "multiple"',
        defaultValue: '"single"',
        description: "라디오 또는 체크박스 역할을 결정합니다.",
      },
    ],
    related: ["step", "insight", "segment"],
  },
  token: {
    slug: "token",
    summary:
      "빈칸 채우기용 문장 슬롯과 단어 칩입니다. 학습자는 뱅크에서 골라 빈칸을 채우고, 슬롯을 다시 눌러 해제합니다.",
    examples: [
      {
        id: "fill-blank",
        title: "빈칸 문장",
        description: "문장 템플릿과 단어 뱅크를 함께 구성합니다.",
        preview: "default",
        code: `import { Token, TokenBank, TokenSentence, TokenSlot } from "@/components/learning/token"

export function FillBlank() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <TokenSentence>
        좋은 반박은<TokenSlot state="empty">빈칸</TokenSlot>을 먼저 드러낸다.
      </TokenSentence>
      <TokenBank>
        <Token>약한 고리</Token>
        <Token state="used">감정</Token>
        <Token>비꼼</Token>
      </TokenBank>
    </div>
  )
}`,
      },
      {
        id: "filled-slot",
        title: "채워진 슬롯",
        description: "선택된 단어가 들어간 슬롯은 다시 눌러 해제할 수 있습니다.",
        code: `<TokenSlot state="filled">약한 고리</TokenSlot>`,
      },
      {
        id: "graded-slots",
        title: "채점 후",
        description: "확인하기 뒤에는 슬롯에 correct/incorrect를 적용합니다.",
        code: `<div className="flex flex-wrap items-center gap-2">
  <TokenSlot state="correct">약한 고리</TokenSlot>
  <TokenSlot state="incorrect">감정</TokenSlot>
</div>`,
      },
      {
        id: "bank-states",
        title: "뱅크 상태",
        description: "사용된 칩은 used로 흐리게, 잠긴 상태는 locked로 둡니다.",
        code: `<TokenBank>
  <Token state="idle">근거</Token>
  <Token state="selected">주장</Token>
  <Token state="used">예시</Token>
  <Token state="locked">비꼼</Token>
</TokenBank>`,
      },
    ],
    usageNotes: [
      "빈칸은 문구가 같아도 단어 ID로 구분하세요.",
      "채우기 순서는 앱 상태에서 관리하고, Token은 표시와 상호작용만 담당합니다.",
    ],
    accessibility: [
      "빈 TokenSlot에는 자리를 알리는 접근 가능 이름을 주세요.",
      "사용된 칩은 disabled와 시각 상태를 함께 전달합니다.",
    ],
    props: [
      {
        name: "state",
        type: "TokenState | TokenSlot state",
        defaultValue: '"idle" / "empty"',
        description: "칩·슬롯의 선택·채점·잠금 상태입니다.",
      },
    ],
    related: ["step", "insight"],
  },
  segment: {
    slug: "segment",
    summary:
      "문장·단락을 선택 가능한 구간으로 나눕니다. inline은 문장 흐름, block은 독립 블록입니다.",
    examples: [
      {
        id: "inline-select",
        title: "문장형 구간",
        description: "흐름을 유지하며 구간을 고릅니다. 구간을 눌러 선택·해제할 수 있습니다.",
        preview: "default",
        code: `import { useState } from "react"
import { Segment, SegmentGroup } from "@/components/learning/segment"

const segments = [
  { id: "s1", text: "기후 위기는" },
  { id: "s2", text: "개인의 습관만으로" },
  { id: "s3", text: "해결되지 않는다." },
]

export function SelectInline() {
  const [selected, setSelected] = useState<string | null>("s2")

  return (
    <SegmentGroup layout="inline" aria-label="과장된 전제 고르기">
      {segments.map((segment) => (
        <Segment
          key={segment.id}
          selected={selected === segment.id}
          onClick={() =>
            setSelected((current) => (current === segment.id ? null : segment.id))
          }
        >
          {segment.text}
        </Segment>
      ))}
    </SegmentGroup>
  )
}`,
      },
      {
        id: "block-select",
        title: "블록형 구간",
        description: "단락 단위 선택에는 block 배치를 사용합니다. 단락을 눌러 골라 보세요.",
        code: `import { useState } from "react"
import { Segment, SegmentGroup } from "@/components/learning/segment"

const paragraphs = [
  { id: "p1", text: "첫 문단은 문제의 배경을 짧게 제시합니다." },
  { id: "p2", text: "두 번째 문단에서 핵심 주장을 분명히 드러냅니다." },
  { id: "p3", text: "마지막 문단은 근거와 연결해 마무리합니다." },
]

export function SelectBlock() {
  const [selected, setSelected] = useState<string | null>("p2")

  return (
    <SegmentGroup layout="block" className="max-w-md" aria-label="핵심 단락 고르기">
      {paragraphs.map((paragraph) => (
        <Segment
          key={paragraph.id}
          layout="block"
          selected={selected === paragraph.id}
          onClick={() =>
            setSelected((current) => (current === paragraph.id ? null : paragraph.id))
          }
        >
          {paragraph.text}
        </Segment>
      ))}
    </SegmentGroup>
  )
}`,
      },
      {
        id: "graded",
        title: "채점 상태",
        description:
          "확인하기 뒤 맞춘·잘못 고른·놓친 구간을 state로 구분합니다. 다시 풀기로 재시도할 수 있습니다.",
        code: `import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { Segment, SegmentGroup, type SegmentState } from "@/components/learning/segment"

const segments = [
  { id: "s1", text: "모든 독자는" },
  { id: "s2", text: "같은 배경지식을 갖고 있으며" },
  { id: "s3", text: "반박 없이도 설득된다." },
]
const answer = new Set(["s2", "s3"])

export function GradedSegments() {
  const [selected, setSelected] = useState<string[]>(["s1", "s2"])
  const [checked, setChecked] = useState(true)

  const stateFor = (id: string): SegmentState => {
    if (!checked) return selected.includes(id) ? "selected" : "idle"
    const isAnswer = answer.has(id)
    const isSelected = selected.includes(id)
    if (isAnswer && isSelected) return "correct"
    if (!isAnswer && isSelected) return "incorrect"
    if (isAnswer && !isSelected) return "missed"
    return "locked"
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SegmentGroup layout="inline" aria-label="과장된 전제 고르기">
        {segments.map((segment) => (
          <Segment
            key={segment.id}
            selected={selected.includes(segment.id)}
            state={stateFor(segment.id)}
            onClick={() => {
              if (checked) return
              setSelected((prev) =>
                prev.includes(segment.id)
                  ? prev.filter((value) => value !== segment.id)
                  : [...prev, segment.id],
              )
            }}
          >
            {segment.text}
          </Segment>
        ))}
      </SegmentGroup>
      <Button
        variant={checked ? "outline" : "default"}
        onClick={() => {
          if (checked) {
            setSelected([])
            setChecked(false)
            return
          }
          setChecked(true)
        }}
      >
        {checked ? "다시 풀기" : "확인하기"}
      </Button>
    </div>
  )
}`,
      },
      {
        id: "multi",
        title: "다중 선택",
        description:
          "하나 이상 고를 수 있으며 제출 전 selected만 강조합니다. 눌러서 토글해 보세요.",
        code: `import { useState } from "react"
import { Segment, SegmentGroup } from "@/components/learning/segment"

const segments = [
  { id: "claim", text: "주장" },
  { id: "reason", text: "근거" },
  { id: "example", text: "예시" },
  { id: "rebuttal", text: "반박" },
]

export function MultiSelect() {
  const [selected, setSelected] = useState<string[]>(["claim", "reason"])

  return (
    <SegmentGroup layout="inline" aria-label="설득 요소 고르기">
      {segments.map((segment) => (
        <Segment
          key={segment.id}
          selected={selected.includes(segment.id)}
          onClick={() =>
            setSelected((prev) =>
              prev.includes(segment.id)
                ? prev.filter((value) => value !== segment.id)
                : [...prev, segment.id],
            )
          }
        >
          {segment.text}
        </Segment>
      ))}
    </SegmentGroup>
  )
}`,
      },
    ],
    usageNotes: [
      "배치 기본값은 inline입니다. 콘텐츠에 layout이 없으면 inline으로 두세요.",
      "구간 문구가 같아도 ID로 채점합니다.",
    ],
    accessibility: [
      "각 Segment는 aria-pressed로 선택 상태를 전달합니다.",
      "질문 텍스트와 SegmentGroup을 레이블로 연결하세요.",
    ],
    props: [
      {
        name: "layout",
        type: '"inline" | "block"',
        defaultValue: '"inline"',
        description: "문장 흐름 또는 블록 목록으로 배치합니다.",
      },
      {
        name: "state",
        type: '"idle" | "selected" | "correct" | "incorrect" | "missed" | "locked"',
        defaultValue: '"idle"',
        description: "선택·채점 상태입니다.",
      },
    ],
    related: ["step", "choice", "insight"],
  },
  insight: {
    slug: "insight",
    summary:
      "해설·생각해보기·정오답 안내를 담는 피드백 패널입니다. 채점 결과와 비교 분석에 공통으로 씁니다.",
    examples: [
      {
        id: "explanation",
        title: "해설",
        description: "확인하기 후 서버가 준 해설을 보여줍니다.",
        preview: "default",
        code: `import { Insight, InsightDescription, InsightEyebrow, InsightTitle } from "@/components/learning/insight"

export function Explanation() {
  return (
    <Insight tone="correct">
      <InsightEyebrow>해설</InsightEyebrow>
      <InsightTitle>정답입니다</InsightTitle>
      <InsightDescription>
        반박은 상대 주장의 전제를 드러낼 때 설득력이 커집니다.
      </InsightDescription>
    </Insight>
  )
}`,
      },
      {
        id: "think",
        title: "생각해보기",
        description: "비교 스텝의 분석 문구에 think 톤을 사용합니다.",
        code: `<Insight tone="think">
  <InsightEyebrow>생각해보기</InsightEyebrow>
  <InsightDescription>두 버전의 어조가 독자의 신뢰를 어떻게 바꾸나요?</InsightDescription>
</Insight>`,
      },
      {
        id: "incorrect",
        title: "오답 안내",
        description: "오답 시 보조 문구는 incorrect 톤으로 짧게 둡니다.",
        code: `<Insight tone="incorrect">
  <InsightTitle>다시 살펴보세요</InsightTitle>
  <InsightDescription>선택지가 주장의 전제를 다루고 있는지 확인해 보세요.</InsightDescription>
</Insight>`,
      },
      {
        id: "list",
        title: "목록형 피드백",
        description: "개선점을 나열할 때 InsightList를 사용합니다.",
        code: `<Insight>
  <InsightTitle>다시 쓸 때</InsightTitle>
  <InsightList>
    <InsightItem>주장 문장을 앞으로 옮기기</InsightItem>
    <InsightItem>근거와 주장 사이 연결어 넣기</InsightItem>
  </InsightList>
</Insight>`,
      },
    ],
    usageNotes: [
      "정오답 색을 넓게 칠하지 말고 톤과 문구로 상태를 전달하세요.",
      "Alert와 역할이 겹치면, 학습 채점 피드백은 Insight를 우선합니다.",
    ],
    accessibility: [
      "채점 직후 포커스를 Insight로 옮기거나 aria-live로 결과를 알려주세요.",
      "톤만으로 의미를 전달하지 말고 제목 텍스트를 함께 둡니다.",
    ],
    props: [
      {
        name: "tone",
        type: '"neutral" | "think" | "correct" | "incorrect" | "coaching"',
        defaultValue: '"neutral"',
        description: "피드백의 역할에 맞는 표면 톤을 고릅니다.",
      },
    ],
    related: ["step", "choice"],
  },
  sortable: {
    slug: "sortable",
    summary:
      "순서 맞추기 활동용 재정렬 목록입니다. 드래그 핸들을 항목 오른쪽에 두어 오른손 엄지로 잡기 쉽게 합니다.",
    examples: [
      {
        id: "order-list",
        title: "순서 목록",
        description: "섞인 항목을 세로로 배열합니다.",
        preview: "default",
        code: `import { useState } from "react"
import { Sortable, SortableContent, SortableHandle, SortableIndex, SortableItem } from "@/components/learning/sortable"

const items = [
  { id: "claim", label: "주장 제시" },
  { id: "reason", label: "근거 제시" },
]

export function OrderStep() {
  const [order, setOrder] = useState(["reason", "claim"])

  return (
    <Sortable
      value={order}
      onValueChange={setOrder}
      getItemLabel={(id) => items.find((item) => item.id === id)?.label ?? String(id)}
      aria-label="설득문 순서"
    >
      {order.map((id) => {
        const item = items.find((entry) => entry.id === id)!
        return (
          <SortableItem key={id} value={id}>
            <SortableIndex />
            <SortableContent>{item.label}</SortableContent>
            <SortableHandle />
          </SortableItem>
        )
      })}
    </Sortable>
  )
}`,
      },
      {
        id: "without-index",
        title: "번호 숨김",
        description: "번호 표시가 꺼진 콘텐츠에서는 SortableIndex를 생략합니다.",
        code: `<Sortable value={["intro"]} onValueChange={() => {}}>
  <SortableItem value="intro">
    <SortableContent>서론</SortableContent>
    <SortableHandle />
  </SortableItem>
</Sortable>`,
      },
      {
        id: "graded",
        title: "채점 후 잠금",
        description: "확인 뒤에는 state로 정오답을 표시하고 이동을 막습니다.",
        code: `<Sortable disabled value={["claim", "reason", "close"]} onValueChange={() => {}}>
  <SortableItem value="claim" state="correct">...</SortableItem>
  <SortableItem value="reason" state="incorrect">...</SortableItem>
  <SortableItem value="close" state="locked">...</SortableItem>
</Sortable>`,
      },
      {
        id: "keyboard",
        title: "키보드 이동",
        description: "핸들에 포커스한 뒤 스페이스와 방향키로 순서를 바꿉니다.",
        code: `<Sortable value={["claim"]} onValueChange={() => {}}>
  <SortableItem value="claim">
    <SortableContent>주장 제시</SortableContent>
    <SortableHandle />
  </SortableItem>
</Sortable>`,
      },
    ],
    usageNotes: [
      "Sortable은 value와 onValueChange로 순서를 제어하며 각 SortableItem에는 안정적인 value를 제공하세요.",
      "핸들은 항목 오른쪽에 두어 오른손 엄지 도달 범위를 맞춥니다.",
    ],
    accessibility: [
      "드래그 핸들은 포커스 후 스페이스 또는 엔터로 들고 방향키로 이동하며 Esc로 취소합니다.",
      "드래그 이동은 live region으로 항목 이름과 새 위치를 알립니다.",
    ],
    props: [
      {
        name: "value",
        type: "Array<string | number>",
        defaultValue: "—",
        description: "현재 항목 순서를 나타내는 안정적인 ID 배열입니다.",
      },
      {
        name: "onValueChange",
        type: "(value: Array<string | number>) => void",
        defaultValue: "—",
        description: "드래그로 순서가 바뀔 때 호출됩니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "목록 전체의 드래그를 잠급니다.",
      },
      {
        name: "getItemLabel",
        type: "(value: string | number) => string",
        defaultValue: "String",
        description: "스크린 리더 이동 안내에 사용할 항목 이름을 반환합니다.",
      },
      {
        name: "SortableItem.value",
        type: "string | number",
        defaultValue: "—",
        description: "value 배열의 항목과 연결되는 고유 ID입니다.",
      },
      {
        name: "SortableItem.state",
        type: '"idle" | "correct" | "incorrect" | "locked"',
        defaultValue: '"idle"',
        description: "항목의 채점·잠금 상태입니다.",
      },
    ],
    related: ["step", "insight"],
  },
  pair: {
    slug: "pair",
    summary:
      "짝 맞추기 보드입니다. 좌·우 열에서 항목을 고르면 PairConnections가 마커 사이를 곡선으로 연결합니다.",
    examples: [
      {
        id: "match-board",
        title: "짝 보드",
        description: "왼쪽·오른쪽 열을 나란히 두고 연결선으로 짝을 보여줍니다.",
        preview: "default",
        code: `import { PairBoard, PairColumn, PairConnections, PairItem, PairLabel, PairMarker } from "@/components/learning/pair"

export function MatchStep() {
  return (
    <PairBoard>
      <PairConnections
        connections={[
          { from: "l1", to: "r1", state: "paired" },
        ]}
        labels={{ l1: "주장", r1: "무엇을 말하려는가" }}
      />
      <PairColumn side="left">
        <PairItem pairId="l1" state="paired"><PairMarker /><PairLabel>주장</PairLabel></PairItem>
        <PairItem pairId="l2"><PairMarker /><PairLabel>근거</PairLabel></PairItem>
      </PairColumn>
      <PairColumn side="right">
        <PairItem pairId="r1" state="paired"><PairMarker /><PairLabel>무엇을 말하려는가</PairLabel></PairItem>
        <PairItem pairId="r2"><PairMarker /><PairLabel>왜 믿을 수 있는가</PairLabel></PairItem>
      </PairColumn>
    </PairBoard>
  )
}`,
      },
      {
        id: "connections",
        title: "연결선",
        description: "PairConnections에 from·to와 상태를 넘기면 보드 위 SVG 곡선이 갱신됩니다.",
        code: `<PairBoard>
  <PairConnections
    connections={[
      { from: "l1", to: "r1", state: "correct" },
      { from: "l2", to: "r2", state: "incorrect" },
    ]}
    labels={{
      l1: "주장",
      l2: "근거",
      r1: "무엇을 말하려는가",
      r2: "왜 믿을 수 있는가",
    }}
  />
  <PairColumn side="left">
    <PairItem pairId="l1" state="correct"><PairMarker /><PairLabel>주장</PairLabel></PairItem>
    <PairItem pairId="l2" state="incorrect"><PairMarker /><PairLabel>근거</PairLabel></PairItem>
  </PairColumn>
  <PairColumn side="right">
    <PairItem pairId="r1" state="correct"><PairMarker /><PairLabel>무엇을 말하려는가</PairLabel></PairItem>
    <PairItem pairId="r2" state="incorrect"><PairMarker /><PairLabel>왜 믿을 수 있는가</PairLabel></PairItem>
  </PairColumn>
</PairBoard>`,
      },
      {
        id: "graded",
        title: "채점 상태",
        description: "올바른·잘못된 연결을 항목과 선 상태값으로 함께 구분합니다.",
        code: `<PairBoard>
  <PairConnections
    connections={[
      { from: "l1", to: "r1", state: "correct" },
      { from: "l2", to: "r3", state: "incorrect" },
    ]}
    labels={{
      l1: "주장",
      l2: "근거",
      r1: "무엇을 말하려는가",
      r3: "반박의 출발점",
    }}
  />
  <PairColumn side="left">
    <PairItem pairId="l1" state="correct"><PairMarker /><PairLabel>주장</PairLabel></PairItem>
    <PairItem pairId="l2" state="incorrect"><PairMarker /><PairLabel>근거</PairLabel></PairItem>
  </PairColumn>
  <PairColumn side="right">
    <PairItem pairId="r1" state="correct"><PairMarker /><PairLabel>무엇을 말하려는가</PairLabel></PairItem>
    <PairItem pairId="r2"><PairMarker /><PairLabel>왜 믿을 수 있는가</PairLabel></PairItem>
    <PairItem pairId="r3" state="incorrect"><PairMarker /><PairLabel>반박의 출발점</PairLabel></PairItem>
  </PairColumn>
</PairBoard>`,
      },
      {
        id: "active",
        title: "선택 중",
        description: "한쪽을 고른 뒤 다른 쪽을 기다리는 상태는 active입니다.",
        code: `<PairBoard>
  <PairColumn side="left">
    <PairItem pairId="l1" state="active"><PairMarker /><PairLabel>전제</PairLabel></PairItem>
    <PairItem pairId="l2"><PairMarker /><PairLabel>결론</PairLabel></PairItem>
  </PairColumn>
  <PairColumn side="right">
    <PairItem pairId="r1"><PairMarker /><PairLabel>이미 참으로 받아들인 것</PairLabel></PairItem>
    <PairItem pairId="r2"><PairMarker /><PairLabel>이끌어 내려는 말</PairLabel></PairItem>
  </PairColumn>
</PairBoard>`,
      },
    ],
    usageNotes: [
      "한쪽 열에 같은 표시 문구가 두 번 있으면 콘텐츠로 허용하지 마세요.",
      "연결된 관계는 PairLinks 목록보다 PairConnections 곡선과 항목 state로 드러내세요.",
      "PairItem에는 pairId를 주고, 보조 기술용 요약이 필요하면 PairConnections의 labels를 사용하세요.",
    ],
    accessibility: [
      "열과 항목에 명확한 레이블을 제공하세요.",
      "연결·해제 시 상태를 텍스트로도 알려주세요. PairConnections labels가 sr-only 요약을 만듭니다.",
    ],
    props: [
      {
        name: "state",
        type: '"idle" | "active" | "paired" | "correct" | "incorrect" | "locked"',
        defaultValue: '"idle"',
        description: "항목의 선택·연결·채점 상태입니다.",
      },
      {
        name: "pairId",
        type: "string",
        defaultValue: "-",
        description: "PairConnections가 연결선을 그릴 때 찾는 항목 ID입니다.",
      },
      {
        name: "connections",
        type: '{ from: string; to: string; state?: "paired" | "correct" | "incorrect" | "active" }[]',
        defaultValue: "-",
        description: "PairConnections에 넘기는 좌·우 연결 목록입니다.",
      },
    ],
    related: ["step", "classify", "insight"],
  },
  classify: {
    slug: "classify",
    summary:
      "분류 활동입니다. 카테고리를 고른 뒤 항목에 붙이고, 같은 카테고리를 다시 누르면 해제합니다.",
    examples: [
      {
        id: "categorize",
        title: "분류 보드",
        description: "카테고리 칩과 항목 목록을 구성합니다.",
        preview: "default",
        code: `import { Classify, ClassifyCategories, ClassifyCategory, ClassifyItem, ClassifyItemLabel, ClassifyItemTag, ClassifyPool } from "@/components/learning/classify"

export function CategorizeStep() {
  return (
    <Classify>
      <ClassifyCategories>
        <ClassifyCategory state="active">주장</ClassifyCategory>
        <ClassifyCategory>근거</ClassifyCategory>
        <ClassifyCategory>예시</ClassifyCategory>
      </ClassifyCategories>
      <ClassifyPool>
        <ClassifyItem state="placed">
          <ClassifyItemLabel>학교는 토론을 늘려야 한다</ClassifyItemLabel>
          <ClassifyItemTag>주장</ClassifyItemTag>
        </ClassifyItem>
        <ClassifyItem>
          <ClassifyItemLabel>참여 학생이 늘었다는 조사</ClassifyItemLabel>
        </ClassifyItem>
      </ClassifyPool>
    </Classify>
  )
}`,
      },
      {
        id: "graded",
        title: "채점 후",
        description: "맞춘·틀린 배치를 상태와 태그로 함께 보여줍니다.",
        code: `<ClassifyItem state="correct">
  <ClassifyItemLabel>항목</ClassifyItemLabel>
  <ClassifyItemTag>근거</ClassifyItemTag>
</ClassifyItem>`,
      },
      {
        id: "locked-categories",
        title: "카테고리 잠금",
        description: "제출 후 카테고리 선택을 막을 때 locked를 씁니다.",
        code: `<ClassifyCategory state="locked">주장</ClassifyCategory>`,
      },
      {
        id: "empty-item",
        title: "미배치 항목",
        description: "아직 카테고리가 없는 항목은 태그를 생략합니다.",
        code: `<ClassifyItem>
  <ClassifyItemLabel>감정에 호소하는 문장</ClassifyItemLabel>
</ClassifyItem>`,
      },
    ],
    usageNotes: [
      "모든 항목이 배치되어야 제출 가능합니다. 미배치는 UI에서 분명히 남기세요.",
      "카테고리 선택은 toolbar로, 항목은 list로 역할을 나눕니다.",
    ],
    accessibility: [
      "활성 카테고리는 시각과 상태 텍스트로 함께 전달하세요.",
      "항목 버튼에 현재 배치된 카테고리 이름을 접근 가능 이름에 포함하세요.",
    ],
    props: [
      {
        name: "state",
        type: "ClassifyState",
        defaultValue: '"idle"',
        description: "카테고리·항목의 선택·배치·채점 상태입니다.",
      },
    ],
    related: ["step", "pair", "insight"],
  },
  prose: {
    slug: "prose",
    summary:
      "읽기 스텝의 본문 표면입니다. 삽화·마크다운 본문·출처를 콘텐츠가 앞에 오도록 배치합니다.",
    examples: [
      {
        id: "reading",
        title: "읽기 본문",
        description: "삽화와 본문, 출처를 순서대로 둡니다.",
        preview: "default",
        code: `import { Prose, ProseBody, ProseFigure, ProseSource } from "@/components/learning/prose"

export function ReadingBody() {
  return (
    <Prose>
      <ProseFigure>
        <img src="/figures/writing.svg" alt="" />
      </ProseFigure>
      <ProseBody>
        <p>설득문에서 주장은 독자가 붙잡을 수 있는 한 문장이어야 합니다.</p>
      </ProseBody>
      <ProseSource>출처: 글쓰기 워크북</ProseSource>
    </Prose>
  )
}`,
      },
      {
        id: "body-only",
        title: "본문만",
        description: "삽화·출처가 없으면 해당 슬롯을 렌더하지 않습니다.",
        code: `<Prose>
  <ProseBody><p>짧은 읽기 자료</p></ProseBody>
</Prose>`,
      },
      {
        id: "with-caption",
        title: "캡션",
        description: "삽화 설명이 필요하면 ProseCaption을 둡니다.",
        code: `<ProseFigure>
  <img src="/figures/outline.svg" alt="" />
  <ProseCaption>개요를 먼저 적은 초고</ProseCaption>
</ProseFigure>`,
      },
      {
        id: "lists",
        title: "목록 본문",
        description: "본문 안의 목록·인용은 ProseBody 타이포 규칙을 따릅니다.",
        code: `<ProseBody>
  <ul>
    <li>주장</li>
    <li>근거</li>
  </ul>
</ProseBody>`,
      },
    ],
    usageNotes: [
      "카드로 본문을 다시 감싸지 말고 Prose를 StepBody 안에 직접 두세요.",
      "마크다운 렌더 결과는 ProseBody children으로 넣습니다.",
    ],
    accessibility: [
      "장식 이미지는 alt를 비우고, 의미 있는 이미지는 설명을 제공합니다.",
      "출처는 본문과 구분되는 텍스트로 남겨 주세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "본문 폭이나 간격을 조정합니다.",
      },
    ],
    related: ["step", "compare"],
  },
  compare: {
    slug: "compare",
    summary:
      "버전 비교 표면입니다. Tabs 컴포지션으로 버전을 전환하고 ComparePanel에 글을 담습니다.",
    examples: [
      {
        id: "versions",
        title: "버전 전환",
        description: "라벨이 있는 버전 탭과 본문 패널을 구성합니다.",
        preview: "default",
        code: `import { Compare, ComparePanel, CompareVersion, CompareVersionList, CompareVersions } from "@/components/learning/compare"

export function CompareStep() {
  return (
    <Compare>
      <CompareVersions defaultValue="a">
        <CompareVersionList>
          <CompareVersion value="a">초고</CompareVersion>
          <CompareVersion value="b">다듬은 글</CompareVersion>
        </CompareVersionList>
        <ComparePanel value="a">주장은 뒤에 있고 근거가 앞섭니다.</ComparePanel>
        <ComparePanel value="b">주장을 먼저 두고 근거를 붙였습니다.</ComparePanel>
      </CompareVersions>
    </Compare>
  )
}`,
      },
      {
        id: "with-insight",
        title: "분석 결합",
        description: "비교 후 생각해보기는 Insight와 조합합니다.",
        code: `<Compare>...</Compare>
<Insight tone="think">
  <InsightEyebrow>생각해보기</InsightEyebrow>
  <InsightDescription>어느 버전이 더 설득력 있나요?</InsightDescription>
</Insight>`,
      },
      {
        id: "three-versions",
        title: "세 버전",
        description: "버전은 2개 이상이면 됩니다.",
        code: `<CompareVersionList>
  <CompareVersion value="1">A</CompareVersion>
  <CompareVersion value="2">B</CompareVersion>
  <CompareVersion value="3">C</CompareVersion>
</CompareVersionList>`,
      },
      {
        id: "panel-density",
        title: "패널 밀도",
        description: "긴 글도 패널 안에서 읽히도록 여백을 유지합니다.",
        code: `<ComparePanel value="a">
  <p>긴 비교 본문…</p>
</ComparePanel>`,
      },
    ],
    usageNotes: [
      "Compare는 Tabs에 의존합니다. 설치 시 tabs도 함께 적용됩니다.",
      "분석 문구는 Compare 밖 Insight로 분리해 역할을 나눕니다.",
    ],
    accessibility: [
      "버전 탭은 키보드로 전환 가능해야 합니다.",
      "활성 버전 라벨이 스크린 리더에 전달되는지 확인하세요.",
    ],
    props: [
      {
        name: "defaultValue",
        type: "string",
        defaultValue: "—",
        description: "CompareVersions의 초기 버전 값입니다.",
      },
    ],
    related: ["step", "insight", "tabs", "prose"],
  },
  compose: {
    slug: "compose",
    summary:
      "쓰기 활동 표면입니다. 배지·대상 주장·안내·원문·가이드·편집기·글자 수·참조 답안을 필요한 것만 조합합니다.",
    examples: [
      {
        id: "write",
        title: "기본 쓰기",
        description: "프롬프트와 입력, 글자 수 미터를 구성합니다.",
        preview: "default",
        code: `import { Compose, ComposeEditor, ComposeMeter } from "@/components/learning/compose"

export function WriteStep() {
  return (
    <Compose>
      <ComposeEditor placeholder="반박 문단을 작성하세요." />
      <ComposeMeter value={42} min={80} goal={120} max={200} />
    </Compose>
  )
}`,
      },
      {
        id: "counter",
        title: "반박 쓰기",
        description: "배지와 대상 주장을 함께 둡니다.",
        code: `<Compose>
  <ComposeBadge>반박 쓰기</ComposeBadge>
  <ComposeClaim>모든 숙제는 폐지해야 한다.</ComposeClaim>
  <ComposeContext>위 주장에 대해 한 단락으로 반박하세요.</ComposeContext>
  <ComposeEditor />
  <ComposeMeter value={0} min={60} />
</Compose>`,
      },
      {
        id: "with-guides",
        title: "원문·구조 가이드",
        description: "참고 원문과 구조 안내는 있을 때만 렌더합니다.",
        code: `<ComposeSource>원문 발췌…</ComposeSource>
<ComposeGuide>1) 전제 지적 → 2) 반례 → 3) 대안</ComposeGuide>`,
      },
      {
        id: "reference",
        title: "참조 답안",
        description: "제출 확인 뒤에만 참조 답안을 보여줍니다.",
        code: `<ComposeReference>
  <strong>예시 답안</strong>
  <p>…</p>
</ComposeReference>`,
      },
    ],
    usageNotes: [
      "서버는 문장 정답이 아니라 글자 수 기준만 판정합니다. ComposeMeter의 ready/short/over를 제출 조건에 연결하세요.",
      "모드(counter, self-rebut)는 배지·주장 유무로 표현하고 별도 테마를 만들지 않습니다.",
    ],
    accessibility: [
      "편집기와 글자 수 미터를 레이블로 연결하세요.",
      "최소 글자 미달로 제출이 막힐 때 이유를 텍스트로 알리세요.",
    ],
    props: [
      {
        name: "value / min / goal / max",
        type: "number",
        defaultValue: "value=0",
        description: "ComposeMeter의 현재·최소·목표·최대 글자 수입니다.",
      },
    ],
    related: ["step", "textarea", "draft"],
  },
  path: {
    slug: "path",
    summary: "코스 → 유닛 → 레슨 경로입니다. 유닛 헤더와 레슨 노드 상태로 학습 지도를 구성합니다.",
    examples: [
      {
        id: "course-path",
        title: "학습 경로",
        description: "유닛 아래 레슨 노드를 세로로 연결합니다.",
        preview: "default",
        code: `import { Path, PathConnector, PathNode, PathNodeDescription, PathNodeMeta, PathNodeTitle, PathStep, PathTrail, PathUnit, PathUnitDescription, PathUnitHeader, PathUnitTitle } from "@/components/learning/path"

export function CoursePath() {
  return (
    <Path>
      <PathUnit>
        <PathUnitHeader>
          <PathUnitTitle>유닛 1 · 주장 세우기</PathUnitTitle>
          <PathUnitDescription>한 문장 주장을 또렷하게 쓰는 연습</PathUnitDescription>
        </PathUnitHeader>
        <PathTrail>
          <PathStep>
            <PathNode state="completed">1</PathNode>
            <PathNodeMeta>
              <PathNodeTitle>주장 고르기</PathNodeTitle>
            </PathNodeMeta>
          </PathStep>
          <PathConnector />
          <PathStep>
            <PathNode state="current">2</PathNode>
            <PathNodeMeta>
              <PathNodeTitle>근거 붙이기</PathNodeTitle>
              <PathNodeDescription>진행 중</PathNodeDescription>
            </PathNodeMeta>
          </PathStep>
          <PathConnector />
          <PathStep>
            <PathNode state="locked">3</PathNode>
            <PathNodeMeta>
              <PathNodeTitle>자기반박</PathNodeTitle>
            </PathNodeMeta>
          </PathStep>
        </PathTrail>
      </PathUnit>
    </Path>
  )
}`,
      },
      {
        id: "node-states",
        title: "노드 상태",
        description: "locked·available·current·completed를 구분합니다.",
        code: `<PathNode state="locked">3</PathNode>
<PathNode state="available">4</PathNode>
<PathNode state="current">5</PathNode>
<PathNode state="completed">✓</PathNode>`,
      },
      {
        id: "as-link",
        title: "링크로 렌더",
        description: "PathNode는 render prop으로 앵커로 바꿀 수 있습니다.",
        code: `<PathNode state="available" render={<a href="/lessons/2" />}>2</PathNode>`,
      },
      {
        id: "multi-unit",
        title: "여러 유닛",
        description: "코스 안에서 PathUnit을 이어 붙입니다.",
        code: `<Path>
  <PathUnit>...</PathUnit>
  <PathUnit>...</PathUnit>
</Path>`,
      },
    ],
    usageNotes: [
      "플레이풀한 캐릭터·폭죽 연출 없이 노드 상태와 여백으로 진행감을 만듭니다.",
      "현재 레슨은 current 하나만 강조합니다.",
    ],
    accessibility: [
      "잠긴 노드는 disabled와 함께 이유를 텍스트로 보완하세요.",
      "PathTrail은 순서 목록(ol)이므로 레슨 순서가 의미적으로 유지됩니다.",
    ],
    props: [
      {
        name: "state",
        type: '"locked" | "available" | "current" | "completed"',
        defaultValue: '"available"',
        description: "레슨 노드의 진행 상태입니다.",
      },
    ],
    related: ["lesson", "progress"],
  },
  lesson: {
    slug: "lesson",
    summary: "레슨 세션 셸입니다. 진행률 헤더, 스텝 본문, 하단 행동, 완료 요약을 감쌉니다.",
    examples: [
      {
        id: "session",
        title: "세션 프레임",
        description: "진행률과 본문, 하단 확인 행동을 한 화면에 둡니다.",
        preview: "default",
        code: `import { Lesson, LessonActions, LessonBody, LessonClose, LessonFooter, LessonHeader, LessonMeta, LessonProgress } from "@/components/learning/lesson"
import { Button } from "@/components/primitives/button"
import { Step, StepTitle } from "@/components/learning/step"

export function LessonSession() {
  return (
    <Lesson>
      <LessonHeader>
        <LessonClose />
        <LessonProgress value={40} />
        <LessonMeta>2 / 5</LessonMeta>
      </LessonHeader>
      <LessonBody>
        <Step><StepTitle>질문을 고르세요</StepTitle></Step>
      </LessonBody>
      <LessonFooter>
        <LessonActions>
          <Button>확인하기</Button>
        </LessonActions>
      </LessonFooter>
    </Lesson>
  )
}`,
      },
      {
        id: "complete",
        title: "완료 화면",
        description: "레슨 요약은 별도 스텝이 아니라 LessonComplete로 보여줍니다.",
        code: `<LessonComplete>
  <LessonCompleteTitle>레슨을 마쳤습니다</LessonCompleteTitle>
  <LessonCompleteDescription>
    주장과 근거를 한 호흡으로 잇는 연습을 완료했습니다.
  </LessonCompleteDescription>
  <Button>다음 레슨</Button>
</LessonComplete>`,
      },
      {
        id: "progress-only",
        title: "진행률",
        description: "스텝 인덱스에 맞춰 Progress value를 갱신합니다.",
        code: `<LessonProgress value={60} label="레슨 진행" />`,
      },
      {
        id: "sticky-footer",
        title: "고정 하단",
        description:
          "LessonFooter는 상단 구분선 없이 sticky로 유지되며, 스크롤해도 행동이 보입니다.",
        code: `<LessonFooter>
  <LessonActions>
    <Button variant="outline">계속하기</Button>
    <Button>확인하기</Button>
  </LessonActions>
</LessonFooter>`,
      },
    ],
    usageNotes: [
      "Lesson은 세션 크롬이고, 활동 콘텐츠는 Step과 도메인 표면이 담당합니다.",
      "완료 요약은 레슨 필드에서 오며 별도 SUMMARY 스텝을 만들지 않습니다.",
      "하단 CTA는 전체 너비의 큰 버튼을 기본으로 두고, 확인·제출 뒤에는 초기화로 다시 연습할 수 있게 합니다.",
    ],
    accessibility: [
      "닫기 버튼에 접근 가능한 이름을 유지하세요.",
      "진행률은 ProgressLabel/Value로 보조 기술에 전달합니다.",
    ],
    props: [
      {
        name: "value",
        type: "number",
        defaultValue: "—",
        description: "LessonProgress의 0–100 진행 값입니다.",
      },
    ],
    related: ["step", "path", "progress", "button"],
  },
  cadence: {
    slug: "cadence",
    summary:
      "최근 학습 리듬을 주간 채움 마크로 보여 줍니다. 스트릭 불꽃 대신 practiced·rest·today·upcoming의 형태·아이콘으로 연속성과 다음 행동을 전달합니다.",
    examples: [
      {
        id: "week-rhythm",
        title: "주간 리듬",
        description:
          "채운 원(학습), 열린 원(휴식), 링(오늘), 윤곽(예정)으로 이번 주 이력을 읽습니다.",
        preview: "default",
        code: `import { Cadence, CadenceDay, CadenceHeader, CadenceHint, CadenceSummary, CadenceTitle, CadenceWeek } from "@/components/learning/cadence"

export function WeekCadence() {
  return (
    <Cadence>
      <CadenceHeader>
        <CadenceTitle>이번 주 리듬</CadenceTitle>
        <CadenceSummary>4일 학습</CadenceSummary>
      </CadenceHeader>
      <CadenceWeek>
        <CadenceDay state="practiced" label="월" />
        <CadenceDay state="practiced" label="화" />
        <CadenceDay state="rest" label="수" />
        <CadenceDay state="practiced" label="목" />
        <CadenceDay state="today" label="금" />
        <CadenceDay state="upcoming" label="토" />
        <CadenceDay state="upcoming" label="일" />
      </CadenceWeek>
      <CadenceHint>오늘은 짧게라도 한 레슨을 마치면 리듬이 이어집니다.</CadenceHint>
    </Cadence>
  )
}`,
      },
      {
        id: "day-states",
        title: "일별 상태",
        description: "체크·마이너스 아이콘과 채움/윤곽/링 형태로 4개 상태를 구분합니다.",
        code: `<CadenceDay state="practiced" label="월" />
<CadenceDay state="rest" label="화" />
<CadenceDay state="today" label="수" />
<CadenceDay state="upcoming" label="목" />`,
      },
      {
        id: "with-rest",
        title: "휴식 날",
        description: "의도적 휴식은 rest로 표시하고, 오늘은 today로 다음 행동을 남깁니다.",
        code: `<Cadence>
  <CadenceHeader>
    <CadenceTitle>최근 7일</CadenceTitle>
    <CadenceSummary>3일 학습 · 1일 휴식</CadenceSummary>
  </CadenceHeader>
  <CadenceWeek>
    <CadenceDay state="practiced" label="월" />
    <CadenceDay state="rest" label="화" />
    <CadenceDay state="practiced" label="수" />
    <CadenceDay state="practiced" label="목" />
    <CadenceDay state="today" label="금" />
    <CadenceDay state="upcoming" label="토" />
    <CadenceDay state="upcoming" label="일" />
  </CadenceWeek>
  <CadenceHint>화요일은 휴식이었습니다. 오늘 세션으로 리듬을 이어 가세요.</CadenceHint>
</Cadence>`,
      },
      {
        id: "home-panel",
        title: "홈 패널",
        description: "홈·프로필처럼 세션 바깥에서 Goal·Mastery와 나란히 둡니다.",
        code: `<div className="flex flex-col gap-6">
  <Cadence>...</Cadence>
  <Goal value={1} target={2} />
</div>`,
      },
    ],
    usageNotes: [
      "연속 일수를 위협으로 쓰지 마세요. 이력과 다음 행동만 남깁니다.",
      "활동 본문보다 앞서지 않게 홈·완료 요약·프로필에 둡니다.",
      "상태는 색만이 아니라 채움·윤곽과 아이콘으로 구분하세요.",
    ],
    accessibility: [
      "각 CadenceDay 마크에 요일과 상태 이름을 aria-label로 전달합니다.",
      "아이콘은 aria-hidden이며 의미는 aria-label이 담당합니다.",
      "요약 숫자는 tabular-nums로 정렬해 읽기 쉽게 합니다.",
    ],
    props: [
      {
        name: "state",
        type: '"practiced" | "rest" | "today" | "upcoming"',
        defaultValue: '"upcoming"',
        description:
          "해당 날짜의 학습 이력 상태입니다. 기본 마크는 상태별 채움·아이콘으로 표현됩니다.",
      },
      {
        name: "label",
        type: "string",
        defaultValue: "—",
        description: "요일 또는 짧은 날짜 레이블입니다.",
      },
    ],
    related: ["goal", "mastery", "lesson", "path"],
  },
  goal: {
    slug: "goal",
    summary:
      "오늘이나 이번 주 학습 목표와 남은 작업량을 보여 줍니다. XP·젬 대신 레슨·분·세션 같은 실제 단위를 씁니다.",
    examples: [
      {
        id: "daily-target",
        title: "오늘 목표",
        description: "남은 레슨 수로 오늘의 목표를 표현합니다.",
        preview: "default",
        code: `import { Goal } from "@/components/learning/goal"

export function DailyGoal() {
  return <Goal value={1} target={2} unit="레슨" />
}`,
      },
      {
        id: "custom-slots",
        title: "슬롯 구성",
        description: "헤더·트랙·힌트를 직접 조합할 수 있습니다.",
        code: `import { Goal, GoalHeader, GoalHint, GoalTitle, GoalTrack, GoalValue } from "@/components/learning/goal"

<Goal value={20} target={30} unit="분">
  <GoalHeader>
    <GoalTitle>이번 주 목표</GoalTitle>
    <GoalValue>20 / 30 분</GoalValue>
  </GoalHeader>
  <GoalTrack value={67} label="주간 목표" />
  <GoalHint>10분 남았습니다.</GoalHint>
</Goal>`,
      },
      {
        id: "complete",
        title: "목표 달성",
        description: "채우면 complete 상태로 조용히 안내합니다.",
        code: `<Goal value={2} target={2} unit="레슨" />`,
      },
      {
        id: "with-cadence",
        title: "리듬과 함께",
        description: "홈에서 Cadence와 나란히 배치합니다.",
        code: `<div className="flex flex-col gap-6">
  <Cadence>...</Cadence>
  <Goal value={0} target={1} />
</div>`,
      },
    ],
    usageNotes: [
      "점수가 아니라 레슨·분·세션처럼 사용자가 이해할 작업 단위를 쓰세요.",
      "가변 보상·젬·재화 카운터로 Goal을 대체하지 마세요.",
    ],
    accessibility: [
      "GoalTrack은 ProgressLabel/Value로 보조 기술에 진행률을 전달합니다.",
      "남은 양은 힌트 텍스트로도 반복해 색만으로 전달하지 않습니다.",
    ],
    props: [
      {
        name: "value",
        type: "number",
        defaultValue: "0",
        description: "현재까지 채운 작업량입니다.",
      },
      {
        name: "target",
        type: "number",
        defaultValue: "1",
        description: "목표 작업량입니다.",
      },
      {
        name: "unit",
        type: "string",
        defaultValue: '"레슨"',
        description: "작업 단위 레이블입니다.",
      },
    ],
    related: ["cadence", "progress", "lesson", "mastery"],
  },
  mastery: {
    slug: "mastery",
    summary:
      "개념 숙련도를 emerging·developing·secure·fluent의 이산 단계로 표현합니다. 레벨 폭죽 대신 다음 연습 초점을 남깁니다.",
    examples: [
      {
        id: "concept-level",
        title: "개념 숙련도",
        description: "한 개념의 현재 단계와 설명을 보여 줍니다.",
        preview: "default",
        code: `import { Mastery, MasteryBadge, MasteryDescription, MasteryHeader, MasteryLabel, MasteryStages } from "@/components/learning/mastery"

export function ConceptMastery() {
  return (
    <Mastery level="developing">
      <MasteryHeader>
        <MasteryLabel>주장과 근거</MasteryLabel>
        <MasteryBadge level="developing" />
      </MasteryHeader>
      <MasteryStages level="developing" />
      <MasteryDescription>근거를 스스로 고르는 연습을 이어 가세요.</MasteryDescription>
    </Mastery>
  )
}`,
      },
      {
        id: "all-levels",
        title: "단계 목록",
        description: "네 단계를 나란히 비교합니다.",
        code: `;(["emerging", "developing", "secure", "fluent"] as const).map((level) => (
  <Mastery key={level} level={level}>
    <MasteryHeader>
      <MasteryLabel>{level}</MasteryLabel>
      <MasteryBadge level={level} />
    </MasteryHeader>
    <MasteryStages level={level} />
  </Mastery>
))`,
      },
      {
        id: "after-lesson",
        title: "레슨 후 요약",
        description: "완료 화면에서 숙련도 변화를 짧게 알립니다.",
        code: `<LessonComplete>
  <LessonCompleteTitle>레슨을 마쳤습니다</LessonCompleteTitle>
  <Mastery level="secure">
    <MasteryHeader>
      <MasteryLabel>자기반박</MasteryLabel>
      <MasteryBadge level="secure" />
    </MasteryHeader>
    <MasteryStages level="secure" />
  </Mastery>
</LessonComplete>`,
      },
      {
        id: "path-aside",
        title: "경로 보조",
        description: "Path 옆에서 현재 유닛의 숙련도를 보조 정보로 둡니다.",
        code: `<aside className="flex flex-col gap-4">
  <Mastery level="emerging">...</Mastery>
</aside>`,
      },
    ],
    usageNotes: [
      "단계를 색만으로 구분하지 말고 배지 문구와 단계 막대를 함께 쓰세요.",
      "점수·왕관·레벨업 연출로 Mastery를 대체하지 마세요.",
    ],
    accessibility: [
      "MasteryStages는 role=img와 현재 단계 라벨을 aria-label로 제공합니다.",
      "MasteryBadge 텍스트가 단계 이름을 보조합니다.",
    ],
    props: [
      {
        name: "level",
        type: '"emerging" | "developing" | "secure" | "fluent"',
        defaultValue: '"emerging"',
        description: "개념의 현재 숙련 단계입니다.",
      },
    ],
    related: ["path", "lesson", "goal", "milestone"],
  },
  milestone: {
    slug: "milestone",
    summary:
      "희소한 학습 이정표를 날짜와 맥락과 함께 기록합니다. 배지 수집 벽이 아니라 의미 있는 완료만 남깁니다.",
    examples: [
      {
        id: "reached-list",
        title: "이정표 목록",
        description: "도달한 이정표와 다가올 이정표를 함께 둡니다.",
        preview: "default",
        code: `import { Milestone, MilestoneBody, MilestoneList, MilestoneMark, MilestoneMeta, MilestoneTitle } from "@/components/learning/milestone"

export function MilestoneTimeline() {
  return (
    <MilestoneList>
      <Milestone state="reached">
        <MilestoneMark state="reached">1</MilestoneMark>
        <MilestoneBody>
          <MilestoneTitle>첫 레슨 완료</MilestoneTitle>
          <MilestoneMeta>3월 2일 · 주장 고르기</MilestoneMeta>
        </MilestoneBody>
      </Milestone>
      <Milestone state="reached">
        <MilestoneMark state="reached">2</MilestoneMark>
        <MilestoneBody>
          <MilestoneTitle>유닛 1 완료</MilestoneTitle>
          <MilestoneMeta>3월 12일 · 주장 세우기</MilestoneMeta>
        </MilestoneBody>
      </Milestone>
      <Milestone state="upcoming">
        <MilestoneMark state="upcoming">3</MilestoneMark>
        <MilestoneBody>
          <MilestoneTitle>첫 쓰기 제출</MilestoneTitle>
          <MilestoneMeta>다가오는 이정표</MilestoneMeta>
        </MilestoneBody>
      </Milestone>
    </MilestoneList>
  )
}`,
      },
      {
        id: "states",
        title: "상태",
        description: "reached·upcoming·locked를 구분합니다.",
        code: `<Milestone state="reached">...</Milestone>
<Milestone state="upcoming">...</Milestone>
<Milestone state="locked">...</Milestone>`,
      },
      {
        id: "with-description",
        title: "설명 포함",
        description: "이정표의 의미를 한 문장으로 보완합니다.",
        code: `<Milestone state="reached">
  <MilestoneMark>12</MilestoneMark>
  <MilestoneBody>
    <MilestoneTitle>연속 학습 2주</MilestoneTitle>
    <MilestoneMeta>3월 20일</MilestoneMeta>
    <MilestoneDescription>리듬을 유지한 기간을 기록합니다. 연속 일수 자체보다 복귀 경로가 중요합니다.</MilestoneDescription>
  </MilestoneBody>
</Milestone>`,
      },
      {
        id: "sparse",
        title: "희소하게",
        description: "경로 진행을 대체하지 않도록 소수만 노출합니다.",
        code: `{/* 배지 그리드 대신 3–5개의 이정표만 유지 */}
<MilestoneList>...</MilestoneList>`,
      },
    ],
    usageNotes: [
      "배지 벽·수집형 achievement grid로 쓰지 마세요.",
      "경로 상태와 다음 할 일을 이정표 목록이 가리지 않게 합니다.",
    ],
    accessibility: [
      "MilestoneList는 순서 목록(ol)으로 이정표 순서를 보존합니다.",
      "잠긴 이정표는 locked 상태와 텍스트로 이유를 보완하세요.",
    ],
    props: [
      {
        name: "state",
        type: '"reached" | "upcoming" | "locked"',
        defaultValue: '"reached"',
        description: "이정표의 도달 상태입니다.",
      },
    ],
    related: ["path", "cadence", "mastery", "lesson"],
  },
  standing: {
    slug: "standing",
    summary:
      "코호트 안에서의 상대 위치를 조용히 보여 줍니다. 주간 리그·승급 연출 없이 완료한 작업량으로 읽히게 합니다.",
    examples: [
      {
        id: "cohort",
        title: "코호트 순위",
        description: "나와 인접한 학습자의 완료량을 비교합니다.",
        preview: "default",
        code: `import { Standing, StandingHeader, StandingHint, StandingList, StandingMeta, StandingMetric, StandingName, StandingRow, StandingTitle } from "@/components/learning/standing"

export function CohortStanding() {
  return (
    <Standing>
      <StandingHeader>
        <StandingTitle>이번 주 코호트</StandingTitle>
        <StandingMeta>24명</StandingMeta>
      </StandingHeader>
      <StandingList>
        <StandingRow rank={2}>
          <StandingName>김서연</StandingName>
          <StandingMetric>레슨 7</StandingMetric>
        </StandingRow>
        <StandingRow rank={3} you>
          <StandingName>나</StandingName>
          <StandingMetric>레슨 5</StandingMetric>
        </StandingRow>
        <StandingRow rank={4}>
          <StandingName>이준호</StandingName>
          <StandingMetric>레슨 4</StandingMetric>
        </StandingRow>
      </StandingList>
      <StandingHint>순위보다 이번 주 완료한 레슨 수를 기준으로 읽습니다.</StandingHint>
    </Standing>
  )
}`,
      },
      {
        id: "you-row",
        title: "내 위치",
        description: "you 행은 현재 사용자를 표시합니다.",
        code: `<StandingRow rank={3} you>
  <StandingName>나</StandingName>
  <StandingMetric>레슨 5</StandingMetric>
</StandingRow>`,
      },
      {
        id: "empty-adjacent",
        title: "소수 코호트",
        description: "한 명만 있어도 목록 구조는 유지합니다.",
        code: `<StandingList>
  <StandingRow rank={1} you>
    <StandingName>나</StandingName>
    <StandingMetric>레슨 1</StandingMetric>
  </StandingRow>
</StandingList>`,
      },
      {
        id: "non-competitive",
        title: "비경쟁 문구",
        description: "조롱·처벌을 암시하지 않는 힌트를 둡니다.",
        code: `<StandingHint>비슷한 속도의 학습자와 함께 보는 참고 위치입니다.</StandingHint>`,
      },
    ],
    usageNotes: [
      "왕관·승급·강등 연출을 붙이지 마세요.",
      "지표는 XP가 아니라 완료한 레슨·세션처럼 읽히게 합니다.",
    ],
    accessibility: [
      "you 행에는 aria-current를 설정합니다.",
      "순위와 지표는 tabular-nums로 정렬합니다.",
    ],
    props: [
      {
        name: "rank",
        type: "number",
        defaultValue: "—",
        description: "StandingRow의 순위 번호입니다.",
      },
      {
        name: "you",
        type: "boolean",
        defaultValue: "false",
        description: "현재 사용자 행 여부입니다.",
      },
    ],
    related: ["goal", "cadence", "path", "milestone"],
  },
  "learning-profile": {
    slug: "learning-profile",
    summary:
      "학습 목적, 현재 수준, 관심 장르, 주당 학습 시간과 피드백 선호를 수집합니다. 온보딩과 프로필 설정에서 개인화의 출발점으로 씁니다.",
    examples: [
      {
        id: "onboarding",
        title: "온보딩 수집",
        description: "학습 목표 설정 화면에서 목적·수준·시간을 고릅니다.",
        preview: "default",
        code: `import {
  LearningProfile,
  LearningProfileDescription,
  LearningProfileFooter,
  LearningProfileHeader,
  LearningProfileOption,
  LearningProfileOptions,
  LearningProfileSection,
  LearningProfileSectionHint,
  LearningProfileSectionLabel,
  LearningProfileTitle,
} from "@/components/learning/learning-profile"
import { Button } from "@/components/primitives/button"

export function OnboardingProfile() {
  return (
    <LearningProfile>
      <LearningProfileHeader>
        <LearningProfileTitle>학습 목표를 정해 볼까요</LearningProfileTitle>
        <LearningProfileDescription>
          목적과 수준을 알면 첫 레슨과 복습 강도를 맞출 수 있습니다.
        </LearningProfileDescription>
      </LearningProfileHeader>
      <LearningProfileSection>
        <LearningProfileSectionLabel>학습 목적</LearningProfileSectionLabel>
        <LearningProfileOptions mode="single">
          <LearningProfileOption mode="single" selected>논증 글쓰기</LearningProfileOption>
          <LearningProfileOption mode="single">학술 에세이</LearningProfileOption>
          <LearningProfileOption mode="single">설득 카피</LearningProfileOption>
        </LearningProfileOptions>
      </LearningProfileSection>
      <LearningProfileSection>
        <LearningProfileSectionLabel>현재 수준</LearningProfileSectionLabel>
        <LearningProfileSectionHint>자가 진단입니다. 언제든 바꿀 수 있습니다.</LearningProfileSectionHint>
        <LearningProfileOptions mode="single">
          <LearningProfileOption mode="single">입문</LearningProfileOption>
          <LearningProfileOption mode="single" selected>중급</LearningProfileOption>
          <LearningProfileOption mode="single">숙련</LearningProfileOption>
        </LearningProfileOptions>
      </LearningProfileSection>
      <LearningProfileFooter>
        <Button>다음</Button>
      </LearningProfileFooter>
    </LearningProfile>
  )
}`,
      },
      {
        id: "genres-time",
        title: "장르·시간",
        description: "관심 장르는 다중, 주당 시간은 단일로 고릅니다.",
        code: `<LearningProfileSection>
  <LearningProfileSectionLabel>관심 장르</LearningProfileSectionLabel>
  <LearningProfileOptions mode="multiple">
    <LearningProfileOption mode="multiple" selected>논설문</LearningProfileOption>
    <LearningProfileOption mode="multiple" selected>리뷰</LearningProfileOption>
    <LearningProfileOption mode="multiple">제안서</LearningProfileOption>
  </LearningProfileOptions>
</LearningProfileSection>
<LearningProfileSection>
  <LearningProfileSectionLabel>주당 학습 시간</LearningProfileSectionLabel>
  <LearningProfileOptions mode="single">
    <LearningProfileOption mode="single">1–2시간</LearningProfileOption>
    <LearningProfileOption mode="single" selected>3–4시간</LearningProfileOption>
    <LearningProfileOption mode="single">5시간 이상</LearningProfileOption>
  </LearningProfileOptions>
</LearningProfileSection>`,
      },
      {
        id: "feedback-preference",
        title: "피드백 선호",
        description: "코칭 톤과 상세도를 선호로 저장합니다.",
        code: `<LearningProfileSection>
  <LearningProfileSectionLabel>피드백 선호</LearningProfileSectionLabel>
  <LearningProfileOptions mode="single">
    <LearningProfileOption mode="single" selected>짧은 초점 위주</LearningProfileOption>
    <LearningProfileOption mode="single">근거와 예시 포함</LearningProfileOption>
    <LearningProfileOption mode="single">질문형 가이드</LearningProfileOption>
  </LearningProfileOptions>
</LearningProfileSection>`,
      },
      {
        id: "settings-summary",
        title: "설정 요약",
        description: "프로필 설정에서는 읽기 전용 요약으로도 보여 줍니다.",
        code: `import {
  LearningProfile,
  LearningProfileHeader,
  LearningProfileSummary,
  LearningProfileSummaryRow,
  LearningProfileSummaryTerm,
  LearningProfileSummaryValue,
  LearningProfileTitle,
} from "@/components/learning/learning-profile"

<LearningProfile>
  <LearningProfileHeader>
    <LearningProfileTitle>학습 설정</LearningProfileTitle>
  </LearningProfileHeader>
  <LearningProfileSummary>
    <LearningProfileSummaryRow>
      <LearningProfileSummaryTerm>목적</LearningProfileSummaryTerm>
      <LearningProfileSummaryValue>논증 글쓰기</LearningProfileSummaryValue>
    </LearningProfileSummaryRow>
    <LearningProfileSummaryRow>
      <LearningProfileSummaryTerm>수준</LearningProfileSummaryTerm>
      <LearningProfileSummaryValue>중급</LearningProfileSummaryValue>
    </LearningProfileSummaryRow>
    <LearningProfileSummaryRow>
      <LearningProfileSummaryTerm>주당 시간</LearningProfileSummaryTerm>
      <LearningProfileSummaryValue>3–4시간</LearningProfileSummaryValue>
    </LearningProfileSummaryRow>
  </LearningProfileSummary>
</LearningProfile>`,
      },
    ],
    usageNotes: [
      "Goal의 일일 목표와 섞지 마세요. 장기 선호·출발 조건만 다룹니다.",
      "긴 심리 검사나 강제 레벨 테스트로 확장하지 마세요.",
    ],
    accessibility: [
      "단일 선택은 radiogroup/radio, 다중은 group/checkbox 역할을 사용합니다.",
      "섹션은 fieldset과 legend로 묶어 보조 기술이 질문 단위를 읽게 합니다.",
    ],
    props: [
      {
        name: "mode",
        type: '"single" | "multiple"',
        defaultValue: '"single"',
        description: "LearningProfileOptions와 Option의 선택 방식입니다.",
      },
      {
        name: "selected",
        type: "boolean",
        defaultValue: "false",
        description: "LearningProfileOption의 선택 상태입니다.",
      },
    ],
    related: ["next-action", "goal", "course-overview", "path"],
  },
  "next-action": {
    slug: "next-action",
    summary:
      "다음에 이어갈 활동 하나와 추천 이유, 예상 시간을 제시합니다. 홈·레슨 완료·재방문에서 Primary 행동을 하나로 좁힙니다.",
    examples: [
      {
        id: "home-continue",
        title: "이어서 학습",
        description: "홈에서 중단한 레슨을 이어가도록 안내합니다.",
        preview: "default",
        code: `import {
  NextAction,
  NextActionActions,
  NextActionBody,
  NextActionEyebrow,
  NextActionMeta,
  NextActionReason,
  NextActionTitle,
} from "@/components/learning/next-action"
import { Button } from "@/components/primitives/button"

export function HomeNextAction() {
  return (
    <NextAction>
      <NextActionEyebrow>이어서 학습</NextActionEyebrow>
      <NextActionBody>
        <NextActionTitle>논증 입문 2레슨 이어하기</NextActionTitle>
        <NextActionReason>
          어제 주장 고르기까지 마쳤습니다. 근거 연결 연습을 이어서 하면 흐름이 유지됩니다.
        </NextActionReason>
        <NextActionMeta>약 12분</NextActionMeta>
      </NextActionBody>
      <NextActionActions>
        <Button>이어하기</Button>
      </NextActionActions>
    </NextAction>
  )
}`,
      },
      {
        id: "after-lesson",
        title: "레슨 완료 후",
        description: "완료 화면에서 다음 활동을 하나만 남깁니다.",
        code: `<NextAction>
  <NextActionEyebrow>다음 활동</NextActionEyebrow>
  <NextActionBody>
    <NextActionTitle>자기반박 연습</NextActionTitle>
    <NextActionReason>방금 배운 반박 구조를 바로 적용해 보세요.</NextActionReason>
    <NextActionMeta>약 8분</NextActionMeta>
  </NextActionBody>
  <NextActionActions>
    <Button>시작하기</Button>
  </NextActionActions>
</NextAction>`,
      },
      {
        id: "return-visit",
        title: "재방문",
        description: "오랜만에 돌아온 학습자에게 복귀 경로를 제시합니다.",
        code: `<NextAction>
  <NextActionEyebrow>다시 시작</NextActionEyebrow>
  <NextActionBody>
    <NextActionTitle>짧은 복습: 근거 고르기</NextActionTitle>
    <NextActionReason>5일 만에 방문했습니다. 짧은 복습으로 맥락을 되살리는 것을 권합니다.</NextActionReason>
    <NextActionMeta>약 5분</NextActionMeta>
  </NextActionBody>
</NextAction>`,
      },
      {
        id: "with-secondary",
        title: "보조 행동",
        description: "Primary는 하나이고 다른 경로는 Secondary로 둡니다.",
        code: `<NextActionActions>
  <Button>이어하기</Button>
  <Button variant="ghost">다른 코스 보기</Button>
</NextActionActions>`,
      },
    ],
    usageNotes: [
      "추천 카드 더미나 피드로 쓰지 마세요. 한 화면의 Primary 행동은 하나입니다.",
      "Goal·Path와 함께 둘 때는 NextAction이 다음 행동을, Path는 전체 지도를 맡습니다.",
    ],
    accessibility: [
      "NextActionTitle을 해당 영역의 제목으로 사용하세요.",
      "예상 시간은 텍스트와 tabular-nums로 전달하고 아이콘만으로 대체하지 마세요.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "간격이나 너비를 조정할 때 사용합니다.",
      },
    ],
    related: ["goal", "path", "lesson", "learning-profile"],
  },
  "course-overview": {
    slug: "course-overview",
    summary:
      "코스 목표, 대상 수준, 예상 기간, 선수 개념, 글쓰기 장르와 샘플 활동을 보여 줍니다. Path 노드 대신 코스 선택 맥락을 전달합니다.",
    examples: [
      {
        id: "course-detail",
        title: "코스 상세",
        description: "탐색·상세 화면에서 코스의 핵심 정보를 정리합니다.",
        preview: "default",
        code: `import {
  CourseOverview,
  CourseOverviewEyebrow,
  CourseOverviewFact,
  CourseOverviewFacts,
  CourseOverviewGenre,
  CourseOverviewGenres,
  CourseOverviewHeader,
  CourseOverviewItem,
  CourseOverviewLead,
  CourseOverviewList,
  CourseOverviewSample,
  CourseOverviewSampleLabel,
  CourseOverviewSamples,
  CourseOverviewSection,
  CourseOverviewSectionTitle,
  CourseOverviewTitle,
} from "@/components/learning/course-overview"

export function ArgumentCourse() {
  return (
    <CourseOverview>
      <CourseOverviewHeader>
        <CourseOverviewEyebrow>추천 코스</CourseOverviewEyebrow>
        <CourseOverviewTitle>논증 입문</CourseOverviewTitle>
        <CourseOverviewLead>
          주장과 근거를 한 문단 안에서 연결하는 기본기를 익힙니다.
        </CourseOverviewLead>
        <CourseOverviewFacts>
          <CourseOverviewFact>대상: 입문–중급</CourseOverviewFact>
          <CourseOverviewFact>예상 3주</CourseOverviewFact>
          <CourseOverviewFact>주 2–3레슨</CourseOverviewFact>
        </CourseOverviewFacts>
      </CourseOverviewHeader>
      <CourseOverviewSection>
        <CourseOverviewSectionTitle>선수 개념</CourseOverviewSectionTitle>
        <CourseOverviewList>
          <CourseOverviewItem>문장과 단락의 역할 구분</CourseOverviewItem>
          <CourseOverviewItem>사실과 의견 구분</CourseOverviewItem>
        </CourseOverviewList>
      </CourseOverviewSection>
      <CourseOverviewSection>
        <CourseOverviewSectionTitle>배울 장르</CourseOverviewSectionTitle>
        <CourseOverviewGenres>
          <CourseOverviewGenre>짧은 논설문</CourseOverviewGenre>
          <CourseOverviewGenre>의견문</CourseOverviewGenre>
        </CourseOverviewGenres>
      </CourseOverviewSection>
      <CourseOverviewSection>
        <CourseOverviewSectionTitle>샘플 활동</CourseOverviewSectionTitle>
        <CourseOverviewSamples>
          <CourseOverviewSample>
            <CourseOverviewSampleLabel>객관식</CourseOverviewSampleLabel>
            주장을 가장 잘 뒷받침하는 근거 고르기
          </CourseOverviewSample>
          <CourseOverviewSample>
            <CourseOverviewSampleLabel>쓰기</CourseOverviewSampleLabel>
            근거와 주장을 한 문단으로 연결하기
          </CourseOverviewSample>
        </CourseOverviewSamples>
      </CourseOverviewSection>
    </CourseOverview>
  )
}`,
      },
      {
        id: "facts-only",
        title: "요약 메타",
        description: "추천 목록에서는 제목과 사실만 짧게 둡니다.",
        code: `<CourseOverviewHeader>
  <CourseOverviewTitle>설득 카피 기초</CourseOverviewTitle>
  <CourseOverviewFacts>
    <CourseOverviewFact>중급</CourseOverviewFact>
    <CourseOverviewFact>2주</CourseOverviewFact>
  </CourseOverviewFacts>
</CourseOverviewHeader>`,
      },
      {
        id: "admin-preview",
        title: "관리자 미리보기",
        description: "게시 전 미리보기에서도 같은 API로 맥락을 확인합니다.",
        code: `<CourseOverview>
  <CourseOverviewHeader>
    <CourseOverviewEyebrow>초안 미리보기</CourseOverviewEyebrow>
    <CourseOverviewTitle>학술 문단 구성</CourseOverviewTitle>
    <CourseOverviewLead>주제문과 뒷받침 문장의 관계를 연습합니다.</CourseOverviewLead>
  </CourseOverviewHeader>
</CourseOverview>`,
      },
      {
        id: "with-path",
        title: "Path와 구분",
        description: "상세에서는 overview로 맥락을, Path로 레슨 순서를 둡니다.",
        code: `<div className="flex flex-col gap-10">
  <CourseOverview>...</CourseOverview>
  <Path>...</Path>
</div>`,
      },
    ],
    usageNotes: [
      "Path 노드 목록을 복제하지 마세요. 선택·미리보기 맥락만 제공합니다.",
      "마케팅 히어로나 통계 카드로 확장하지 마세요.",
    ],
    accessibility: [
      "CourseOverviewTitle을 페이지 또는 영역의 주 제목으로 사용하세요.",
      "사실·장르 목록은 리스트 의미로 전달되어 순서를 보존합니다.",
    ],
    props: [
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "간격이나 너비를 조정할 때 사용합니다.",
      },
    ],
    related: ["path", "lesson", "learning-profile"],
  },
};
