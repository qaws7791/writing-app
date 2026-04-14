import Link from "next/link"

import { Table } from "@workspace/ui/components/table"

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
  if (steps.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-secondary py-12 text-center text-sm text-muted">
        스텝이 없습니다
      </div>
    )
  }

  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="스텝 목록">
          <Table.Header>
            <Table.Column>순서</Table.Column>
            <Table.Column isRowHeader>타입</Table.Column>
            <Table.Column> </Table.Column>
          </Table.Header>
          <Table.Body>
            {steps.map((step) => (
              <Table.Row key={step.id} id={step.id}>
                <Table.Cell>{step.order}</Table.Cell>
                <Table.Cell>
                  {stepTypeLabels[step.type] ?? step.type}
                </Table.Cell>
                <Table.Cell>
                  <Link
                    href={`/journeys/${journeyId}/sessions/${sessionId}/steps/${step.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    편집
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
