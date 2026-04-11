"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { motion, AnimatePresence } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const dialogVariants = cva("", {
  variants: {
    variant: {
      basic: [
        "relative m-auto w-[min(90vw,560px)] rounded-[28px] bg-surface-container-high p-6",
        "shadow-lg",
      ],
      "full-screen": ["fixed inset-0 bg-surface"],
    },
  },
  defaultVariants: {
    variant: "basic",
  },
})

export interface DialogProps extends VariantProps<typeof dialogVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function DialogComponent({
  open,
  onOpenChange,
  variant = "basic",
  title,
  description,
  children,
  actions,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
    >
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal keepMounted>
            <DialogPrimitive.Backdrop
              data-slot="dialog-backdrop"
              render={
                <motion.div
                  className="fixed inset-0 z-50 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              }
            />
            <DialogPrimitive.Popup
              data-slot="dialog"
              render={
                <motion.div
                  className={cn(
                    "fixed inset-0 z-50 flex items-center justify-center",
                    variant === "full-screen" && "items-stretch justify-stretch"
                  )}
                  initial={
                    variant === "full-screen"
                      ? { y: "100%", opacity: 0.5 }
                      : { scale: 0.9, opacity: 0 }
                  }
                  animate={
                    variant === "full-screen"
                      ? { y: 0, opacity: 1 }
                      : { scale: 1, opacity: 1 }
                  }
                  exit={
                    variant === "full-screen"
                      ? { y: "100%", opacity: 0.5 }
                      : { scale: 0.9, opacity: 0 }
                  }
                  transition={{ duration: 0.2, ease: [0.05, 0.7, 0.1, 1] }}
                />
              }
            >
              <div className={cn(dialogVariants({ variant }), className)}>
                {title && (
                  <DialogPrimitive.Title className="text-headline-small text-on-surface">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="mt-2 text-body-medium text-on-surface-low">
                    {description}
                  </DialogPrimitive.Description>
                )}

                <div className={cn(title && "mt-4")}>{children}</div>

                {actions && (
                  <div className="mt-6 flex items-center justify-end gap-2">
                    {actions}
                  </div>
                )}
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export { DialogComponent as Dialog, DialogClose }
