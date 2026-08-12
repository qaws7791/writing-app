"use client"

import { useState } from "react"
import Link from "next/link"
import { completeWritingSelfCheck } from "@workspace/http-client/learner"
import { CheckCircleIcon } from "@workspace/ui/components/icons"
import { Badge } from "@workspace/ui/components/primitives/badge"
import {
  Button,
  buttonVariants,
} from "@workspace/ui/components/primitives/button"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"
import {
  Insight,
  InsightDescription,
} from "@workspace/ui/components/learning/insight"
import { Prose, ProseBody } from "@workspace/ui/components/learning/prose"

import {
  readWritingModeOption,
  readWritingTitle,
} from "@/features/focused-writing/model/writing-copy"
import { WritingFocusShell } from "@/features/focused-writing/ui/writing-focus-shell"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

export function WritingSelfCheck({
  initialWriting,
}: {
  readonly initialWriting: LearnerWritingDetailDto
}) {
  const [writing, setWriting] = useState(initialWriting)
  const [completing, setCompleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mode = readWritingModeOption(writing.mode)
  const editorHref = `/app/writing/${encodeURIComponent(writing.id)}`
  const completed = writing.status === "checked"

  const handleComplete = async () => {
    setCompleting(true)
    setErrorMessage(null)
    const result = await settleLearnerApiRequest(
      completeWritingSelfCheck(writing.id, {
        expectedVersion: writing.version,
      })
    )

    if (result.status === "error") {
      setCompleting(false)
      setErrorMessage(
        readLearnerApiErrorCode(result.error) === "WRITING_VERSION_CONFLICT"
          ? "다른 화면에서 글이 변경되었습니다. 편집 화면에서 글을 다시 확인해 주세요."
          : "점검 완료 상태를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요."
      )
      return
    }

    setWriting(result.value)
    setCompleting(false)
  }

  return (
    <WritingFocusShell
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Link
            className={buttonVariants({
              className: "w-full sm:w-auto",
              size: "lg",
              variant: "secondary",
            })}
            href={editorHref}
          >
            다시 다듬기
          </Link>
          {completed ? (
            <Link
              className={buttonVariants({
                className: "w-full sm:w-auto",
                size: "lg",
              })}
              href="/app/writing"
            >
              쓰기 홈으로
            </Link>
          ) : (
            <Button
              className="w-full sm:w-auto"
              disabled={completing}
              onClick={() => void handleComplete()}
              size="lg"
            >
              {completing ? "저장 중" : "점검 마치기"}
            </Button>
          )}
        </div>
      }
      header={
        <>
          <p className="font-medium">{mode.label} 자기 점검</p>
          {completed ? (
            <Badge role="status" variant="success">
              <CheckCircleIcon aria-hidden="true" size={16} />
              점검 완료
            </Badge>
          ) : (
            <Badge variant="outline">점수 없음</Badge>
          )}
        </>
      }
    >
      <article>
        <Prose>
          <section className="space-y-4" aria-labelledby="writing-review-title">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                내가 쓴 글
              </p>
              <h1
                className="font-heading text-2xl font-semibold tracking-[-0.025em] text-balance"
                id="writing-review-title"
              >
                {readWritingTitle(writing.title)}
              </h1>
            </div>
            <Card variant="muted">
              <CardContent>
                <ProseBody className="break-words whitespace-pre-wrap">
                  <p>
                    {writing.body.length === 0 ? (
                      <span className="text-muted-foreground">
                        본문이 비어 있습니다.
                      </span>
                    ) : (
                      writing.body
                    )}
                  </p>
                </ProseBody>
              </CardContent>
            </Card>
          </section>

          <section
            className="space-y-4"
            aria-labelledby="self-check-questions-title"
          >
            <div className="space-y-1">
              <h2
                className="font-heading text-xl font-semibold tracking-[-0.02em]"
                id="self-check-questions-title"
              >
                세 가지 질문
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                정답을 고르지 말고 글을 다시 읽으며 생각해 보세요.
              </p>
            </div>
            <ol className="grid gap-3">
              {mode.selfCheckQuestions.map((question, index) => (
                <li key={question}>
                  <Card size="sm" variant="frame">
                    <CardContent className="flex gap-4 text-base font-medium leading-7">
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        {index + 1}
                      </span>
                      <span>{question}</span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {errorMessage === null ? null : (
            <Insight role="alert" tone="incorrect">
              <InsightDescription>{errorMessage}</InsightDescription>
            </Insight>
          )}
        </Prose>
      </article>
    </WritingFocusShell>
  )
}
