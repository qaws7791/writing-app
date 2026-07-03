import ReactMarkdown from "react-markdown"

import type { StepProps } from "./step-types"
import type { LessonStep } from "../lesson-types"

export function ReadingStepView({
  step,
}: StepProps<LessonStep & { readonly type: "READING" }>) {
  return (
    <div className="an-fi">
      <h2 className="font-bold mb-2" style={{ fontSize: "1.5rem" }}>
        {step.title}
      </h2>
      {step.guide === "" ? null : (
        <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-muted prose-p:font-medium prose-strong:text-charcoal prose-li:text-muted prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted">
          <ReactMarkdown>{step.guide}</ReactMarkdown>
        </div>
      )}
      <div className="prose prose-sm max-w-none mb-6 prose-headings:font-bold prose-headings:text-charcoal prose-p:text-charcoal/80 prose-p:font-medium prose-strong:text-charcoal prose-li:text-charcoal/80 prose-li:font-medium prose-code:bg-surface prose-code:rounded prose-code:px-1 prose-code:text-charcoal prose-blockquote:border-primary prose-blockquote:text-muted prose-hr:border-surface">
        <ReactMarkdown>{step.body}</ReactMarkdown>
      </div>
      {step.source === undefined ? null : (
        <div className="text-muted font-bold" style={{ fontSize: "0.8125rem" }}>
          출처: {step.source}
        </div>
      )}
    </div>
  )
}
