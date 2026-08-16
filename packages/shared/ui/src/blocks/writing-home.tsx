"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "#ui/components/primitives/empty"

type WritingPiece = {
  id: string
  taskTitle: string
  domain: string
  typeName: string
  difficulty: "입문" | "기본" | "심화"
  charCount: number
  startedAt: string
}

const PIECES: WritingPiece[] = [
  {
    id: "w-01",
    taskTitle: "주말 소풍 초대 메시지",
    domain: "일상·실용문",
    typeName: "초대장",
    difficulty: "입문",
    charCount: 86,
    startedAt: "오늘 14:20",
  },
  {
    id: "w-02",
    taskTitle: "지원 동기 한 문단",
    domain: "자기서사·기록",
    typeName: "자기소개서",
    difficulty: "기본",
    charCount: 240,
    startedAt: "어제 21:08",
  },
  {
    id: "w-03",
    taskTitle: "숙제 폐지 찬반 칼럼",
    domain: "설득·의견문",
    typeName: "칼럼",
    difficulty: "심화",
    charCount: 612,
    startedAt: "8월 11일",
  },
]

function WritingPieceCard({
  piece,
  onDelete,
}: {
  piece: WritingPiece
  onDelete: (piece: WritingPiece) => void
}) {
  return (
    <article
      data-slot="writing-home-piece"
      className={cn(
        cardLike(),
        "flex flex-col gap-3 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <a
        href="#studio"
        className="min-w-0 flex-1 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        onClick={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {piece.domain} · {piece.typeName}
          </p>
          <Badge variant="outline">{piece.difficulty}</Badge>
        </div>
        <h2 className="mt-1 font-heading text-base font-semibold tracking-[-0.02em] text-balance">
          {piece.taskTitle}
        </h2>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {piece.startedAt} · {piece.charCount.toLocaleString("ko-KR")}자
        </p>
      </a>
      <div className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label={`${piece.taskTitle} 삭제`}
          onClick={() => onDelete(piece)}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        </Button>
      </div>
    </article>
  )
}

function cardLike() {
  return "rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 shadow-2xs"
}

/**
 * Learner writing home: a single list of pieces, plus a path to the task catalog.
 */
export function WritingHome({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [pieces, setPieces] = React.useState(PIECES)
  const [pendingDelete, setPendingDelete] = React.useState<WritingPiece | null>(
    null
  )

  return (
    <LearnerShell
      data-slot="writing-home"
      className={className}
      currentNav="write"
      {...props}
    >
      <main className="@container mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]">
              쓰기
            </h1>
            <p className="text-sm leading-6 text-pretty text-muted-foreground">
              글을 이어 쓰거나, 과제를 골라 새 글을 시작합니다.
            </p>
          </div>
          <Button type="button">
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            과제 둘러보기
          </Button>
        </header>

        <div className="flex flex-col gap-3">
          {pieces.length > 0 ? (
            pieces.map((piece) => (
              <WritingPieceCard
                key={piece.id}
                piece={piece}
                onDelete={setPendingDelete}
              />
            ))
          ) : (
            <Empty variant="frame">
              <EmptyHeader>
                <EmptyTitle>아직 글이 없습니다</EmptyTitle>
                <EmptyDescription>
                  과제를 고르면 목적이 정해진 글을 시작할 수 있습니다.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
