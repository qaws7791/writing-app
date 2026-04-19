"use client"

import { useRouter } from "next/navigation"
import { CheckCircle2, Layers } from "lucide-react"

interface JourneyCardBaseProps {
  id: number
  title: string
  imageUrl: string
}

interface ActiveJourneyCardProps extends JourneyCardBaseProps {
  mode: "active"
  description: string
  progress: number
}

interface DiscoverJourneyCardProps extends JourneyCardBaseProps {
  mode: "discover"
  description: string
  sessionCount: number
}

interface CompletedJourneyCardProps extends JourneyCardBaseProps {
  mode: "completed"
  description: string
}

export type JourneyCardProps =
  | ActiveJourneyCardProps
  | DiscoverJourneyCardProps
  | CompletedJourneyCardProps

export function JourneyCard(props: JourneyCardProps) {
  const router = useRouter()

  if (props.mode === "active") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/journeys/${props.id}`)}
        className="flex h-32 w-full items-center gap-5 rounded-3xl bg-muted p-4 text-left transition-colors hover:bg-accent"
      >
        <div className="size-24 shrink-0 overflow-hidden rounded-[32px] bg-accent">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="size-full object-cover"
          />
        </div>
        <div className="flex h-[87.5px] flex-1 flex-col gap-1">
          <p className="text-lg leading-7 font-medium text-foreground">
            {props.title}
          </p>
          <p className="line-clamp-1 pb-1.5 text-xs leading-5 text-muted-foreground">
            {props.description}
          </p>
          <div className="flex flex-1 items-end">
            <div className="flex w-full items-center gap-2">
              <div className="relative h-2 flex-1 rounded-full bg-accent">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${props.progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs leading-5 font-semibold tracking-wide text-muted-foreground">
                {props.progress}%
              </span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  if (props.mode === "discover") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/journeys/${props.id}`)}
        className="flex h-32 w-full items-center gap-5 rounded-3xl bg-muted p-4 text-left transition-colors hover:bg-accent"
      >
        <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-accent">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="size-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <div className="flex flex-col gap-1">
            <p className="text-lg leading-7 font-medium text-foreground">
              {props.title}
            </p>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {props.description}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <Layers
              size={12}
              strokeWidth={1.5}
              className="text-muted-foreground"
            />
            <span className="text-xs leading-4 font-medium text-muted-foreground uppercase">
              {props.sessionCount}개의 세션
            </span>
          </div>
        </div>
      </button>
    )
  }

  // completed
  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${props.id}`)}
      className="flex items-center gap-4 rounded-3xl bg-muted p-4 text-left transition-colors hover:bg-accent"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-accent">
        <img
          src={props.imageUrl}
          alt={props.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-base leading-6 font-semibold text-foreground">
          {props.title}
        </p>
        <p className="line-clamp-1 text-sm leading-5 font-medium text-muted-foreground">
          {props.description}
        </p>
      </div>
      <CheckCircle2
        size={20}
        strokeWidth={1.5}
        className="shrink-0 text-primary"
      />
    </button>
  )
}
