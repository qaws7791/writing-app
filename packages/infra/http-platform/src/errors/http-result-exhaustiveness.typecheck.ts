import { assertExhaustiveHttpResult } from "#http-platform/errors/assert-exhaustive-http-result"

type FixtureError =
  | Readonly<{ kind: "conflict" }>
  | Readonly<{ kind: "not-found" }>

function mapCompleteFixture(error: FixtureError): number {
  switch (error.kind) {
    case "conflict":
      return 409
    case "not-found":
      return 404
  }

  return assertExhaustiveHttpResult(error)
}

function mapIncompleteFixture(error: FixtureError): number {
  switch (error.kind) {
    case "not-found":
      return 404
  }

  // @ts-expect-error 누락된 variant가 never로 좁혀지지 않아야 한다.
  return assertExhaustiveHttpResult(error)
}

void mapCompleteFixture
void mapIncompleteFixture
