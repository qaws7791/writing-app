"use client"

import * as React from "react"
import type { EmblaOptionsType, EmblaPluginType } from "embla-carousel"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"

import { ChevronLeftIcon } from "#ui/components/icons/direction-icons"
import { ChevronRightIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/primitives/button"
import { cn } from "#ui/lib/utils"

const carouselDragThresholdPx = 8
const carouselProgressThumbPercent = 32

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = EmblaOptionsType
type CarouselPlugin = EmblaPluginType[]

type CarouselProps = {
  opts?: CarouselOptions
  orientation?: "horizontal" | "vertical"
  plugins?: CarouselPlugin
  setApi?: (api: CarouselApi) => void
}

type CarouselContextValue = {
  api: CarouselApi | undefined
  canScrollNext: boolean
  canScrollPrev: boolean
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  clickAllowedRef: React.RefObject<boolean>
  orientation: "horizontal" | "vertical"
  scrollNext: () => void
  scrollPrev: () => void
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function useCarouselClickGuard() {
  const { clickAllowedRef } = useCarousel()

  return React.useCallback(
    (event: React.MouseEvent) => {
      if (!clickAllowedRef.current) {
        event.preventDefault()
      }
    },
    [clickAllowedRef]
  )
}

function readPrefersReducedMotion() {
  if (typeof document === "undefined") {
    return false
  }

  const motion = document.documentElement.dataset.motion
  if (motion === "reduced") {
    return true
  }
  if (motion === "full") {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
  const clickAllowedRef = React.useRef(true)
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => {
      setPrefersReducedMotion(readPrefersReducedMotion())
    }

    syncMotion()
    media.addEventListener("change", syncMotion)
    return () => {
      media.removeEventListener("change", syncMotion)
    }
  }, [])

  const [carouselRef, api] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      ...(prefersReducedMotion ? { duration: 0 } : {}),
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) {
      return
    }

    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (orientation === "horizontal") {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        scrollNext()
      }
    },
    [orientation, scrollNext, scrollPrev]
  )

  const onPointerDownCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY }
      clickAllowedRef.current = true
    },
    []
  )

  const onPointerMoveCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current
      if (start === null) {
        return
      }

      const distance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y
      )
      if (distance > carouselDragThresholdPx) {
        clickAllowedRef.current = false
      }
    },
    []
  )

  const onPointerUpCapture = React.useCallback(() => {
    pointerStartRef.current = null
  }, [])

  React.useEffect(() => {
    if (!api || !setApi) {
      return
    }

    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) {
      return
    }

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api.off("reInit", onSelect)
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        api,
        canScrollNext,
        canScrollPrev,
        carouselRef,
        clickAllowedRef,
        orientation,
        scrollNext,
        scrollPrev,
      }}
    >
      <div
        aria-roledescription="캐러셀"
        className={cn("@container flex flex-col gap-4", className)}
        data-slot="carousel"
        onKeyDownCapture={handleKeyDown}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMoveCapture={onPointerMoveCapture}
        onPointerUpCapture={onPointerUpCapture}
        role="region"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      className="cursor-grab overflow-hidden active:cursor-grabbing"
      data-slot="carousel-viewport"
      ref={carouselRef}
    >
      <div
        className={cn(
          "flex gap-6",
          orientation === "vertical" && "flex-col",
          className
        )}
        data-slot="carousel-content"
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-roledescription="슬라이드"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      data-slot="carousel-item"
      role="group"
      {...props}
    />
  )
}

const carouselNavButtonClassName = "[&_svg:not([class*='size-'])]:size-6"

// `full`/`infinity` on one corner makes CSS shrink the adjacent md radius to ~0.
const carouselPreviousRadiusStyle = {
  borderBottomLeftRadius: "50%",
  borderBottomRightRadius: "var(--radius-md)",
  borderTopLeftRadius: "50%",
  borderTopRightRadius: "var(--radius-md)",
} satisfies React.CSSProperties

const carouselNextRadiusStyle = {
  borderBottomLeftRadius: "var(--radius-md)",
  borderBottomRightRadius: "50%",
  borderTopLeftRadius: "var(--radius-md)",
  borderTopRightRadius: "50%",
} satisfies React.CSSProperties

function CarouselPrevious({
  className,
  variant = "secondary",
  size = "icon-lg",
  style,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      aria-label="이전 카드"
      className={cn(carouselNavButtonClassName, className)}
      data-slot="carousel-previous"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      size={size}
      type="button"
      variant={variant}
      {...props}
      style={{ ...carouselPreviousRadiusStyle, ...style }}
    >
      <ChevronLeftIcon className="size-6" />
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "secondary",
  size = "icon-lg",
  style,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      aria-label="다음 카드"
      className={cn(carouselNavButtonClassName, className)}
      data-slot="carousel-next"
      disabled={!canScrollNext}
      onClick={scrollNext}
      size={size}
      type="button"
      variant={variant}
      {...props}
      style={{ ...carouselNextRadiusStyle, ...style }}
    >
      <ChevronRightIcon className="size-6" />
    </Button>
  )
}

function CarouselControls({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { canScrollNext, canScrollPrev } = useCarousel()

  if (!canScrollPrev && !canScrollNext) {
    return null
  }

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      data-slot="carousel-controls"
      {...props}
    />
  )
}

function CarouselProgress({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { api, canScrollNext, canScrollPrev } = useCarousel()
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    const onScroll = () => {
      setProgress(api.scrollProgress())
    }

    onScroll()
    api.on("reInit", onScroll)
    api.on("scroll", onScroll)

    return () => {
      api.off("reInit", onScroll)
      api.off("scroll", onScroll)
    }
  }, [api])

  if (!canScrollPrev && !canScrollNext) {
    return null
  }

  return (
    <div
      aria-label="캐러셀 위치"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(progress * 100)}
      className={cn(
        "relative ml-4 h-0.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted",
        className
      )}
      data-slot="carousel-progress"
      role="progressbar"
      {...props}
    >
      <div
        className="absolute inset-y-0 rounded-full bg-foreground"
        style={{
          left: `${progress * (100 - carouselProgressThumbPercent)}%`,
          width: `${carouselProgressThumbPercent}%`,
        }}
      />
    </div>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselControls,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselProgress,
  useCarousel,
  useCarouselClickGuard,
}
