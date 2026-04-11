function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n")

  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h4
              key={i}
              className="mt-4 mb-1 text-label-large-em text-on-surface"
            >
              {line.slice(4)}
            </h4>
          )
        }
        if (line.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="mt-5 mb-1 text-title-small-em text-on-surface"
            >
              {line.slice(3)}
            </h3>
          )
        }
        if (line.startsWith("- ")) {
          return (
            <li
              key={i}
              className="ml-4 list-disc text-body-medium text-on-surface-low"
            >
              <InlineMarkdown text={line.slice(2)} />
            </li>
          )
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />
        }
        return (
          <p key={i} className="text-body-medium text-on-surface-low">
            <InlineMarkdown text={line} />
          </p>
        )
      })}
    </>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-on-surface">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export { MarkdownRenderer, InlineMarkdown }
