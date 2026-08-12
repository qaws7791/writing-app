"use client";

import { useMemo, useState, type ReactNode } from "react";

import { LEARNING_EXTENDED_PREVIEWS } from "./learning-extended-demos";

import { Button } from "@workspace/ui/components/ui/button";
import {
  Cadence,
  CadenceDay,
  CadenceHeader,
  CadenceHint,
  CadenceSummary,
  CadenceTitle,
  CadenceWeek,
} from "@workspace/ui/components/ui/cadence";
import {
  Choice,
  ChoiceContent,
  ChoiceGroup,
  ChoiceLabel,
  type ChoiceState,
} from "@workspace/ui/components/ui/choice";
import {
  Classify,
  ClassifyCategories,
  ClassifyCategory,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyItemTag,
  ClassifyPool,
  type ClassifyState,
} from "@workspace/ui/components/ui/classify";
import {
  Compare,
  ComparePanel,
  CompareVersion,
  CompareVersionList,
  CompareVersions,
} from "@workspace/ui/components/ui/compare";
import {
  Compose,
  ComposeBadge,
  ComposeClaim,
  ComposeContext,
  ComposeEditor,
  ComposeMeter,
} from "@workspace/ui/components/ui/compose";
import {
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
} from "@workspace/ui/components/ui/course-overview";
import { Goal } from "@workspace/ui/components/ui/goal";
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightTitle,
} from "@workspace/ui/components/ui/insight";
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
} from "@workspace/ui/components/ui/lesson";
import {
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
} from "@workspace/ui/components/ui/learning-profile";
import {
  Mastery,
  MasteryBadge,
  MasteryDescription,
  MasteryHeader,
  MasteryLabel,
  MasteryStages,
} from "@workspace/ui/components/ui/mastery";
import {
  Milestone,
  MilestoneBody,
  MilestoneList,
  MilestoneMark,
  MilestoneMeta,
  MilestoneTitle,
} from "@workspace/ui/components/ui/milestone";
import {
  NextAction,
  NextActionActions,
  NextActionBody,
  NextActionEyebrow,
  NextActionMeta,
  NextActionReason,
  NextActionTitle,
} from "@workspace/ui/components/ui/next-action";
import {
  PairBoard,
  PairColumn,
  PairConnections,
  PairItem,
  PairLabel,
  PairMarker,
  type PairState,
} from "@workspace/ui/components/ui/pair";
import {
  Path,
  PathConnector,
  PathNode,
  PathNodeDescription,
  PathNodeMeta,
  PathNodeTitle,
  PathStep,
  PathTrail,
  PathUnit,
  PathUnitDescription,
  PathUnitHeader,
  PathUnitTitle,
  type PathNodeState,
} from "@workspace/ui/components/ui/path";
import { Prose, ProseBody, ProseSource } from "@workspace/ui/components/ui/prose";
import { Segment, SegmentGroup, type SegmentState } from "@workspace/ui/components/ui/segment";
import {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableIndex,
  SortableItem,
  type SortableState,
} from "@workspace/ui/components/ui/sortable";
import {
  Standing,
  StandingHeader,
  StandingHint,
  StandingList,
  StandingMeta,
  StandingMetric,
  StandingName,
  StandingRow,
  StandingTitle,
} from "@workspace/ui/components/ui/standing";
import { Step, StepBody, StepGuide, StepHeader, StepTitle } from "@workspace/ui/components/ui/step";
import { Token, TokenBank, TokenSentence, TokenSlot } from "@workspace/ui/components/ui/token";

const TOTAL_STEPS = 5;

type Phase = "answering" | "checked" | "done";

