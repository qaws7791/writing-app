"use client"

import * as React from "react"

import { AdminShell } from "#ui/blocks/admin-shell"
import { Badge } from "#ui/components/primitives/badge"
import { Button } from "#ui/components/primitives/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#ui/components/primitives/field"
import { Input } from "#ui/components/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#ui/components/primitives/select"
import { Textarea } from "#ui/components/primitives/textarea"

const DOMAINS = [
  "일상·실용문",
  "학업·논술문",
  "업무·비즈니스 문서",
  "창작·문학",
  "설득·의견문",
  "정보전달·설명문",
  "자기서사·기록",
  "관계·소통 문서",
  "공적·행정 문서",
  "디지털·뉴미디어",
] as const

const DIFFICULTIES = ["입문", "기본", "심화"] as const

/**
 * Admin writing-task editor: draft fields and publish, without mutating started writings.
 */
export function WritingTaskAdmin({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [domain, setDomain] =
    React.useState<(typeof DOMAINS)[number]>("설득·의견문")
  const [difficulty, setDifficulty] =
    React.useState<(typeof DIFFICULTIES)[number]>("심화")
  const [status, setStatus] = React.useState<"draft" | "published">("draft")

  return (
    <AdminShell
      data-slot="writing-task-admin"
      className={className}
      activeNav="writing-tasks"
      title="숙제 폐지 찬반 칼럼"
      breadcrumb={[
        { label: "콘텐츠" },
        { label: "쓰기 과제", href: "#writing-tasks" },
        { label: "숙제 폐지 찬반 칼럼" },
      ]}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={status === "published" ? "success" : "outline"}>
            {status === "published" ? "발행됨" : "초안"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            이미 시작한 글은 이 초안을 발행해도 바뀌지 않습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            초안 저장
          </Button>
          <Button type="button" onClick={() => setStatus("published")}>
            발행
          </Button>
        </div>
      </div>

      <form
        className="grid max-w-3xl gap-6"
        onSubmit={(event) => event.preventDefault()}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="task-title">제목</FieldLabel>
            <Input id="task-title" defaultValue="숙제 폐지 찬반 칼럼" />
          </Field>
          <Field>
            <FieldLabel htmlFor="task-domain">도메인</FieldLabel>
            <Select
              items={DOMAINS.map((item) => ({ label: item, value: item }))}
              value={domain}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (
                  typeof next === "string" &&
                  DOMAINS.includes(next as (typeof DOMAINS)[number])
                ) {
                  setDomain(next as (typeof DOMAINS)[number])
                }
              }}
            >
              <SelectTrigger id="task-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-type">유형</FieldLabel>
            <Input id="task-type" defaultValue="칼럼" />
            <FieldDescription>
              유형 이름은 과제에 붙입니다. 칩에는 발행된 유형만 나타납니다.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-difficulty">난이도</FieldLabel>
            <Select
              items={DIFFICULTIES.map((item) => ({ label: item, value: item }))}
              value={difficulty}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (
                  typeof next === "string" &&
                  DIFFICULTIES.includes(next as (typeof DIFFICULTIES)[number])
                ) {
                  setDifficulty(next as (typeof DIFFICULTIES)[number])
                }
              }}
            >
              <SelectTrigger id="task-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((item) => (
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
              defaultValue="숙제를 줄이자는 주장과 근거, 예상 반론을 한 칼럼으로 씁니다."
            />
            <FieldDescription>
              미리보기 오버레이에 보이는 고르기용 설명입니다.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="task-audience">독자</FieldLabel>
            <Input id="task-audience" defaultValue="학교 신문 독자" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="task-min">최소 글자 수</FieldLabel>
              <Input id="task-min" type="number" defaultValue={200} />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-goal">목표 글자 수</FieldLabel>
              <Input id="task-goal" type="number" defaultValue={500} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="task-requirements">필수 요소</FieldLabel>
            <Textarea
              id="task-requirements"
              defaultValue={
                "한 문단 안에 주장과 근거를 연결한다\n반대 의견을 한 문장 이상 다룬다\n격식체를 유지한다"
              }
            />
            <FieldDescription>
              작성 화면 브리프와 점검 비중의 기준입니다. 줄마다 한 항목입니다.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AdminShell>
  )
}

export default WritingTaskAdmin
