"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#ui/lib/utils"

type PairState =
  | "idle"
  | "active"
  | "paired"
  | "correct"
  | "incorrect"
  | "locked"

type PairConnection = {
  from: string
  to: string
  state?: Extract<PairState, "paired" | "correct" | "incorrect" | "active">
}

type PairLine = {
  key: string
  d: string
  state: PairConnection["state"]
}

function PairBoard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pair-board"
      className={cn(
        "@container/pair relative grid w-full grid-cols-2 gap-x-3 gap-y-3 @[28rem]/pair:gap-x-6 @[40rem]/pair:gap-x-10",
        className
      )}
      {...props}
    />
  )
}

function PairColumn({
  className,
  side,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
}) {
  return (
    <div
      data-slot="pair-column"
      data-side={side}
      className={cn(
        "flex flex-col gap-3",
        side === "left" && "[&_[data-slot=pair-item]]:flex-row-reverse",
        className
      )}
      {...props}
    />
  )
}

const pairItemVariants = cva(
  "group/pair-item flex w-full items-center gap-3 rounded-3xl border px-4 py-3.5 text-left text-sm font-medium tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      state: {
        idle: "border-border/80 bg-card text-foreground shadow-2xs hover:bg-accent/40",
        active:
          "border-primary/35 bg-accent/55 text-foreground shadow-2xs ring-1 ring-primary/10",
        paired: "border-border bg-surface/80 text-foreground",
        correct: "border-foreground/20 bg-foreground/[0.035] text-foreground",
        incorrect: "border-destructive/30 bg-destructive/6 text-destructive",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      state: "idle",
    },
  }
)

function PairItem({
  className,
  state = "idle",
  pairId,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof pairItemVariants> & {
    state?: PairState
    pairId?: string
  }) {
  return (
    <button
      type="button"
      data-slot="pair-item"
      data-state={state}
      data-pair-id={pairId}
      disabled={state === "locked"}
      className={cn(pairItemVariants({ state }), className)}
      {...props}
    />
  )
}

function PairMarker({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pair-marker"
      className={cn(
        "flex size-2.5 shrink-0 rounded-full bg-border transition-colors group-data-[state=active]/pair-item:bg-primary group-data-[state=paired]/pair-item:bg-foreground/45 group-data-[state=correct]/pair-item:bg-foreground group-data-[state=incorrect]/pair-item:bg-destructive",
        className
      )}
      {...props}
    />
  )
}

function PairLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pair-label"
      className={cn("min-w-0 flex-1 leading-6", className)}
      {...props}
    />
  )
}

function getAnchor(
  board: HTMLElement,
  item: HTMLElement,
  side: "left" | "right"
): { x: number; y: number } | null {
  const boardRect = board.getBoundingClientRect()
  const marker = item.querySelector<HTMLElement>("[data-slot=pair-marker]")
  const target = marker ?? item
  const rect = target.getBoundingClientRect()
  const inset = marker ? rect.width / 2 : 10

  return {
    x:
      (side === "left" ? rect.right - inset : rect.left + inset) -
      boardRect.left,
    y: rect.top + rect.height / 2 - boardRect.top,
  }
}

function buildPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const delta = Math.max(24, Math.abs(to.x - from.x) * 0.45)
  return `M ${from.x} ${from.y} C ${from.x + delta} ${from.y}, ${to.x - delta} ${to.y}, ${to.x} ${to.y}`
}

function PairConnections({
  className,
  connections,
  labels,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  connections: PairConnection[]
  labels?: Record<string, string>
}) {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [lines, setLines] = React.useState<PairLine[]>([])

  const measure = React.useCallback(() => {
    const host = hostRef.current
    const board = host?.closest<HTMLElement>("[data-slot=pair-board]")
    if (!host || !board) {
      setLines([])
      return
    }

    const next = connections.flatMap((connection) => {
      const fromItem = board.querySelector<HTMLElement>(
        `[data-slot=pair-item][data-pair-id="${connection.from}"]`
      )
      const toItem = board.querySelector<HTMLElement>(
        `[data-slot=pair-item][data-pair-id="${connection.to}"]`
      )
      if (!fromItem || !toItem) return []

      const from = getAnchor(board, fromItem, "left")
      const to = getAnchor(board, toItem, "right")
      if (!from || !to) return []

      return [
        {
          key: `${connection.from}:${connection.to}`,
          d: buildPath(from, to),
          state: connection.state ?? "paired",
        },
      ]
    })

    setLines(next)
  }, [connections])

  React.useLayoutEffect(() => {
    measure()

    const host = hostRef.current
    const board = host?.closest<HTMLElement>("[data-slot=pair-board]")
    if (!board || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => measure())
    observer.observe(board)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div
      ref={hostRef}
      data-slot="pair-connections"
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
      {...props}
    >
      <svg aria-hidden className="size-full overflow-visible">
        {lines.map((line) => (
          <path
            key={line.key}
            d={line.d}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            className={cn(
              "transition-[stroke,opacity] duration-200",
              line.state === "active" && "stroke-primary/45",
              line.state === "paired" && "stroke-foreground/25",
              line.state === "correct" && "stroke-foreground/55",
              line.state === "incorrect" && "stroke-destructive/55"
            )}
          />
        ))}
      </svg>
      {labels ? (
        <ul className="sr-only">
          {connections.map((connection) => (
            <li key={`${connection.from}:${connection.to}`}>
              {labels[connection.from] ?? connection.from}
              {" — "}
              {labels[connection.to] ?? connection.to}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function PairLink({
  className,
  ...props
}: React.ComponentProps<"div"> & {
  leftLabel?: React.ReactNode
  rightLabel?: React.ReactNode
}) {
  const { leftLabel, rightLabel, children, ...rest } = props

  return (
    <div
      data-slot="pair-link"
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/70 bg-surface/60 px-3.5 py-2.5 text-sm",
        className
      )}
      {...rest}
    >
      {children ?? (
        <>
          <span className="min-w-0 flex-1 font-medium tracking-[-0.01em]">
            {leftLabel}
          </span>
          <span aria-hidden className="text-muted-foreground">
            —
          </span>
          <span className="min-w-0 flex-1 text-right text-muted-foreground">
            {rightLabel}
          </span>
        </>
      )}
    </div>
  )
}

function PairLinks({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pair-links"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  )
}

export {
  PairBoard,
  PairColumn,
  PairConnections,
  PairItem,
  PairLabel,
  PairLink,
  PairLinks,
  PairMarker,
  pairItemVariants,
}
export type { PairConnection, PairState }
