import Link from "next/link"
import {
  AiBrain01Icon,
  ArrowLeft01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import WritingBodyEditor from "@/components/writing-body-editor"

export default function WritingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[#FAFAFA] text-[#111111]">
      <header className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-[#111111] transition-opacity hover:opacity-70"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={22}
              color="currentColor"
              strokeWidth={1.8}
            />
            <span>돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 text-[14px] font-medium text-[#5F5F5F] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
              <span>저장중...</span>
            </div>

            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-[#5F5F5F] transition-colors hover:bg-[#F0F0F0]"
            >
              <HugeiconsIcon
                icon={AiBrain01Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.8}
              />
              <span>AI</span>
            </button>

            <button
              type="button"
              aria-label="설정"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#5F5F5F] transition-colors hover:bg-[#F0F0F0]"
            >
              <HugeiconsIcon
                icon={Settings02Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-24 pb-24 md:px-10 md:pt-36">
        <section className="w-full max-w-[760px]">
          <div className="space-y-12">
            <h1
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="에세이 제목"
              data-placeholder="어떤 이야기를 남길까요?"
              className="min-h-[72px] text-[40px] leading-[1.45] font-medium tracking-[-0.03em] text-[#111111] outline-none empty:before:text-[#979797] empty:before:content-[attr(data-placeholder)]"
            />

            <WritingBodyEditor />
          </div>
        </section>
      </main>
    </div>
  )
}
