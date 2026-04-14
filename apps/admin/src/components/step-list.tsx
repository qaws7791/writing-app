import Link from "next/link"

type Step = {
  id: number
  sessionId: number
  order: number
  type: string
  contentJson: unknown
}

type Props = {
  steps: Step[]
  journeyId: number
  sessionId: number
}

const stepTypeLabels: Record<string, string> = {
  learn: "학습",
  read: "읽기",
  guided_question: "안내 질문",
  write: "쓰기",
  feedback: "피드백",
  revise: "수정",
}

export function StepList({ steps, journeyId, sessionId }: Props) {
  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">순서</th>
            <th className="px-4 py-3 text-left font-medium">타입</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {steps.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="text-muted-foreground px-4 py-8 text-center"
              >
                스텝이 없습니다
              </td>
            </tr>
          )}
          {steps.map((step) => (
            <tr
              key={step.id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3">{step.order}</td>
              <td className="px-4 py-3">
                {stepTypeLabels[step.type] ?? step.type}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/journeys/${journeyId}/sessions/${sessionId}/steps/${step.id}`}
                  className="text-primary hover:underline"
                >
                  편집
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
