import Link from "next/link"
import { notFound } from "next/navigation"

import { parsePromptId } from "@workspace/core"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"

import { PromptForm } from "@/components/prompt-form"
import { unwrapAdminPageResult } from "@/lib/runtime/admin-page-result"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

type Props = { params: Promise<{ id: string }> }

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params
  const rawId = Number(id)
  if (!Number.isInteger(rawId) || rawId <= 0) notFound()
  const promptId = parsePromptId(rawId)

  const { getPrompt } = getAdminRuntime().useCases
  const prompt = await unwrapAdminPageResult(getPrompt(promptId, null))

  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/prompts" />}>
              글감 관리
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{prompt.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl font-semibold text-foreground">글감 편집</h1>

      <div className="max-w-lg">
        <PromptForm
          promptId={prompt.id}
          defaultValues={{
            title: prompt.title,
            body: prompt.body,
            promptType: prompt.promptType,
            thumbnailUrl: prompt.thumbnailUrl ?? "",
          }}
        />
      </div>
    </div>
  )
}
