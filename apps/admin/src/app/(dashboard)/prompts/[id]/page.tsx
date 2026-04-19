import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { writingPrompts } from "@workspace/database"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"

import { PromptForm } from "@/components/prompt-form"
import { getDb } from "@/lib/db"

type Props = { params: Promise<{ id: string }> }

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params
  const promptId = Number(id)
  if (Number.isNaN(promptId)) notFound()

  const db = getDb()
  const [prompt] = await db
    .select()
    .from(writingPrompts)
    .where(eq(writingPrompts.id, promptId))
    .limit(1)

  if (!prompt) notFound()

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
