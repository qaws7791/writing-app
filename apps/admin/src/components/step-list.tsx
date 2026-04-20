import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

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
  INTRO: "인트로",
  COMPLETION: "완료",
  CONCEPT: "개념",
  EXAMPLE: "예시",
  MULTIPLE_CHOICE: "객관식",
  FILL_IN_THE_BLANK: "빈칸 채우기",
  ORDERING: "순서 배열",
  HIGHLIGHT: "하이라이트",
  SHORT_ANSWER: "단답형",
  WRITING: "글쓰기",
  REWRITING: "퇴고",
  AI_FEEDBACK: "AI 피드백",
  AI_COMPARISON: "AI 비교",
}

export function StepList({ steps, journeyId, sessionId }: Props) {
  if (steps.length === 0) {
    return (
      <div className="rounded-3xl bg-muted py-12 text-center text-sm text-muted-foreground">
        스텝이 없습니다
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>순서</TableHead>
          <TableHead>타입</TableHead>
          <TableHead> </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => (
          <TableRow key={step.id}>
            <TableCell>{step.order}</TableCell>
            <TableCell>{stepTypeLabels[step.type] ?? step.type}</TableCell>
            <TableCell>
              <Link
                href={`/journeys/${journeyId}/sessions/${sessionId}/steps/${step.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                편집
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
