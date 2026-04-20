import Link from "next/link"
import type { StepType } from "@workspace/core/modules/journeys"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"

import { stepTypeLabels } from "@/lib/forms/step-form-helpers"

type Step = {
  id: number
  sessionId: number
  order: number
  type: StepType
  contentJson: unknown
}

type Props = {
  steps: Step[]
  journeyId: number
  sessionId: number
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
