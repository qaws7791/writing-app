"use client";

import { CategorizeAnswer } from "@workspace/ui/components/learning/categorize-answer";
import { CompareStepView } from "@workspace/ui/components/learning/compare-step-view";
import { FillBlankAnswer } from "@workspace/ui/components/learning/fill-blank-answer";
import { MatchAnswer } from "@workspace/ui/components/learning/match-answer";
import { MultipleChoiceAnswer } from "@workspace/ui/components/learning/multiple-choice-answer";
import { OrderAnswer } from "@workspace/ui/components/learning/order-answer";
import { ReadingStepView } from "@workspace/ui/components/learning/reading-step-view";
import { SelectAnswer } from "@workspace/ui/components/learning/select-answer";
import { ThemeSelector } from "@workspace/ui/components/primitives/theme-selector";
import type { ThemeValue } from "@workspace/ui/components/primitives/theme-selector";
import { useState } from "react";

import {
  categorizeDefaults,
  compareDefaults,
  fillBlankDefaults,
  matchDefaults,
  multipleChoiceDefaults,
  orderDefaults,
  readingDefaults,
  selectDefaults,
} from "@/src/lib/lesson-fixtures";

type WorkspaceExtensionPreviewProps = {
  slug: string;
  story: string;
};

const leftChoices = matchDefaults.pairs.map((pair, index) => ({
  id: `left-${index + 1}`,
  text: pair.left,
}));
const rightChoices = matchDefaults.pairs
  .map((pair, index) => ({ id: `right-${index + 1}`, text: pair.right }))
  .toReversed();
const correctConnections = matchDefaults.pairs.map((_, index) => ({
  leftChoiceId: `left-${index + 1}`,
  rightChoiceId: `right-${index + 1}`,
  tone: "correct" as const,
}));
const wrongConnections = matchDefaults.pairs.map((_, index, pairs) => ({
  leftChoiceId: `left-${index + 1}`,
  rightChoiceId: `right-${((index + 1) % pairs.length) + 1}`,
  tone: "wrong" as const,
}));

function CategorizePreview({ story }: { story: string }) {
  const narrow = story === "NarrowWithLongTags";
  const categories = narrow
    ? [
        { id: "A", label: "주제문 (핵심 주장)" },
        { id: "B", label: "뒷받침 문장 (근거·설명)" },
        { id: "C", label: "구체적 예시 (사례)" },
      ]
    : [...categorizeDefaults.categories];
  const items = narrow ? categorizeDefaults.items.slice(0, 3) : [...categorizeDefaults.items];

  return (
    <div className={narrow ? "mx-auto w-[320px] max-w-full" : undefined}>
      <CategorizeAnswer
        {...categorizeDefaults}
        categories={categories}
        items={items}
        checked={
          story === "CheckedWrong"
            ? "wrong"
            : story === "CheckedCorrect" || narrow
              ? "correct"
              : false
        }
        defaultPlacements={
          story === "CheckedWrong"
            ? { i1: "B", i2: "A", i3: "C", i4: "B" }
            : story === "CheckedCorrect" || narrow
              ? { i1: "A", i2: "B", i3: "C", ...(narrow ? {} : { i4: "B" }) }
              : undefined
        }
        onChange={() => undefined}
      />
    </div>
  );
}

function ComparePreview({ story }: { story: string }) {
  return (
    <CompareStepView
      {...compareDefaults}
      versions={
        story === "ThreeVersions"
          ? [
              ...compareDefaults.versions,
              { label: "질문형 도입", text: "당신은 하루에 몇 분이나 글을 씁니까?" },
            ]
          : [...compareDefaults.versions]
      }
    />
  );
}

function FillBlankPreview({ story }: { story: string }) {
  return (
    <FillBlankAnswer
      {...fillBlankDefaults}
      checked={story === "CheckedWrong" ? "wrong" : story === "CheckedCorrect" ? "correct" : false}
      choices={[...fillBlankDefaults.choices]}
      onChange={() => undefined}
    />
  );
}

