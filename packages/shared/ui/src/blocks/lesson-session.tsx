"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { ErrorCorrectAnswer } from "#ui/components/learning/error-correct-answer"
import { ParagraphOrganizeAnswer } from "#ui/components/learning/paragraph-organize-answer"
import { SentenceBuildAnswer } from "#ui/components/learning/sentence-build-answer"
import { TranscribeAnswer } from "#ui/components/learning/transcribe-answer"
import { TrueFalseAnswer } from "#ui/components/learning/true-false-answer"
import { Button } from "#ui/components/primitives/button"
import {
  Choice,
  ChoiceContent,
  ChoiceGroup,
  ChoiceLabel,
  type ChoiceState,
} from "#ui/components/learning/choice"
import {
  Classify,
  ClassifyCategories,
  ClassifyCategory,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyItemTag,
  ClassifyPool,
  type ClassifyState,
} from "#ui/components/learning/classify"
import {
  Compare,
  ComparePanel,
  CompareVersion,
  CompareVersionList,
  CompareVersions,
} from "#ui/components/learning/compare"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightTitle,
} from "#ui/components/learning/insight"
import {
  Lesson,
  LessonActions,
  LessonBody,
  LessonClose,
  LessonComplete,
  LessonCompleteDescription,
  LessonCompleteTitle,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
} from "#ui/components/learning/lesson"
import {
  PairBoard,
  PairColumn,
  PairConnections,
  PairItem,
  PairLabel,
  PairMarker,
  type PairState,
} from "#ui/components/learning/pair"
import { Prose, ProseBody } from "#ui/components/learning/prose"
import {
  Segment,
  SegmentGroup,
  type SegmentState,
} from "#ui/components/learning/segment"
import {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableItem,
  type SortableState,
} from "#ui/components/learning/sortable"
import {
  Step,
  StepBody,
  StepHeader,
  StepTitle,
} from "#ui/components/learning/step"
import {
  Token,
  TokenBank,
  TokenSentence,
  TokenSlot,
} from "#ui/components/learning/token"

type StepType =
  | "READING"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SELECT"
  | "ORDER"
  | "MATCH"
  | "CATEGORIZE"
  | "COMPARE"
  | "SENTENCE_BUILD"
  | "TRANSCRIBE"
  | "ERROR_CORRECT"
  | "PARAGRAPH_ORGANIZE"

type GradePhase = "answering" | "checked"

const FLOW: StepType[] = [
  "READING",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "MATCH",
  "CATEGORIZE",
  "COMPARE",
  "SENTENCE_BUILD",
  "TRANSCRIBE",
  "ERROR_CORRECT",
  "PARAGRAPH_ORGANIZE",
]

const TOTAL_STEPS = FLOW.length

const CHOICE_OPTIONS = [
  { id: "a", label: "주장을 먼저 밝히고 근거를 붙인다" },
  { id: "b", label: "감정을 강조해 설득력을 높인다" },
  { id: "c", label: "긴 문장으로 권위를 드러낸다" },
] as const
const CHOICE_ANSWER = "a"

const TOKEN_WORDS = [
  { id: "weak", label: "약한 고리" },
  { id: "emotion", label: "감정" },
  { id: "sarcasm", label: "비꼼" },
] as const
const TOKEN_ANSWER = "weak"

const SEGMENTS = [
  { id: "s1", text: "기후 위기는" },
  { id: "s2", text: "개인의 습관만으로" },
  { id: "s3", text: "해결되지 않는다." },
] as const
const SEGMENT_ANSWER = new Set(["s2"])

const ORDER_ITEMS = [
  { id: "claim", label: "주장 제시" },
  { id: "reason", label: "근거 제시" },
  { id: "close", label: "결론" },
] as const
const ORDER_ANSWER = ["claim", "reason", "close"] as const
const ORDER_INITIAL = ["reason", "close", "claim"]

