import Link from "next/link"
import { ArrowLeft01Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import WritingBodyEditor from "@/components/writing-body-editor"
import { buttonVariants } from "@workspace/ui/components/button.styles"
import { Button } from "@workspace/ui/components/button"

export default function WritingNewPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div className="pointer-events-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link
            aria-label="뒤로 가기"
            href="/write"
            className={buttonVariants({
              variant: "outline",
              size: "icon",
            })}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" size="icon" aria-label="설정">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.8}
              />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-28 pb-40 md:px-10 md:pt-36 md:pb-44">
        <section className="w-full max-w-3xl">
          <div className="flex flex-col gap-12">
            <h1
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="에세이 제목"
              data-placeholder="어떤 이야기를 남길까요?"
              className="min-h-18 text-5xl leading-snug font-medium tracking-tight text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
            />

            <WritingBodyEditor />
          </div>
        </section>
      </main>
    </div>
  )
}
