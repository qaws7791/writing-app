import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { $applyNodeReplacement, DecoratorNode } from "lexical"

import { isAllowedResourceImageUrl } from "#resource-document/resource-markdown-validation"

export type SerializedResourceImageNode = Spread<
  {
    readonly alt: string
    readonly type: "resource-image"
    readonly url: string
    readonly version: 1
  },
  SerializedLexicalNode
>

export class ResourceImageNode extends DecoratorNode<null> {
  __alt: string
  __url: string

  static getType(): string {
    return "resource-image"
  }

  static clone(node: ResourceImageNode): ResourceImageNode {
    return new ResourceImageNode(node.__url, node.__alt, node.__key)
  }

  static importJSON(
    serializedNode: SerializedResourceImageNode
  ): ResourceImageNode {
    return $createResourceImageNode({
      alt: serializedNode.alt,
      url: serializedNode.url,
    })
  }

  constructor(url = "", alt = "", key?: NodeKey) {
    super(key)
    this.__alt = alt
    this.__url = url
  }

  createDOM(_config: EditorConfig): HTMLImageElement {
    const { alt, url } = readRenderableResourceImage(this)
    const image = document.createElement("img")

    image.alt = alt
    image.referrerPolicy = "no-referrer"
    image.src = url

    return image
  }

  updateDOM(previousNode: ResourceImageNode, image: HTMLImageElement): boolean {
    const { alt, url } = readRenderableResourceImage(this)

    if (previousNode.__alt !== alt) {
      image.alt = alt
    }

    if (previousNode.__url !== url) {
      image.src = url
    }

    return false
  }

  decorate(): null {
    return null
  }

  exportJSON(): SerializedResourceImageNode {
    return {
      ...super.exportJSON(),
      alt: this.getAltText(),
      type: "resource-image",
      url: this.getUrl(),
      version: 1,
    }
  }

  getAltText(): string {
    return this.getLatest().__alt
  }

  getUrl(): string {
    return this.getLatest().__url
  }

  isInline(): false {
    return false
  }
}

export type CreateResourceImageNodeInput = {
  readonly alt: string
  readonly url: string
}

export function $createResourceImageNode({
  alt,
  url,
}: CreateResourceImageNodeInput): ResourceImageNode {
  if (alt.trim().length === 0) {
    throw new TypeError("자료 이미지에는 대체 텍스트가 필요합니다.")
  }

  if (!isAllowedResourceImageUrl(url)) {
    throw new TypeError("자료 이미지는 HTTPS URL만 사용할 수 있습니다.")
  }

  return $applyNodeReplacement(new ResourceImageNode(url, alt))
}

export function $isResourceImageNode(
  node: LexicalNode | null | undefined
): node is ResourceImageNode {
  return node instanceof ResourceImageNode
}

function readRenderableResourceImage(
  node: ResourceImageNode
): CreateResourceImageNodeInput {
  const alt: unknown = node.getAltText()
  const url: unknown = node.getUrl()

  if (typeof alt !== "string" || alt.trim().length === 0) {
    throw new TypeError("자료 이미지에는 대체 텍스트가 필요합니다.")
  }

  if (typeof url !== "string" || !isAllowedResourceImageUrl(url)) {
    throw new TypeError("자료 이미지는 HTTPS URL만 사용할 수 있습니다.")
  }

  return { alt, url }
}
