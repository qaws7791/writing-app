"use client"

import { Archive, FileText, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import { AdminHeader } from "@/components/admin-header"
import { readPlainTextFromTiptapDocument } from "@/features/resources/resource-document-content"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminDeleteResourceDocumentResult,
  AdminResourceDocumentDetail,
  AdminResourceDocumentList,
  ReadAdminResourcesInput,
} from "@/lib/api/admin-api"

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
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (documentsResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="운영 자료와 교육 문서를 저장하고 검색합니다."
          title="자료실"
        />
        <section className="admin-alert" role="alert">
          {documentsResult.error.message}
        </section>
      </>
    )
  }

  const documents = documentsResult.value

  return (
    <>
      <AdminHeader
        description="운영 자료와 교육 문서를 저장하고 검색합니다."
        title="자료실"
      />
      <form className="admin-toolbar" method="get" aria-label="자료 필터">
        <label>
          <span>자료 검색</span>
          <input
            aria-label="자료 검색"
            defaultValue={filters.query}
            name="query"
            placeholder="제목 또는 본문 검색"
          />
        </label>
        <label>
          <span>상태</span>
          <select aria-label="상태" defaultValue={filters.status} name="status">
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label>
          <span>페이지 크기</span>
          <select
            aria-label="페이지 크기"
            defaultValue={filters.pageSize}
            name="pageSize"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
          </select>
        </label>
        <button className="admin-secondary-button" type="submit">
          필터 적용
        </button>
      </form>
      <section className="admin-panel admin-resource-create-panel">
        <div className="admin-section-heading">
          <h2>새 자료</h2>
          <p>운영 자료를 작성합니다.</p>
        </div>
        <form
          className="admin-resource-form"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await createResourceDocument(formData)

              setMessage(
                result.status === "ok"
                  ? "자료를 저장했습니다."
                  : result.error.message
              )
            })
          }}
        >
          <label className="admin-form-field">
            <span>제목</span>
            <input name="title" required maxLength={120} />
          </label>
          <label className="admin-form-field">
            <span>본문</span>
            <textarea name="body" required />
          </label>
          <button
            className="admin-primary-button"
            disabled={isPending}
            type="submit"
          >
            <Plus aria-hidden="true" size={16} />
            저장
          </button>
        </form>
      </section>
      {message === null ? null : (
        <p className="admin-inline-status" role="status">
          {message}
        </p>
      )}
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>자료 목록</h2>
          <p>
            총 {documents.pagination.totalItems}개 · {documents.pagination.page}
            /{documents.pagination.totalPages} 페이지
          </p>
        </div>
        {documents.items.length === 0 ? (
          <p className="admin-empty">조건에 맞는 자료가 없습니다.</p>
        ) : (
          <div className="admin-resource-list">
            {documents.items.map((document) => (
              <Link
                className="admin-resource-list-item"
                href={`/resources/${document.id}`}
                key={document.id}
              >
                <span className="admin-resource-list-item__icon">
                  <FileText aria-hidden="true" size={18} />
                </span>
                <span>
                  <strong>{document.title}</strong>
                  <small>
                    {document.author.name} · {formatDate(document.updatedAt)}
                  </small>
                  <em>{document.excerpt}</em>
                </span>
                <span className="admin-status-pill">{document.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
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
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (documentResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="자료 문서 내용을 확인하고 수정합니다."
          title="자료 상세"
        />
        <section className="admin-alert" role="alert">
          {documentResult.error.message}
        </section>
      </>
    )
  }

  const document = documentResult.value

  return (
    <>
      <AdminHeader
        description={`${document.author.name} · ${formatDate(
          document.updatedAt
        )}`}
        title={document.title}
      />
      {message === null ? null : (
        <p className="admin-inline-status" role="status">
          {message}
        </p>
      )}
      <section className="admin-panel">
        <form
          className="admin-resource-form"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await updateResourceDocument(formData)

              setMessage(
                result.status === "ok"
                  ? "자료를 수정했습니다."
                  : result.error.message
              )
            })
          }}
        >
          <label className="admin-form-field">
            <span>제목</span>
            <input
              defaultValue={document.title}
              maxLength={120}
              name="title"
              required
            />
          </label>
          <label className="admin-form-field">
            <span>본문</span>
            <textarea
              defaultValue={readPlainTextFromTiptapDocument(document.content)}
              name="body"
              required
            />
          </label>
          <div className="admin-row-actions">
            <button
              className="admin-primary-button"
              disabled={isPending}
              type="submit"
            >
              저장
            </button>
            <button
              className="admin-secondary-button"
              disabled={isPending || document.status === "archived"}
              onClick={() => {
                startTransition(async () => {
                  const result = await archiveResourceDocument()

                  setMessage(
                    result.status === "ok"
                      ? "자료를 보관했습니다."
                      : result.error.message
                  )
                })
              }}
              type="button"
            >
              <Archive aria-hidden="true" size={15} />
              보관
            </button>
            <button
              className="admin-danger-button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteResourceDocument()

                  setMessage(
                    result.status === "ok"
                      ? "자료를 삭제했습니다."
                      : result.error.message
                  )
                })
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
              삭제
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}
