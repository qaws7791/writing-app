"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Layers01Icon } from "@hugeicons/core-free-icons"

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
        className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
      >
        <div className="size-24 shrink-0 overflow-hidden rounded-[32px] bg-surface-container-high">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="size-full object-cover"
          />
        </div>
        <div className="flex h-[87.5px] flex-1 flex-col gap-1">
          <p className="text-title-medium text-on-surface">{props.title}</p>
          <p className="line-clamp-1 pb-1.5 text-body-small text-on-surface-low">
            {props.description}
          </p>
          <div className="flex flex-1 items-end">
            <div className="flex w-full items-center gap-2">
              <div className="relative h-2 flex-1 rounded-full bg-surface-container-high">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-on-surface-low"
                  style={{ width: `${props.progress}%` }}
                />
              </div>
              <span className="shrink-0 text-label-medium-em text-on-surface-low">
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
        className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
      >
        <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-surface-container-high">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="size-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <div className="flex flex-col gap-1">
            <p className="text-title-medium text-on-surface">{props.title}</p>
            <p className="line-clamp-2 text-body-medium text-on-surface-low">
              {props.description}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <HugeiconsIcon
              icon={Layers01Icon}
              size={12}
              color="currentColor"
              strokeWidth={1.5}
              className="text-on-surface-low"
            />
            <span className="text-label-small text-on-surface-low uppercase">
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
      className="flex items-center gap-4 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container-high">
        <img
          src={props.imageUrl}
          alt={props.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-title-small-em text-on-surface">{props.title}</p>
        <p className="line-clamp-1 text-label-large text-on-surface-low">
          {props.description}
        </p>
      </div>
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        size={20}
        color="currentColor"
        strokeWidth={1.5}
        className="shrink-0 text-primary"
      />
    </button>
  )
}
