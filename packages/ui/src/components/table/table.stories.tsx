import type { Meta, StoryObj } from "@storybook/react"
import type { Selection, SortDescriptor } from "react-aria-components"

import React from "react"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Chip } from "@workspace/ui/components/chip"
import { Spinner } from "@workspace/ui/components/spinner"

import { Table } from "./index"

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary"],
    },
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

/* -------------------------------------------------------------------------------------------------
 * Sample Data
 * -----------------------------------------------------------------------------------------------*/
interface User {
  id: number
  name: string
  role: string
  status: "Active" | "Inactive" | "On Leave"
  email: string
}

const users: User[] = [
  {
    id: 1001,
    name: "Kate Moore",
    role: "CEO",
    status: "Active",
    email: "kate@acme.com",
  },
  {
    id: 1002,
    name: "John Smith",
    role: "CTO",
    status: "Active",
    email: "john@acme.com",
  },
  {
    id: 1003,
    name: "Sara Johnson",
    role: "CMO",
    status: "On Leave",
    email: "sara@acme.com",
  },
  {
    id: 1004,
    name: "Michael Brown",
    role: "CFO",
    status: "Active",
    email: "michael@acme.com",
  },
  {
    id: 1005,
    name: "Emily Davis",
    role: "Product Manager",
    status: "Inactive",
    email: "emily@acme.com",
  },
  {
    id: 1006,
    name: "Davis Wilson",
    role: "Lead Designer",
    status: "Active",
    email: "davis@acme.com",
  },
]

const columns = [
  { id: "name", isRowHeader: true, name: "Name" },
  { id: "role", name: "Role" },
  { id: "status", name: "Status" },
  { id: "email", name: "Email" },
]

const statusVariantMap: Record<string, "success" | "danger" | "warning"> = {
  Active: "success",
  Inactive: "danger",
  "On Leave": "warning",
}

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/

/**
 * Default table — primary variant with static rows
 */
export const Default: Story = {
  args: { variant: "primary" },
  render: ({ variant }) => (
    <div className="w-full max-w-3xl">
      <Table variant={variant}>
        <Table.ScrollContainer>
          <Table.Content aria-label="Team members">
            <Table.Header>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="status">Status</Table.Column>
              <Table.Column id="email">Email</Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id} id={user.id}>
                  <Table.Cell className="font-medium">{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={statusVariantMap[user.status]}
                      variant="soft"
                      size="sm"
                    >
                      {user.status}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell className="text-muted">{user.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  ),
}

/**
 * Secondary variant
 */
export const Secondary: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="Team members secondary">
            <Table.Header>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="email">Email</Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id} id={user.id}>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  ),
}

/**
 * Table with multi-row selection and checkboxes
 */
function SelectableTableExample() {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set())

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <p className="text-sm text-muted">
        Selected: {selectedKeys === "all" ? "All" : selectedKeys.size} row(s)
      </p>
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Selectable team members"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
          >
            <Table.Header>
              <Table.Column className="pr-0">
                <Checkbox aria-label="Select all" slot="selection">
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox>
              </Table.Column>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="status">Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id} id={user.id}>
                  <Table.Cell className="pr-0">
                    <Checkbox
                      aria-label={`Select ${user.name}`}
                      slot="selection"
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox>
                  </Table.Cell>
                  <Table.Cell className="font-medium">{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={statusVariantMap[user.status]}
                      variant="soft"
                      size="sm"
                    >
                      {user.status}
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  )
}

export const WithSelection: Story = {
  render: () => <SelectableTableExample />,
}

/**
 * Sortable table columns
 */
