"use client"

import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

import type { DraftContent } from "@/domain/draft"
import {
  createVersionDataSource,
  type VersionDataSource,
} from "@/features/writing/repositories/version-data-source"

type SaveVersionInput = {
  content: DraftContent
  draftId: number
  title: string
}

export function useSaveVersionMutation(dataSource?: VersionDataSource) {
  const sourceRef = useRef(dataSource)

  useEffect(() => {
    sourceRef.current = dataSource
  }, [dataSource])

  return useMutation({
    mutationFn: async ({ draftId, title, content }: SaveVersionInput) => {
      const source = sourceRef.current ?? createVersionDataSource()

      const pulled = await source.pull(draftId)

      await source.push(draftId, {
        baseVersion: pulled.version,
        transactions: [
          {
            operations: [
              { type: "setTitle", title },
              { type: "setContent", content },
            ],
            createdAt: new Date().toISOString(),
          },
        ],
        snapshotReason: "manual",
      })
    },
  })
}
