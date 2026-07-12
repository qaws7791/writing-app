import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Tree, TreeItem, TreeItemLabel } from "@workspace/ui/components/ui/tree"

type ResourceTreeItem = {
  readonly children: readonly string[]
  readonly folder: boolean
  readonly name: string
}

const resourceItems: Readonly<Record<string, ResourceTreeItem>> = {
  guide: { children: [], folder: false, name: "운영 안내" },
  operations: { children: ["guide"], folder: true, name: "운영" },
  root: { children: ["operations"], folder: true, name: "자료실" },
}

const meta = {
  title: "Components/UI/Tree",
  component: ResourceTree,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ResourceTree>

export default meta
type Story = StoryObj<typeof meta>

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const folder = canvas.getByRole("treeitem", { name: "운영" })
    const document = canvas.getByRole("treeitem", { name: "운영 안내" })

    folder.focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(document).toHaveFocus())

    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(folder).toHaveFocus())
  },
}

function ResourceTree() {
  const tree = useTree<ResourceTreeItem>({
    dataLoader: {
      getChildren: (itemId) => [...readResourceItem(itemId).children],
      getItem: readResourceItem,
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
    getItemName: (item) => item.getItemData().name,
    initialState: { expandedItems: ["operations"] },
    isItemFolder: (item) => item.getItemData().folder,
    rootItemId: "root",
  })

  return (
    <Tree tree={tree} aria-label="자료 트리" className="w-72">
      {tree.getItems().map((item) => (
        <TreeItem item={item} key={item.getId()}>
          <TreeItemLabel />
        </TreeItem>
      ))}
    </Tree>
  )
}

function readResourceItem(itemId: string): ResourceTreeItem {
  const item = resourceItems[itemId]

  if (item === undefined) {
    throw new Error(`Storybook 자료 항목을 찾을 수 없습니다: ${itemId}`)
  }

  return item
}
