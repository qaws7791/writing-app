"use client"

import { useState } from "react"

import { buttonVariants } from "#ui/components/ui/button"
import { cn } from "#ui/lib/utils"

export function CompareStepView({
  analysis,
  title,
  versions,
}: {
  readonly analysis: string
  readonly title: string
  readonly versions: readonly {
    readonly label: string
    readonly text: string
  }[]
}) {
  const [tab, setTab] = useState(0)

  return (
    <div className="an-fi">
      <h2 className="font-bold mb-6" style={{ fontSize: "1.75rem" }}>
        {title || "두 버전을 비교해보세요"}
      </h2>
      <div className="flex gap-2 mb-6">
        {versions.map((version, index) => (
          <button
            className={buttonVariants({
              className: cn(
                "h-auto flex-1 rounded-full py-3 text-body-sm",
                tab === index
                  ? "bg-charcoal text-cream"
                  : "bg-surface text-charcoal hover:bg-surface/70"
              ),
              variant: tab === index ? "default" : "secondary",
            })}
            key={version.label}
            onClick={() => setTab(index)}
            style={{ fontSize: "0.9375rem" }}
            type="button"
          >
            {version.label}
          </button>
        ))}
      </div>
      <div className="bg-surface rounded-4xl p-6 md:p-8">
        <p
          className="font-medium leading-relaxed whitespace-pre-line"
          style={{ fontSize: "1.125rem" }}
        >
          {versions[tab]?.text}
        </p>
      </div>
      {analysis ? (
        <div className="mt-6 bg-accent-soft rounded-4xl p-6">
          <div className="font-bold text-muted-foreground mb-2">
            💡 생각해보기
          </div>
          <p className="font-medium" style={{ fontSize: "1.0625rem" }}>
            {analysis}
          </p>
        </div>
      ) : null}
    </div>
  )
}
