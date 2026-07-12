"use client"

import { useState, useTransition } from "react"
import { FileTextIcon, FolderIcon, SearchIcon } from "lucide-react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type {
  AdminResourceSearchItem,
  AdminResourceTreeScope,
} from "@/features/resources/resource-library-model"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Spinner } from "@workspace/ui/components/ui/spinner"

export function ResourceSearch({
  api,
  onSelect,
  scope,
}: {
  readonly api: ResourceTreeApi
  readonly onSelect: (item: AdminResourceSearchItem) => void
  readonly scope: AdminResourceTreeScope
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<readonly AdminResourceSearchItem[]>([])

  return (
    <section aria-label="자료 검색" className="grid gap-2 px-3">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault()
          const normalizedQuery = query.trim()

          if (normalizedQuery === "") {
            setResults([])
            setErrorMessage(null)
            return
          }

          startTransition(async () => {
            const result = await api.searchResources({
              limit: 50,
              query: normalizedQuery,
              scope,
            })

            if (result.status === "error") {
              setErrorMessage(result.error.message)
              return
            }

            setErrorMessage(null)
            setResults(result.value.items)
          })
        }}
      >
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="자료 검색어"
          className="h-9 pl-9"
          onChange={(event) => {
            const nextQuery = event.currentTarget.value
            setQuery(nextQuery)

            if (nextQuery.trim() === "") {
              setResults([])
              setErrorMessage(null)
            }
          }}
          placeholder="자료 검색"
          value={query}
        />
        {isPending ? (
          <Spinner
            aria-label="자료 검색 중"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
        ) : null}
      </form>
      {errorMessage === null ? null : (
        <Alert role="alert" tone="danger">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {results.length === 0 ? null : (
        <ul aria-label="자료 검색 결과" className="grid gap-1">
          {results.map((result) => {
            const Icon = result.kind === "folder" ? FolderIcon : FileTextIcon

            return (
              <li key={result.id}>
                <Button
                  className="h-auto w-full justify-start px-2 py-2 text-left"
                  onClick={() => {
                    onSelect(result)
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate">{result.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {formatResourcePath(result)}
                    </span>
                  </span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function formatResourcePath(item: AdminResourceSearchItem): string {
  const path = [...item.path.map((part) => part.name), item.name]
  return path.join(" / ")
}
