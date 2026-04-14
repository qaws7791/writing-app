import { Breadcrumbs } from "@workspace/ui/components/breadcrumbs"

import { PromptForm } from "@/components/prompt-form"

export default function NewPromptPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/prompts">글감 관리</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/prompts/new">새 글감</Breadcrumbs.Item>
      </Breadcrumbs>

      <h1 className="text-xl font-semibold text-foreground">새 글감 추가</h1>

      <div className="max-w-lg">
        <PromptForm />
      </div>
    </div>
  )
}
