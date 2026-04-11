"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@workspace/ui/lib/utils"

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  dismissible?: boolean
  children: React.ReactNode
  className?: string
}

function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  dismissible = true,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
      disablePointerDismissal={!dismissible}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              data-slot="bottom-sheet-backdrop"
              render={
                <motion.div
                  className="fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                />
              }
            />
            <Dialog.Popup
              data-slot="bottom-sheet"
              render={
                <motion.div
                  className={cn(
                    "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[28px] bg-surface-container-low safe-area-pb",
                    className
                  )}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.35, ease: [0.05, 0.7, 0.1, 1] }}
                />
              }
            >
              {/* Drag handle */}
              <div className="flex justify-center py-4">
                <div className="h-1 w-8 rounded-full bg-on-surface-low/40" />
              </div>

              {title && (
                <div className="px-6 pb-4">
                  <Dialog.Title className="text-title-large text-on-surface">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description className="mt-1 text-body-medium text-on-surface-low">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export { BottomSheet }
