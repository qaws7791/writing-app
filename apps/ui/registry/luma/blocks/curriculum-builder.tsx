"use client";

import * as React from "react";
import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Menu01Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/registry/luma/lib/utils";
import { Button } from "@/registry/luma/ui/button";
import {
  CurriculumNode,
  CurriculumNodeActions,
  CurriculumNodeChildren,
  CurriculumNodeCount,
  CurriculumNodeDisclosure,
  CurriculumNodeLabel,
  CurriculumNodeMeta,
  CurriculumNodeRename,
  CurriculumTree,
  CurriculumTreeHeader,
  CurriculumTreeList,
  CurriculumTreeSummary,
  CurriculumTreeTitle,
  type CurriculumNodeState,
} from "@/registry/luma/ui/curriculum-tree";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/registry/luma/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/registry/luma/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/registry/luma/ui/field";
import { Input } from "@/registry/luma/ui/input";
import {
  LessonBuilder,
  LessonBuilderCanvas,
  LessonBuilderEmpty,
  LessonBuilderHeader,
  LessonBuilderMeta,
  LessonBuilderStep,
  LessonBuilderStepActions,
  LessonBuilderStepBody,
  LessonBuilderStepEditor,
  LessonBuilderStepHandle,
  LessonBuilderStepInsert,
  LessonBuilderStepType,
  LessonBuilderTitle,
} from "@/registry/luma/ui/lesson-builder";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/luma/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/luma/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/registry/luma/ui/sheet";
import { Textarea } from "@/registry/luma/ui/textarea";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type StepType =
  | "READING"
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "SELECT"
  | "ORDER"
  | "MATCH"
  | "CATEGORIZE"
  | "COMPARE"
  | "WRITE"
  | "AI_FEEDBACK";

export type LessonStep = {
  id: string;
  type: StepType;
  title: string;
  prompt: string;
  body: string;
  source?: string;
  caption?: string;
  options?: { id: string; label: string }[];
  correctOptionIds?: string[];
  tokens?: { id: string; label: string }[];
  answerTokens?: string[];
  segments?: { id: string; label: string; correct?: boolean }[];
  pairs?: { id: string; left: string; right: string }[];
  categories?: { id: string; label: string; itemIds: string[] }[];
  items?: { id: string; label: string }[];
  versionA?: string;
  versionB?: string;
  comparePoints?: string;
  minChars?: number;
  targetChars?: number;
  maxChars?: number;
  submitHint?: string;
  coachingPrompt?: string;
  rubricRef?: string;
  feedbackScope?: string;
  insight?: string;
  hint?: string;
};

export type LessonNode = {
  id: string;
  title: string;
  state: CurriculumNodeState;
  steps: LessonStep[];
};

export type UnitNode = {
  id: string;
  title: string;
  description: string;
  state: CurriculumNodeState;
  lessons: LessonNode[];
};

export type CurriculumSelection =
  | { kind: "unit"; id: string }
  | { kind: "lesson"; id: string }
  | { kind: "step"; lessonId: string; stepId: string };

export type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  title: string;
  detail: string;
  selection: CurriculumSelection;
};

type UndoEntry = {
  units: UnitNode[];
  selection: CurriculumSelection | null;
  message: string;
};

type BuilderState = {
  units: UnitNode[];
  selection: CurriculumSelection | null;
  expanded: Record<string, boolean>;
  undo: UndoEntry | null;
  renaming: { kind: "unit" | "lesson"; id: string } | null;
};

type BuilderAction =
  | { type: "hydrate"; units: UnitNode[] }
  | { type: "select"; selection: CurriculumSelection | null }
  | { type: "toggle-expand"; id: string }
  | { type: "set-expanded"; id: string; open: boolean }
  | { type: "start-rename"; kind: "unit" | "lesson"; id: string }
  | { type: "cancel-rename" }
  | { type: "unit/add" }
  | {
      type: "unit/update";
      id: string;
      patch: Partial<Pick<UnitNode, "title" | "description" | "state">>;
    }
  | { type: "unit/duplicate"; id: string }
  | { type: "unit/remove"; id: string }
  | { type: "unit/move"; from: number; to: number }
  | { type: "lesson/add"; unitId: string }
  | { type: "lesson/update"; id: string; patch: Partial<Pick<LessonNode, "title" | "state">> }
  | { type: "lesson/duplicate"; id: string }
  | { type: "lesson/remove"; id: string }
  | { type: "lesson/move"; lessonId: string; toUnitId: string; toIndex: number }
  | { type: "lesson/reorder"; unitId: string; from: number; to: number }
  | { type: "step/add"; lessonId: string; stepType: StepType; index?: number }
  | { type: "step/update"; lessonId: string; stepId: string; patch: Partial<LessonStep> }
  | { type: "step/duplicate"; lessonId: string; stepId: string }
  | { type: "step/remove"; lessonId: string; stepId: string }
  | { type: "step/move"; lessonId: string; from: number; to: number }
  | { type: "undo" }
  | { type: "dismiss-undo" };

/* ─── Constants & helpers ───────────────────────────────────────────────── */

const STEP_TYPE_LABELS: Record<StepType, string> = {
  READING: "읽기",
  MULTIPLE_CHOICE: "객관식",
  FILL_BLANK: "빈칸 채우기",
  SELECT: "구간 선택",
  ORDER: "순서 맞추기",
  MATCH: "짝 맞추기",
  CATEGORIZE: "분류하기",
  COMPARE: "비교하기",
  WRITE: "쓰기",
  AI_FEEDBACK: "AI 코칭",
};

const STEP_TYPES = Object.keys(STEP_TYPE_LABELS) as StepType[];

const STATE_ITEMS = [
  { label: "초안", value: "draft" },
  { label: "준비됨", value: "ready" },
  { label: "게시됨", value: "published" },
] as const;

const LEGACY_TYPE_MAP: Record<string, StepType> = {
  읽기: "READING",
  객관식: "MULTIPLE_CHOICE",
  쓰기: "WRITE",
  READING: "READING",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  FILL_BLANK: "FILL_BLANK",
  SELECT: "SELECT",
  ORDER: "ORDER",
  MATCH: "MATCH",
  CATEGORIZE: "CATEGORIZE",
  COMPARE: "COMPARE",
  WRITE: "WRITE",
  AI_FEEDBACK: "AI_FEEDBACK",
};

let idSeq = 0;
function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

function cloneUnits(units: UnitNode[]): UnitNode[] {
  return structuredClone(units);
}

function normalizeStep(
  raw: Partial<LessonStep> & { id: string; type: string; body?: string },
): LessonStep {
  const type = LEGACY_TYPE_MAP[raw.type] ?? "READING";
  return {
    id: raw.id,
    type,
    title: raw.title ?? STEP_TYPE_LABELS[type],
    prompt: raw.prompt ?? raw.body ?? "",
    body: raw.body ?? "",
    source: raw.source,
    caption: raw.caption,
    options:
      raw.options ??
      (type === "MULTIPLE_CHOICE"
        ? [
            { id: nextId("opt"), label: "선택지 A" },
            { id: nextId("opt"), label: "선택지 B" },
            { id: nextId("opt"), label: "선택지 C" },
            { id: nextId("opt"), label: "선택지 D" },
          ]
        : undefined),
    correctOptionIds: raw.correctOptionIds ?? [],
    tokens: raw.tokens,
    answerTokens: raw.answerTokens,
    segments: raw.segments,
    pairs: raw.pairs,
    categories: raw.categories,
    items: raw.items,
    versionA: raw.versionA,
    versionB: raw.versionB,
    comparePoints: raw.comparePoints,
    minChars: raw.minChars ?? (type === "WRITE" ? 40 : undefined),
    targetChars: raw.targetChars ?? (type === "WRITE" ? 120 : undefined),
    maxChars: raw.maxChars ?? (type === "WRITE" ? 300 : undefined),
    submitHint: raw.submitHint,
    coachingPrompt: raw.coachingPrompt,
    rubricRef: raw.rubricRef,
    feedbackScope: raw.feedbackScope,
    insight: raw.insight,
    hint: raw.hint,
  };
}

export function normalizeUnits(units: UnitNode[]): UnitNode[] {
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => ({
      ...lesson,
      steps: lesson.steps.map((step) => normalizeStep(step)),
    })),
  }));
}

