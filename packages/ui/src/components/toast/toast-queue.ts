"use client"

import type { ReactNode } from "react"
import type {
  ToastOptions as RACToastOptions,
  UNSTABLE_ToastQueue as ToastQueuePrimitiveType,
} from "react-aria-components"

import { UNSTABLE_ToastQueue as ToastQueuePrimitive } from "react-aria-components"
import { flushSync } from "react-dom"

import type { ButtonProps } from "@workspace/ui/components/button"

const DEFAULT_RAC_MAX_VISIBLE_TOAST = Number.MAX_SAFE_INTEGER
const DEFAULT_TOAST_TIMEOUT = 4000

/* -------------------------------------------------------------------------------------------------
 * Toast Queue Options
 * -----------------------------------------------------------------------------------------------*/
export interface ToastQueueOptions {
  maxVisibleToasts?: number
  wrapUpdate?: (fn: () => void) => void
}

/* -------------------------------------------------------------------------------------------------
 * Toast Content Value
 * -----------------------------------------------------------------------------------------------*/
export interface ToastContentValue {
  indicator?: ReactNode
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "accent" | "success" | "warning" | "danger"
  actionProps?: ButtonProps
  isLoading?: boolean
}

/* -------------------------------------------------------------------------------------------------
 * Toast Queue
 * -----------------------------------------------------------------------------------------------*/
export class ToastQueue<T extends object = ToastContentValue> {
  private queue: ToastQueuePrimitiveType<T>
  readonly maxVisibleToasts?: number

  constructor(options?: ToastQueueOptions) {
    this.maxVisibleToasts = options?.maxVisibleToasts
    this.queue = new ToastQueuePrimitive<T>({
      maxVisibleToasts: DEFAULT_RAC_MAX_VISIBLE_TOAST,
      wrapUpdate: options?.wrapUpdate
        ? options.wrapUpdate
        : (fn: () => void) => {
            if ("startViewTransition" in document) {
              document.startViewTransition(() => {
                flushSync(fn)
              })
            } else {
              fn()
            }
          },
    })
  }

  add(content: T, options?: RACToastOptions): string {
    const timeout =
      options?.timeout !== undefined ? options.timeout : DEFAULT_TOAST_TIMEOUT

    return this.queue.add(content, { ...options, timeout })
  }

  close(key: string): void {
    this.queue.close(key)
  }

  pauseAll(): void {
    this.queue.pauseAll()
  }

  resumeAll(): void {
    this.queue.resumeAll()
  }

  clear(): void {
    this.queue.clear()
  }

  subscribe(fn: () => void): () => void {
    return this.queue.subscribe(fn)
  }

  get visibleToasts() {
    return this.queue.visibleToasts
  }

  getQueue(): ToastQueuePrimitiveType<T> {
    return this.queue
  }
}

/* -------------------------------------------------------------------------------------------------
 * toast helper
 * -----------------------------------------------------------------------------------------------*/
export interface HeroUIToastOptions {
  description?: ReactNode
  indicator?: ReactNode
  variant?: ToastContentValue["variant"]
  actionProps?: ButtonProps
  isLoading?: boolean
  timeout?: number
  onClose?: () => void
}

export interface ToastPromiseOptions<T = unknown> {
  loading: ReactNode
  success: ((data: T) => ReactNode) | ReactNode
  error: ((error: Error) => ReactNode) | ReactNode
}

function createToastFunction(queue: ToastQueue<ToastContentValue>) {
  const toastFn = (
    message: ReactNode,
    options?: HeroUIToastOptions
  ): string => {
    const timeout =
      options?.timeout !== undefined ? options.timeout : DEFAULT_TOAST_TIMEOUT

    return queue.add(
      {
        title: message,
        description: options?.description,
        indicator: options?.indicator,
        variant: options?.variant ?? "default",
        actionProps: options?.actionProps,
        isLoading: options?.isLoading,
      },
      {
        timeout,
        onClose: () => {
          requestAnimationFrame(() => {
            options?.onClose?.()
          })
        },
      }
    )
  }

  toastFn.success = (
    message: ReactNode,
    options?: Omit<HeroUIToastOptions, "variant">
  ): string => toastFn(message, { ...options, variant: "success" })

  toastFn.danger = (
    message: ReactNode,
    options?: Omit<HeroUIToastOptions, "variant">
  ): string => toastFn(message, { ...options, variant: "danger" })

  toastFn.info = (
    message: ReactNode,
    options?: Omit<HeroUIToastOptions, "variant">
  ): string => toastFn(message, { ...options, variant: "accent" })

  toastFn.warning = (
    message: ReactNode,
    options?: Omit<HeroUIToastOptions, "variant">
  ): string => toastFn(message, { ...options, variant: "warning" })

  toastFn.promise = <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ToastPromiseOptions<T>
  ): string => {
    const promiseFn = typeof promise === "function" ? promise() : promise
    const loadingId = queue.add(
      { title: options.loading, variant: "default", isLoading: true },
      { timeout: 0 }
    )

    promiseFn
      .then((data) => {
        const successMessage =
          typeof options.success === "function"
            ? options.success(data)
            : options.success

        queue.close(loadingId)

        return toastFn.success(successMessage)
      })
      .catch((error: Error) => {
        const errorMessage =
          typeof options.error === "function"
            ? options.error(error)
            : options.error

        queue.close(loadingId)

        return toastFn.danger(errorMessage)
      })

    return loadingId
  }

  toastFn.getQueue = () => queue.getQueue()
  toastFn.close = (key: string) => queue.close(key)
  toastFn.pauseAll = () => queue.pauseAll()
  toastFn.resumeAll = () => queue.resumeAll()
  toastFn.clear = () => queue.clear()

  return toastFn
}

const toastQueue = new ToastQueue<ToastContentValue>({
  maxVisibleToasts: DEFAULT_RAC_MAX_VISIBLE_TOAST,
})

export const toast = createToastFunction(toastQueue)
export { toastQueue }
