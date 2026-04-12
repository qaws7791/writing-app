"use client"

import type { UseOverlayStateReturn } from "@workspace/ui/hooks/use-overlay-state"
import type { SurfaceVariants } from "@workspace/ui/components/surface"
import type { ModalVariants } from "./modal.styles"
import type { ComponentPropsWithRef, ReactNode } from "react"
import type {
  Button as ButtonPrimitive,
  DialogProps as DialogPrimitiveProps,
} from "react-aria-components"

import { createContext, useContext, useMemo } from "react"
import {
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  DialogTrigger as ModalTriggerPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"
import { CloseButton } from "@workspace/ui/components/close-button"
import { SurfaceContext } from "@workspace/ui/components/surface"

import { modalVariants } from "./modal.styles"

type ModalPlacement = "auto" | "top" | "center" | "bottom"

/* -------------------------------------------------------------------------------------------------
 * Modal Context
 * -----------------------------------------------------------------------------------------------*/
type ModalContext = {
  slots?: ReturnType<typeof modalVariants>
  placement?: ModalPlacement
}

const ModalContext = createContext<ModalContext>({})

/* -------------------------------------------------------------------------------------------------
 * Modal Root
 * -----------------------------------------------------------------------------------------------*/
interface ModalRootProps extends ComponentPropsWithRef<
  typeof ModalTriggerPrimitive
> {
  state?: UseOverlayStateReturn
}

const ModalRoot = ({ children, state, ...props }: ModalRootProps) => {
  const modalContext = useMemo<ModalContext>(
    () => ({ slots: modalVariants(), placement: undefined }),
    []
  )

  return (
    <ModalContext value={modalContext}>
      <ModalTriggerPrimitive
        data-slot="modal-root"
        {...props}
        {...(state
          ? { isOpen: state.isOpen, onOpenChange: state.setOpen }
          : {})}
      >
        {children}
      </ModalTriggerPrimitive>
    </ModalContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Trigger
 * -----------------------------------------------------------------------------------------------*/
type ModalTriggerProps = ComponentPropsWithRef<"div">

const ModalTrigger = ({ children, className, ...props }: ModalTriggerProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <PressablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="modal-trigger"
        role="button"
        {...props}
      >
        {children}
      </div>
    </PressablePrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface ModalBackdropProps extends ComponentPropsWithRef<
  typeof ModalOverlayPrimitive
> {
  variant?: ModalVariants["variant"]
  isDismissable?: boolean
}

const ModalBackdrop = ({
  children,
  className,
  isDismissable = true,
  onClick,
  variant,
  ...props
}: ModalBackdropProps) => {
  const { slots: contextSlots } = useContext(ModalContext)

  const updatedSlots = useMemo(() => modalVariants({ variant }), [variant])

  const updatedModalContext = useMemo<ModalContext>(
    () => ({ slots: { ...contextSlots, ...updatedSlots } }),
    [contextSlots, updatedSlots]
  )

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      data-slot="modal-backdrop"
      isDismissable={isDismissable}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      {...props}
    >
      {(renderProps) => (
        <ModalContext value={updatedModalContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext>
      )}
    </ModalOverlayPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Container
 * -----------------------------------------------------------------------------------------------*/
interface ModalContainerProps extends Omit<
  ComponentPropsWithRef<typeof ModalPrimitive>,
  Exclude<keyof ModalBackdropProps, "children" | "className">
> {
  placement?: ModalPlacement
  scroll?: ModalVariants["scroll"]
  size?: ModalVariants["size"]
}

const ModalContainer = ({
  children,
  className,
  placement = "auto",
  scroll,
  size,
  ...props
}: ModalContainerProps) => {
  const { slots: contextSlots } = useContext(ModalContext)

  const updatedSlots = useMemo(
    () => modalVariants({ scroll, size }),
    [scroll, size]
  )

  const updatedModalContext = useMemo<ModalContext>(
    () => ({
      placement,
      slots: { ...contextSlots, ...updatedSlots },
    }),
    [contextSlots, placement, updatedSlots]
  )

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.container())}
      data-placement={placement}
      data-slot="modal-container"
      {...props}
    >
      {(renderProps) => (
        <ModalContext value={updatedModalContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext>
      )}
    </ModalPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Dialog
 * -----------------------------------------------------------------------------------------------*/
type ModalDialogProps = DialogPrimitiveProps

const ModalDialog = ({ children, className, ...props }: ModalDialogProps) => {
  const { placement, slots } = useContext(ModalContext)

  return (
    <SurfaceContext
      value={{ variant: "default" as SurfaceVariants["variant"] }}
    >
      <DialogPrimitive
        className={composeSlotClassName(slots?.dialog, className)}
        data-placement={placement}
        data-slot="modal-dialog"
        {...props}
      >
        {children}
      </DialogPrimitive>
    </SurfaceContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Header
 * -----------------------------------------------------------------------------------------------*/
type ModalHeaderProps = ComponentPropsWithRef<"div">

const ModalHeader = ({ children, className, ...props }: ModalHeaderProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <div
      className={composeSlotClassName(slots?.header, className)}
      data-slot="modal-header"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Body
 * -----------------------------------------------------------------------------------------------*/
type ModalBodyProps = ComponentPropsWithRef<"div">

const ModalBody = ({ children, className, ...props }: ModalBodyProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <div
      className={composeSlotClassName(slots?.body, className)}
      data-slot="modal-body"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Footer
 * -----------------------------------------------------------------------------------------------*/
type ModalFooterProps = ComponentPropsWithRef<"div">

const ModalFooter = ({ children, className, ...props }: ModalFooterProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <div
      className={composeSlotClassName(slots?.footer, className)}
      data-slot="modal-footer"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Heading
 * -----------------------------------------------------------------------------------------------*/
type ModalHeadingProps = ComponentPropsWithRef<typeof HeadingPrimitive>

const ModalHeading = ({ children, className, ...props }: ModalHeadingProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      data-slot="modal-heading"
      slot="title"
      {...props}
    >
      {children}
    </HeadingPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Icon
 * -----------------------------------------------------------------------------------------------*/
type ModalIconProps = ComponentPropsWithRef<"div">

const ModalIcon = ({ children, className, ...props }: ModalIconProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <div
      className={composeSlotClassName(slots?.icon, className)}
      data-slot="modal-icon"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Modal Close Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ModalCloseTriggerProps extends ComponentPropsWithRef<
  typeof ButtonPrimitive
> {
  className?: string
  children?: ReactNode
}

const ModalCloseTrigger = ({ className, ...rest }: ModalCloseTriggerProps) => {
  const { slots } = useContext(ModalContext)

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      data-slot="modal-close-trigger"
      slot="close"
      {...rest}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ModalRoot,
  ModalTrigger,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
}

export type {
  ModalRootProps,
  ModalTriggerProps,
  ModalBackdropProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalHeaderProps,
  ModalIconProps,
  ModalHeadingProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalCloseTriggerProps,
}
