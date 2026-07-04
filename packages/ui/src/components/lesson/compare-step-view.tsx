"use client"

import { useState } from "react"

import { Surface } from "../ui/surface"
import { cn } from "../../lib/utils"

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
    <div className="an-fi flex flex-col gap-4">
      <h2 className="font-bold mb-6" style={{ fontSize: "1.75rem" }}>
        {title || "두 버전을 비교해보세요"}
      </h2>
      <div className="flex gap-2 mb-6">
        {versions.map((version, index) => (
          <button
            className={cn(
              "btn-squish flex-1 py-3 rounded-full font-bold transition-all outline-none",
              tab === index
                ? "bg-foreground text-background"
                : "bg-surface text-muted-foreground border border-border hover:bg-surface-hover hover:text-foreground"
            )}
            key={version.label}
            onClick={() => setTab(index)}
            style={{ fontSize: "0.9375rem" }}
            type="button"
          >
            {version.label}
          </button>
        ))}
      </div>
      <Surface
        className="whitespace-pre-line leading-relaxed text-body-lg font-medium p-6 md:p-8 rounded-4xl"
        variant="panel"
      >
        {versions[tab]?.text}
      </Surface>
      {analysis ? (
        <Surface
          className="bg-warning/15 border border-warning/10 p-6 rounded-4xl"
          variant="panel"
        >
          <div className="font-bold text-warning-foreground mb-2">
            💡 생각해보기
          </div>
          <p className="font-medium text-body-md leading-relaxed text-warning-foreground">
            {analysis}
          </p>
        </Surface>
      ) : null}
    </div>
  )
}