function SortableTableExample() {
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  })

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      const col = sortDescriptor.column as keyof User
      const cmp = String(a[col]).localeCompare(String(b[col]))
      return sortDescriptor.direction === "descending" ? -cmp : cmp
    })
  }, [sortDescriptor])

  return (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Sortable members"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          >
            <Table.Header>
              <Table.Column allowsSorting isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column allowsSorting id="role">
                Role
              </Table.Column>
              <Table.Column allowsSorting id="status">
                Status
              </Table.Column>
              <Table.Column id="email">Email</Table.Column>
            </Table.Header>
            <Table.Body>
              {sortedUsers.map((user) => (
                <Table.Row key={user.id} id={user.id}>
                  <Table.Cell className="font-medium">{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={statusVariantMap[user.status]}
                      variant="soft"
                      size="sm"
                    >
                      {user.status}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell className="text-muted">{user.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  )
}

export const Sortable: Story = {
  render: () => <SortableTableExample />,
}

/**
 * Dynamic collection using Table.Collection
 */
export const DynamicCollection: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Dynamic collection">
            <Table.Header columns={columns}>
              {(col) => (
                <Table.Column isRowHeader={col.isRowHeader}>
                  {col.name}
                </Table.Column>
              )}
            </Table.Header>
            <Table.Body items={users}>
              {(user) => (
                <Table.Row>
                  <Table.Collection items={columns}>
                    {(col) => (
                      <Table.Cell>{user[col.id as keyof User]}</Table.Cell>
                    )}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  ),
}

/**
 * Table with empty state
 */
export const EmptyState: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Empty table">
            <Table.Header>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="email">Email</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <div className="py-10 text-center text-sm text-muted">
                  No records found
                </div>
              )}
            >
              {[]}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  ),
}

/**
 * Table with column resizing
 */
export const ColumnResizing: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ResizableContainer>
          <Table.Content aria-label="Resizable columns">
            <Table.Header>
              <Table.Column
                isRowHeader
                defaultWidth="1fr"
                id="name"
                minWidth={120}
              >
                Name
                <Table.ColumnResizer />
              </Table.Column>
              <Table.Column defaultWidth="1fr" id="role" minWidth={160}>
                Role
                <Table.ColumnResizer />
              </Table.Column>
              <Table.Column defaultWidth="1fr" id="email" minWidth={180}>
                Email
              </Table.Column>
            </Table.Header>
            <Table.Body items={users}>
              {(user) => (
                <Table.Row>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ResizableContainer>
      </Table>
    </div>
  ),
}

/**
 * Table with async loading (infinite scroll simulation)
 */
const ITEMS_PER_PAGE = 3

function useAsyncUsers() {
  const [items, setItems] = React.useState<User[]>(() =>
    users.slice(0, ITEMS_PER_PAGE)
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const isLoadingRef = React.useRef(false)
  const hasMore = items.length < users.length

  const loadMore = React.useCallback(() => {
    if (!hasMore || isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    setTimeout(() => {
      setItems((prev) => users.slice(0, prev.length + ITEMS_PER_PAGE))
      setIsLoading(false)
      requestAnimationFrame(() => {
        isLoadingRef.current = false
      })
    }, 1200)
  }, [hasMore])

  return { hasMore, isLoading, items, loadMore }
}

function AsyncLoadingExample() {
  const { hasMore, isLoading, items, loadMore } = useAsyncUsers()

  return (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ScrollContainer className="h-[220px] overflow-y-auto">
          <Table.Content
            aria-label="Async loading table"
            className="min-w-[500px]"
          >
            <Table.Header>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="email">Email</Table.Column>
            </Table.Header>
            <Table.Body>
              <Table.Collection items={items}>
                {(user) => (
                  <Table.Row>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>{user.role}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                  </Table.Row>
                )}
              </Table.Collection>
              {!!hasMore && (
                <Table.LoadMore
                  isLoading={isLoading}
                  scrollOffset={0}
                  onLoadMore={loadMore}
                >
                  <Table.LoadMoreContent>
                    <Spinner size="sm" />
                  </Table.LoadMoreContent>
                </Table.LoadMore>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  )
}

export const AsyncLoading: Story = {
  render: () => <AsyncLoadingExample />,
}

/**
 * Table with a footer
 */
export const WithFooter: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Table with footer">
            <Table.Header>
              <Table.Column isRowHeader id="name">
                Name
              </Table.Column>
              <Table.Column id="role">Role</Table.Column>
              <Table.Column id="status">Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {users.slice(0, 4).map((user) => (
                <Table.Row key={user.id} id={user.id}>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={statusVariantMap[user.status]}
                      variant="soft"
                      size="sm"
                    >
                      {user.status}
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>
          <div className="flex items-center justify-between px-4 py-2 text-sm text-muted">
            <span>Showing 4 of {users.length} results</span>
            <Button size="sm" variant="ghost">
              Load more
            </Button>
          </div>
        </Table.Footer>
      </Table>
    </div>
  ),
}
