"use client"

import { useRouter } from "next/navigation"

import { CreateDraftCard } from "@/features/writing/components/create-draft-card"
import { DraftListSection } from "@/features/writing/components/draft-list-section"
import { useCreateDraftMutation } from "@/features/writing/hooks/use-create-draft-mutation"
import { useDraftListQuery } from "@/features/writing/hooks/use-draft-list-query"

export default function WriteListView() {
  const router = useRouter()
  const draftListQuery = useDraftListQuery()
  const createDraftMutation = useCreateDraftMutation()

  const handleCreateDraft = () => {
    if (createDraftMutation.isPending) return
    createDraftMutation.mutate(
      {},
      { onSuccess: (draft) => router.push(`/write/${draft.id}`) }
    )
  }

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 md:px-10 md:py-20 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-12 text-3xl leading-snug font-semibold tracking-tight text-foreground md:mb-16 md:text-4xl">
          내 글
        </h1>

        <section className="mb-14 md:mb-16">
          <CreateDraftCard
            isPending={createDraftMutation.isPending}
            onCreateDraft={handleCreateDraft}
          />
        </section>

        <section>
          <DraftListSection
            drafts={draftListQuery.data}
            isError={draftListQuery.isError}
            isLoading={draftListQuery.isLoading}
          />
        </section>
      </div>
    </div>
  )
}