function findUnit(units: UnitNode[], id: string) {
  return units.find((unit) => unit.id === id);
}

function findLesson(units: UnitNode[], id: string) {
  for (const unit of units) {
    const lesson = unit.lessons.find((item) => item.id === id);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}

function findStep(units: UnitNode[], lessonId: string, stepId: string) {
  const hit = findLesson(units, lessonId);
  if (!hit) return undefined;
  const step = hit.lesson.steps.find((item) => item.id === stepId);
  if (!step) return undefined;
  return { ...hit, step };
}

function countStats(units: UnitNode[]) {
  let lessons = 0;
  let steps = 0;
  for (const unit of units) {
    lessons += unit.lessons.length;
    for (const lesson of unit.lessons) steps += lesson.steps.length;
  }
  return { units: units.length, lessons, steps };
}

function createEmptyStep(type: StepType): LessonStep {
  return normalizeStep({
    id: nextId("step"),
    type,
    title: STEP_TYPE_LABELS[type],
    body: "",
    prompt: "",
  });
}

function createEmptyLesson(): LessonNode {
  return {
    id: nextId("lesson"),
    title: "새 레슨",
    state: "draft",
    steps: [createEmptyStep("READING")],
  };
}

function createEmptyUnit(): UnitNode {
  return {
    id: nextId("unit"),
    title: "새 유닛",
    description: "",
    state: "draft",
    lessons: [],
  };
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function withUndo(
  state: BuilderState,
  units: UnitNode[],
  message: string,
  patch: Partial<BuilderState> = {},
): BuilderState {
  return {
    ...state,
    units,
    undo: {
      units: cloneUnits(state.units),
      selection: state.selection,
      message,
    },
    ...patch,
  };
}

function selectionEquals(
  a: CurriculumSelection | null | undefined,
  b: CurriculumSelection | null | undefined,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "step" && b.kind === "step") {
    return a.lessonId === b.lessonId && a.stepId === b.stepId;
  }
  if (a.kind === "step" || b.kind === "step") return false;
  return a.id === b.id;
}

export function validateCurriculum(units: UnitNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const unit of units) {
    if (!unit.title.trim()) {
      issues.push({
        id: `unit-title-${unit.id}`,
        severity: "error",
        title: "유닛 제목 없음",
        detail: "제목이 비어 있는 유닛이 있습니다.",
        selection: { kind: "unit", id: unit.id },
      });
    }
    if (unit.lessons.length === 0) {
      issues.push({
        id: `unit-empty-${unit.id}`,
        severity: "warning",
        title: "빈 유닛",
        detail: `「${unit.title || "제목 없음"}」에 레슨이 없습니다.`,
        selection: { kind: "unit", id: unit.id },
      });
    }

    for (const lesson of unit.lessons) {
      if (!lesson.title.trim()) {
        issues.push({
          id: `lesson-title-${lesson.id}`,
          severity: "error",
          title: "레슨 제목 없음",
          detail: `「${unit.title}」의 레슨 제목이 비어 있습니다.`,
          selection: { kind: "lesson", id: lesson.id },
        });
      }
      if (lesson.steps.length === 0) {
        issues.push({
          id: `lesson-empty-${lesson.id}`,
          severity: "error",
          title: "스텝 없는 레슨",
          detail: `「${lesson.title || "제목 없음"}」에 스텝이 없습니다.`,
          selection: { kind: "lesson", id: lesson.id },
        });
      }

      for (const step of lesson.steps) {
        if (step.type === "MULTIPLE_CHOICE") {
          const empty = (step.options ?? []).find((opt) => !opt.label.trim());
          if (empty) {
            issues.push({
              id: `opt-empty-${step.id}`,
              severity: "error",
              title: "빈 선택지",
              detail: `「${lesson.title}」의 「${step.title}」에 비어 있는 선택지가 있습니다.`,
              selection: { kind: "step", lessonId: lesson.id, stepId: step.id },
            });
          }
          if (!(step.correctOptionIds ?? []).length) {
            issues.push({
              id: `opt-answer-${step.id}`,
              severity: "error",
              title: "정답 미지정",
              detail: `「${lesson.title}」의 「${step.title}」에 정답이 없습니다.`,
              selection: { kind: "step", lessonId: lesson.id, stepId: step.id },
            });
          }
        }
        if (step.type === "READING" && !step.body.trim() && !step.prompt.trim()) {
          issues.push({
            id: `reading-empty-${step.id}`,
            severity: "warning",
            title: "읽기 본문 없음",
            detail: `「${lesson.title}」의 읽기 스텝에 본문이 없습니다.`,
            selection: { kind: "step", lessonId: lesson.id, stepId: step.id },
          });
        }
        if (step.type === "WRITE" && !step.prompt.trim()) {
          issues.push({
            id: `write-empty-${step.id}`,
            severity: "warning",
            title: "쓰기 프롬프트 없음",
            detail: `「${lesson.title}」의 쓰기 스텝에 프롬프트가 없습니다.`,
            selection: { kind: "step", lessonId: lesson.id, stepId: step.id },
          });
        }
      }
    }
  }

  return issues;
}

