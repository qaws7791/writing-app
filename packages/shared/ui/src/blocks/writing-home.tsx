"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Delete02Icon,
  PlusSignIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { LearnerShell } from "#ui/blocks/learner-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#ui/components/primitives/alert-dialog"
import { Badge } from "#ui/components/primitives/badge"
import { Button } from "#ui/components/primitives/button"
import { cardVariants } from "#ui/components/primitives/card"

type WritingPiece = {
  id: string
  taskId: string
  taskTitle: string
  domain: string
  typeName: string
  difficulty: "입문" | "기본" | "심화"
  preview: string
  charCount: number
  updatedAt: string
}

const PIECES: WritingPiece[] = [
  {
    id: "w-01",
    taskId: "invite",
    taskTitle: "주말 소풍 초대 메시지",
    domain: "일상·실용문",
    typeName: "초대장",
    difficulty: "입문",
    preview:
      "이번 주말 한강에서 도시락을 나눠 먹자고 친구들에게 짧게 초대합니다. 비 오면 실내로 옮긴다는 말도 넣었습니다.",
    charCount: 86,
    updatedAt: "오늘 14:20",
  },
  {
    id: "w-02",
    taskId: "invite",
    taskTitle: "주말 소풍 초대 메시지",
    domain: "일상·실용문",
    typeName: "초대장",
    difficulty: "입문",
    preview: "토요일 낮에 한강 갈까요?",
    charCount: 14,
    updatedAt: "어제 21:08",
  },
  {
    id: "w-03",
    taskId: "column",
    taskTitle: "숙제 폐지 찬반 칼럼",
    domain: "설득·의견문",
    typeName: "칼럼",
    difficulty: "심화",
    preview:
      "숙제를 없애자는 주장은 쉬는 시간을 돌려주자는 말과 같습니다. 다만 연습이 사라지면 수업만으로 남는 것이 무엇인지 먼저 물어야 합니다.",
    charCount: 612,
    updatedAt: "8월 11일",
  },
]

function groupPieces(pieces: readonly WritingPiece[]) {
  const groups: {
    difficulty: WritingPiece["difficulty"]
    domain: string
    pieces: WritingPiece[]
    taskId: string
    title: string
    typeName: string
  }[] = []
  const indexByTaskId = new Map<string, number>()

  for (const piece of pieces) {
    const index = indexByTaskId.get(piece.taskId)
    if (index === undefined) {
      indexByTaskId.set(piece.taskId, groups.length)
      groups.push({
        difficulty: piece.difficulty,
        domain: piece.domain,
        pieces: [piece],
        taskId: piece.taskId,
        title: piece.taskTitle,
        typeName: piece.typeName,
      })
      continue
    }

    const group = groups[index]
    if (group === undefined) continue
    group.pieces.push(piece)
  }

  return groups
}

function WritingPaper({
  piece,
  onDelete,
}: {
  piece: WritingPiece
  onDelete: (piece: WritingPiece) => void
}) {
  const preview = piece.preview.trim()

  return (
    <article
      data-slot="writing-home-piece"
      className={cn(
        cardVariants({ size: "default", variant: "surface" }),
        "relative gap-0 overflow-visible rounded-[1.75rem] py-0"
      )}
    >
      <a
        href="#studio"
        className="flex flex-col gap-4 rounded-[1.75rem] px-6 py-5 pr-14 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
        onClick={(event) => event.preventDefault()}
      >
        <p
          className={cn(
            "line-clamp-3 min-h-[5.25rem] text-base leading-7",
            preview.length > 0 ? "text-foreground/80" : "text-muted-foreground"
          )}
        >
          {preview.length > 0 ? preview : "아직 본문이 없습니다"}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {piece.updatedAt} · {piece.charCount.toLocaleString("ko-KR")}자
        </p>
      </a>
      <div className="absolute top-2.5 right-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label={`${piece.taskTitle}, ${piece.updatedAt} 삭제`}
          onClick={() => onDelete(piece)}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        </Button>
      </div>
    </article>
  )
}

function StartWritingCta() {
  return (
    <a
      href="#catalog"
      className={cn(
        cardVariants({ size: "lg", variant: "muted" }),
        "gap-6 rounded-[1.75rem] px-8 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
      )}
      onClick={(event) => event.preventDefault()}
    >
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={SparklesIcon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
        <span className="text-sm font-medium text-muted-foreground">
          지금 써볼까요?
        </span>
      </div>
      <h2 className="font-heading text-2xl leading-tight font-semibold tracking-[-0.01em]">
        목적이 있는 글을
        <br />
        시작해 보세요
      </h2>
      <div className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs">
        <span>과제 둘러보기</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="size-4"
        />
      </div>
    </a>
  )
}

/**
 * Learner writing home: pieces grouped by task, with body preview on each sheet.
 */
export function WritingHome({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [pieces, setPieces] = React.useState(PIECES)
  const [pendingDelete, setPendingDelete] = React.useState<WritingPiece | null>(
    null
  )
  const groups = groupPieces(pieces)

  return (
    <LearnerShell
      data-slot="writing-home"
      className={className}
      currentNav="write"
      {...props}
    >
      <main className="@container mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex w-full max-w-2xl flex-col gap-10">
          <header className="flex items-end justify-between gap-4">
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.01em] sm:text-4xl sm:leading-[1.15]">
              이어 쓸 글
            </h1>
            {pieces.length > 0 ? (
              <Button type="button" size="sm" variant="outline">
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                과제 둘러보기
              </Button>
            ) : null}
          </header>

          {groups.length > 0 ? (
            <div className="flex flex-col gap-10">
              {groups.map((group) => (
                <section
                  key={group.taskId}
                  aria-labelledby={`writing-task-${group.taskId}`}
                  className="flex flex-col gap-3"
                >
                  <header className="flex flex-col gap-1.5 px-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {group.domain} · {group.typeName}
                      </p>
                      <Badge variant="outline">{group.difficulty}</Badge>
                    </div>
                    <h2
                      id={`writing-task-${group.taskId}`}
                      className="font-heading text-xl font-semibold tracking-[-0.01em] sm:text-2xl sm:leading-[1.2]"
                    >
                      {group.title}
                    </h2>
                  </header>
                  <ul className="flex flex-col gap-3">
                    {group.pieces.map((piece) => (
                      <li key={piece.id}>
                        <WritingPaper
                          onDelete={setPendingDelete}
                          piece={piece}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <StartWritingCta />
          )}
        </div>
      </main>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.taskTitle} 본문과 점검 기록이 함께 사라집니다.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) return
                setPieces((current) =>
                  current.filter((piece) => piece.id !== pendingDelete.id)
                )
                setPendingDelete(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LearnerShell>
  )
}

export default WritingHome