function MatchPreview({ story }: { story: string }) {
  const connections =
    story === "CheckedCorrect"
      ? correctConnections
      : story === "CheckedWrong"
        ? wrongConnections
        : story === "Connected"
          ? [{ leftChoiceId: "left-1", rightChoiceId: "right-1", tone: "default" as const }]
          : [];
  return (
    <MatchAnswer
      checked={story === "CheckedWrong" ? "wrong" : story === "CheckedCorrect" ? "correct" : false}
      connections={connections}
      explanation={matchDefaults.explanation}
      leftChoices={leftChoices}
      onChoiceSelect={() => undefined}
      pendingChoice={story === "PendingChoice" ? { id: "left-1", side: "left" } : null}
      rightChoices={rightChoices}
      title={matchDefaults.title}
    />
  );
}

function MultipleChoicePreview({ story }: { story: string }) {
  return (
    <MultipleChoiceAnswer
      {...multipleChoiceDefaults}
      options={[...multipleChoiceDefaults.options]}
      checked={story === "CheckedWrong" ? "wrong" : story === "CheckedCorrect" ? "correct" : false}
      defaultSelectedOptionId={
        story === "CheckedWrong" ? "a" : story === "CheckedCorrect" ? "b" : undefined
      }
      onSelect={() => undefined}
    />
  );
}

function OrderPreview({ story }: { story: string }) {
  return (
    <OrderAnswer
      {...orderDefaults}
      items={[...orderDefaults.items]}
      correctItemIds={[...orderDefaults.correctItemIds]}
      checked={story === "CheckedWrong" ? "wrong" : story === "CheckedCorrect" ? "correct" : false}
      onChange={() => undefined}
    />
  );
}

function ReadingPreview({ story }: { story: string }) {
  const longBody = `${readingDefaults.body}\n\n---\n\n**명료성** — 문장이 단 하나의 해석으로 읽히는 정도\n\n- 한 문장에 생각이 하나인가?\n- 없애도 의미가 유지되는 단어가 있는가?\n- 독자가 다르게 해석할 여지가 있는가?`;
  return (
    <ReadingStepView
      {...readingDefaults}
      body={story === "LongBody" ? longBody : readingDefaults.body}
      source={story === "WithoutSource" ? undefined : readingDefaults.source}
    />
  );
}

function SelectPreview({ story }: { story: string }) {
  return (
    <SelectAnswer
      {...selectDefaults}
      segments={[...selectDefaults.segments]}
      correctIndexes={[...selectDefaults.correctIndexes]}
      layout={story === "BlockLayout" ? "block" : undefined}
      checked={story === "CheckedWrong" ? "wrong" : story === "CheckedCorrect" ? "correct" : false}
      onChange={() => undefined}
    />
  );
}

function ThemeSelectorPreview({ story }: { story: string }) {
  const [theme, setTheme] = useState<ThemeValue>("system");
  if (story === "SelectedStates") {
    return (
      <div className="grid gap-3">
        {(["light", "dark", "system"] as const).map((value) => (
          <ThemeSelector key={value} activeTheme={value} onThemeChange={setTheme} />
        ))}
      </div>
    );
  }
  return (
    <ThemeSelector activeTheme={theme} disabled={story === "Disabled"} onThemeChange={setTheme} />
  );
}

export default function WorkspaceExtensionPreview({ slug, story }: WorkspaceExtensionPreviewProps) {
  const content = (() => {
    switch (slug) {
      case "theme-selector":
        return <ThemeSelectorPreview story={story} />;
      case "categorize-answer":
        return <CategorizePreview story={story} />;
      case "compare-step-view":
        return <ComparePreview story={story} />;
      case "fill-blank-answer":
        return <FillBlankPreview story={story} />;
      case "match-answer":
        return <MatchPreview story={story} />;
      case "multiple-choice-answer":
        return <MultipleChoicePreview story={story} />;
      case "order-answer":
        return <OrderPreview story={story} />;
      case "reading-step-view":
        return <ReadingPreview story={story} />;
      case "select-answer":
        return <SelectPreview story={story} />;
      default:
        return <p>지원하지 않는 workspace extension입니다.</p>;
    }
  })();

  return <div className="mx-auto w-full max-w-3xl">{content}</div>;
}
