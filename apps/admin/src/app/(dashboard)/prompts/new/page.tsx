import Link from "next/link"

import { PromptForm } from "@/components/prompt-form"

export default function NewPromptPage() {
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link href="/prompts" className="hover:underline">
          글감 관리
        </Link>
        <span>/</span>
        <span>새 글감</span>
      </div>
      <h1 className="text-xl font-semibold">새 글감 추가</h1>
      <div className="max-w-lg">
        <PromptForm />
      </div>
    </div>
  )
}