function DemoFrame({
  stepIndex,
  total = TOTAL_STEPS,
  children,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onClose,
  onReset,
  showReset,
  secondaryLabel,
  onSecondary,
}: {
  stepIndex: number;
  total?: number;
  children: ReactNode;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onClose?: () => void;
  onReset?: () => void;
  showReset?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const progress = Math.round((stepIndex / total) * 100);

  return (
    <Lesson className="min-h-140 w-full max-w-md rounded-[2rem] border border-border/80 px-4 pt-4 shadow-xs sm:px-5">
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
          <Button type="button" size="lg" disabled={primaryDisabled} onClick={onPrimary}>
            {primaryLabel}
          </Button>
        </LessonActions>
      </LessonFooter>
    </Lesson>
  );
}

function ReadingDemo() {
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => setPhase("answering");

  return (
    <DemoFrame
      stepIndex={1}
      primaryLabel={phase === "answering" ? "확인" : "다음으로"}
      onPrimary={() => setPhase(phase === "answering" ? "done" : "done")}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>주장과 근거의 거리</StepTitle>
          <StepGuide>아래 글을 읽고, 주장이 근거와 얼마나 맞닿아 있는지 살펴보세요.</StepGuide>
        </StepHeader>
        <StepBody>
          <Prose>
            <ProseBody>
              <p>
                설득문에서 주장은 독자가 붙잡을 수 있는 한 문장이어야 합니다. 근거는 그 문장을 믿게
                만드는 재료이며, 둘 사이가 멀수록 글은 흔들립니다.
              </p>
            </ProseBody>
            <ProseSource>출처: 글쓰기 워크북</ProseSource>
          </Prose>
          {phase !== "answering" ? (
            <Insight tone="think">
              <InsightEyebrow>생각해보기</InsightEyebrow>
              <InsightDescription>
                다음 활동에서 주장과 근거를 직접 구분해 보세요.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function CompareDemo() {
  const [phase, setPhase] = useState<Phase>("answering");
  const reset = () => setPhase("answering");

  return (
    <DemoFrame
      stepIndex={2}
      primaryLabel={phase === "answering" ? "확인" : "다음으로"}
      onPrimary={() => setPhase("done")}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>어느 버전이 더 설득력 있나요?</StepTitle>
          <StepGuide>두 버전을 전환하며 어조와 구조의 차이를 비교해 보세요.</StepGuide>
        </StepHeader>
        <StepBody>
          <Compare>
            <CompareVersions defaultValue="a">
              <CompareVersionList>
                <CompareVersion value="a">초고</CompareVersion>
                <CompareVersion value="b">다듬은 글</CompareVersion>
              </CompareVersionList>
              <ComparePanel value="a">
                숙제는 많으면 부담스럽고, 없애면 편해질 것 같다. 그래서 숙제는 줄이는 게 좋다.
              </ComparePanel>
              <ComparePanel value="b">
                숙제를 없애면 학습 부담은 줄지만, 복습의 리듬도 함께 사라질 수 있다. 양은 줄이되
                목적을 분명히 해야 한다.
              </ComparePanel>
            </CompareVersions>
          </Compare>
          {phase !== "answering" ? (
            <Insight tone="think">
              <InsightEyebrow>생각해보기</InsightEyebrow>
              <InsightDescription>
                다듬은 글은 반론을 먼저 인정한 뒤 대안을 제시합니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

const CHOICE_OPTIONS = [
  { id: "a", label: "주장을 먼저 밝히고 근거를 붙인다" },
  { id: "b", label: "감정을 강조해 설득력을 높인다" },
  { id: "c", label: "긴 문장으로 권위를 드러낸다" },
] as const;
const CHOICE_ANSWER = "a";

function ChoiceDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setSelected(null);
    setPhase("answering");
  };

  const stateFor = (id: string): ChoiceState => {
    if (phase === "answering") return selected === id ? "selected" : "idle";
    if (selected === id) return id === CHOICE_ANSWER ? "correct" : "incorrect";
    if (id === CHOICE_ANSWER) return "missed";
    return "locked";
  };

  const correct = selected === CHOICE_ANSWER;

  return (
    <DemoFrame
      stepIndex={2}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !selected}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setSelected(null);
          setPhase("answering");
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>다음 중 설득문의 기본 구조를 가장 잘 담은 문장은?</StepTitle>
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
              <InsightTitle>{correct ? "정답입니다" : "다시 살펴보세요"}</InsightTitle>
              <InsightDescription>
                설득문은 주장을 먼저 두고 근거로 뒷받침할 때 읽기 쉬워집니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

const TOKEN_WORDS = [
  { id: "weak", label: "약한 고리" },
  { id: "emotion", label: "감정" },
  { id: "sarcasm", label: "비꼼" },
] as const;
const TOKEN_ANSWER = ["weak"] as const;

function TokenDemo() {
  const [slots, setSlots] = useState<(string | null)[]>([null]);
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setSlots([null]);
    setPhase("answering");
  };

  const used = new Set(slots.filter(Boolean));
  const filled = slots.every(Boolean);
  const correct =
    phase !== "answering" &&
    slots.length === TOKEN_ANSWER.length &&
    slots.every((id, index) => id === TOKEN_ANSWER[index]);

  const place = (wordId: string) => {
    if (phase !== "answering" || used.has(wordId)) return;
    const next = [...slots];
    const empty = next.findIndex((slot) => slot === null);
    if (empty === -1) return;
    next[empty] = wordId;
    setSlots(next);
  };

  const clearSlot = (index: number) => {
    if (phase !== "answering") return;
    const next = [...slots];
    next[index] = null;
    setSlots(next);
  };

  return (
    <DemoFrame
      stepIndex={3}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !filled}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setSlots([null]);
          setPhase("answering");
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>빈칸을 채워보세요</StepTitle>
          <StepGuide>문장에 가장 알맞은 표현을 고르세요.</StepGuide>
        </StepHeader>
        <StepBody>
          <TokenSentence>
            좋은 반박은
            <TokenSlot
              state={
                phase === "answering"
                  ? slots[0]
                    ? "filled"
                    : "empty"
                  : correct
                    ? "correct"
                    : "incorrect"
              }
              onClick={() => clearSlot(0)}
            >
              {slots[0] ? TOKEN_WORDS.find((word) => word.id === slots[0])?.label : "빈칸"}
            </TokenSlot>
            을 먼저 드러낸다.
          </TokenSentence>
          <TokenBank>
            {TOKEN_WORDS.map((word) => (
              <Token
                key={word.id}
                state={phase !== "answering" ? "locked" : used.has(word.id) ? "used" : "idle"}
                onClick={() => place(word.id)}
              >
                {word.label}
              </Token>
            ))}
          </TokenBank>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightTitle>{correct ? "정답입니다" : "다시 채워보세요"}</InsightTitle>
              <InsightDescription>
                반박은 상대 주장의 약한 고리를 드러낼 때 설득력이 커집니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

const SEGMENTS = [
  { id: "s1", text: "기후 위기는" },
  { id: "s2", text: "개인의 습관만으로" },
  { id: "s3", text: "해결되지 않는다." },
] as const;
const SEGMENT_ANSWER = new Set(["s2"]);

function SegmentDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setSelected([]);
    setPhase("answering");
  };

  const toggle = (id: string) => {
    if (phase !== "answering") return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const correct =
    phase !== "answering" &&
    selected.length === SEGMENT_ANSWER.size &&
    selected.every((id) => SEGMENT_ANSWER.has(id));

  const stateFor = (id: string): SegmentState => {
    if (phase === "answering") return selected.includes(id) ? "selected" : "idle";
    const isAnswer = SEGMENT_ANSWER.has(id);
    const isSelected = selected.includes(id);
    if (isAnswer && isSelected) return "correct";
    if (!isAnswer && isSelected) return "incorrect";
    if (isAnswer && !isSelected) return "missed";
    return "locked";
  };

  return (
    <DemoFrame
      stepIndex={3}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && selected.length === 0}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setSelected([]);
          setPhase("answering");
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>과장된 전제가 담긴 구간을 고르세요</StepTitle>
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
    </DemoFrame>
  );
}

const ORDER_ITEMS = [
  { id: "claim", label: "주장 제시" },
  { id: "reason", label: "근거 제시" },
  { id: "close", label: "결론" },
] as const;
const ORDER_ANSWER = ["claim", "reason", "close"] as const;

function SortableDemo() {
  const [order, setOrder] = useState(["reason", "close", "claim"]);
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setOrder(["reason", "close", "claim"]);
    setPhase("answering");
  };

  const correct = phase !== "answering" && order.every((id, index) => id === ORDER_ANSWER[index]);

  const stateFor = (id: string, index: number): SortableState => {
    if (phase === "answering") return "idle";
    return id === ORDER_ANSWER[index] ? "correct" : "incorrect";
  };

  return (
    <DemoFrame
      stepIndex={4}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setPhase("answering");
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>설득문의 순서를 맞춰보세요</StepTitle>
          <StepGuide>오른쪽 핸들로 항목을 드래그해 재정렬하세요.</StepGuide>
        </StepHeader>
        <StepBody>
          <Sortable
            value={order}
            onValueChange={setOrder}
            getItemLabel={(id) => ORDER_ITEMS.find((item) => item.id === id)?.label ?? String(id)}
            disabled={phase !== "answering"}
            aria-label="설득문 순서"
          >
            {order.map((id, index) => {
              const item = ORDER_ITEMS.find((entry) => entry.id === id)!;
              return (
                <SortableItem key={id} value={id} state={stateFor(id, index)}>
                  <SortableIndex />
                  <SortableContent>{item.label}</SortableContent>
                  <SortableHandle />
                </SortableItem>
              );
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
    </DemoFrame>
  );
}

const PAIR_LEFT = [
  { id: "l1", label: "주장" },
  { id: "l2", label: "근거" },
] as const;
const PAIR_RIGHT = [
  { id: "r1", label: "무엇을 말하려는가" },
  { id: "r2", label: "왜 믿을 수 있는가" },
] as const;
const PAIR_ANSWER: Record<string, string> = { l1: "r1", l2: "r2" };

function PairDemo() {
  const [active, setActive] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setActive(null);
    setPairs({});
    setPhase("answering");
  };

  const pairedRight = new Set(Object.values(pairs));
  const complete = PAIR_LEFT.every((item) => pairs[item.id]);
  const correct =
    phase !== "answering" && PAIR_LEFT.every((item) => pairs[item.id] === PAIR_ANSWER[item.id]);

  const selectLeft = (id: string) => {
    if (phase !== "answering") return;
    if (pairs[id]) {
      const next = { ...pairs };
      delete next[id];
      setPairs(next);
      setActive(null);
      return;
    }
    setActive(id);
  };

  const selectRight = (id: string) => {
    if (phase !== "answering" || !active) return;
    if (pairedRight.has(id)) return;
    setPairs((prev) => ({ ...prev, [active]: id }));
    setActive(null);
  };

  const leftState = (id: string): PairState => {
    if (phase !== "answering") {
      return pairs[id] === PAIR_ANSWER[id] ? "correct" : "incorrect";
    }
    if (active === id) return "active";
    if (pairs[id]) return "paired";
    return "idle";
  };

  const rightState = (id: string): PairState => {
    if (phase !== "answering") {
      const leftId = Object.entries(pairs).find(([, right]) => right === id)?.[0];
      if (!leftId) return "locked";
      return PAIR_ANSWER[leftId] === id ? "correct" : "incorrect";
    }
    if (pairedRight.has(id)) return "paired";
    if (active) return "idle";
    return "idle";
  };

  return (
    <DemoFrame
      stepIndex={4}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !complete}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          reset();
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>개념과 설명을 짝 지으세요</StepTitle>
          <StepGuide>한쪽을 고른 뒤 다른 쪽을 누르면 연결됩니다.</StepGuide>
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
                [...PAIR_LEFT, ...PAIR_RIGHT].map((item) => [item.id, item.label]),
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
    </DemoFrame>
  );
}

const CATEGORIES = [
  { id: "claim", label: "주장" },
  { id: "evidence", label: "근거" },
] as const;
const CLASSIFY_ITEMS = [
  { id: "i1", label: "학교는 토론을 늘려야 한다", answer: "claim" },
  { id: "i2", label: "참여 학생이 늘었다는 조사", answer: "evidence" },
  { id: "i3", label: "숙제 없는 날이 필요하다", answer: "claim" },
] as const;

function ClassifyDemo() {
  const [activeCategory, setActiveCategory] = useState<string | null>("claim");
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("answering");

  const reset = () => {
    setActiveCategory("claim");
    setPlacements({});
    setPhase("answering");
  };

  const complete = CLASSIFY_ITEMS.every((item) => placements[item.id]);
  const correct =
    phase !== "answering" && CLASSIFY_ITEMS.every((item) => placements[item.id] === item.answer);

  const place = (itemId: string) => {
    if (phase !== "answering" || !activeCategory) return;
    setPlacements((prev) => {
      if (prev[itemId] === activeCategory) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: activeCategory };
    });
  };

  const itemState = (itemId: string): ClassifyState => {
    const placed = placements[itemId];
    if (phase === "answering") return placed ? "placed" : "idle";
    const answer = CLASSIFY_ITEMS.find((item) => item.id === itemId)?.answer;
    return placed === answer ? "correct" : "incorrect";
  };

  return (
    <DemoFrame
      stepIndex={4}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !complete}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          reset();
          return;
        }
        setPhase("done");
      }}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>문장을 알맞은 카테고리에 넣으세요</StepTitle>
          <StepGuide>카테고리를 고른 뒤 항목을 누릅니다.</StepGuide>
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
                  onClick={() => phase === "answering" && setActiveCategory(category.id)}
                >
                  {category.label}
                </ClassifyCategory>
              ))}
            </ClassifyCategories>
            <ClassifyPool>
              {CLASSIFY_ITEMS.map((item) => {
                const tag = CATEGORIES.find(
                  (category) => category.id === placements[item.id],
                )?.label;
                return (
                  <ClassifyItem
                    key={item.id}
                    state={itemState(item.id)}
                    onClick={() => place(item.id)}
                  >
                    <ClassifyItemLabel>{item.label}</ClassifyItemLabel>
                    {tag ? <ClassifyItemTag>{tag}</ClassifyItemTag> : null}
                  </ClassifyItem>
                );
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
    </DemoFrame>
  );
}

function ComposeDemo() {
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const min = 40;
  const goal = 80;
  const max = 160;
  const ready = value.trim().length >= min && value.length <= max;

  const reset = () => {
    setValue("");
    setPhase("answering");
  };

  return (
    <DemoFrame
      stepIndex={5}
      primaryLabel={phase === "answering" ? "제출하기" : "다음으로"}
      primaryDisabled={phase === "answering" && !ready}
      onPrimary={() => setPhase("done")}
      showReset={phase !== "answering"}
      onReset={reset}
      onClose={reset}
    >
      <Step>
        <StepHeader>
          <StepTitle>반박 문단을 작성하세요</StepTitle>
        </StepHeader>
        <StepBody>
          <Compose>
            <ComposeBadge>반박 쓰기</ComposeBadge>
            <ComposeClaim>모든 숙제는 폐지해야 한다.</ComposeClaim>
            <ComposeContext>위 주장에 대해 한 단락으로 반박하세요.</ComposeContext>
            <ComposeEditor
              value={value}
              disabled={phase !== "answering"}
              placeholder="전제를 지적하고, 반례와 대안을 이어서 적어 보세요."
              onChange={(event) => setValue(event.target.value)}
            />
            <ComposeMeter value={value.length} min={min} goal={goal} max={max} />
          </Compose>
          {phase !== "answering" ? (
            <Insight tone="neutral">
              <InsightEyebrow>제출됨</InsightEyebrow>
              <InsightDescription>
                글자 수 기준을 만족했습니다. 다음 스텝으로 이어갈 수 있습니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function InsightDemo() {
  return <ChoiceDemo />;
}

function PathDemo() {
  const [current, setCurrent] = useState(2);
  const nodes = useMemo(
    () => [
      { id: 1, title: "주장 고르기" },
      { id: 2, title: "근거 붙이기" },
      { id: 3, title: "자기반박" },
      { id: 4, title: "다시 쓰기" },
      { id: 5, title: "정리하기" },
    ],
    [],
  );

  const stateFor = (id: number): PathNodeState => {
    if (id < current) return "completed";
    if (id === current) return "current";
    if (id === current + 1) return "available";
    return "locked";
  };

  const reset = () => setCurrent(2);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Path>
        <PathUnit>
          <PathUnitHeader>
            <PathUnitTitle>유닛 1 · 주장 세우기</PathUnitTitle>
            <PathUnitDescription>노드를 눌러 진행 상태를 바꿔 보세요.</PathUnitDescription>
          </PathUnitHeader>
          <PathTrail>
            {nodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                <PathStep>
                  <PathNode
                    state={stateFor(node.id)}
                    onClick={() => {
                      const state = stateFor(node.id);
                      if (state === "locked") return;
                      setCurrent(node.id);
                    }}
                  >
                    {stateFor(node.id) === "completed" ? "✓" : node.id}
                  </PathNode>
                  <PathNodeMeta>
                    <PathNodeTitle>{node.title}</PathNodeTitle>
                    {stateFor(node.id) === "current" ? (
                      <PathNodeDescription>진행 중</PathNodeDescription>
                    ) : null}
                  </PathNodeMeta>
                </PathStep>
                {index < nodes.length - 1 ? <PathConnector /> : null}
              </div>
            ))}
          </PathTrail>
        </PathUnit>
      </Path>
      <Button type="button" variant="outline" className="w-full" onClick={reset}>
        초기화
      </Button>
    </div>
  );
}

function CadenceDemo() {
  return (
    <div className="w-full max-w-sm">
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
    </div>
  );
}

function GoalDemo() {
  return (
    <div className="w-full max-w-sm">
      <Goal value={1} target={2} unit="레슨" />
    </div>
  );
}

function MasteryDemo() {
  return (
    <div className="w-full max-w-sm">
      <Mastery level="developing">
        <MasteryHeader>
          <MasteryLabel>주장과 근거</MasteryLabel>
          <MasteryBadge level="developing" />
        </MasteryHeader>
        <MasteryStages level="developing" />
        <MasteryDescription>근거를 스스로 고르는 연습을 이어 가세요.</MasteryDescription>
      </Mastery>
    </div>
  );
}

function MilestoneDemo() {
  return (
    <div className="w-full max-w-sm">
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
    </div>
  );
}

function StandingDemo() {
  return (
    <div className="w-full max-w-sm">
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
    </div>
  );
}

function LearningProfileDemo() {
  return (
    <div className="w-full max-w-md">
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
            <LearningProfileOption mode="single" selected>
              논증 글쓰기
            </LearningProfileOption>
            <LearningProfileOption mode="single">학술 에세이</LearningProfileOption>
            <LearningProfileOption mode="single">설득 카피</LearningProfileOption>
          </LearningProfileOptions>
        </LearningProfileSection>
        <LearningProfileSection>
          <LearningProfileSectionLabel>현재 수준</LearningProfileSectionLabel>
          <LearningProfileSectionHint>
            자가 진단입니다. 언제든 바꿀 수 있습니다.
          </LearningProfileSectionHint>
          <LearningProfileOptions mode="single">
            <LearningProfileOption mode="single">입문</LearningProfileOption>
            <LearningProfileOption mode="single" selected>
              중급
            </LearningProfileOption>
            <LearningProfileOption mode="single">숙련</LearningProfileOption>
          </LearningProfileOptions>
        </LearningProfileSection>
        <LearningProfileFooter>
          <Button>다음</Button>
        </LearningProfileFooter>
      </LearningProfile>
    </div>
  );
}

function NextActionDemo() {
  return (
    <div className="w-full max-w-md">
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
    </div>
  );
}

function CourseOverviewDemo() {
  return (
    <div className="w-full max-w-lg">
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
    </div>
  );
}

const LESSON_FLOW = ["reading", "choice", "token", "sortable", "compose"] as const;

function LessonSessionDemo() {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [seed, setSeed] = useState(0);

  const resetAll = () => {
    setIndex(0);
    setFinished(false);
    setSeed((value) => value + 1);
  };

  if (finished) {
    return (
      <Lesson className="min-h-140 w-full max-w-md rounded-[2rem] border border-border/80 px-4 pt-4 shadow-xs sm:px-5">
        <LessonHeader>
          <LessonClose onClick={resetAll} />
          <LessonProgress value={100} />
          <LessonMeta>
            {TOTAL_STEPS} / {TOTAL_STEPS}
          </LessonMeta>
        </LessonHeader>
        <LessonBody>
          <LessonComplete>
            <LessonCompleteTitle>레슨을 마쳤습니다</LessonCompleteTitle>
            <LessonCompleteDescription>
              주장과 근거를 한 호흡으로 잇는 연습을 완료했습니다. 초기화하면 처음부터 다시 해볼 수
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
    );
  }

  const current = LESSON_FLOW[index];
  const advance = () => {
    if (index >= LESSON_FLOW.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSeed((value) => value + 1);
  };

  return (
    <LessonFlowStep
      key={`${current}-${seed}`}
      kind={current}
      stepIndex={index + 1}
      onComplete={advance}
      onReset={() => setSeed((value) => value + 1)}
      onClose={resetAll}
    />
  );
}

function LessonFlowStep({
  kind,
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  kind: (typeof LESSON_FLOW)[number];
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (kind === "reading") {
    return (
      <FlowReading
        stepIndex={stepIndex}
        onComplete={onComplete}
        onReset={onReset}
        onClose={onClose}
      />
    );
  }
  if (kind === "choice") {
    return (
      <FlowChoice
        stepIndex={stepIndex}
        onComplete={onComplete}
        onReset={onReset}
        onClose={onClose}
      />
    );
  }
  if (kind === "token") {
    return (
      <FlowToken
        stepIndex={stepIndex}
        onComplete={onComplete}
        onReset={onReset}
        onClose={onClose}
      />
    );
  }
  if (kind === "sortable") {
    return (
      <FlowSortable
        stepIndex={stepIndex}
        onComplete={onComplete}
        onReset={onReset}
        onClose={onClose}
      />
    );
  }
  return (
    <FlowCompose
      stepIndex={stepIndex}
      onComplete={onComplete}
      onReset={onReset}
      onClose={onClose}
    />
  );
}

function FlowReading({
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [acked, setAcked] = useState(false);
  return (
    <DemoFrame
      stepIndex={stepIndex}
      primaryLabel={acked ? "다음으로" : "확인"}
      onPrimary={() => (acked ? onComplete() : setAcked(true))}
      showReset={acked}
      onReset={() => {
        setAcked(false);
        onReset();
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>주장과 근거의 거리</StepTitle>
          <StepGuide>글을 읽고 확인을 누르면 다음 활동으로 넘어갑니다.</StepGuide>
        </StepHeader>
        <StepBody>
          <Prose>
            <ProseBody>
              <p>
                설득문에서 주장은 독자가 붙잡을 수 있는 한 문장이어야 합니다. 근거는 그 문장을 믿게
                만드는 재료입니다.
              </p>
            </ProseBody>
          </Prose>
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function FlowChoice({
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const correct = selected === CHOICE_ANSWER;

  return (
    <DemoFrame
      stepIndex={stepIndex}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !selected}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setSelected(null);
          setPhase("answering");
          return;
        }
        onComplete();
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setSelected(null);
        setPhase("answering");
        onReset();
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>설득문의 기본 구조를 고르세요</StepTitle>
        </StepHeader>
        <StepBody>
          <ChoiceGroup type="single">
            {CHOICE_OPTIONS.map((option) => {
              let state: ChoiceState = "idle";
              if (phase === "answering") state = selected === option.id ? "selected" : "idle";
              else if (selected === option.id)
                state = option.id === CHOICE_ANSWER ? "correct" : "incorrect";
              else if (option.id === CHOICE_ANSWER) state = "missed";
              else state = "locked";
              return (
                <Choice
                  key={option.id}
                  mode="single"
                  selected={selected === option.id}
                  state={state}
                  onClick={() => phase === "answering" && setSelected(option.id)}
                >
                  <ChoiceContent>
                    <ChoiceLabel>{option.label}</ChoiceLabel>
                  </ChoiceContent>
                </Choice>
              );
            })}
          </ChoiceGroup>
          {phase !== "answering" ? (
            <Insight tone={correct ? "correct" : "incorrect"}>
              <InsightDescription>
                주장을 먼저 두고 근거로 뒷받침하는 구조가 기본입니다.
              </InsightDescription>
            </Insight>
          ) : null}
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function FlowToken({
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [slot, setSlot] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const correct = phase !== "answering" && slot === "weak";

  return (
    <DemoFrame
      stepIndex={stepIndex}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      primaryDisabled={phase === "answering" && !slot}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setSlot(null);
          setPhase("answering");
          return;
        }
        onComplete();
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setSlot(null);
        setPhase("answering");
        onReset();
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>빈칸을 채워보세요</StepTitle>
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
              {slot ? TOKEN_WORDS.find((word) => word.id === slot)?.label : "빈칸"}
            </TokenSlot>
            을 먼저 드러낸다.
          </TokenSentence>
          <TokenBank>
            {TOKEN_WORDS.map((word) => (
              <Token
                key={word.id}
                state={phase !== "answering" ? "locked" : slot === word.id ? "used" : "idle"}
                onClick={() => phase === "answering" && !slot && setSlot(word.id)}
              >
                {word.label}
              </Token>
            ))}
          </TokenBank>
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function FlowSortable({
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState(["reason", "close", "claim"]);
  const [phase, setPhase] = useState<Phase>("answering");
  const correct = phase !== "answering" && order.every((id, index) => id === ORDER_ANSWER[index]);

  return (
    <DemoFrame
      stepIndex={stepIndex}
      primaryLabel={phase === "answering" ? "확인하기" : correct ? "다음으로" : "계속하기"}
      onPrimary={() => {
        if (phase === "answering") {
          setPhase("checked");
          return;
        }
        if (!correct) {
          setPhase("answering");
          return;
        }
        onComplete();
      }}
      showReset={phase !== "answering"}
      onReset={() => {
        setOrder(["reason", "close", "claim"]);
        setPhase("answering");
        onReset();
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>설득문의 순서를 맞춰보세요</StepTitle>
        </StepHeader>
        <StepBody>
          <Sortable
            value={order}
            onValueChange={setOrder}
            getItemLabel={(id) => ORDER_ITEMS.find((item) => item.id === id)?.label ?? String(id)}
            disabled={phase !== "answering"}
            aria-label="설득문 순서"
          >
            {order.map((id, index) => {
              const item = ORDER_ITEMS.find((entry) => entry.id === id)!;
              return (
                <SortableItem
                  key={id}
                  value={id}
                  state={
                    phase === "answering"
                      ? "idle"
                      : id === ORDER_ANSWER[index]
                        ? "correct"
                        : "incorrect"
                  }
                >
                  <SortableIndex />
                  <SortableContent>{item.label}</SortableContent>
                  <SortableHandle />
                </SortableItem>
              );
            })}
          </Sortable>
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

function FlowCompose({
  stepIndex,
  onComplete,
  onReset,
  onClose,
}: {
  stepIndex: number;
  onComplete: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const min = 40;
  const goal = 80;
  const max = 160;
  const ready = value.trim().length >= min && value.length <= max;

  return (
    <DemoFrame
      stepIndex={stepIndex}
      primaryLabel={submitted ? "레슨 완료" : "제출하기"}
      primaryDisabled={!submitted && !ready}
      onPrimary={() => (submitted ? onComplete() : setSubmitted(true))}
      showReset={submitted}
      onReset={() => {
        setValue("");
        setSubmitted(false);
        onReset();
      }}
      onClose={onClose}
    >
      <Step>
        <StepHeader>
          <StepTitle>반박 문단을 작성하세요</StepTitle>
        </StepHeader>
        <StepBody>
          <Compose>
            <ComposeBadge>반박 쓰기</ComposeBadge>
            <ComposeClaim>모든 숙제는 폐지해야 한다.</ComposeClaim>
            <ComposeEditor
              value={value}
              disabled={submitted}
              placeholder="최소 40자 이상 작성하세요."
              onChange={(event) => setValue(event.target.value)}
            />
            <ComposeMeter value={value.length} min={min} goal={goal} max={max} />
          </Compose>
        </StepBody>
      </Step>
    </DemoFrame>
  );
}

const LEARNING_PREVIEWS: Record<string, () => ReactNode> = {
  ...LEARNING_EXTENDED_PREVIEWS,
  lesson: () => <LessonSessionDemo />,
  step: () => <LessonSessionDemo />,
  path: () => <PathDemo />,
  cadence: () => <CadenceDemo />,
  goal: () => <GoalDemo />,
  mastery: () => <MasteryDemo />,
  milestone: () => <MilestoneDemo />,
  standing: () => <StandingDemo />,
  "learning-profile": () => <LearningProfileDemo />,
  "next-action": () => <NextActionDemo />,
  "course-overview": () => <CourseOverviewDemo />,
  prose: () => <ReadingDemo />,
  compare: () => <CompareDemo />,
  choice: () => <ChoiceDemo />,
  token: () => <TokenDemo />,
  segment: () => <SegmentDemo />,
  sortable: () => <SortableDemo />,
  pair: () => <PairDemo />,
  classify: () => <ClassifyDemo />,
  compose: () => <ComposeDemo />,
  insight: () => <InsightDemo />,
};

export function isLearningPreview(slug: string) {
  return slug in LEARNING_PREVIEWS;
}

export function LearningPreview({ slug }: { slug: string }) {
  const render = LEARNING_PREVIEWS[slug];
  if (!render) return null;
  return <div className="flex w-full justify-center py-2">{render()}</div>;
}
