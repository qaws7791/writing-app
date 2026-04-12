"use client"

import type { ToastContentValue } from "./toast-queue"
import type { ToastVariants } from "./toast.styles"
import type { CSSProperties, ComponentPropsWithRef } from "react"
import type {
  QueuedToast,
  ToastProps as ToastPrimitiveProps,
} from "react-aria-components"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Text as TextPrimitive,
  UNSTABLE_ToastContent as ToastContentPrimitive,
  UNSTABLE_Toast as ToastPrimitive,
  UNSTABLE_ToastRegion as ToastRegionPrimitive,
  UNSTABLE_ToastStateContext as ToastStateContext,
} from "react-aria-components"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"
import { Button } from "@workspace/ui/components/button"
import { CloseButton } from "@workspace/ui/components/close-button"
import {
  DangerIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "@workspace/ui/components/icons"
import { Spinner } from "@workspace/ui/components/spinner"
import { useMeasuredHeight } from "@workspace/ui/hooks/use-measured-height"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"

import { ToastQueue, toast as defaultToastQueue } from "./toast-queue"
import { toastVariants } from "./toast.styles"

const DEFAULT_GAP = 12
const DEFAULT_MAX_VISIBLE_TOAST = 3
const DEFAULT_SCALE_FACTOR = 0.05
const DEFAULT_TOAST_WIDTH = 460

/* -------------------------------------------------------------------------------------------------
 * Toast Context
 * -----------------------------------------------------------------------------------------------*/
type ToastContext = {
  slots?: ReturnType<typeof toastVariants>
  placement?: ToastVariants["placement"]
  width?: number | string
  scaleFactor?: number
  gap?: number
  maxVisibleToasts?: number
  heightsByKey?: Record<string, number>
  onToastHeightChange?: (key: string, height: number) => void
}

const ToastContext = createContext<ToastContext>({})

/* -------------------------------------------------------------------------------------------------
 * Toast (individual item)
 * -----------------------------------------------------------------------------------------------*/
interface ToastProps<T extends object = ToastContentValue>
  extends ToastPrimitiveProps<T>, ToastVariants {
  scaleFactor?: number
}

const Toast = <T extends object = ToastContentValue>({
  children,
  className,
  placement,
  scaleFactor = DEFAULT_SCALE_FACTOR,
  toast,
  variant,
  ...rest
}: ToastProps<T>) => {
  const {
    gap = DEFAULT_GAP,
    heightsByKey,
    maxVisibleToasts = DEFAULT_MAX_VISIBLE_TOAST,
    onToastHeightChange,
    placement: contextPlacement,
    scaleFactor: contextScaleFactor,
    slots,
  } = useContext(ToastContext)

  const finalPlacement = placement ?? contextPlacement
  const finalScaleFactor = scaleFactor ?? contextScaleFactor

  const state = useContext(ToastStateContext)!
  const visibleToasts = state.visibleToasts
  const index = visibleToasts.indexOf(toast)
  const isFrontmost = index <= 0
  const isBottom = finalPlacement?.startsWith("bottom")
  const isHidden = index >= maxVisibleToasts
  const toastKey = toast?.key
  const toastRef = useRef<HTMLDivElement | null>(null)
  const { height: toastHeight } = useMeasuredHeight(toastRef)

  useEffect(() => {
    if (toastKey && typeof toastHeight === "number") {
      onToastHeightChange?.(toastKey, toastHeight)
    }
  }, [toastKey, toastHeight, onToastHeightChange])

  const style = useMemo<CSSProperties>(() => {
    const frontToastKey = visibleToasts[0]?.key
    const frontHeight =
      (frontToastKey ? heightsByKey?.[frontToastKey] : undefined) ??
      toastHeight ??
      0

    const offset = index * gap
    const translateY = (isBottom ? -1 : 1) * offset
    const scale = 1 - index * (finalScaleFactor ?? DEFAULT_SCALE_FACTOR)

    return {
      viewTransitionName: `toast-${String(toast.key).replace(/[^a-zA-Z0-9]/g, "-")}`,
      translate: `0 ${translateY}px 0`,
      scale: `${scale}`,
      zIndex: visibleToasts.length - index,
      tabIndex: isFrontmost ? 0 : -1,
      ...(frontHeight
        ? ({ "--front-height": `${frontHeight}px` } as CSSProperties)
        : null),
      opacity: isHidden ? 0 : 1,
      pointerEvents: isHidden ? "none" : "auto",
      ...rest.style,
    } as const
  }, [
    finalScaleFactor,
    gap,
    heightsByKey,
    index,
    isBottom,
    isFrontmost,
    isHidden,
    rest.style,
    toast.key,
    toastHeight,
    visibleToasts,
  ])

  return (
    <ToastPrimitive
      ref={toastRef}
      aria-hidden={isHidden}
      className={composeTwRenderProps(className, slots?.toast({ variant }))}
      data-frontmost={isFrontmost ? "" : undefined}
      data-hidden={isHidden ? "" : undefined}
      data-index={index}
      data-slot="toast"
      style={style}
      toast={toast}
      {...rest}
    >
      {children}
    </ToastPrimitive>
  )
}

Toast.displayName = "UI.Toast"

/* -------------------------------------------------------------------------------------------------
 * Toast Content
 * -----------------------------------------------------------------------------------------------*/
type ToastContentProps = ComponentPropsWithRef<typeof ToastContentPrimitive>

const ToastContent = ({ children, className, ...rest }: ToastContentProps) => {
  const { slots } = useContext(ToastContext)

  return (
    <ToastContentPrimitive
      className={composeSlotClassName(slots?.content, className)}
      data-slot="toast-content"
      {...rest}
    >
      {children}
    </ToastContentPrimitive>
  )
}

ToastContent.displayName = "UI.ToastContent"

/* -------------------------------------------------------------------------------------------------
 * Toast Indicator
 * -----------------------------------------------------------------------------------------------*/
interface ToastIndicatorProps extends ComponentPropsWithRef<"div"> {
  variant?: ToastVariants["variant"]
}

const ToastIndicator = ({
  children,
  className,
  variant,
  ...rest
}: ToastIndicatorProps) => {
  const { slots } = useContext(ToastContext)

  const getDefaultIcon = useCallback(() => {
    switch (variant) {
      case "accent":
        return <InfoIcon data-slot="toast-default-icon" />
      case "success":
        return <SuccessIcon data-slot="toast-default-icon" />
      case "warning":
        return <WarningIcon data-slot="toast-default-icon" />
      case "danger":
        return <DangerIcon data-slot="toast-default-icon" />
      default:
        return <InfoIcon data-slot="toast-default-icon" />
    }
  }, [variant])

  return (
    <div
      className={composeSlotClassName(slots?.indicator, className)}
      data-slot="toast-indicator"
      {...rest}
    >
      {children ?? getDefaultIcon()}
    </div>
  )
}

ToastIndicator.displayName = "UI.ToastIndicator"

/* -------------------------------------------------------------------------------------------------
 * Toast Title
 * -----------------------------------------------------------------------------------------------*/
type ToastTitleProps = ComponentPropsWithRef<typeof TextPrimitive>

const ToastTitle = ({ children, className, ...rest }: ToastTitleProps) => {
  const { slots } = useContext(ToastContext)

  return (
    <TextPrimitive
      className={composeSlotClassName(slots?.title, className)}
      data-slot="toast-title"
      slot="title"
      {...rest}
    >
      {children}
    </TextPrimitive>
  )
}

ToastTitle.displayName = "UI.ToastTitle"

/* -------------------------------------------------------------------------------------------------
 * Toast Description
 * -----------------------------------------------------------------------------------------------*/
type ToastDescriptionProps = ComponentPropsWithRef<typeof TextPrimitive>

const ToastDescription = ({
  children,
  className,
  ...rest
}: ToastDescriptionProps) => {
  const { slots } = useContext(ToastContext)

  return (
    <TextPrimitive
      className={composeSlotClassName(slots?.description, className)}
      data-slot="toast-description"
      slot="description"
      {...rest}
    >
      {children}
    </TextPrimitive>
  )
}

ToastDescription.displayName = "UI.ToastDescription"

/* -------------------------------------------------------------------------------------------------
 * Toast Close Button
 * -----------------------------------------------------------------------------------------------*/
type ToastCloseButtonProps = ComponentPropsWithRef<typeof CloseButton>

const ToastCloseButton = ({ className, ...rest }: ToastCloseButtonProps) => {
  const { slots } = useContext(ToastContext)

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.close())}
      data-slot="toast-close"
      slot="close"
      {...rest}
    />
  )
}

