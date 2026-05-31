import type * as React from "react"
import { vi } from "vitest"

type RenderProp = {
  render?: React.ReactElement
}

function withRenderedSlot(
  ReactModule: typeof React,
  render: React.ReactElement | undefined,
  props: React.HTMLAttributes<HTMLElement>
) {
  if (!ReactModule.isValidElement(render)) {
    return null
  }

  return ReactModule.cloneElement(render, props)
}

vi.mock("@workspace/ui/components/ui/badge", async () => {
  const ReactModule = await import("react")

  return {
    Badge: ({ children, ...props }: React.ComponentPropsWithoutRef<"span">) =>
      ReactModule.createElement("span", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({
      children,
      render,
      ...props
    }: React.ComponentPropsWithoutRef<"button"> & RenderProp) =>
      withRenderedSlot(ReactModule, render, props) ??
      ReactModule.createElement("button", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/dropdown-menu", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) =>
    ReactModule.createElement("div", props, children)

  return {
    DropdownMenu: DivComponent,
    DropdownMenuCheckboxItem: DivComponent,
    DropdownMenuContent: DivComponent,
    DropdownMenuTrigger: ({
      children,
      render,
      ...props
    }: React.ComponentPropsWithoutRef<"div"> & RenderProp) =>
      withRenderedSlot(ReactModule, render, props) ??
      ReactModule.createElement("div", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/empty", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) =>
    ReactModule.createElement("div", props, children)

  return {
    Empty: DivComponent,
    EmptyDescription: DivComponent,
    EmptyHeader: DivComponent,
    EmptyTitle: DivComponent,
  }
})

vi.mock("@workspace/ui/components/ui/input", async () => {
  const ReactModule = await import("react")

  return {
    Input: (props: React.ComponentPropsWithoutRef<"input">) =>
      ReactModule.createElement("input", props),
  }
})

vi.mock("@workspace/ui/components/ui/select", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"div">) =>
    ReactModule.createElement("div", props, children)

  return {
    Select: ({ children }: React.PropsWithChildren) =>
      ReactModule.createElement("div", null, children),
    SelectContent: DivComponent,
    SelectItem: DivComponent,
    SelectTrigger: DivComponent,
    SelectValue: DivComponent,
  }
})

vi.mock("@workspace/ui/components/ui/table", async () => {
  const ReactModule = await import("react")

  return {
    Table: ({ children, ...props }: React.ComponentPropsWithoutRef<"table">) =>
      ReactModule.createElement("table", props, children),
    TableBody: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"tbody">) =>
      ReactModule.createElement("tbody", props, children),
    TableCell: ({ children, ...props }: React.ComponentPropsWithoutRef<"td">) =>
      ReactModule.createElement("td", props, children),
    TableHead: ({ children, ...props }: React.ComponentPropsWithoutRef<"th">) =>
      ReactModule.createElement("th", props, children),
    TableHeader: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"thead">) =>
      ReactModule.createElement("thead", props, children),
    TableRow: ({ children, ...props }: React.ComponentPropsWithoutRef<"tr">) =>
      ReactModule.createElement("tr", props, children),
  }
})
