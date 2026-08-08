import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

type AppRouteNoticeProps = {
  readonly description: string
  readonly linkHref?: string
  readonly linkLabel?: string
  readonly title: string
}

export function AppRouteNotice({
  description,
  linkHref = "/app/courses",
  linkLabel = "코스 둘러보기",
  title,
}: AppRouteNoticeProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl px-6 py-10 sm:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <h1>{title}</h1>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={linkHref}
            >
              {linkLabel}
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