const PAIR_LEFT = [
  { id: "l1", label: "주장" },
  { id: "l2", label: "근거" },
] as const
const PAIR_RIGHT = [
  { id: "r1", label: "무엇을 말하려는가" },
  { id: "r2", label: "왜 믿을 수 있는가" },
] as const
const PAIR_ANSWER: Record<string, string> = { l1: "r1", l2: "r2" }

const CATEGORIES = [
  { id: "claim", label: "주장" },
  { id: "evidence", label: "근거" },
] as const
const CLASSIFY_ITEMS = [
  { id: "i1", label: "학교는 토론을 늘려야 한다", answer: "claim" },
  { id: "i2", label: "참여 학생이 늘었다는 조사", answer: "evidence" },
  { id: "i3", label: "숙제 없는 날이 필요하다", answer: "claim" },
] as const

const TRUE_FALSE_STATEMENT =
  "설득문에서 근거는 주장을 반복하는 문장으로 충분하다."
const TRUE_FALSE_ANSWER = false

const SENTENCE_TILES = [
  { id: "t1", text: "주장은" },
  { id: "t2", text: "한 문장으로" },
  { id: "t3", text: "분명해야" },
  { id: "t4", text: "한다" },
  { id: "t5", text: "여러 문장으로" },
] as const
const SENTENCE_ANSWER = ["t1", "t2", "t3", "t4"] as const

const TRANSCRIBE_SOURCE = "근거는 주장을 반복하지 않고 사실과 사례를 제시한다."

const ERROR_SEGMENTS = [
  { id: "e1", text: "좋은 근거는" },
  { id: "e2", text: "주장을 되풀이하며" },
  { id: "e3", text: "독자를 설득한다." },
] as const
const ERROR_CORRECT_SEGMENT = "e2"
const ERROR_FIXES = [
  { id: "f1", text: "주장을 되풀이하며" },
  { id: "f2", text: "사실과 사례로" },
  { id: "f3", text: "감정을 강조하며" },
] as const
const ERROR_CORRECT_FIX = "f2"

const PARAGRAPH_CARDS = [
  { id: "p1", text: "학교는 토론 수업을 늘려야 한다." },
  {
    id: "p2",
    text: "토론에 참여한 학생이 발표 자신감이 높아졌다는 조사가 있다.",
  },
  { id: "p3", text: "따라서 토론은 설득력 훈련에 도움이 된다." },
  { id: "p4", text: "급식 메뉴는 매주 바뀌는 편이 좋다." },
] as const
const PARAGRAPH_ANSWER = ["p1", "p2", "p3"] as const

