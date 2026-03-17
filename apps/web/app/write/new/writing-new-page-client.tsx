"use client"

import { type FormEvent, startTransition, useState } from "react"
import Link from "next/link"
import { ArrowLeft01Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import WritingBodyEditor from "@/components/writing-body-editor"
import { Button } from "@workspace/ui/components/button"
import { buttonVariants } from "@workspace/ui/components/button.styles"

import styles from "../write-editor-page.module.css"

function extractTitle(text: string | null) {
  return text?.replace(/\s+/g, " ").trim() ?? ""
}

export default function WritingNewPageClient() {
  const [title, setTitle] = useState("")

  function handleTitleInput(event: FormEvent<HTMLHeadingElement>) {
    const nextTitle = extractTitle(event.currentTarget.textContent)

    startTransition(() => {
      setTitle(nextTitle)
    })
  }

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <header>
        <div className="pointer-events-auto flex h-16 items-center gap-3 px-4 md:px-6">
          <Link
            aria-label="뒤로 가기"
            href="/write"
            className={`${buttonVariants({
              variant: "outline",
              size: "icon",
            })} shrink-0`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
          </Link>

          <div className="min-w-0 flex-1">
            <p
              aria-live="polite"
              className="min-h-5 truncate text-sm font-medium text-foreground/80 md:text-base"
            >
              {title}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
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

      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 pt-28 pb-40 md:px-10 md:pt-36 md:pb-44">
        <section className="w-full max-w-3xl">
          <div className="flex flex-col gap-12">
            <h1
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="에세이 제목"
              data-placeholder="어떤 이야기를 남길까요?"
              className="min-h-18 text-5xl leading-snug font-medium tracking-tight text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
              onInput={handleTitleInput}
            />

            <WritingBodyEditor />
          </div>
        </section>
      </main>
    </div>
  )
}
