export type Clock = Readonly<{
  now: () => Date
}>

export type IdGenerator<TId> = Readonly<{
  next: () => TId
}>
