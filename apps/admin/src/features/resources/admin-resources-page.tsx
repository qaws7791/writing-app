"use client"

import Link from "next/link"
import { useRef, useState, useTransition } from "react"

import { StatusBadge } from "@/components/status-badge"
import { readPlainTextFromTiptapDocument } from "@/features/resources/resource-document-content"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminDeleteResourceDocumentResult,
  AdminResourceDocumentDetail,
  AdminResourceDocumentList,
  ReadAdminResourcesInput,
} from "@/lib/api/admin-api"
import {
  ArchiveIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import {
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Textarea } from "@workspace/ui/components/ui/textarea"

type StatusMessage = {
  readonly message: string
  readonly tone: "danger" | "success"
}

type ResourceDocumentAction = "archive" | "delete"

export function AdminResourcesPage({
  createResourceDocument,
  documentsResult,
  filters,
}: {
  readonly createResourceDocument: (
    formData: FormData
  ) => Promise<AdminApiResult<AdminResourceDocumentDetail>>
  readonly documentsResult: AdminApiResult<AdminResourceDocumentList>
  readonly filters: ReadAdminResourcesInput
}) {
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  if (documentsResult.status === "error") {
    return (
      <>
        <ResourcesHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{documentsResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const documents = documentsResult.value

  return (
    <>
      <ResourcesHeading totalDocuments={documents.pagination.totalItems} />
      <form
        ref={formRef}
        aria-label="자료 필터"
        className="mb-4 flex flex-wrap items-center gap-3"
        method="get"
      >
        <FilterToolbarField className="relative min-w-[220px] flex-1 gap-0">
          <FilterToolbarLabel className="sr-only">자료 검색</FilterToolbarLabel>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            aria-label="자료 검색"
            className="pl-10 font-semibold"
            defaultValue={filters.query}
            name="query"
            placeholder="제목 또는 본문 검색…"
          />
        </FilterToolbarField>
        <FilterToolbarField className="gap-0">
          <FilterToolbarLabel className="sr-only">상태</FilterToolbarLabel>
          <Select
            aria-label="상태"
            defaultValue={filters.status}
            name="status"
            onValueChange={() => {
              formRef.current?.requestSubmit()
            }}
          >
            <SelectTrigger
              className="w-[140px] font-semibold"
              variant="outlined"
            >
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="archived">보관</SelectItem>
            </SelectContent>
          </Select>
        </FilterToolbarField>
        <FilterToolbarField className="gap-0">
          <FilterToolbarLabel className="sr-only">
            페이지 크기
          </FilterToolbarLabel>
          <Select
            aria-label="페이지 크기"
            defaultValue={String(filters.pageSize)}
            name="pageSize"
            onValueChange={() => {
              formRef.current?.requestSubmit()
            }}
          >
            <SelectTrigger
              className="w-[120px] font-semibold"
              variant="outlined"
            >
              <SelectValue placeholder="20개" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="20">20개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
            </SelectContent>
          </Select>
        </FilterToolbarField>
        <span className="ml-auto text-sm font-bold text-muted-foreground">
          {documents.pagination.totalItems}개
        </span>
      </form>
      <article className="mb-4 rounded-4xl bg-surface p-6">
        <h2 className="m-0 mb-1 text-[1.125rem] font-bold text-foreground">
          새 자료
        </h2>
        <p className="mb-4 text-[0.875rem] font-medium text-muted-foreground">
          운영 자료를 작성합니다.
        </p>
        <form
          className="grid gap-3.5"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await createResourceDocument(formData)

              setMessage(
                result.status === "ok"
                  ? { message: "자료를 저장했습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
            })
          }}
        >
          <Field>
            <FieldLabel htmlFor="resource-title">제목</FieldLabel>
            <Input id="resource-title" name="title" required maxLength={120} />
          </Field>
          <Field>
            <FieldLabel htmlFor="resource-body">본문</FieldLabel>
            <Textarea
              className="min-h-56"
              id="resource-body"
              name="body"
              required
            />
          </Field>
          <Button disabled={isPending} type="submit">
            <PlusIcon aria-hidden="true" size={16} />
            저장
          </Button>
        </form>
      </article>
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      {documents.items.length === 0 ? (
        <Empty role="status">
          <EmptyHeader>
            <EmptyTitle>조건에 맞는 자료가 없습니다.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3">
          {documents.items.map((document) => (
            <Link
              className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-card border border-border/50 bg-background p-3.5 transition-colors hover:border-foreground/20 hover:bg-surface-hover max-[860px]:grid-cols-[44px_minmax(0,1fr)]"
              href={`/resources/${document.id}`}
              key={document.id}
            >
              <span className="grid size-11 place-items-center rounded-card bg-surface text-muted-foreground">
                <FileTextIcon aria-hidden="true" size={18} />
              </span>
              <span className="grid min-w-0 gap-1">
                <strong className="text-title-md font-black text-foreground">
                  {document.title}
                </strong>
                <small className="overflow-hidden text-ellipsis whitespace-nowrap text-label-sm font-semibold text-muted-foreground">
                  {document.author.name} · {formatDate(document.updatedAt)}
                </small>
                <em className="overflow-hidden text-ellipsis whitespace-nowrap text-label-sm font-semibold not-italic text-muted-foreground">
                  {document.excerpt}
                </em>
              </span>
              <span className="max-[860px]:col-start-2">
                <StatusBadge status={document.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

function ResourcesHeading({
  totalDocuments,
}: {
  readonly totalDocuments?: number
}) {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">자료실</h1>
      <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
        {totalDocuments === undefined
          ? "운영 자료와 교육 문서를 저장하고 검색합니다."
          : `자료 ${totalDocuments}개 · 운영 자료와 교육 문서를 관리합니다.`}
      </p>
    </header>
  )
}

export function AdminResourceDetailPage({
  archiveResourceDocument,
  deleteResourceDocument,
  documentResult,
  updateResourceDocument,
}: {
  readonly archiveResourceDocument: () => Promise<
    AdminApiResult<{
      readonly archived: true
    }>
  >
  readonly deleteResourceDocument: () => Promise<
    AdminApiResult<AdminDeleteResourceDocumentResult>
  >
  readonly documentResult: AdminApiResult<AdminResourceDocumentDetail>
  readonly updateResourceDocument: (
    formData: FormData
  ) => Promise<AdminApiResult<AdminResourceDocumentDetail>>
}) {
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [pendingAction, setPendingAction] =
    useState<ResourceDocumentAction | null>(null)
  const [isPending, startTransition] = useTransition()

  if (documentResult.status === "error") {
    return (
      <>
        <PageHeader
          description="자료 문서 내용을 확인하고 수정합니다."
          title="자료 상세"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{documentResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const document = documentResult.value

  return (
    <>
      <PageHeader
        description={`${document.author.name} · ${formatDate(
          document.updatedAt
        )}`}
        title={document.title}
      />
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
      <Surface variant="panel">
        <form
          className="grid gap-3.5"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await updateResourceDocument(formData)

              setMessage(
                result.status === "ok"
                  ? { message: "자료를 수정했습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
            })
          }}
        >
          <Field>
            <FieldLabel htmlFor="resource-detail-title">제목</FieldLabel>
            <Input
              defaultValue={document.title}
              id="resource-detail-title"
              maxLength={120}
              name="title"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="resource-detail-body">본문</FieldLabel>
            <Textarea
              className="min-h-56"
              defaultValue={readPlainTextFromTiptapDocument(document.content)}
              id="resource-detail-body"
              name="body"
              required
            />
          </Field>
          <div className="flex gap-2">
            <Button disabled={isPending} type="submit">
              저장
            </Button>
            <Button
              variant="outline"
              disabled={isPending || document.status === "archived"}
              onClick={() => setPendingAction("archive")}
              type="button"
            >
              <ArchiveIcon aria-hidden="true" size={15} />
              보관
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => setPendingAction("delete")}
              type="button"
            >
              <TrashIcon aria-hidden="true" size={15} />
              삭제
            </Button>
          </div>
        </form>
      </Surface>
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null)
          }
        }}
      >
        {pendingAction === null ? null : (
          <AlertDialogContent>
            <AlertDialogTitle>
              {pendingAction === "archive"
                ? "자료 보관 확인"
                : "자료 삭제 확인"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "archive"
                ? `${document.title} 자료를 자료실 목록에서 보관 상태로 전환합니다.`
                : `${document.title} 자료를 삭제합니다.`}
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  const action = pendingAction

                  startTransition(async () => {
                    const result =
                      action === "archive"
                        ? await archiveResourceDocument()
                        : await deleteResourceDocument()

                    setMessage(
                      result.status === "ok"
                        ? {
                            message:
                              action === "archive"
                                ? "자료를 보관했습니다."
                                : "자료를 삭제했습니다.",
                            tone: "success",
                          }
                        : { message: result.error.message, tone: "danger" }
                    )
                    setPendingAction(null)
                  })
                }}
                type="button"
              >
                {pendingAction === "archive" ? "보관하기" : "삭제하기"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}
