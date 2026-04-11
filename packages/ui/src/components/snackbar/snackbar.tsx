"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"

export interface SnackbarData {
  id: string
  message: string
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface SnackbarContextValue {
  addSnackbar: (data: Omit<SnackbarData, "id">) => void
}

const SnackbarContext = React.createContext<SnackbarContextValue | null>(null)

function useSnackbar() {
  const ctx = React.useContext(SnackbarContext)
  if (!ctx) {
    throw new Error("useSnackbar must be used within a SnackbarProvider")
  }

  const { addSnackbar } = ctx

  return React.useMemo(
    () => ({
      toast: Object.assign(
        (options: Omit<SnackbarData, "id">) => addSnackbar(options),
        {
          error: (message: string) => addSnackbar({ message }),
          success: (message: string) => addSnackbar({ message }),
        }
      ),
    }),
    [addSnackbar]
  )
}

const DEFAULT_DURATION = 4000

function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbars, setSnackbars] = React.useState<SnackbarData[]>([])

  const removeSnackbar = React.useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const addSnackbar = React.useCallback(
    (data: Omit<SnackbarData, "id">) => {
      const id = crypto.randomUUID()
      const duration = data.duration ?? DEFAULT_DURATION

      setSnackbars((prev) => [...prev.slice(-4), { ...data, id }])

      setTimeout(() => {
        removeSnackbar(id)
      }, duration)
    },
    [removeSnackbar]
  )

  const contextValue = React.useMemo(() => ({ addSnackbar }), [addSnackbar])

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            data-slot="snackbar-container"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-70 flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <AnimatePresence mode="popLayout">
              {snackbars.map((snackbar) => (
                <SnackbarItem
                  key={snackbar.id}
                  data={snackbar}
                  onDismiss={() => removeSnackbar(snackbar.id)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </SnackbarContext.Provider>
  )
}

interface SnackbarItemProps {
  data: SnackbarData
  onDismiss: () => void
}

function SnackbarItem({ data, onDismiss }: SnackbarItemProps) {
  return (
    <motion.div
      data-slot="snackbar"
      layout
      initial={{ y: 24, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 24, opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
      className={cn(
        "pointer-events-auto flex max-w-[min(90vw,560px)] min-w-[288px] items-center gap-2",
        "bg-inverse-surface rounded-md px-4 py-3 shadow-md",
        "text-inverse-on-surface text-body-medium"
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex-1">{data.message}</span>
      {data.action && (
        <button
          type="button"
          className="text-inverse-primary shrink-0 text-label-large transition-opacity hover:opacity-80"
          onClick={() => {
            data.action?.onClick()
            onDismiss()
          }}
        >
          {data.action.label}
        </button>
      )}
    </motion.div>
  )
}

export { SnackbarProvider, useSnackbar }
