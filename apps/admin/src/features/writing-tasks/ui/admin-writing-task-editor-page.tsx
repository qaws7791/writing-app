"use client"

import { useState, useTransition } from "react"

import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import type {
  AdminWritingTaskCommandResult,
  AdminWritingTaskDetail,
} from "@/features/writing-tasks/model/admin-writing-tasks"
import {
  writingTaskDifficultyOptions,
  writingTaskDomainOptions,
} from "@/features/writing-tasks/model/admin-writing-tasks"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Badge } from "@workspace/ui/components/primitives/badge"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/primitives/field"
import { Input } from "@workspace/ui/components/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select"
import { Textarea } from "@workspace/ui/components/primitives/textarea"

type EditorDraft = {
  audience: string
  difficulty: AdminWritingTaskDetail["difficulty"]
  domain: AdminWritingTaskDetail["domain"]
  editVersion: number
  goalChars: number
  minChars: number
  requiredElementsText: string
  situation: string
  title: string
  typeName: string
}

export function AdminWritingTaskEditorPage({
  publishTask,
  saveTask,
  taskResult,
}: {
  readonly publishTask: (
    writingTaskId: string,
    editVersion: number
  ) => Promise<AdminWritingTaskCommandResult>
  readonly saveTask: (
    writingTaskId: string,
    input: unknown
  ) => Promise<AdminWritingTaskCommandResult>
  readonly taskResult: AdminRequestResult<AdminWritingTaskDetail>
}) {
  if (taskResult.status === "error") {
    return (
      <>
        <AdminPageHeader description="쓰기 과제 초안을 저장하고 발행합니다." />
        <Alert role="alert" variant="destructive">
          <AlertDescription>{taskResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  return (
    <WritingTaskEditorForm
      initialTask={taskResult.value}
      publishTask={publishTask}
      saveTask={saveTask}
    />
  )
}

function WritingTaskEditorForm({
  initialTask,
  publishTask,
  saveTask,
}: {
  readonly initialTask: AdminWritingTaskDetail
  readonly publishTask: (
    writingTaskId: string,
    editVersion: number
  ) => Promise<AdminWritingTaskCommandResult>
  readonly saveTask: (
    writingTaskId: string,
    input: unknown
  ) => Promise<AdminWritingTaskCommandResult>
}) {
  const [task, setTask] = useState(initialTask)
  const [draft, setDraft] = useState(() => toEditorDraft(initialTask))
  const [conflictLatest, setConflictLatest] =
    useState<AdminWritingTaskDetail | null>(null)
  const [message, setMessage] = useState<{
    readonly text: string
    readonly tone: "danger" | "success"
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const applyTask = (next: AdminWritingTaskDetail) => {
    setTask(next)
    setDraft(toEditorDraft(next))
    setConflictLatest(null)
  }

  const writeDocument = () => ({
    audience: draft.audience,
    difficulty: draft.difficulty,
    domain: draft.domain,
    editVersion: draft.editVersion,
    goalChars: draft.goalChars,
    minChars: draft.minChars,
    requiredElements: readRequiredElements(draft.requiredElementsText),
    situation: draft.situation,
    title: draft.title,
    typeName: draft.typeName,
  })

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveTask(task.id, writeDocument())
      if (result.status === "ok") {
        applyTask(result.value)
        setMessage({ text: "초안을 저장했습니다.", tone: "success" })
        return
      }
      if (result.status === "conflict") {
        setConflictLatest(result.latest)
        setMessage({
          text: "다른 화면에서 과제가 변경되었습니다. 최신본으로 바꾸거나 로컬 초안을 유지하세요.",
          tone: "danger",
        })
        return
      }
      setMessage({ text: result.error.message, tone: "danger" })
    })
  }

  const handlePublish = () => {
    startTransition(async () => {
      const saved = await saveTask(task.id, writeDocument())
      if (saved.status === "conflict") {
        setConflictLatest(saved.latest)
        setMessage({
          text: "다른 화면에서 과제가 변경되었습니다. 최신본으로 바꾸거나 로컬 초안을 유지하세요.",
          tone: "danger",
        })
        return
      }
      if (saved.status === "error") {
        setMessage({ text: saved.error.message, tone: "danger" })
        return
      }

      applyTask(saved.value)
      const published = await publishTask(
        saved.value.id,
        saved.value.editVersion
      )
      if (published.status === "ok") {
        applyTask(published.value)
        setMessage({ text: "과제를 발행했습니다.", tone: "success" })
        return
      }
      if (published.status === "conflict") {
        setConflictLatest(published.latest)
        setMessage({
          text: "다른 화면에서 과제가 변경되었습니다. 최신본으로 바꾸거나 로컬 초안을 유지하세요.",
          tone: "danger",
        })
        return
      }
      setMessage({ text: published.error.message, tone: "danger" })
    })
  }

  return (
    <>
      <AdminPageHeader
        actions={
          <div className="flex gap-2">
            <Button
              disabled={isPending}
              onClick={handleSave}
              type="button"
              variant="outline"
            >
              초안 저장
            </Button>
            <Button disabled={isPending} onClick={handlePublish} type="button">
              발행
            </Button>
          </div>
        }
        description="이미 시작한 글은 이 초안을 발행해도 바뀌지 않습니다."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={task.status === "published" ? "success" : "outline"}>
          {task.status === "published" ? "발행됨" : "초안"}
        </Badge>
        <p className="text-xs text-muted-foreground">
          이미 시작한 글은 이 초안 발행으로 바뀌지 않습니다.
        </p>
      </div>

      {message === null ? null : (
        <Alert
          role={message.tone === "danger" ? "alert" : "status"}
          variant={message.tone === "danger" ? "destructive" : "default"}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {conflictLatest === null ? null : (
        <div
          aria-label="충돌 해결"
          className="flex flex-wrap gap-2"
          role="group"
        >
          <Button
            onClick={() => {
              applyTask(conflictLatest)
              setMessage({ text: "최신 초안으로 바꿨습니다.", tone: "success" })
            }}
            type="button"
            variant="outline"
          >
            최신본으로 교체
          </Button>
          <Button
            onClick={() => {
              setDraft((current) => ({
                ...current,
                editVersion: conflictLatest.editVersion,
              }))
              setTask(conflictLatest)
              setConflictLatest(null)
              setMessage({
                text: "로컬 초안을 최신 version에 맞춰 유지합니다. 다시 저장해 주세요.",
                tone: "success",
              })
            }}
            type="button"
            variant="outline"
          >
            로컬 초안 유지
          </Button>
        </div>
      )}

      <form
        className="grid max-w-3xl gap-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="task-title">제목</FieldLabel>
            <Input
              id="task-title"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              value={draft.title}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="task-domain">도메인</FieldLabel>
            <Select
              items={writingTaskDomainOptions.map((item) => ({
                label: item,
                value: item,
              }))}
              onValueChange={(value) => {
                if (
                  typeof value === "string" &&
                  writingTaskDomainOptions.includes(
                    value as (typeof writingTaskDomainOptions)[number]
                  )
                ) {
                  setDraft((current) => ({
                    ...current,
                    domain: value as AdminWritingTaskDetail["domain"],
                  }))
                }
              }}
              value={draft.domain}
            >
              <SelectTrigger id="task-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {writingTaskDomainOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-type">유형</FieldLabel>
            <Input
              id="task-type"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  typeName: event.target.value,
                }))
              }
              value={draft.typeName}
            />
            <FieldDescription>
              유형 이름은 과제에 붙입니다. 칩에는 발행된 유형만 나타납니다.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-difficulty">난이도</FieldLabel>
            <Select
              items={writingTaskDifficultyOptions.map((item) => ({
                label: item,
                value: item,
              }))}
              onValueChange={(value) => {
                if (
                  typeof value === "string" &&
                  writingTaskDifficultyOptions.includes(
                    value as (typeof writingTaskDifficultyOptions)[number]
                  )
                ) {
                  setDraft((current) => ({
                    ...current,
                    difficulty: value as AdminWritingTaskDetail["difficulty"],
                  }))
                }
              }}
              value={draft.difficulty}
            >
              <SelectTrigger id="task-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {writingTaskDifficultyOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-situation">상황</FieldLabel>
            <Textarea
              id="task-situation"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  situation: event.target.value,
                }))
              }
              value={draft.situation}
            />
            <FieldDescription>
              미리보기 오버레이에 보이는 고르기용 설명입니다.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-audience">독자</FieldLabel>
            <Input
              id="task-audience"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  audience: event.target.value,
                }))
              }
              value={draft.audience}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="task-min">최소 글자 수</FieldLabel>
              <Input
                id="task-min"
                min={0}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    minChars: Number(event.target.value) || 0,
                  }))
                }
                type="number"
                value={draft.minChars}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-goal">목표 글자 수</FieldLabel>
              <Input
                id="task-goal"
                min={0}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    goalChars: Number(event.target.value) || 0,
                  }))
                }
                type="number"
                value={draft.goalChars}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="task-requirements">필수 요소</FieldLabel>
            <Textarea
              id="task-requirements"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  requiredElementsText: event.target.value,
                }))
              }
              value={draft.requiredElementsText}
            />
            <FieldDescription>
              작성 화면 브리프와 점검 비중의 기준입니다. 줄마다 한 항목입니다.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  )
}

function toEditorDraft(task: AdminWritingTaskDetail): EditorDraft {
  return {
    audience: task.audience,
    difficulty: task.difficulty,
    domain: task.domain,
    editVersion: task.editVersion,
    goalChars: task.goalChars,
    minChars: task.minChars,
    requiredElementsText: task.requiredElements.join("\n"),
    situation: task.situation,
    title: task.title,
    typeName: task.typeName,
  }
}

function readRequiredElements(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
