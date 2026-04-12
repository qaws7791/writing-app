"use client"

import type { AlertDialogVariants } from "./alert-dialog.styles"
import type { ComponentPropsWithRef, HTMLAttributes } from "react"
import type {
  ButtonProps as ButtonPrimitiveProps,
  DialogProps as DialogPrimitiveProps,
} from "react-aria-components"

import { createContext, useContext, useMemo } from "react"
import {
  DialogTrigger as AlertDialogTriggerPrimitive,
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"
import { CloseButton } from "@workspace/ui/components/close-button"
import {
  DangerIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "@workspace/ui/components/icons"

import { alertDialogVariants } from "./alert-dialog.styles"

type AlertDialogPlacement = "auto" | "top" | "center" | "bottom"

type AlertDialogStatus = "default" | "accent" | "success" | "warning" | "danger"

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Context
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogContext = {
  slots?: ReturnType<typeof alertDialogVariants>
  placement?: AlertDialogPlacement
}

const AlertDialogContext = createContext<AlertDialogContext>({})

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Root
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogRootProps = ComponentPropsWithRef<
  typeof AlertDialogTriggerPrimitive
>

const AlertDialogRoot = ({ children, ...props }: AlertDialogRootProps) => {
  const alertDialogContext = useMemo<AlertDialogContext>(
    () => ({ slots: alertDialogVariants(), placement: undefined }),
    []
  )

  return (
    <AlertDialogContext value={alertDialogContext}>
      <AlertDialogTriggerPrimitive data-slot="alert-dialog-root" {...props}>
        {children}
      </AlertDialogTriggerPrimitive>
    </AlertDialogContext>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Trigger
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogTriggerProps = HTMLAttributes<HTMLDivElement>

const AlertDialogTrigger = ({
  children,
  className,
  ...props
}: AlertDialogTriggerProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <PressablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="alert-dialog-trigger"
        role="button"
        {...props}
      >
        {children}
      </div>
    </PressablePrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogBackdropProps extends ComponentPropsWithRef<
  typeof ModalOverlayPrimitive
> {
  variant?: AlertDialogVariants["variant"]
  /**
   * Whether to close the alert dialog when the user interacts outside it.
   * Alert dialogs typically require explicit action, so this defaults to false.
   * @default false
   */
  isDismissable?: boolean
  /**
   * Whether pressing the escape key to close the modal should be disabled.
   * Alert dialogs typically require explicit action, so this defaults to true.
   * @default true
   */
  isKeyboardDismissDisabled?: boolean
}

const AlertDialogBackdrop = ({
  children,
  className,
  isDismissable = false,
  isKeyboardDismissDisabled = true,
  onClick,
  variant,
  ...props
}: AlertDialogBackdropProps) => {
  const { slots: contextSlots } = useContext(AlertDialogContext)

  const updatedSlots = useMemo(
    () => alertDialogVariants({ variant }),
    [variant]
  )

  const updatedModalContext = useMemo<AlertDialogContext>(
    () => ({ slots: { ...contextSlots, ...updatedSlots } }),
    [contextSlots, updatedSlots]
  )

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      data-slot="alert-dialog-backdrop"
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      {...props}
    >
      {(renderProps) => (
        <AlertDialogContext value={updatedModalContext}>
          {typeof children === "function"
            ? children(renderProps)
            : children}{" "}
        </AlertDialogContext>
      )}
    </ModalOverlayPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Container
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogContainerProps extends Omit<
  ComponentPropsWithRef<typeof ModalPrimitive>,
  Exclude<keyof AlertDialogBackdropProps, "children" | "className">
> {
  placement?: AlertDialogPlacement
  size?: AlertDialogVariants["size"]
}

const AlertDialogContainer = ({
  children,
  className,
  placement = "auto",
  size,
  ...props
}: AlertDialogContainerProps) => {
  const { slots: contextSlots } = useContext(AlertDialogContext)

  const updatedSlots = useMemo(() => alertDialogVariants({ size }), [size])

  const updatedContext = useMemo<AlertDialogContext>(
    () => ({ placement, slots: { ...contextSlots, ...updatedSlots } }),
    [placement, contextSlots, updatedSlots]
  )

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.container())}
      data-placement={placement}
      data-slot="alert-dialog-container"
      {...props}
    >
      {(renderProps) => (
        <AlertDialogContext value={updatedContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </AlertDialogContext>
      )}
    </ModalPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Dialog
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogDialogProps = DialogPrimitiveProps

const AlertDialogDialog = ({
  children,
  className,
  ...props
}: AlertDialogDialogProps) => {
  const { placement, slots } = useContext(AlertDialogContext)

  return (
    <DialogPrimitive
      className={composeSlotClassName(slots?.dialog, className)}
      data-placement={placement}
      data-slot="alert-dialog-dialog"
      role="alertdialog"
      {...props}
    >
      {children}
    </DialogPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Header
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogHeaderProps = HTMLAttributes<HTMLDivElement>

const AlertDialogHeader = ({
  children,
  className,
  ...props
}: AlertDialogHeaderProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <div
      className={composeSlotClassName(slots?.header, className)}
      data-slot="alert-dialog-header"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Heading
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogHeadingProps = ComponentPropsWithRef<typeof HeadingPrimitive>

const AlertDialogHeading = ({
  children,
  className,
  ...props
}: AlertDialogHeadingProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      data-slot="alert-dialog-heading"
      slot="title"
      {...props}
    >
      {children}
    </HeadingPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Body
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogBodyProps = HTMLAttributes<HTMLDivElement>

const AlertDialogBody = ({
  children,
  className,
  ...props
}: AlertDialogBodyProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <div
      className={composeSlotClassName(slots?.body, className)}
      data-slot="alert-dialog-body"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Footer
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogFooterProps = HTMLAttributes<HTMLDivElement>

const AlertDialogFooter = ({
  children,
  className,
  ...props
}: AlertDialogFooterProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <div
      className={composeSlotClassName(slots?.footer, className)}
      data-slot="alert-dialog-footer"
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Icon
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogIconProps extends ComponentPropsWithRef<"div"> {
  status?: AlertDialogStatus
}

const AlertDialogIcon = ({
  children,
  className,
  status = "danger",
  ...props
}: AlertDialogIconProps) => {
  const slots = useMemo(() => alertDialogVariants({ status }), [status])

  const getDefaultIcon = () => {
    switch (status) {
      case "default":
        return <InfoIcon data-slot="alert-dialog-default-icon" />
      case "accent":
        return <InfoIcon data-slot="alert-dialog-default-icon" />
      case "success":
        return <SuccessIcon data-slot="alert-dialog-default-icon" />
      case "warning":
        return <WarningIcon data-slot="alert-dialog-default-icon" />
      case "danger":
        return <DangerIcon data-slot="alert-dialog-default-icon" />
      default:
        return <DangerIcon data-slot="alert-dialog-default-icon" />
    }
  }

  return (
    <div
      className={slots?.icon({ className })}
      data-slot="alert-dialog-icon"
      {...props}
    >
      {children ?? getDefaultIcon()}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Close Trigger
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogCloseTriggerProps = ButtonPrimitiveProps

const AlertDialogCloseTrigger = ({
  className,
  ...rest
}: AlertDialogCloseTriggerProps) => {
  const { slots } = useContext(AlertDialogContext)

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      data-slot="alert-dialog-close-trigger"
      slot="close"
      {...rest}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogIcon,
  AlertDialogCloseTrigger,
}

export type {
  AlertDialogRootProps,
  AlertDialogTriggerProps,
  AlertDialogBackdropProps,
  AlertDialogContainerProps,
  AlertDialogDialogProps,
  AlertDialogHeaderProps,
  AlertDialogHeadingProps,
  AlertDialogBodyProps,
  AlertDialogFooterProps,
  AlertDialogIconProps,
  AlertDialogCloseTriggerProps,
  AlertDialogStatus,
  AlertDialogPlacement,
}
