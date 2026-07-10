import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { describe, expect, it } from "vitest"

import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree"

type TestTreeItem = {
  readonly children: readonly string[]
  readonly folder: boolean
  readonly name: string
}

const items: Readonly<Record<string, TestTreeItem>> = {
  document: { children: [], folder: false, name: "운영 안내" },
  folder: { children: ["document"], folder: true, name: "운영" },
  root: { children: ["folder"], folder: true, name: "자료실" },
}

describe("Tree", () => {
  it("Headless Tree의 접근성 props와 펼침·선택 상태를 렌더링한다", () => {
    render(<TestTree />)

    expect(screen.getByRole("tree", { name: "자료 트리" })).toBeVisible()
    expect(screen.getAllByRole("treeitem")).toHaveLength(2)
    expect(screen.getByRole("treeitem", { name: "운영" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(
      screen.getByRole("treeitem", { name: "운영 안내" })
    ).not.toHaveAttribute("aria-expanded")
  })

  it("방향키로 펼친 폴더의 문서와 부모 폴더를 탐색한다", async () => {
    const user = userEvent.setup()

    render(<TestTree />)
    const folder = screen.getByRole("treeitem", { name: "운영" })
    const document = screen.getByRole("treeitem", { name: "운영 안내" })

    folder.focus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() => {
      expect(document).toHaveFocus()
    })

    await user.keyboard("{ArrowLeft}")
    await waitFor(() => {
      expect(folder).toHaveFocus()
    })
  })
})

function TestTree() {
  const tree = useTree<TestTreeItem>({
    dataLoader: {
      getChildren: (itemId) => [...readItem(itemId).children],
      getItem: readItem,
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
    getItemName: (item) => item.getItemData().name,
    initialState: { expandedItems: ["folder"] },
    isItemFolder: (item) => item.getItemData().folder,
    rootItemId: "root",
  })

  return (
    <Tree tree={tree} aria-label="자료 트리">
      {tree.getItems().map((item) => (
        <TreeItem item={item} key={item.getId()}>
          <TreeItemLabel />
        </TreeItem>
      ))}
    </Tree>
  )
}

function readItem(itemId: string): TestTreeItem {
  const item = items[itemId]

  if (item === undefined) {
    throw new Error(`테스트 트리 항목을 찾을 수 없습니다: ${itemId}`)
  }

  return item
}