ToastCloseButton.displayName = "UI.ToastCloseButton"

/* -------------------------------------------------------------------------------------------------
 * Toast Action Button
 * -----------------------------------------------------------------------------------------------*/
type ToastActionButtonProps = ComponentPropsWithRef<typeof Button>

const ToastActionButton = ({
  children,
  className,
  ...rest
}: ToastActionButtonProps) => {
  const { slots } = useContext(ToastContext)

  return (
    <Button
      className={composeTwRenderProps(className, slots?.action?.())}
      data-slot="toast-action-button"
      {...rest}
    >
      {children}
    </Button>
  )
}

ToastActionButton.displayName = "UI.ToastActionButton"

/* -------------------------------------------------------------------------------------------------
 * Toast Provider (Region)
 * -----------------------------------------------------------------------------------------------*/
type ToastRegionPrimitiveProps<T extends object = ToastContentValue> =
  ComponentPropsWithRef<typeof ToastRegionPrimitive<T>>

interface ToastProviderProps<T extends object = ToastContentValue> extends Omit<
  ToastRegionPrimitiveProps<T>,
  "queue" | "children"
> {
  children?: ToastRegionPrimitiveProps<T>["children"]
  /** Gap between stacked toasts (px). @default 12 */
  gap?: number
  /** Maximum visible toasts (visual only). @default 3 */
  maxVisibleToasts?: number
  /** Scale factor for stacked toasts. @default 0.05 */
  scaleFactor?: number
  placement?: ToastVariants["placement"]
  queue?: ToastQueue<T>
  /** Toast width. @default 460 */
  width?: number | string
}

