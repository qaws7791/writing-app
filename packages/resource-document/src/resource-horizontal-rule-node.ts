import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { $applyNodeReplacement, DecoratorNode } from "lexical"

export type SerializedResourceHorizontalRuleNode = Spread<
  {
    readonly type: "resource-horizontal-rule"
    readonly version: 1
  },
  SerializedLexicalNode
>

export class ResourceHorizontalRuleNode extends DecoratorNode<null> {
  static getType(): string {
    return "resource-horizontal-rule"
  }

  static clone(node: ResourceHorizontalRuleNode): ResourceHorizontalRuleNode {
    return new ResourceHorizontalRuleNode(node.__key)
  }

  static importJSON(): ResourceHorizontalRuleNode {
    return $createResourceHorizontalRuleNode()
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("hr")
  }

  updateDOM(): false {
    return false
  }

  decorate(): null {
    return null
  }

  isInline(): false {
    return false
  }

  exportJSON(): SerializedResourceHorizontalRuleNode {
    return {
      ...super.exportJSON(),
      type: "resource-horizontal-rule",
      version: 1,
    }
  }
}

export function $createResourceHorizontalRuleNode(): ResourceHorizontalRuleNode {
  return $applyNodeReplacement(new ResourceHorizontalRuleNode())
}

export function $isResourceHorizontalRuleNode(
  node: LexicalNode | null | undefined
): node is ResourceHorizontalRuleNode {
  return node instanceof ResourceHorizontalRuleNode
}
