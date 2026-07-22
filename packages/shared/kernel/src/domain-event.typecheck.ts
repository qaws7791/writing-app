import type { DomainDecision, DomainEvent } from "#kernel/domain-event"

type ExampleEvent = DomainEvent<"example.completed", { readonly id: string }>

declare const decision: DomainDecision<
  { readonly status: "completed" },
  ExampleEvent
>

const firstEvent: ExampleEvent | undefined = decision.events[0]
void firstEvent

// @ts-expect-error decision의 aggregate 참조는 교체할 수 없다.
decision.aggregate = { status: "completed" }
// @ts-expect-error 공개 event collection은 mutable queue가 아니다.
decision.events.push({
  id: "event-1",
  occurredAt: new Date("2026-07-22T00:00:00.000Z"),
  payload: { id: "example-1" },
  type: "example.completed",
})
