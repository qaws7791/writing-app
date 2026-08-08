import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/registry/luma/lib/utils";

type CurriculumNodeLevel = "course" | "unit" | "lesson" | "step";
type CurriculumNodeState = "draft" | "ready" | "locked" | "published";

const CURRICULUM_NODE_LEVEL_LABELS: Record<CurriculumNodeLevel, string> = {
  course: "과정",
  unit: "단원",
  lesson: "레슨",
  step: "스텝",
};

const CURRICULUM_NODE_STATE_LABELS: Record<CurriculumNodeState, string> = {
  draft: "초안",
  ready: "준비됨",
  locked: "잠김",
  published: "게시됨",
};

const CURRICULUM_NODE_DEPTH: Record<CurriculumNodeLevel, number> = {
  course: 0,
  unit: 1,
  lesson: 2,
  step: 3,
};

function CurriculumTree({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="curriculum-tree"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      {children}
    </section>
  );
}

function CurriculumTreeHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="curriculum-tree-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function CurriculumTreeTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-tree-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function CurriculumTreeSummary({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="curriculum-tree-summary"
      className={cn("text-[11px] tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function CurriculumTreeList({ className, role = "tree", ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="curriculum-tree-list"
      role={role}
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

const curriculumNodeVariants = cva(
  "group/node relative flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-2xl px-1.5 py-1 outline-none",
  {
    variants: {
      state: {
        draft: "hover:bg-muted/40",
        ready: "hover:bg-muted/40",
        locked: "opacity-70",
        published: "bg-foreground/[0.03] hover:bg-foreground/[0.05] dark:bg-foreground/[0.05]",
      },
      selected: {
        true: "bg-foreground/[0.05] ring-1 ring-foreground/10 dark:bg-foreground/[0.08]",
        false: "",
      },
    },
    defaultVariants: {
      state: "draft",
      selected: false,
    },
  },
);

function CurriculumNode({
  className,
  level = "course",
  state = "draft",
  selected = false,
  expanded,
  depth,
  children,
  style,
  ref,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof curriculumNodeVariants> & {
    level?: CurriculumNodeLevel;
    state?: CurriculumNodeState;
    selected?: boolean;
    expanded?: boolean;
    depth?: number;
  }) {
  const resolvedDepth = depth ?? CURRICULUM_NODE_DEPTH[level];

  return (
    <li
      ref={ref}
      data-slot="curriculum-node"
      data-level={level}
      data-state={state}
      data-selected={selected || undefined}
      data-expanded={expanded === undefined ? undefined : expanded}
      role="treeitem"
      aria-level={resolvedDepth + 1}
      aria-selected={selected}
      aria-expanded={expanded}
      style={
        {
          ...style,
          "--curriculum-depth": resolvedDepth,
        } as React.CSSProperties
      }
      className={cn(
        curriculumNodeVariants({ state, selected }),
        "ps-[calc(0.375rem+var(--curriculum-depth)*0.875rem)]",
        className,
      )}
      {...props}
    >
      {children}
    </li>
  );
}

function CurriculumNodeDisclosure({
  className,
  expanded = false,
  label,
  ...props
}: React.ComponentProps<"button"> & {
  expanded?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      data-slot="curriculum-node-disclosure"
      data-expanded={expanded || undefined}
      aria-label={label ?? (expanded ? "접기" : "펼치기")}
      aria-expanded={expanded}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        className,
      )}
      {...props}
    >
      <HugeiconsIcon
        icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
        strokeWidth={2}
        className="size-3.5"
      />
    </button>
  );
}

function CurriculumNodeLabel({
  className,
  level = "course",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  level?: CurriculumNodeLevel;
}) {
  return (
    <div
      data-slot="curriculum-node-label"
      data-level={level}
      className={cn("min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CurriculumNodeRename({ className, ref, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      ref={ref}
      data-slot="curriculum-node-rename"
      className={cn(
        "min-w-0 flex-1 rounded-lg border border-border/70 bg-background px-2 py-1 text-sm font-medium tracking-[-0.01em] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        className,
      )}
      {...props}
    />
  );
}

function CurriculumNodeMeta({
  className,
  level,
  state,
  children,
  quiet = false,
  ...props
}: React.ComponentProps<"p"> & {
  level?: CurriculumNodeLevel;
  state?: CurriculumNodeState;
  /** When true, omit the repeating level label and hide draft (default) state. */
  quiet?: boolean;
}) {
  const content =
    children ??
    (quiet
      ? state && state !== "draft"
        ? CURRICULUM_NODE_STATE_LABELS[state]
        : null
      : [
          level ? CURRICULUM_NODE_LEVEL_LABELS[level] : null,
          state ? CURRICULUM_NODE_STATE_LABELS[state] : null,
        ]
          .filter(Boolean)
          .join(" · "));

  if (!content) return null;

  return (
    <p
      data-slot="curriculum-node-meta"
      data-level={level}
      data-state={state}
      className={cn(
        "max-w-[7.5rem] shrink-0 truncate text-[11px] tabular-nums text-muted-foreground",
        quiet &&
          "inline-flex max-w-none items-center gap-1 before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:opacity-50",
        className,
      )}
      {...props}
    >
      {content}
    </p>
  );
}

function CurriculumNodeCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="curriculum-node-count"
      className={cn(
        "shrink-0 text-[11px] tabular-nums text-muted-foreground group-hover/node:hidden group-focus-within/node:hidden",
        className,
      )}
      {...props}
    />
  );
}

function CurriculumNodeActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-node-actions"
      className={cn(
        "-me-0.5 hidden shrink-0 items-center gap-0.5 group-hover/node:flex group-focus-within/node:flex",
        className,
      )}
      {...props}
    />
  );
}

function CurriculumNodeChildren({
  className,
  role = "group",
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="curriculum-node-children"
      role={role}
      className={cn("flex w-full basis-full flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function CurriculumNodeDropIndicator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="curriculum-node-drop-indicator"
      aria-hidden
      className={cn("pointer-events-none mx-2 h-0.5 rounded-full bg-foreground/40", className)}
      {...props}
    />
  );
}

export {
  CurriculumTree,
  CurriculumTreeHeader,
  CurriculumTreeTitle,
  CurriculumTreeSummary,
  CurriculumTreeList,
  CurriculumNode,
  CurriculumNodeLabel,
  CurriculumNodeRename,
  CurriculumNodeMeta,
  CurriculumNodeDisclosure,
  CurriculumNodeCount,
  CurriculumNodeActions,
  CurriculumNodeChildren,
  CurriculumNodeDropIndicator,
  curriculumNodeVariants,
  CURRICULUM_NODE_LEVEL_LABELS,
  CURRICULUM_NODE_STATE_LABELS,
  type CurriculumNodeLevel,
  type CurriculumNodeState,
};