const ToastProvider = <T extends object = ToastContentValue>({
  children,
  className,
  gap = DEFAULT_GAP,
  maxVisibleToasts,
  placement = "bottom",
  queue: queueProp,
  scaleFactor = DEFAULT_SCALE_FACTOR,
  width = DEFAULT_TOAST_WIDTH,
  ...rest
}: ToastProviderProps<T>) => {
  const slots = useMemo(() => toastVariants({ placement }), [placement])
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [toastHeights, setToastHeights] = useState<Record<string, number>>({})

  const toastQueue = useMemo(() => {
    if (queueProp) {
      return "getQueue" in queueProp ? queueProp.getQueue() : queueProp
    }

    return defaultToastQueue.getQueue() as ReturnType<ToastQueue<T>["getQueue"]>
  }, [queueProp])

  const resolvedMaxVisibleToasts = useMemo(() => {
    const queueLimit =
      queueProp && "maxVisibleToasts" in queueProp
        ? queueProp.maxVisibleToasts
        : undefined

    return maxVisibleToasts ?? queueLimit ?? DEFAULT_MAX_VISIBLE_TOAST
  }, [maxVisibleToasts, queueProp])

  const handleToastHeightChange = useCallback((key: string, height: number) => {
    setToastHeights((prev) => {
      if (prev[key] === height) return prev

      return { ...prev, [key]: height }
    })
  }, [])

  const getDefaultChildren = useCallback(
    (renderProps: { toast: QueuedToast<T> }) => {
      const { actionProps, description, indicator, isLoading, title, variant } =
        (renderProps.toast.content as ToastContentValue) ?? {}

      return (
        <Toast
          placement={placement}
          scaleFactor={scaleFactor}
          toast={renderProps.toast}
          variant={variant}
        >
          {indicator === null ? null : isLoading ? (
            <ToastIndicator variant={variant}>
              <Spinner color="current" size="sm" />
            </ToastIndicator>
          ) : (
            <ToastIndicator variant={variant}>{indicator}</ToastIndicator>
          )}
          <ToastContent>
            {!!title && <ToastTitle>{title}</ToastTitle>}
            {!!description && (
              <ToastDescription>{description}</ToastDescription>
            )}
            {isMobile && actionProps?.children ? (
              <ToastActionButton {...actionProps}>
                {actionProps.children}
              </ToastActionButton>
            ) : null}
          </ToastContent>
          {!isMobile && actionProps?.children ? (
            <ToastActionButton {...actionProps}>
              {actionProps.children}
            </ToastActionButton>
          ) : null}
          <ToastCloseButton />
        </Toast>
      )
    },
    [isMobile, placement, scaleFactor]
  )

  return (
    <ToastRegionPrimitive<T>
      className={composeTwRenderProps(className, slots?.region())}
      data-slot="toast-region"
      queue={toastQueue}
      style={{
        // @ts-expect-error -- CSS custom properties
        "--gap": `${gap}px`,
        "--scale-factor": scaleFactor,
        "--placement": placement,
        "--toast-width": typeof width === "number" ? `${width}px` : width,
      }}
      {...rest}
    >
      {(renderProps) => (
        <ToastContext
          value={{
            slots,
            placement,
            scaleFactor,
            gap,
            maxVisibleToasts: resolvedMaxVisibleToasts,
            heightsByKey: toastHeights,
            onToastHeightChange: handleToastHeightChange,
            width,
          }}
        >
          {typeof children === "undefined"
            ? getDefaultChildren(renderProps)
            : typeof children === "function"
              ? children({
                  ...renderProps,
                  isLoading:
                    (renderProps.toast.content as ToastContentValue)
                      ?.isLoading ?? false,
                } as Parameters<NonNullable<typeof children>>[0])
              : children}
        </ToastContext>
      )}
    </ToastRegionPrimitive>
  )
}

ToastProvider.displayName = "UI.ToastProvider"

/* -------------------------------------------------------------------------------------------------
 * Compound export
 * -----------------------------------------------------------------------------------------------*/
const ToastNamespace = Object.assign(Toast, {
  Provider: ToastProvider,
  Content: ToastContent,
  Indicator: ToastIndicator,
  Title: ToastTitle,
  Description: ToastDescription,
  ActionButton: ToastActionButton,
  CloseButton: ToastCloseButton,
})

export {
  ToastNamespace as Toast,
  ToastProvider,
  ToastContent,
  ToastIndicator,
  ToastTitle,
  ToastDescription,
  ToastActionButton,
  ToastCloseButton,
}
export type {
  ToastProps,
  ToastProviderProps,
  ToastContentProps,
  ToastIndicatorProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastCloseButtonProps,
  ToastActionButtonProps,
}