type SessionChromeProps = {
  stepIndex: number
  total?: number
  children: React.ReactNode
  primaryLabel: string
  primaryDisabled?: boolean
  onPrimary: () => void
  onClose?: () => void
  showReset?: boolean
  onReset?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

function SessionChrome({
  stepIndex,
  total = TOTAL_STEPS,
  children,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onClose,
  showReset,
  onReset,
  secondaryLabel,
  onSecondary,
}: SessionChromeProps) {
  const progress = Math.round((stepIndex / total) * 100)

  return (
    <Lesson className="min-h-0 w-full flex-1 px-4 pt-4 sm:px-6">
      <LessonHeader>
        <LessonClose onClick={onClose} />
        <LessonProgress value={progress} label="레슨 진행" />
        <LessonMeta>
          {stepIndex} / {total}
        </LessonMeta>
      </LessonHeader>
      <LessonBody className="gap-6">{children}</LessonBody>
      <LessonFooter>
        <LessonActions>
          {showReset && onReset ? (
            <Button type="button" variant="outline" onClick={onReset}>
              초기화
            </Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button type="button" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </LessonActions>
      </LessonFooter>
    </Lesson>
  )
}

function ReadingStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [acked, setAcked] = React.useState(false)

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={acked ? "다음으로" : "확인"}
      onPrimary={() => (acked ? onComplete() : setAcked(true))}
      showReset={acked}
      onReset={() => setAcked(false)}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[READING] 주장과 근거의 거리</StepTitle>
        </StepHeader>
        <StepBody>
          <Prose>
            <ProseBody>
              <p>
                설득문에서 주장은 독자가 붙잡을 수 있는 한 문장이어야 합니다.
                근거는 그 문장을 믿게 만드는 재료입니다. 둘이 멀어지면 글은 길게
                쓰여도 설득력이 약해집니다.
              </p>
              <p>
                좋은 근거는 주장을 반복하지 않고, 독자가 “왜?”라고 물을 자리에
                사실·사례·원리를 둡니다.
              </p>
            </ProseBody>
          </Prose>
          {acked ? (
            <Insight tone="think">
              <InsightEyebrow>생각해보기</InsightEyebrow>
              <InsightDescription>
                다음 활동부터는 주장·근거를 고르고, 연결하고, 짧은 글로 써
                봅니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function ChoiceStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const correct = selected === CHOICE_ANSWER

  const stateFor = (id: string): ChoiceState => {
    if (phase === "answering") return selected === id ? "selected" : "idle"
    if (selected === id) return id === CHOICE_ANSWER ? "correct" : "incorrect"
    if (id === CHOICE_ANSWER) return "missed"
    return "locked"
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && !selected}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          setSelected(null)
          setPhase("answering")
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setSelected(null)
        setPhase("answering")
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[MULTIPLE_CHOICE] 설득문의 기본 구조를 고르세요</StepTitle>
        </StepHeader>
        <StepBody>
          <ChoiceGroup type="single">
            {CHOICE_OPTIONS.map((option) => (
              <Choice
                key={option.id}
                mode="single"
                selected={selected === option.id}
                state={stateFor(option.id)}
                onClick={() => phase === "answering" && setSelected(option.id)}
              >
                <ChoiceContent>
                  <ChoiceLabel>{option.label}</ChoiceLabel>
                </ChoiceContent>
              </Choice>
            ))}
          </ChoiceGroup>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightEyebrow>해설</InsightEyebrow>
              <InsightTitle>
                {correct ? "정답입니다" : "다시 살펴보세요"}
              </InsightTitle>
              <InsightDescription>
                설득문은 주장을 먼저 두고 근거로 뒷받침할 때 읽기 쉬워집니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function TokenStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [slot, setSlot] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const correct = phase !== "answering" && slot === TOKEN_ANSWER

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && !slot}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          setSlot(null)
          setPhase("answering")
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setSlot(null)
        setPhase("answering")
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[FILL_BLANK] 빈칸을 채워보세요</StepTitle>
        </StepHeader>
        <StepBody>
          <TokenSentence>
            좋은 반박은
            <TokenSlot
              state={
                phase === "answering"
                  ? slot
                    ? "filled"
                    : "empty"
                  : correct
                    ? "correct"
                    : "incorrect"
              }
              onClick={() => phase === "answering" && setSlot(null)}
            >
              {slot
                ? TOKEN_WORDS.find((word) => word.id === slot)?.label
                : "빈칸"}
            </TokenSlot>
            을 먼저 드러낸다.
          </TokenSentence>
          <TokenBank>
            {TOKEN_WORDS.map((word) => (
              <Token
                key={word.id}
                state={
                  phase !== "answering"
                    ? "locked"
                    : slot === word.id
                      ? "used"
                      : "idle"
                }
                onClick={() =>
                  phase === "answering" && !slot && setSlot(word.id)
                }
              >
                {word.label}
              </Token>
            ))}
          </TokenBank>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightTitle>
                {correct ? "정답입니다" : "다시 채워보세요"}
              </InsightTitle>
              <InsightDescription>
                반박은 상대 주장의 약한 고리를 드러낼 때 설득력이 커집니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function SegmentStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [phase, setPhase] = React.useState<GradePhase>("answering")

  const toggle = (id: string) => {
    if (phase !== "answering") return
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  const correct =
    phase !== "answering" &&
    selected.length === SEGMENT_ANSWER.size &&
    selected.every((id) => SEGMENT_ANSWER.has(id))

  const stateFor = (id: string): SegmentState => {
    if (phase === "answering")
      return selected.includes(id) ? "selected" : "idle"
    const isAnswer = SEGMENT_ANSWER.has(id)
    const isSelected = selected.includes(id)
    if (isAnswer && isSelected) return "correct"
    if (!isAnswer && isSelected) return "incorrect"
    if (isAnswer && !isSelected) return "missed"
    return "locked"
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && selected.length === 0}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          setSelected([])
          setPhase("answering")
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setSelected([])
        setPhase("answering")
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[SELECT] 과장된 전제가 담긴 구간을 고르세요</StepTitle>
        </StepHeader>
        <StepBody>
          <SegmentGroup layout="inline">
            {SEGMENTS.map((segment) => (
              <Segment
                key={segment.id}
                selected={selected.includes(segment.id)}
                state={stateFor(segment.id)}
                onClick={() => toggle(segment.id)}
              >
                {segment.text}
              </Segment>
            ))}
          </SegmentGroup>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightDescription>
                “개인의 습관만으로”가 문제의 범위를 너무 좁히는 전제입니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function OrderStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [order, setOrder] = React.useState<string[]>([...ORDER_INITIAL])
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const correct =
    phase !== "answering" &&
    order.every((id, index) => id === ORDER_ANSWER[index])

  const stateFor = (id: string, index: number): SortableState => {
    if (phase === "answering") return "idle"
    return id === ORDER_ANSWER[index] ? "correct" : "incorrect"
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          setPhase("answering")
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setOrder([...ORDER_INITIAL])
        setPhase("answering")
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[ORDER] 설득문의 순서를 맞춰보세요</StepTitle>
        </StepHeader>
        <StepBody>
          <Sortable
            value={order}
            onValueChange={setOrder}
            getItemLabel={(id) =>
              ORDER_ITEMS.find((item) => item.id === id)?.label ?? String(id)
            }
            disabled={phase !== "answering"}
            aria-label="설득문 순서"
          >
            {order.map((id, index) => {
              const item = ORDER_ITEMS.find((entry) => entry.id === id)
              if (!item) return null
              return (
                <SortableItem key={id} value={id} state={stateFor(id, index)}>
                  <SortableContent>{item.label}</SortableContent>
                  <SortableHandle />
                </SortableItem>
              )
            })}
          </Sortable>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightDescription>
                주장 → 근거 → 결론 순서가 가장 안정적인 기본 골격입니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function MatchStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [active, setActive] = React.useState<string | null>(null)
  const [pairs, setPairs] = React.useState<Record<string, string>>({})
  const [phase, setPhase] = React.useState<GradePhase>("answering")

  const reset = () => {
    setActive(null)
    setPairs({})
    setPhase("answering")
  }

  const pairedRight = new Set(Object.values(pairs))
  const complete = PAIR_LEFT.every((item) => pairs[item.id])
  const correct =
    phase !== "answering" &&
    PAIR_LEFT.every((item) => pairs[item.id] === PAIR_ANSWER[item.id])

  const selectLeft = (id: string) => {
    if (phase !== "answering") return
    if (pairs[id]) {
      const next = { ...pairs }
      delete next[id]
      setPairs(next)
      setActive(null)
      return
    }
    setActive(id)
  }

  const selectRight = (id: string) => {
    if (phase !== "answering" || !active) return
    if (pairedRight.has(id)) return
    setPairs((prev) => ({ ...prev, [active]: id }))
    setActive(null)
  }

  const leftState = (id: string): PairState => {
    if (phase !== "answering") {
      return pairs[id] === PAIR_ANSWER[id] ? "correct" : "incorrect"
    }
    if (active === id) return "active"
    if (pairs[id]) return "paired"
    return "idle"
  }

  const rightState = (id: string): PairState => {
    if (phase !== "answering") {
      const leftId = Object.entries(pairs).find(
        ([, right]) => right === id
      )?.[0]
      if (!leftId) return "locked"
      return PAIR_ANSWER[leftId] === id ? "correct" : "incorrect"
    }
    if (pairedRight.has(id)) return "paired"
    return "idle"
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && !complete}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          reset()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[MATCH] 개념과 설명을 짝 지으세요</StepTitle>
        </StepHeader>
        <StepBody>
          <PairBoard>
            <PairConnections
              connections={Object.entries(pairs).map(([from, to]) => ({
                from,
                to,
                state:
                  phase === "answering"
                    ? "paired"
                    : PAIR_ANSWER[from] === to
                      ? "correct"
                      : "incorrect",
              }))}
              labels={Object.fromEntries(
                [...PAIR_LEFT, ...PAIR_RIGHT].map((item) => [
                  item.id,
                  item.label,
                ])
              )}
            />
            <PairColumn side="left">
              {PAIR_LEFT.map((item) => (
                <PairItem
                  key={item.id}
                  pairId={item.id}
                  state={leftState(item.id)}
                  onClick={() => selectLeft(item.id)}
                >
                  <PairMarker />
                  <PairLabel>{item.label}</PairLabel>
                </PairItem>
              ))}
            </PairColumn>
            <PairColumn side="right">
              {PAIR_RIGHT.map((item) => (
                <PairItem
                  key={item.id}
                  pairId={item.id}
                  state={rightState(item.id)}
                  onClick={() => selectRight(item.id)}
                >
                  <PairMarker />
                  <PairLabel>{item.label}</PairLabel>
                </PairItem>
              ))}
            </PairColumn>
          </PairBoard>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightDescription>
                주장은 “무엇을”, 근거는 “왜”에 답하는 짝입니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function CategorizeStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(
    "claim"
  )
  const [placements, setPlacements] = React.useState<Record<string, string>>({})
  const [phase, setPhase] = React.useState<GradePhase>("answering")

  const reset = () => {
    setActiveCategory("claim")
    setPlacements({})
    setPhase("answering")
  }

  const complete = CLASSIFY_ITEMS.every((item) => placements[item.id])
  const correct =
    phase !== "answering" &&
    CLASSIFY_ITEMS.every((item) => placements[item.id] === item.answer)

  const place = (itemId: string) => {
    if (phase !== "answering" || !activeCategory) return
    setPlacements((prev) => {
      if (prev[itemId] === activeCategory) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: activeCategory }
    })
  }

  const itemState = (itemId: string): ClassifyState => {
    const placed = placements[itemId]
    if (phase === "answering") return placed ? "placed" : "idle"
    const answer = CLASSIFY_ITEMS.find((item) => item.id === itemId)?.answer
    return placed === answer ? "correct" : "incorrect"
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && !complete}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          reset()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[CATEGORIZE] 문장을 알맞은 카테고리에 넣으세요</StepTitle>
        </StepHeader>
        <StepBody>
          <Classify>
            <ClassifyCategories>
              {CATEGORIES.map((category) => (
                <ClassifyCategory
                  key={category.id}
                  state={
                    phase !== "answering"
                      ? "locked"
                      : activeCategory === category.id
                        ? "active"
                        : "idle"
                  }
                  onClick={() =>
                    phase === "answering" && setActiveCategory(category.id)
                  }
                >
                  {category.label}
                </ClassifyCategory>
              ))}
            </ClassifyCategories>
            <ClassifyPool>
              {CLASSIFY_ITEMS.map((item) => {
                const tag = CATEGORIES.find(
                  (category) => category.id === placements[item.id]
                )?.label
                return (
                  <ClassifyItem
                    key={item.id}
                    state={itemState(item.id)}
                    onClick={() => place(item.id)}
                  >
                    <ClassifyItemLabel>{item.label}</ClassifyItemLabel>
                    {tag ? <ClassifyItemTag>{tag}</ClassifyItemTag> : null}
                  </ClassifyItem>
                )
              })}
            </ClassifyPool>
          </Classify>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightDescription>
                주장은 의견을, 근거는 그 의견을 받치는 사실을 담습니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function CompareStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [acked, setAcked] = React.useState(false)

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={acked ? "다음으로" : "확인"}
      onPrimary={() => (acked ? onComplete() : setAcked(true))}
      showReset={acked}
      onReset={() => setAcked(false)}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>[COMPARE] 어느 버전이 더 설득력 있나요?</StepTitle>
        </StepHeader>
        <StepBody>
          <Compare>
            <CompareVersions defaultValue="a">
              <CompareVersionList>
                <CompareVersion value="a">초고</CompareVersion>
                <CompareVersion value="b">다듬은 글</CompareVersion>
              </CompareVersionList>
              <ComparePanel value="a">
                숙제는 많으면 부담스럽고, 없애면 편해질 것 같다. 그래서 숙제는
                줄이는 게 좋다.
              </ComparePanel>
              <ComparePanel value="b">
                숙제를 없애면 학습 부담은 줄지만, 복습의 리듬도 함께 사라질 수
                있다. 양은 줄이되 목적을 분명히 해야 한다.
              </ComparePanel>
            </CompareVersions>
          </Compare>
          {acked ? (
            <Insight tone="think">
              <InsightEyebrow>생각해보기</InsightEyebrow>
              <InsightDescription>
                다듬은 글은 반론을 먼저 인정한 뒤 대안을 제시합니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </SessionChrome>
  )
}

function TrueFalseStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = React.useState<boolean | null>(null)
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const [resetNonce, setResetNonce] = React.useState(0)
  const correct = selected === TRUE_FALSE_ANSWER

  const retry = () => {
    setSelected(null)
    setPhase("answering")
    setResetNonce((value) => value + 1)
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && selected === null}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          retry()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={retry}
      onClose={onClose}
    >
      <Step>
        <TrueFalseAnswer
          key={resetNonce}
          checked={
            phase === "answering" ? false : correct ? "correct" : "wrong"
          }
          correctAnswer={TRUE_FALSE_ANSWER}
          onSelect={setSelected}
          prompt="[TRUE_FALSE] 참인지 거짓인지 판단하세요"
          statement={TRUE_FALSE_STATEMENT}
        />
        {phase !== "answering" ? (
          <Insight tone={correct ? "correct" : "incorrect"}>
            <InsightTitle>
              {correct ? "정답입니다" : "다시 살펴보세요"}
            </InsightTitle>
            <InsightDescription>
              근거는 주장을 반복하는 문장이 아니라 독자가 믿을 재료여야 합니다.
            </InsightDescription>
          </Insight>
        ) : null}
      </Step>
    </SessionChrome>
  )
}

function SentenceBuildStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = React.useState<readonly string[]>([])
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const [resetNonce, setResetNonce] = React.useState(0)
  const correct =
    phase !== "answering" &&
    selected.length === SENTENCE_ANSWER.length &&
    selected.every((id, index) => id === SENTENCE_ANSWER[index])

  const retry = () => {
    setSelected([])
    setPhase("answering")
    setResetNonce((value) => value + 1)
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && selected.length === 0}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          retry()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={retry}
      onClose={onClose}
    >
      <Step>
        <SentenceBuildAnswer
          key={resetNonce}
          checked={
            phase === "answering" ? false : correct ? "correct" : "wrong"
          }
          correctTileIds={[...SENTENCE_ANSWER]}
          explanation="주장을 짧고 분명한 한 문장으로 두는 것이 기본입니다."
          onChange={setSelected}
          prompt="[SENTENCE_BUILD] 타일을 모아 완전한 문장을 만드세요"
          tiles={[...SENTENCE_TILES]}
        />
      </Step>
    </SessionChrome>
  )
}

function TranscribeStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [value, setValue] = React.useState("")
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const [resetNonce, setResetNonce] = React.useState(0)
  const normalized = (text: string) => text.replace(/\s+/g, " ").trim()
  const correct =
    phase !== "answering" && normalized(value) === normalized(TRANSCRIBE_SOURCE)

  const retry = () => {
    setValue("")
    setPhase("answering")
    setResetNonce((value) => value + 1)
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && value.trim() === ""}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          retry()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={retry}
      onClose={onClose}
    >
      <Step>
        <TranscribeAnswer
          key={resetNonce}
          checked={
            phase === "answering" ? false : correct ? "correct" : "wrong"
          }
          explanation="맞춤법·띄어쓰기·문장부호까지 원문과 같아야 합니다."
          onChange={setValue}
          prompt="[TRANSCRIBE] 아래 문장을 그대로 입력하세요"
          sourceText={TRANSCRIBE_SOURCE}
        />
      </Step>
    </SessionChrome>
  )
}

function ErrorCorrectStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [errorSegmentId, setErrorSegmentId] = React.useState<string | null>(
    null
  )
  const [fixId, setFixId] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const [resetNonce, setResetNonce] = React.useState(0)
  const correct =
    phase !== "answering" &&
    errorSegmentId === ERROR_CORRECT_SEGMENT &&
    fixId === ERROR_CORRECT_FIX

  const retry = () => {
    setErrorSegmentId(null)
    setFixId(null)
    setPhase("answering")
    setResetNonce((value) => value + 1)
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={
        phase === "answering" && (errorSegmentId === null || fixId === null)
      }
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          retry()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={retry}
      onClose={onClose}
    >
      <Step>
        <ErrorCorrectAnswer
          key={resetNonce}
          checked={
            phase === "answering" ? false : correct ? "correct" : "wrong"
          }
          correctErrorSegmentId={ERROR_CORRECT_SEGMENT}
          correctFixId={ERROR_CORRECT_FIX}
          fixes={[...ERROR_FIXES]}
          onChange={({ errorSegmentId: nextError, fixId: nextFix }) => {
            setErrorSegmentId(nextError)
            setFixId(nextFix)
          }}
          segments={[...ERROR_SEGMENTS]}
        />
        {phase !== "answering" ? (
          <Insight tone={correct ? "correct" : "incorrect"}>
            <InsightTitle>
              {correct ? "정답입니다" : "다시 고쳐 보세요"}
            </InsightTitle>
            <InsightDescription>
              “주장을 되풀이하며”가 오류이고, “사실과 사례로”가 바른 교정입니다.
            </InsightDescription>
          </Insight>
        ) : null}
      </Step>
    </SessionChrome>
  )
}

