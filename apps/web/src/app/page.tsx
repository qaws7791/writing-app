import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"

const writingSteps = [
  { label: "주제", value: "생활 기록" },
  { label: "상태", value: "초안 작성" },
  { label: "분량", value: "1,200자" },
]

const notes = [
  "오늘의 장면을 한 문장으로 적기",
  "감정이 바뀐 지점을 문단으로 나누기",
  "마지막 문장은 독자에게 남길 질문으로 닫기",
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              글필
            </span>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              오늘의 에세이
            </h1>
          </div>
          <Button size="sm">새 글</Button>
        </header>

        <section className="grid flex-1 gap-8 py-8 lg:grid-cols-3">
          <article className="flex min-h-96 flex-col rounded-lg border border-border bg-card/80 shadow-sm backdrop-blur lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
              {writingSteps.map((step) => (
                <Badge key={step.label} variant="secondary">
                  {step.label}: {step.value}
                </Badge>
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-6 px-5 py-6 sm:px-8">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  제목
                </p>
                <h2 className="text-3xl font-semibold leading-tight">
                  익숙한 길에서 새로 본 것
                </h2>
              </div>

              <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border bg-background/85 p-5 leading-8 shadow-inner">
                <p>
                  아침마다 지나던 골목은 늘 같은 길이라고 생각했다. 그런데
                  오늘은 문득 담장 아래의 작은 그림자가 먼저 보였다.
                </p>
                <p className="text-muted-foreground">
                  글은 거창한 사건보다 관찰을 붙잡는 일에서 시작된다. 지금
                  남겨둘 수 있는 가장 구체적인 장면을 이어 적는다.
                </p>
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
              <h2 className="text-base font-medium">작성 흐름</h2>
              <ol className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                {notes.map((note) => (
                  <li key={note} className="rounded-md bg-muted px-3 py-2">
                    {note}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
              <h2 className="text-base font-medium">다음 검토</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                문단 사이의 호흡, 반복되는 표현, 결말의 여운을 순서대로
                확인한다.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