/* ─── Reducer ───────────────────────────────────────────────────────────── */

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        units: normalizeUnits(action.units),
        expanded: Object.fromEntries(action.units.map((unit) => [unit.id, true])),
        undo: null,
      };
    case "select":
      if (selectionEquals(state.selection, action.selection)) return state;
      return { ...state, selection: action.selection };
    case "toggle-expand":
      return {
        ...state,
        expanded: { ...state.expanded, [action.id]: !state.expanded[action.id] },
      };
    case "set-expanded":
      return {
        ...state,
        expanded: { ...state.expanded, [action.id]: action.open },
      };
    case "start-rename":
      return { ...state, renaming: { kind: action.kind, id: action.id } };
    case "cancel-rename":
      return { ...state, renaming: null };
    case "dismiss-undo":
      return { ...state, undo: null };
    case "undo": {
      if (!state.undo) return state;
      return {
        ...state,
        units: state.undo.units,
        selection: state.undo.selection,
        undo: null,
        renaming: null,
      };
    }
    case "unit/add": {
      const unit = createEmptyUnit();
      const units = [...state.units, unit];
      return withUndo(state, units, "유닛을 추가했습니다.", {
        selection: { kind: "unit", id: unit.id },
        expanded: { ...state.expanded, [unit.id]: true },
        renaming: { kind: "unit", id: unit.id },
      });
    }
    case "unit/update": {
      const units = state.units.map((unit) =>
        unit.id === action.id ? { ...unit, ...action.patch } : unit,
      );
      // Non-undoable content edit — drop stale structural undo.
      return { ...state, units, renaming: null, undo: null };
    }
    case "unit/duplicate": {
      const source = findUnit(state.units, action.id);
      if (!source) return state;
      const copy: UnitNode = {
        ...structuredClone(source),
        id: nextId("unit"),
        title: `${source.title} 복사`,
        lessons: source.lessons.map((lesson) => ({
          ...structuredClone(lesson),
          id: nextId("lesson"),
          steps: lesson.steps.map((step) => ({ ...structuredClone(step), id: nextId("step") })),
        })),
      };
      const index = state.units.findIndex((unit) => unit.id === action.id);
      const units = [...state.units];
      units.splice(index + 1, 0, copy);
      return withUndo(state, units, `「${source.title}」 유닛을 복제했습니다.`, {
        selection: { kind: "unit", id: copy.id },
        expanded: { ...state.expanded, [copy.id]: true },
      });
    }
    case "unit/remove": {
      const source = findUnit(state.units, action.id);
      if (!source) return state;
      const units = state.units.filter((unit) => unit.id !== action.id);
      const current = state.selection;
      let selection = current;
      const removesSelection =
        current != null &&
        ((current.kind === "unit" && current.id === action.id) ||
          (current.kind === "lesson" &&
            source.lessons.some((lesson) => lesson.id === current.id)) ||
          (current.kind === "step" &&
            source.lessons.some((lesson) => lesson.id === current.lessonId)));
      if (removesSelection) {
        selection = units[0] ? { kind: "unit", id: units[0].id } : null;
      }
      return withUndo(state, units, `「${source.title}」 유닛을 삭제했습니다.`, { selection });
    }
    case "unit/move": {
      const units = arrayMove(state.units, action.from, action.to);
      if (units === state.units) return state;
      return withUndo(state, units, "유닛 순서를 바꿨습니다.");
    }
    case "lesson/add": {
      const lesson = createEmptyLesson();
      const units = state.units.map((unit) =>
        unit.id === action.unitId ? { ...unit, lessons: [...unit.lessons, lesson] } : unit,
      );
      return withUndo(state, units, "레슨을 추가했습니다.", {
        selection: { kind: "lesson", id: lesson.id },
        expanded: { ...state.expanded, [action.unitId]: true },
        renaming: { kind: "lesson", id: lesson.id },
      });
    }
    case "lesson/update": {
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) =>
          lesson.id === action.id ? { ...lesson, ...action.patch } : lesson,
        ),
      }));
      // Non-undoable content edit — drop stale structural undo.
      return { ...state, units, renaming: null, undo: null };
    }
    case "lesson/duplicate": {
      const hit = findLesson(state.units, action.id);
      if (!hit) return state;
      const copy: LessonNode = {
        ...structuredClone(hit.lesson),
        id: nextId("lesson"),
        title: `${hit.lesson.title} 복사`,
        steps: hit.lesson.steps.map((step) => ({ ...structuredClone(step), id: nextId("step") })),
      };
      const units = state.units.map((unit) => {
        if (unit.id !== hit.unit.id) return unit;
        const index = unit.lessons.findIndex((lesson) => lesson.id === action.id);
        const lessons = [...unit.lessons];
        lessons.splice(index + 1, 0, copy);
        return { ...unit, lessons };
      });
      return withUndo(state, units, `「${hit.lesson.title}」 레슨을 복제했습니다.`, {
        selection: { kind: "lesson", id: copy.id },
      });
    }
    case "lesson/remove": {
      const hit = findLesson(state.units, action.id);
      if (!hit) return state;
      const units = state.units.map((unit) =>
        unit.id === hit.unit.id
          ? { ...unit, lessons: unit.lessons.filter((lesson) => lesson.id !== action.id) }
          : unit,
      );
      let selection = state.selection;
      if (
        selection &&
        ((selection.kind === "lesson" && selection.id === action.id) ||
          (selection.kind === "step" && selection.lessonId === action.id))
      ) {
        selection = { kind: "unit", id: hit.unit.id };
      }
      return withUndo(state, units, `「${hit.lesson.title}」 레슨을 삭제했습니다.`, { selection });
    }
    case "lesson/reorder": {
      const target = state.units.find((unit) => unit.id === action.unitId);
      if (!target) return state;
      const lessons = arrayMove(target.lessons, action.from, action.to);
      if (lessons === target.lessons) return state;
      const units = state.units.map((unit) =>
        unit.id === action.unitId ? { ...unit, lessons } : unit,
      );
      return withUndo(state, units, "레슨 순서를 바꿨습니다.");
    }
    case "lesson/move": {
      const hit = findLesson(state.units, action.lessonId);
      if (!hit) return state;
      let moving = hit.lesson;
      const stripped = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.filter((lesson) => lesson.id !== action.lessonId),
      }));
      const units = stripped.map((unit) => {
        if (unit.id !== action.toUnitId) return unit;
        const lessons = unit.lessons.slice();
        const index = Math.max(0, Math.min(action.toIndex, lessons.length));
        lessons.splice(index, 0, moving);
        return Object.assign({}, unit, { lessons });
      });
      return withUndo(state, units, "레슨을 다른 유닛으로 옮겼습니다.", {
        expanded: { ...state.expanded, [action.toUnitId]: true },
      });
    }
    case "step/add": {
      const step = createEmptyStep(action.stepType);
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          if (lesson.id !== action.lessonId) return lesson;
          const steps = [...lesson.steps];
          const index = action.index ?? steps.length;
          steps.splice(index, 0, step);
          return { ...lesson, steps };
        }),
      }));
      return withUndo(state, units, `${STEP_TYPE_LABELS[action.stepType]} 스텝을 추가했습니다.`, {
        selection: { kind: "step", lessonId: action.lessonId, stepId: step.id },
      });
    }
    case "step/update": {
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          if (lesson.id !== action.lessonId) return lesson;
          return {
            ...lesson,
            steps: lesson.steps.map((step) => {
              if (step.id !== action.stepId) return step;
              const next = { ...step, ...action.patch };
              if (action.patch.type && action.patch.type !== step.type) {
                return normalizeStep({ ...next, type: action.patch.type });
              }
              return next;
            }),
          };
        }),
      }));
      // Non-undoable content edit — drop stale structural undo.
      return { ...state, units, undo: null };
    }
    case "step/duplicate": {
      const hit = findStep(state.units, action.lessonId, action.stepId);
      if (!hit) return state;
      const copy = {
        ...structuredClone(hit.step),
        id: nextId("step"),
        title: `${hit.step.title} 복사`,
      };
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => {
          if (lesson.id !== action.lessonId) return lesson;
          const index = lesson.steps.findIndex((step) => step.id === action.stepId);
          const steps = [...lesson.steps];
          steps.splice(index + 1, 0, copy);
          return { ...lesson, steps };
        }),
      }));
      return withUndo(state, units, "스텝을 복제했습니다.", {
        selection: { kind: "step", lessonId: action.lessonId, stepId: copy.id },
      });
    }
    case "step/remove": {
      const hit = findStep(state.units, action.lessonId, action.stepId);
      if (!hit) return state;
      const removedIndex = hit.lesson.steps.findIndex((step) => step.id === action.stepId);
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) =>
          lesson.id === action.lessonId
            ? { ...lesson, steps: lesson.steps.filter((step) => step.id !== action.stepId) }
            : lesson,
        ),
      }));
      let selection = state.selection;
      const removesSelection =
        selection?.kind === "step" &&
        selection.lessonId === action.lessonId &&
        selection.stepId === action.stepId;
      if (removesSelection) {
        const remaining = findLesson(units, action.lessonId)?.lesson.steps ?? [];
        if (remaining.length) {
          const nextIndex = Math.min(Math.max(removedIndex, 0), remaining.length - 1);
          selection = {
            kind: "step",
            lessonId: action.lessonId,
            stepId: remaining[nextIndex].id,
          };
        } else {
          selection = { kind: "lesson", id: action.lessonId };
        }
      }
      return withUndo(state, units, `「${hit.step.title}」 스텝을 삭제했습니다.`, { selection });
    }
    case "step/move": {
      const hit = findLesson(state.units, action.lessonId);
      if (!hit) return state;
      const steps = arrayMove(hit.lesson.steps, action.from, action.to);
      if (steps === hit.lesson.steps) return state;
      const units = state.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) =>
          lesson.id === action.lessonId ? { ...lesson, steps } : lesson,
        ),
      }));
      return withUndo(state, units, "스텝 순서를 바꿨습니다.");
    }
    default:
      return state;
  }
}

/* ─── Shared form pieces ────────────────────────────────────────────────── */