function ParagraphOrganizeStep({
  stepIndex,
  onComplete,
  onClose,
}: {
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = React.useState<readonly string[]>([])
  const [phase, setPhase] = React.useState<GradePhase>("answering")
  const [resetNonce, setResetNonce] = React.useState(0)
  const correct =
    phase !== "answering" &&
    selected.length === PARAGRAPH_ANSWER.length &&
    selected.every((id, index) => id === PARAGRAPH_ANSWER[index])

  const retry = () => {
    setSelected([])
    setPhase("answering")
    setResetNonce((value) => value + 1)
  }

  return (
    <SessionChrome
      stepIndex={stepIndex}
      primaryLabel={
        phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"
      }
      primaryDisabled={phase === "answering" && selected.length === 0}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked")
          return
        }
        if (!correct) {
          retry()
          return
        }
        onComplete()
      }}
      showReset={phase !== "answering"}
      onReset={retry}
      onClose={onClose}
    >
      <Step>
        <ParagraphOrganizeAnswer
          key={resetNonce}
          cards={[...PARAGRAPH_CARDS]}
          checked={
            phase === "answering" ? false : correct ? "correct" : "wrong"
          }
          correctCardIds={[...PARAGRAPH_ANSWER]}
          explanation="주제문 → 근거 → 결론 순으로 이어지고, 주제와 무관한 문장은 제외합니다."
          onChange={setSelected}
          prompt="[PARAGRAPH_ORGANIZE] 문단에 넣을 문장을 고르고 순서를 맞추세요"
        />
      </Step>
    </SessionChrome>
  )
}

