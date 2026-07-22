export type DomainEvent<TType extends string, TPayload> = Readonly<{
  id: string
  occurredAt: Date
  payload: Readonly<TPayload>
  type: TType
}>

export type DomainDecision<TAggregate, TEvent> = Readonly<{
  aggregate: TAggregate
  events: readonly TEvent[]
}>