function StepFieldText({
  id,
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20"
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

const EMPTY_CORRECT_IDS: string[] = [];

function StepOptionList({
  options,
  correctOptionIds,
  onChange,
  onCorrectChange,
  allowMultiple = false,
}: {
  options: { id: string; label: string }[];
  correctOptionIds?: string[];
  onChange: (options: { id: string; label: string }[]) => void;
  onCorrectChange: (ids: string[]) => void;
  allowMultiple?: boolean;
}) {
  const correctIds = correctOptionIds ?? EMPTY_CORRECT_IDS;

  return (
    <Field>
      <FieldLabel>선택지</FieldLabel>
      <div className="flex flex-col gap-2">
        {options.map((option, index) => {
          const checked = correctIds.includes(option.id);
          return (
            <div key={option.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={checked ? "정답 해제" : "정답으로 지정"}
                aria-pressed={checked}
                onClick={() => {
                  if (allowMultiple) {
                    onCorrectChange(
                      checked
                        ? correctIds.filter((id) => id !== option.id)
                        : [...correctIds, option.id],
                    );
                  } else {
                    onCorrectChange(checked ? [] : [option.id]);
                  }
                }}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                  checked
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border/70 bg-muted/40 text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + index)}
              </button>
              <Input
                value={option.label}
                aria-label={`선택지 ${String.fromCharCode(65 + index)}`}
                onChange={(event) => {
                  const next = options.map((item) =>
                    item.id === option.id ? { ...item, label: event.target.value } : item,
                  );
                  onChange(next);
                }}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="선택지 삭제"
                disabled={options.length <= 2}
                onClick={() => {
                  onChange(options.filter((item) => item.id !== option.id));
                  onCorrectChange(correctIds.filter((id) => id !== option.id));
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit"
          onClick={() => onChange([...options, { id: nextId("opt"), label: "" }])}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          선택지 추가
        </Button>
      </div>
    </Field>
  );
}

function StepFeedbackFields({
  insight,
  hint,
  onChange,
}: {
  insight?: string;
  hint?: string;
  onChange: (patch: Partial<LessonStep>) => void;
}) {
  return (
    <>
      <StepFieldText
        id="step-insight"
        label="해설"
        value={insight ?? ""}
        multiline
        rows={2}
        onChange={(value) => onChange({ insight: value })}
      />
      <StepFieldText
        id="step-hint"
        label="힌트"
        value={hint ?? ""}
        onChange={(value) => onChange({ hint: value })}
      />
    </>
  );
}

function ItemListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: { id: string; label: string }[];
  onChange: (items: { id: string; label: string }[]) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[11px] tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <Input
              value={item.label}
              onChange={(event) =>
                onChange(
                  items.map((row) =>
                    row.id === item.id ? { ...row, label: event.target.value } : row,
                  ),
                )
              }
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="항목 삭제"
              onClick={() => onChange(items.filter((row) => row.id !== item.id))}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit"
          onClick={() => onChange([...items, { id: nextId("item"), label: "" }])}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          항목 추가
        </Button>
      </div>
    </Field>
  );
}

function StepTypeForm({
  step,
  onChange,
}: {
  step: LessonStep;
  onChange: (patch: Partial<LessonStep>) => void;
}) {
  return (
    <FieldGroup className="gap-4">
      <div className="@container grid gap-4 @[32rem]:grid-cols-2">
        <StepFieldText
          id={`step-title-${step.id}`}
          label="제목"
          value={step.title}
          onChange={(value) => onChange({ title: value })}
        />
        <Field>
          <FieldLabel htmlFor={`step-type-${step.id}`}>유형</FieldLabel>
          <Select
            items={STEP_TYPES.map((type) => ({ label: STEP_TYPE_LABELS[type], value: type }))}
            value={step.type}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              if (typeof next === "string" && next in STEP_TYPE_LABELS) {
                onChange({ type: next as StepType });
              }
            }}
          >
            <SelectTrigger id={`step-type-${step.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {STEP_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {STEP_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <StepFieldText
        id={`step-prompt-${step.id}`}
        label="지시문"
        value={step.prompt}
        multiline
        rows={2}
        onChange={(value) => onChange({ prompt: value })}
      />

      {step.type === "READING" ? (
        <>
          <StepFieldText
            id={`step-body-${step.id}`}
            label="본문"
            value={step.body}
            multiline
            rows={5}
            onChange={(value) => onChange({ body: value })}
          />
          <div className="@container grid gap-4 @[32rem]:grid-cols-2">
            <StepFieldText
              id={`step-source-${step.id}`}
              label="출처"
              value={step.source ?? ""}
              onChange={(value) => onChange({ source: value })}
            />
            <StepFieldText
              id={`step-caption-${step.id}`}
              label="삽화 캡션"
              value={step.caption ?? ""}
              onChange={(value) => onChange({ caption: value })}
            />
          </div>
        </>
      ) : null}

      {step.type === "MULTIPLE_CHOICE" ? (
        <StepOptionList
          options={step.options ?? []}
          correctOptionIds={step.correctOptionIds}
          onChange={(options) => onChange({ options })}
          onCorrectChange={(correctOptionIds) => onChange({ correctOptionIds })}
        />
      ) : null}

      {step.type === "FILL_BLANK" ? (
        <>
          <StepFieldText
            id={`step-blank-${step.id}`}
            label="문장 (빈칸은 ___ )"
            value={step.body}
            multiline
            onChange={(value) => onChange({ body: value })}
          />
          <ItemListEditor
            label="보기 토큰"
            items={step.tokens ?? []}
            onChange={(tokens) => onChange({ tokens })}
          />
        </>
      ) : null}

      {step.type === "SELECT" ? (
        <>
          <StepFieldText
            id={`step-select-body-${step.id}`}
            label="지문"
            value={step.body}
            multiline
            rows={4}
            onChange={(value) => onChange({ body: value })}
          />
          <ItemListEditor
            label="선택 가능 구간"
            items={(step.segments ?? []).map((segment) => ({
              id: segment.id,
              label: segment.label,
            }))}
            onChange={(items) =>
              onChange({
                segments: items.map((item) => ({
                  ...item,
                  correct: (step.segments ?? []).find((s) => s.id === item.id)?.correct,
                })),
              })
            }
          />
        </>
      ) : null}

      {step.type === "ORDER" ? (
        <ItemListEditor
          label="항목 (정답 순서)"
          items={step.items ?? []}
          onChange={(items) => onChange({ items })}
        />
      ) : null}

      {step.type === "MATCH" ? (
        <Field>
          <FieldLabel>짝 목록</FieldLabel>
          <div className="flex flex-col gap-2">
            {(step.pairs ?? []).map((pair) => (
              <div key={pair.id} className="flex flex-wrap items-center gap-2">
                <Input
                  value={pair.left}
                  placeholder="왼쪽"
                  className="min-w-[8rem] flex-1 basis-[min(100%,10rem)]"
                  onChange={(event) =>
                    onChange({
                      pairs: (step.pairs ?? []).map((row) =>
                        row.id === pair.id
                          ? Object.assign({}, row, { left: event.target.value })
                          : row,
                      ),
                    })
                  }
                />
                <Input
                  value={pair.right}
                  placeholder="오른쪽"
                  className="min-w-[8rem] flex-1 basis-[min(100%,10rem)]"
                  onChange={(event) =>
                    onChange({
                      pairs: (step.pairs ?? []).map((row) =>
                        row.id === pair.id
                          ? Object.assign({}, row, { right: event.target.value })
                          : row,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="shrink-0"
                  aria-label="짝 삭제"
                  onClick={() =>
                    onChange({ pairs: (step.pairs ?? []).filter((row) => row.id !== pair.id) })
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() =>
                onChange({
                  pairs: [...(step.pairs ?? []), { id: nextId("pair"), left: "", right: "" }],
                })
              }
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              짝 추가
            </Button>
          </div>
        </Field>
      ) : null}

      {step.type === "CATEGORIZE" ? (
        <>
          <ItemListEditor
            label="항목"
            items={step.items ?? []}
            onChange={(items) => onChange({ items })}
          />
          <Field>
            <FieldLabel>카테고리</FieldLabel>
            <div className="flex flex-col gap-2">
              {(step.categories ?? []).map((category) => (
                <Input
                  key={category.id}
                  value={category.label}
                  onChange={(event) =>
                    onChange({
                      categories: (step.categories ?? []).map((row) =>
                        row.id === category.id
                          ? Object.assign({}, row, { label: event.target.value })
                          : row,
                      ),
                    })
                  }
                />
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() =>
                  onChange({
                    categories: [
                      ...(step.categories ?? []),
                      { id: nextId("cat"), label: "새 카테고리", itemIds: [] },
                    ],
                  })
                }
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                카테고리 추가
              </Button>
            </div>
          </Field>
        </>
      ) : null}

      {step.type === "COMPARE" ? (
        <>
          <StepFieldText
            id={`step-a-${step.id}`}
            label="버전 A"
            value={step.versionA ?? ""}
            multiline
            onChange={(value) => onChange({ versionA: value })}
          />
          <StepFieldText
            id={`step-b-${step.id}`}
            label="버전 B"
            value={step.versionB ?? ""}
            multiline
            onChange={(value) => onChange({ versionB: value })}
          />
          <StepFieldText
            id={`step-points-${step.id}`}
            label="비교 포인트"
            value={step.comparePoints ?? ""}
            multiline
            rows={2}
            onChange={(value) => onChange({ comparePoints: value })}
          />
        </>
      ) : null}

      {step.type === "WRITE" ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-4">
            <StepFieldText
              id={`step-min-${step.id}`}
              label="최소 글자"
              value={String(step.minChars ?? "")}
              onChange={(value) => onChange({ minChars: Number(value) || 0 })}
            />
            <StepFieldText
              id={`step-target-${step.id}`}
              label="목표 글자"
              value={String(step.targetChars ?? "")}
              onChange={(value) => onChange({ targetChars: Number(value) || 0 })}
            />
            <StepFieldText
              id={`step-max-${step.id}`}
              label="최대 글자"
              value={String(step.maxChars ?? "")}
              onChange={(value) => onChange({ maxChars: Number(value) || 0 })}
            />
          </div>
          <StepFieldText
            id={`step-submit-${step.id}`}
            label="제출 조건"
            value={step.submitHint ?? ""}
            onChange={(value) => onChange({ submitHint: value })}
          />
        </>
      ) : null}

      {step.type === "AI_FEEDBACK" ? (
        <>
          <StepFieldText
            id={`step-coach-${step.id}`}
            label="코칭 지시문"
            value={step.coachingPrompt ?? ""}
            multiline
            onChange={(value) => onChange({ coachingPrompt: value })}
          />
          <StepFieldText
            id={`step-rubric-${step.id}`}
            label="루브릭 참조"
            value={step.rubricRef ?? ""}
            onChange={(value) => onChange({ rubricRef: value })}
          />
          <StepFieldText
            id={`step-scope-${step.id}`}
            label="피드백 범위"
            value={step.feedbackScope ?? ""}
            onChange={(value) => onChange({ feedbackScope: value })}
          />
        </>
      ) : null}

      {step.type !== "READING" && step.type !== "WRITE" && step.type !== "AI_FEEDBACK" ? (
        <StepFeedbackFields insight={step.insight} hint={step.hint} onChange={onChange} />
      ) : null}
    </FieldGroup>
  );
}

/* ─── Sortable tree nodes ───────────────────────────────────────────────── */

function TreeRenameInput({
  defaultValue,
  ariaLabel,
  fallbackTitle,
  onCommit,
  onCancel,
}: {
  defaultValue: string;
  ariaLabel: string;
  fallbackTitle: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
}) {
  // Escape/Enter unmounts this input; ignore the blur that follows so cancel
  // is not overwritten by a commit of the draft value.
  const skipBlurCommitRef = React.useRef(false);

  return (
    <CurriculumNodeRename
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      ref={(element) => {
        element?.focus();
        element?.select();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (skipBlurCommitRef.current) {
          skipBlurCommitRef.current = false;
          return;
        }
        onCommit(event.currentTarget.value.trim() || fallbackTitle);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          skipBlurCommitRef.current = true;
          onCommit(event.currentTarget.value.trim() || fallbackTitle);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          skipBlurCommitRef.current = true;
          onCancel();
        }
      }}
    />
  );
}

function SortableUnitRow({
  unit,
  index,
  selected,
  expanded,
  renaming,
  lessonCount,
  onSelect,
  onToggle,
  onRename,
  onCancelRename,
  onMenu,
  children,
}: {
  unit: UnitNode;
  index: number;
  selected: boolean;
  expanded: boolean;
  renaming: boolean;
  lessonCount: number;
  onSelect: () => void;
  onToggle: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
  onMenu: (action: "up" | "down" | "duplicate" | "remove" | "add-lesson" | "rename") => void;
  children?: React.ReactNode;
}) {
  const { ref, isDragging } = useSortable({
    id: unit.id,
    index,
    group: "units",
    type: "unit",
    accept: "unit",
    data: { kind: "unit", id: unit.id },
    disabled: renaming,
  });

  return (
    <CurriculumNode
      ref={ref as React.Ref<HTMLLIElement>}
      level="unit"
      state={unit.state}
      selected={selected}
      expanded={expanded}
      depth={0}
      className={cn("cursor-pointer", isDragging && "opacity-50")}
      onClick={onSelect}
    >
      <CurriculumNodeDisclosure
        expanded={expanded}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      />
      {renaming ? (
        <TreeRenameInput
          defaultValue={unit.title}
          ariaLabel="유닛 제목 수정"
          fallbackTitle={unit.title}
          onCommit={onRename}
          onCancel={onCancelRename}
        />
      ) : (
        <CurriculumNodeLabel level="unit">{unit.title}</CurriculumNodeLabel>
      )}
      <CurriculumNodeMeta level="unit" state={unit.state} quiet />
      <CurriculumNodeCount>{lessonCount}</CurriculumNodeCount>
      <CurriculumNodeActions
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}
            aria-label={`${unit.title} 메뉴`}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => onMenu("add-lesson")}>레슨 추가</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("rename")}>이름 바꾸기</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("duplicate")}>복제</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMenu("up")}>
              위로
              <DropdownMenuShortcut>Alt↑</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("down")}>
              아래로
              <DropdownMenuShortcut>Alt↓</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onMenu("remove")}>
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CurriculumNodeActions>
      {expanded ? (
        <CurriculumNodeChildren onClick={(event) => event.stopPropagation()}>
          {children}
        </CurriculumNodeChildren>
      ) : null}
    </CurriculumNode>
  );
}

function SortableLessonRow({
  lesson,
  unitId,
  index,
  selected,
  renaming,
  stepCount,
  onSelect,
  onRename,
  onCancelRename,
  onMenu,
}: {
  lesson: LessonNode;
  unitId: string;
  index: number;
  selected: boolean;
  renaming: boolean;
  stepCount: number;
  onSelect: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
  onMenu: (action: "up" | "down" | "duplicate" | "remove" | "rename") => void;
}) {
  const { ref, isDragging } = useSortable({
    id: lesson.id,
    index,
    group: unitId,
    type: "lesson",
    accept: "lesson",
    data: { kind: "lesson", id: lesson.id, unitId },
    disabled: renaming,
  });

  return (
    <CurriculumNode
      ref={ref as React.Ref<HTMLLIElement>}
      level="lesson"
      state={lesson.state}
      selected={selected}
      depth={1}
      className={cn("cursor-pointer", isDragging && "opacity-50")}
      onClick={onSelect}
    >
      <span className="size-6 shrink-0" aria-hidden />
      {renaming ? (
        <TreeRenameInput
          defaultValue={lesson.title}
          ariaLabel="레슨 제목 수정"
          fallbackTitle={lesson.title}
          onCommit={onRename}
          onCancel={onCancelRename}
        />
      ) : (
        <CurriculumNodeLabel level="lesson">{lesson.title}</CurriculumNodeLabel>
      )}
      <CurriculumNodeMeta level="lesson" state={lesson.state} quiet />
      <CurriculumNodeCount>{stepCount}</CurriculumNodeCount>
      <CurriculumNodeActions
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}
            aria-label={`${lesson.title} 메뉴`}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => onMenu("rename")}>이름 바꾸기</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("duplicate")}>복제</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMenu("up")}>
              위로
              <DropdownMenuShortcut>Alt↑</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("down")}>
              아래로
              <DropdownMenuShortcut>Alt↓</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onMenu("remove")}>
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CurriculumNodeActions>
    </CurriculumNode>
  );
}

function SortableStepCard({
  step,
  index,
  selected,
  onSelect,
  onUpdate,
  onMenu,
}: {
  step: LessonStep;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<LessonStep>) => void;
  onMenu: (action: "up" | "down" | "duplicate" | "remove") => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: step.id,
    index,
    group: "steps",
    type: "step",
    accept: "step",
    data: { kind: "step", id: step.id },
  });

  return (
    <LessonBuilderStep
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      index={index + 1}
      selected={selected}
      className={cn("cursor-pointer", isDragging && "opacity-50")}
      onClick={onSelect}
    >
      <LessonBuilderStepHandle
        ref={handleRef as React.Ref<HTMLButtonElement>}
        index={index + 1}
        aria-label={`${step.title} 스텝 이동`}
        onClick={(event) => event.stopPropagation()}
      />
      <LessonBuilderStepBody>
        <div className="flex flex-col gap-1.5">
          <LessonBuilderStepType>{STEP_TYPE_LABELS[step.type]}</LessonBuilderStepType>
          <p className="font-medium tracking-[-0.01em]">{step.title || "제목 없음"}</p>
          {!selected ? (
            <p className="line-clamp-2 text-muted-foreground">
              {step.prompt || step.body || "내용 없음"}
            </p>
          ) : null}
        </div>
      </LessonBuilderStepBody>
      <LessonBuilderStepActions onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}
            aria-label={`${step.title} 메뉴`}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => onMenu("duplicate")}>복제</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("up")}>위로</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("down")}>아래로</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onMenu("remove")}>
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </LessonBuilderStepActions>
      {selected ? (
        <LessonBuilderStepEditor onClick={(event) => event.stopPropagation()}>
          <StepTypeForm step={step} onChange={onUpdate} />
        </LessonBuilderStepEditor>
      ) : null}
    </LessonBuilderStep>
  );
}

/* ─── Panels ────────────────────────────────────────────────────────────── */

function OutlinePanel({
  units,
  selection,
  expanded,
  renaming,
  dispatch,
  className,
}: {
  units: UnitNode[];
  selection: CurriculumSelection | null;
  expanded: Record<string, boolean>;
  renaming: BuilderState["renaming"];
  dispatch: React.Dispatch<BuilderAction>;
  className?: string;
}) {
  const stats = countStats(units);

  const accessibility = React.useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: {
          draggable:
            "항목을 들려면 스페이스 또는 엔터 키를 누르세요. 위아래 방향키로 위치를 바꾸고, 스페이스 또는 엔터 키로 놓거나 Esc 키로 취소하세요.",
        },
        announcements: {
          dragstart({ operation: { source } }: DragStartEvent) {
            if (!source) return;
            return "항목을 들었습니다.";
          },
          dragover({ operation: { source, target } }: DragOverEvent) {
            if (!source || !target || !isSortable(target)) return;
            return `${target.index + 1}번째 위치로 이동했습니다.`;
          },
          dragend({ operation: { source }, canceled }: DragEndEvent) {
            if (!source || !isSortable(source)) return;
            if (canceled) return "이동을 취소했습니다.";
            return `${source.index + 1}번째 위치에 놓았습니다.`;
          },
        },
      }),
    [],
  );

  return (
    <CurriculumTree
      data-slot="curriculum-builder-outline"
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-border/70 bg-card p-3",
        className,
      )}
    >
      <CurriculumTreeHeader className="mb-1 shrink-0 px-0.5">
        <div className="min-w-0">
          <CurriculumTreeTitle>커리큘럼</CurriculumTreeTitle>
          <CurriculumTreeSummary>
            유닛 {stats.units} · 레슨 {stats.lessons} · 스텝 {stats.steps}
          </CurriculumTreeSummary>
        </div>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="h-7 px-2 text-xs"
          onClick={() => dispatch({ type: "unit/add" })}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          유닛 추가
        </Button>
      </CurriculumTreeHeader>

      {units.length === 0 ? (
        <Empty variant="compact" className="min-h-48 flex-1">
          <EmptyHeader>
            <EmptyTitle className="text-base">유닛이 없습니다</EmptyTitle>
            <EmptyDescription>첫 유닛을 추가해 커리큘럼을 시작하세요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" size="sm" onClick={() => dispatch({ type: "unit/add" })}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              유닛 추가
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DragDropProvider
          plugins={(defaults) => [
            ...defaults.filter((plugin) => plugin !== Accessibility),
            accessibility,
          ]}
          onDragEnd={(event) => {
            const { source } = event.operation;
            if (event.canceled || !source || !isSortable(source)) return;
            const data = source.data as { kind?: string; id?: string; unitId?: string } | undefined;
            if (data?.kind === "unit") {
              dispatch({ type: "unit/move", from: source.initialIndex, to: source.index });
              return;
            }
            if (data?.kind === "lesson" && data.id) {
              const toGroup = String(source.group ?? "");
              const fromGroup = String(source.initialGroup ?? data.unitId ?? "");
              if (toGroup && toGroup !== fromGroup) {
                dispatch({
                  type: "lesson/move",
                  lessonId: data.id,
                  toUnitId: toGroup,
                  toIndex: source.index,
                });
              } else if (fromGroup) {
                dispatch({
                  type: "lesson/reorder",
                  unitId: fromGroup,
                  from: source.initialIndex,
                  to: source.index,
                });
              }
            }
          }}
        >
          <CurriculumTreeList className="min-h-0 flex-1 overflow-auto">
            {units.map((unit, unitIndex) => {
              const unitSelected = selection?.kind === "unit" && selection.id === unit.id;
              const isExpanded = expanded[unit.id] !== false;
              return (
                <React.Fragment key={unit.id}>
                  <SortableUnitRow
                    unit={unit}
                    index={unitIndex}
                    selected={unitSelected}
                    expanded={isExpanded}
                    renaming={renaming?.kind === "unit" && renaming.id === unit.id}
                    lessonCount={unit.lessons.length}
                    onSelect={() =>
                      dispatch({ type: "select", selection: { kind: "unit", id: unit.id } })
                    }
                    onToggle={() => dispatch({ type: "toggle-expand", id: unit.id })}
                    onRename={(title) =>
                      dispatch({ type: "unit/update", id: unit.id, patch: { title } })
                    }
                    onCancelRename={() => dispatch({ type: "cancel-rename" })}
                    onMenu={(action) => {
                      if (action === "add-lesson") {
                        dispatch({ type: "lesson/add", unitId: unit.id });
                      } else if (action === "rename") {
                        dispatch({ type: "start-rename", kind: "unit", id: unit.id });
                      } else if (action === "duplicate") {
                        dispatch({ type: "unit/duplicate", id: unit.id });
                      } else if (action === "remove") {
                        dispatch({ type: "unit/remove", id: unit.id });
                      } else if (action === "up") {
                        dispatch({ type: "unit/move", from: unitIndex, to: unitIndex - 1 });
                      } else if (action === "down") {
                        dispatch({ type: "unit/move", from: unitIndex, to: unitIndex + 1 });
                      }
                    }}
                  >
                    {unit.lessons.map((lesson, lessonIndex) => {
                      const lessonSelected =
                        (selection?.kind === "lesson" && selection.id === lesson.id) ||
                        (selection?.kind === "step" && selection.lessonId === lesson.id);
                      return (
                        <SortableLessonRow
                          key={lesson.id}
                          lesson={lesson}
                          unitId={unit.id}
                          index={lessonIndex}
                          selected={Boolean(lessonSelected)}
                          renaming={renaming?.kind === "lesson" && renaming.id === lesson.id}
                          stepCount={lesson.steps.length}
                          onSelect={() =>
                            dispatch({
                              type: "select",
                              selection: { kind: "lesson", id: lesson.id },
                            })
                          }
                          onRename={(title) =>
                            dispatch({ type: "lesson/update", id: lesson.id, patch: { title } })
                          }
                          onCancelRename={() => dispatch({ type: "cancel-rename" })}
                          onMenu={(action) => {
                            if (action === "rename") {
                              dispatch({ type: "start-rename", kind: "lesson", id: lesson.id });
                            } else if (action === "duplicate") {
                              dispatch({ type: "lesson/duplicate", id: lesson.id });
                            } else if (action === "remove") {
                              dispatch({ type: "lesson/remove", id: lesson.id });
                            } else if (action === "up") {
                              dispatch({
                                type: "lesson/reorder",
                                unitId: unit.id,
                                from: lessonIndex,
                                to: lessonIndex - 1,
                              });
                            } else if (action === "down") {
                              dispatch({
                                type: "lesson/reorder",
                                unitId: unit.id,
                                from: lessonIndex,
                                to: lessonIndex + 1,
                              });
                            }
                          }}
                        />
                      );
                    })}
                    {unit.lessons.length === 0 ? (
                      <li className="px-3 py-2 ps-10 text-xs text-muted-foreground">
                        레슨이 없습니다.{" "}
                        <button
                          type="button"
                          className="underline underline-offset-2 hover:text-foreground"
                          onClick={() => dispatch({ type: "lesson/add", unitId: unit.id })}
                        >
                          레슨 추가
                        </button>
                      </li>
                    ) : null}
                  </SortableUnitRow>
                </React.Fragment>
              );
            })}
          </CurriculumTreeList>
        </DragDropProvider>
      )}
    </CurriculumTree>
  );
}

function UnitEditor({
  unit,
  dispatch,
}: {
  unit: UnitNode;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  return (
    <section data-slot="curriculum-builder-unit-editor" className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">유닛 정보</h2>
        <p className="text-sm text-muted-foreground">단원 제목과 학습 목표 요약을 정리합니다.</p>
      </header>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="unit-title">제목</FieldLabel>
          <Input
            id="unit-title"
            value={unit.title}
            onChange={(event) =>
              dispatch({ type: "unit/update", id: unit.id, patch: { title: event.target.value } })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="unit-description">설명</FieldLabel>
          <Textarea
            id="unit-description"
            value={unit.description}
            className="min-h-24"
            onChange={(event) =>
              dispatch({
                type: "unit/update",
                id: unit.id,
                patch: { description: event.target.value },
              })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="unit-state">상태</FieldLabel>
          <Select
            items={[...STATE_ITEMS]}
            value={unit.state === "locked" ? "draft" : unit.state}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              if (typeof next === "string") {
                dispatch({
                  type: "unit/update",
                  id: unit.id,
                  patch: { state: next as CurriculumNodeState },
                });
              }
            }}
          >
            <SelectTrigger id="unit-state" className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {STATE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">레슨 · {unit.lessons.length}</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => dispatch({ type: "lesson/add", unitId: unit.id })}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            레슨 추가
          </Button>
        </div>
        {unit.lessons.length === 0 ? (
          <Empty variant="compact">
            <EmptyHeader>
              <EmptyTitle className="text-base">레슨이 없습니다</EmptyTitle>
              <EmptyDescription>이 유닛에 첫 레슨을 추가하세요.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                size="sm"
                onClick={() => dispatch({ type: "lesson/add", unitId: unit.id })}
              >
                레슨 추가
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {unit.lessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40"
                  onClick={() =>
                    dispatch({ type: "select", selection: { kind: "lesson", id: lesson.id } })
                  }
                >
                  <span className="min-w-0 truncate font-medium">{lesson.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {lesson.steps.length} 스텝
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AddStepMenu({
  onAdd,
  trigger,
  align = "end",
  open: openProp,
  onOpenChange,
}: {
  onAdd: (type: StepType) => void;
  trigger: React.ReactElement;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = openProp ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} className="w-72 gap-2 p-3">
        <PopoverHeader className="gap-0.5 px-1">
          <PopoverTitle className="text-sm">스텝 유형</PopoverTitle>
          <PopoverDescription className="text-xs">추가할 활동 유형을 고르세요.</PopoverDescription>
        </PopoverHeader>
        <div className="grid grid-cols-2 gap-1">
          {STEP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium outline-none transition-colors hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-3.5 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 truncate">{STEP_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LessonEditor({
  lesson,
  selectedStepId,
  dispatch,
}: {
  lesson: LessonNode;
  selectedStepId?: string;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  const [insertIndex, setInsertIndex] = React.useState<number | null>(null);
  const accessibility = React.useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: {
          draggable:
            "스텝을 들려면 스페이스 또는 엔터 키를 누르세요. 위아래 방향키로 위치를 바꾸고, 스페이스 또는 엔터로 놓으세요.",
        },
        announcements: {
          dragstart() {
            return "스텝을 들었습니다.";
          },
          dragover({ operation: { target } }: DragOverEvent) {
            if (!target || !isSortable(target)) return;
            return `${target.index + 1}번째 위치로 이동했습니다.`;
          },
          dragend({ canceled }: DragEndEvent) {
            return canceled ? "이동을 취소했습니다." : "스텝을 놓았습니다.";
          },
        },
      }),
    [],
  );

  function addStep(type: StepType, index?: number) {
    dispatch({ type: "step/add", lessonId: lesson.id, stepType: type, index });
    setInsertIndex(null);
  }

  return (
    <LessonBuilder data-slot="curriculum-builder-lesson-editor">
      <LessonBuilderHeader className="items-center">
        <div className="min-w-0 flex-1">
          <LessonBuilderTitle>{lesson.title}</LessonBuilderTitle>
          <LessonBuilderMeta>
            {lesson.steps.length} 스텝 ·{" "}
            {lesson.state === "draft" ? "초안" : lesson.state === "ready" ? "준비됨" : "게시됨"}
          </LessonBuilderMeta>
        </div>
        <AddStepMenu
          align="end"
          onAdd={(type) => addStep(type)}
          trigger={
            <Button type="button" size="sm">
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
              스텝 추가
            </Button>
          }
        />
      </LessonBuilderHeader>

      <FieldGroup className="gap-4">
        <div className="@container grid gap-4 @[32rem]:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="lesson-title">레슨 제목</FieldLabel>
            <Input
              id="lesson-title"
              value={lesson.title}
              onChange={(event) =>
                dispatch({
                  type: "lesson/update",
                  id: lesson.id,
                  patch: { title: event.target.value },
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lesson-state">상태</FieldLabel>
            <Select
              items={[...STATE_ITEMS]}
              value={lesson.state === "locked" ? "draft" : lesson.state}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                if (typeof next === "string") {
                  dispatch({
                    type: "lesson/update",
                    id: lesson.id,
                    patch: { state: next as CurriculumNodeState },
                  });
                }
              }}
            >
              <SelectTrigger id="lesson-state" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {STATE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <DragDropProvider
        plugins={(defaults) => [
          ...defaults.filter((plugin) => plugin !== Accessibility),
          accessibility,
        ]}
        onDragEnd={(event) => {
          const { source } = event.operation;
          if (event.canceled || !source || !isSortable(source)) return;
          dispatch({
            type: "step/move",
            lessonId: lesson.id,
            from: source.initialIndex,
            to: source.index,
          });
        }}
      >
        <LessonBuilderCanvas>
          {lesson.steps.length === 0 ? (
            <LessonBuilderEmpty>
              <p className="text-sm font-medium">스텝이 없습니다</p>
              <p className="text-xs text-muted-foreground">유형을 골라 첫 스텝을 추가하세요.</p>
              <AddStepMenu
                align="center"
                onAdd={(type) => addStep(type)}
                trigger={
                  <Button type="button" size="sm" className="mt-1">
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                    스텝 추가
                  </Button>
                }
              />
            </LessonBuilderEmpty>
          ) : (
            lesson.steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {index > 0 ? (
                  <AddStepMenu
                    align="center"
                    open={insertIndex === index}
                    onOpenChange={(open) => setInsertIndex(open ? index : null)}
                    onAdd={(type) => addStep(type, index)}
                    trigger={
                      <LessonBuilderStepInsert
                        aria-label={`${index}번째와 ${index + 1}번째 사이에 스텝 삽입`}
                      />
                    }
                  />
                ) : null}
                <SortableStepCard
                  step={step}
                  index={index}
                  selected={step.id === selectedStepId}
                  onSelect={() =>
                    dispatch({
                      type: "select",
                      selection: { kind: "step", lessonId: lesson.id, stepId: step.id },
                    })
                  }
                  onUpdate={(patch) =>
                    dispatch({
                      type: "step/update",
                      lessonId: lesson.id,
                      stepId: step.id,
                      patch,
                    })
                  }
                  onMenu={(action) => {
                    if (action === "duplicate") {
                      dispatch({
                        type: "step/duplicate",
                        lessonId: lesson.id,
                        stepId: step.id,
                      });
                    } else if (action === "remove") {
                      dispatch({ type: "step/remove", lessonId: lesson.id, stepId: step.id });
                    } else if (action === "up") {
                      dispatch({
                        type: "step/move",
                        lessonId: lesson.id,
                        from: index,
                        to: index - 1,
                      });
                    } else if (action === "down") {
                      dispatch({
                        type: "step/move",
                        lessonId: lesson.id,
                        from: index,
                        to: index + 1,
                      });
                    }
                  }}
                />
              </React.Fragment>
            ))
          )}
        </LessonBuilderCanvas>
      </DragDropProvider>
    </LessonBuilder>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────── */

export type CurriculumBuilderProps = {
  units: UnitNode[];
  onUnitsChange?: (units: UnitNode[]) => void;
  selection?: CurriculumSelection | null;
  onSelectionChange?: (selection: CurriculumSelection | null) => void;
  className?: string;
};

/**
 * Interactive curriculum outline + lesson/step editor for course admin.
 */
export function CurriculumBuilder({
  units: unitsProp,
  onUnitsChange,
  selection: selectionProp,
  onSelectionChange,
  className,
}: CurriculumBuilderProps) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => {
    const units = normalizeUnits(unitsProp);
    const firstLesson = units[0]?.lessons[0];
    const defaultSelection = firstLesson
      ? ({ kind: "lesson", id: firstLesson.id } as CurriculumSelection)
      : units[0]
        ? ({ kind: "unit", id: units[0].id } as CurriculumSelection)
        : null;
    return {
      units,
      // Honor controlled selection on mount. CourseAdmin tabs unmount the
      // builder; defaulting to the first lesson would overwrite parent state
      // via the selection notify effect and break validation "이동".
      selection: selectionProp !== undefined ? selectionProp : defaultSelection,
      expanded: Object.fromEntries(units.map((unit) => [unit.id, true])),
      undo: null,
      renaming: null,
    } satisfies BuilderState;
  });

  const [outlineOpen, setOutlineOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const unitsRef = React.useRef(state.units);
  const selectionRef = React.useRef(state.selection);
  const onUnitsChangeRef = React.useRef(onUnitsChange);
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  // Seed with the controlled prop so remount does not push default selection
  // upstream before the parent's intended selection is applied.
  const lastNotifiedSelection = React.useRef<CurriculumSelection | null | undefined>(
    selectionProp !== undefined ? selectionProp : undefined,
  );
  const lastNotifiedUnits = React.useRef<UnitNode[] | null>(null);

  unitsRef.current = state.units;
  selectionRef.current = state.selection;
  onUnitsChangeRef.current = onUnitsChange;
  onSelectionChangeRef.current = onSelectionChange;

  React.useEffect(() => {
    if (lastNotifiedUnits.current === state.units) return;
    lastNotifiedUnits.current = state.units;
    onUnitsChangeRef.current?.(state.units);
  }, [state.units]);

  React.useEffect(() => {
    if (selectionProp === undefined) return;
    if (selectionEquals(selectionRef.current, selectionProp)) return;
    dispatch({ type: "select", selection: selectionProp });
  }, [selectionProp]);

  React.useEffect(() => {
    if (selectionEquals(lastNotifiedSelection.current, state.selection)) return;
    const previous = lastNotifiedSelection.current;
    lastNotifiedSelection.current = state.selection;
    onSelectionChangeRef.current?.(state.selection);
    // Close mobile outline only after a real user-driven selection change.
    if (previous !== undefined) setOutlineOpen(false);
  }, [state.selection]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const root = rootRef.current;
      // Keep destructive/edit shortcuts scoped to the builder surface so focus
      // on surrounding chrome (tabs, toolbars, other panels) cannot mutate data.
      if (!target || !root?.contains(target)) return;

      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        if (typing) return;
        event.preventDefault();
        dispatch({ type: "undo" });
        return;
      }
      if (typing || !state.selection) return;

      if (event.key === "F2") {
        if (state.selection.kind === "unit") {
          dispatch({ type: "start-rename", kind: "unit", id: state.selection.id });
        } else if (state.selection.kind === "lesson") {
          dispatch({ type: "start-rename", kind: "lesson", id: state.selection.id });
        }
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (state.selection.kind === "unit") {
          event.preventDefault();
          dispatch({ type: "unit/remove", id: state.selection.id });
        } else if (state.selection.kind === "lesson") {
          event.preventDefault();
          dispatch({ type: "lesson/remove", id: state.selection.id });
        } else if (state.selection.kind === "step") {
          event.preventDefault();
          dispatch({
            type: "step/remove",
            lessonId: state.selection.lessonId,
            stepId: state.selection.stepId,
          });
        }
      }

      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const delta = event.key === "ArrowUp" ? -1 : 1;
        const current = state.selection;
        if (current.kind === "unit") {
          const from = state.units.findIndex((unit) => unit.id === current.id);
          dispatch({ type: "unit/move", from, to: from + delta });
        } else if (current.kind === "lesson") {
          const hit = findLesson(state.units, current.id);
          if (!hit) return;
          const from = hit.unit.lessons.findIndex((lesson) => lesson.id === current.id);
          dispatch({
            type: "lesson/reorder",
            unitId: hit.unit.id,
            from,
            to: from + delta,
          });
        } else if (current.kind === "step") {
          const hit = findLesson(state.units, current.lessonId);
          if (!hit) return;
          const from = hit.lesson.steps.findIndex((step) => step.id === current.stepId);
          dispatch({
            type: "step/move",
            lessonId: current.lessonId,
            from,
            to: from + delta,
          });
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.selection, state.units]);

  const selectedUnit =
    state.selection?.kind === "unit" ? findUnit(state.units, state.selection.id) : undefined;
  const lessonId =
    state.selection?.kind === "lesson"
      ? state.selection.id
      : state.selection?.kind === "step"
        ? state.selection.lessonId
        : undefined;
  const lessonHit = lessonId ? findLesson(state.units, lessonId) : undefined;
  // Lesson selection must not fake-select steps[0]; Delete still targets the lesson.
  const selectedStepId = state.selection?.kind === "step" ? state.selection.stepId : undefined;

  const outline = (
    <OutlinePanel
      units={state.units}
      selection={state.selection}
      expanded={state.expanded}
      renaming={state.renaming}
      dispatch={dispatch}
      className="h-full"
    />
  );

  return (
    <div
      ref={rootRef}
      data-slot="curriculum-builder"
      className={cn(
        "@container/curriculum-builder flex h-full min-h-0 min-w-0 flex-col gap-3",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 @[56rem]/curriculum-builder:hidden">
        <Button type="button" size="sm" variant="outline" onClick={() => setOutlineOpen(true)}>
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} data-icon="inline-start" />
          구조
        </Button>
        <p className="truncate text-xs text-muted-foreground">
          {selectedUnit?.title ?? lessonHit?.lesson.title ?? "항목을 선택하세요"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 @[56rem]/curriculum-builder:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)] @[56rem]/curriculum-builder:grid-rows-[minmax(0,1fr)]">
        <div className="hidden min-h-0 min-w-0 @[56rem]/curriculum-builder:block @[56rem]/curriculum-builder:h-full">
          {outline}
        </div>

        <div
          data-slot="curriculum-builder-workspace"
          className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-[1.25rem] border border-border/70 bg-card p-4 sm:p-5"
        >
          {!state.selection ? (
            <Empty variant="compact" className="min-h-48">
              <EmptyHeader>
                <EmptyTitle className="text-base">유닛 또는 레슨을 선택하세요</EmptyTitle>
                <EmptyDescription>
                  왼쪽에서 단원을 고르면 정보를 수정하고, 레슨을 고르면 스텝을 편집합니다.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" size="sm" onClick={() => dispatch({ type: "unit/add" })}>
                  유닛 추가
                </Button>
              </EmptyContent>
            </Empty>
          ) : null}

          {selectedUnit ? <UnitEditor unit={selectedUnit} dispatch={dispatch} /> : null}

          {lessonHit ? (
            <LessonEditor
              lesson={lessonHit.lesson}
              selectedStepId={selectedStepId}
              dispatch={dispatch}
            />
          ) : null}
        </div>
      </div>

      {state.undo ? (
        <output className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-sm">
          <p className="min-w-0 truncate text-muted-foreground">{state.undo.message}</p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: "undo" })}
            >
              실행 취소
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: "dismiss-undo" })}
            >
              닫기
            </Button>
          </div>
        </output>
      ) : null}

      <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
        <SheetContent side="left" className="w-[min(100%,22rem)] p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>커리큘럼 구조</SheetTitle>
            <SheetDescription>유닛과 레슨을 선택합니다.</SheetDescription>
          </SheetHeader>
          <div className="h-full p-3">{outline}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CurriculumBuilder;