function LessonFlowStep({
  kind,
  stepIndex,
  onComplete,
  onClose,
}: {
  kind: StepType
  stepIndex: number
  onComplete: () => void
  onClose: () => void
}) {
  switch (kind) {
    case "READING":
      return (
        <ReadingStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "MULTIPLE_CHOICE":
      return (
        <ChoiceStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "TRUE_FALSE":
      return (
        <TrueFalseStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "FILL_BLANK":
      return (
        <TokenStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "SELECT":
      return (
        <SegmentStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "ORDER":
      return (
        <OrderStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "MATCH":
      return (
        <MatchStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "CATEGORIZE":
      return (
        <CategorizeStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "COMPARE":
      return (
        <CompareStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "SENTENCE_BUILD":
      return (
        <SentenceBuildStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "TRANSCRIBE":
      return (
        <TranscribeStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "ERROR_CORRECT":
      return (
        <ErrorCorrectStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
    case "PARAGRAPH_ORGANIZE":
      return (
        <ParagraphOrganizeStep
          stepIndex={stepIndex}
          onComplete={onComplete}
          onClose={onClose}
        />
      )
  }
}

function LessonSession({ className, ...props }: React.ComponentProps<"div">) {
  const [index, setIndex] = React.useState(0)
  const [finished, setFinished] = React.useState(false)
  const [seed, setSeed] = React.useState(0)

  const resetAll = () => {
    setIndex(0)
    setFinished(false)
    setSeed((value) => value + 1)
  }

  const advance = () => {
    if (index >= FLOW.length - 1) {
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setSeed((value) => value + 1)
  }

  const currentStep = FLOW[index]
  if (!currentStep) {
    throw new Error(`레슨 단계 index ${index}에 해당하는 단계가 없습니다.`)
  }

  return (
    <div
      data-slot="lesson-session"
      className={cn("flex min-h-svh w-full flex-col bg-background", className)}
      {...props}
    >
      {finished ? (
        <Lesson className="min-h-0 w-full flex-1 px-4 pt-4 sm:px-6">
          <LessonHeader>
            <LessonClose onClick={resetAll} />
            <LessonProgress value={100} label="레슨 진행" />
            <LessonMeta>
              {TOTAL_STEPS} / {TOTAL_STEPS}
            </LessonMeta>
          </LessonHeader>
          <LessonBody>
            <LessonComplete>
              <LessonCompleteTitle>레슨을 마쳤습니다</LessonCompleteTitle>
              <LessonCompleteDescription>
                읽기부터 문장 조립·받아쓰기·오류 교정·문단 구성까지 열세 가지
                활동을 모두 둘러보았습니다. 다시 시작하면 처음부터 연습할 수
                있습니다.
              </LessonCompleteDescription>
            </LessonComplete>
          </LessonBody>
          <LessonFooter>
            <LessonActions>
              <Button type="button" variant="outline" onClick={resetAll}>
                초기화
              </Button>
              <Button type="button" size="lg" onClick={resetAll}>
                다시 시작
              </Button>
            </LessonActions>
          </LessonFooter>
        </Lesson>
      ) : (
        <LessonFlowStep
          key={`${currentStep}-${seed}`}
          kind={currentStep}
          stepIndex={index + 1}
          onComplete={advance}
          onClose={resetAll}
        />
      )}
    </div>
  )
}

export { LessonSession }
export default LessonSession
