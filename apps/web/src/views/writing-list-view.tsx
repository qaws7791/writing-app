"use client"

import { useRouter } from "next/navigation"

import { CreateWritingCard } from "@/features/writing/components/create-writing-card"
import { WritingListSection } from "@/features/writing/components/writing-list-section"
import { useCreateWritingMutation } from "@/features/writing/hooks/use-create-writing-mutation"
import { useWritingListQuery } from "@/features/writing/hooks/use-writing-list-query"

export default function WritingListView() {
  const router = useRouter()
  const writingListQuery = useWritingListQuery()
  const createWritingMutation = useCreateWritingMutation()

  const handleCreateWriting = () => {
    if (createWritingMutation.isPending) return
    createWritingMutation.mutate(
      {},
      { onSuccess: (writing) => router.push(`/writing/${writing.id}`) }
    )
  }

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 md:px-10 md:py-20 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-12 text-3xl leading-snug font-semibold tracking-tight text-foreground md:mb-16 md:text-4xl">
          내 글
        </h1>

        <section className="mb-14 md:mb-16">
          <CreateWritingCard
            isPending={createWritingMutation.isPending}
            onCreateWriting={handleCreateWriting}
          />
        </section>

        <section>
          <WritingListSection
            writings={writingListQuery.data}
            isError={writingListQuery.isError}
            isLoading={writingListQuery.isLoading}
          />
        </section>
      </div>
    </div>
  )
}
