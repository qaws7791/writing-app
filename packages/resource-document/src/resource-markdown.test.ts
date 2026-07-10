import { describe, expect, it } from "vitest"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { $createLinkNode, $isLinkNode } from "@lexical/link"
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
} from "@lexical/list"
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text"
import {
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
} from "@lexical/table"
import {
  $setSlot,
  $setState,
  $createParagraphNode,
  $createTextNode,
  $createLineBreakNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  type TextFormatType,
  createState,
} from "lexical"

import {
  $isResourceImageNode,
  createResourceDocumentEditor,
  normalizeResourceMarkdown,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
  validateResourceMarkdown,
} from "#resource-document/index"
import { $validateResourceDocumentStructure } from "#resource-document/resource-lexical-validation"
import { $createResourceTableNodeWithDimensions } from "#resource-document/resource-table-state"

describe("자료 Markdown 계약", () => {
  it("새 자료 표에 GFM 열 정렬 상태를 함께 초기화한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        $getRoot().append($createResourceTableNodeWithDimensions(2, 2))
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "|   |   |\n| - | - |\n|   |   |",
      status: "valid",
    })
  })

  it("문단의 GFM 인라인 서식을 의미 손실 없이 보존한다", () => {
    const markdown =
      "일반 **굵게** *기울임* ~~취소선~~ `인라인 코드` [링크](https://example.com)를 포함한다."

    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown:
        "일반 **굵게** _기울임_ ~~취소선~~ `인라인 코드` [링크](https://example.com)를 포함한다.",
      status: "valid",
    })
  })

  it("중첩·겹침 inline format range와 code·link 경계를 구조적으로 보존한다", () => {
    const fixtures = [
      "*before **middle** after*",
      "~~strike **bold** strike~~",
      "**bold *nested***",
      "*left* `code` **[link](https://example.com)** ~~right~~",
    ]

    for (const fixture of fixtures) {
      const normalized = expectStableNormalization(fixture)

      expect(readFormattingSegments(normalized)).toEqual(
        readFormattingSegments(fixture)
      )
    }
  })

  it("세 TextNode의 모든 inline format 전이를 의미 손실 없이 보존한다", () => {
    for (const firstFormats of resourceInlineFormatSets) {
      for (const secondFormats of resourceInlineFormatSets) {
        for (const thirdFormats of resourceInlineFormatSets) {
          const expected = [firstFormats, secondFormats, thirdFormats]
          const editor = createResourceDocumentEditor()

          editor.update(
            () => {
              $getRoot().append(
                $createParagraphNode().append(
                  createFormattedFixtureText("A", firstFormats),
                  createFormattedFixtureText("B", secondFormats),
                  createFormattedFixtureText("C", thirdFormats)
                )
              )
            },
            { discrete: true }
          )

          const projection = readResourceDocumentMarkdown(editor)

          expect(projection.status).toBe("valid")

          if (projection.status !== "valid") {
            throw new Error("inline format 전이 fixture가 거부되었습니다.")
          }

          const restoredEditor = createResourceDocumentEditor()

          expect(
            replaceResourceDocumentMarkdown(restoredEditor, projection.markdown)
          ).toEqual({ status: "valid" })
          expect(
            readCharacterFormatting(restoredEditor),
            `${projection.markdown} :: ${JSON.stringify(expected)}`
          ).toEqual(expected)
          expect(readResourceDocumentMarkdown(restoredEditor)).toEqual(
            projection
          )
        }
      }
    }
  })

  it("delimiter-sensitive 문자의 모든 inline format 전이를 valid일 때만 의미 손실 없이 보존한다", () => {
    const fixtures = [
      ["~", "A", "B"],
      ["A", "~", "B"],
      ["A", "B", "~"],
      ["~", "~", "A"],
      ["A", "~", "~"],
      ["*", "_", "~"],
      ["`", "~", "\\"],
      ["[", "~", "]"],
    ] as const
    let invalidStates = 0
    let validStates = 0

    for (const characters of fixtures) {
      for (const firstFormats of resourceInlineFormatSets) {
        for (const secondFormats of resourceInlineFormatSets) {
          for (const thirdFormats of resourceInlineFormatSets) {
            const expected = [firstFormats, secondFormats, thirdFormats]
            const editor = createResourceDocumentEditor()

            editor.update(
              () => {
                $getRoot().append(
                  $createParagraphNode().append(
                    createFormattedFixtureText(characters[0], firstFormats),
                    createFormattedFixtureText(characters[1], secondFormats),
                    createFormattedFixtureText(characters[2], thirdFormats)
                  )
                )
              },
              { discrete: true }
            )

            const projection = readResourceDocumentMarkdown(editor)

            if (projection.status !== "valid") {
              expect(projection).toEqual({
                issues: [{ code: "markdown-round-trip-mismatch" }],
                status: "invalid",
              })
              invalidStates += 1
              continue
            }

            validStates += 1

            const restoredEditor = createResourceDocumentEditor()

            expect(
              replaceResourceDocumentMarkdown(
                restoredEditor,
                projection.markdown
              )
            ).toEqual({ status: "valid" })

            expect(
              readCharacterFormatting(restoredEditor),
              `${projection.markdown} :: ${JSON.stringify(expected)}`
            ).toEqual(expected)
            expect(restoredEditor.read(() => $getRoot().getTextContent())).toBe(
              characters.join("")
            )
          }
        }
      }
    }

    expect(invalidStates).toBeGreaterThan(0)
    expect(validStates).toBeGreaterThan(0)
  }, 30_000)

  it("GFM으로 표현할 수 없는 취소선 물결표 인접 상태를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            createFormattedFixtureText("~", ["strikethrough"]),
            $createTextNode("AB")
          )
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [{ code: "markdown-round-trip-mismatch" }],
      status: "invalid",
    })
  })

  it("자료 표 정렬 이외의 persisted NodeState를 export 전에 거부한다", () => {
    const probeState = createState("probe", {
      parse: (value) => (typeof value === "string" ? value : ""),
    })
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        const text = $createTextNode("본문")

        $setState(text, probeState, "secret")
        $getRoot().append($createParagraphNode().append(text))
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-node-state",
          keys: ["probe"],
          nodeType: "text",
        },
      ],
      status: "invalid",
    })
  })

  it("Markdown에 표현되지 않는 Lexical slot을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append($createTextNode("본문"))

        $setSlot(paragraph, "probe", $createParagraphNode())
        $getRoot().append(paragraph)
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-node-slots",
          nodeType: "paragraph",
          slots: ["probe"],
        },
      ],
      status: "invalid",
    })
  })

  it("제목 1부터 제목 3까지 보존한다", () => {
    const markdown = "# 제목 1\n\n## 제목 2\n\n### 제목 3"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        return $getRoot()
          .getChildren()
          .map((node) => node.getType())
      })
    ).toEqual(["heading", "heading", "heading"])
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown: "# 제목 1\n\n## 제목 2\n\n### 제목 3",
      status: "valid",
    })
    expect(normalizeResourceMarkdown("Setext 제목\n===")).toEqual({
      markdown: "# Setext 제목",
      status: "valid",
    })
  })

  it("인용 블록을 보존한다", () => {
    const markdown = "> 중요한 인용"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => $getRoot().getFirstChild()?.getType())
    ).toBe("quote")
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown,
      status: "valid",
    })
  })

  it("글머리·번호·할 일 목록과 중첩 구조를 보존한다", () => {
    const markdown = [
      "- 상위 항목",
      "    - 중첩 항목",
      "",
      "1. 첫 번째",
      "2. 두 번째",
      "",
      "- [x] 완료",
      "- [ ] 미완료",
    ].join("\n")
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        return $getRoot()
          .getChildren()
          .map((node) => node.getType())
      })
    ).toEqual(["list", "list", "list"])
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown: [
        "- 상위 항목",
        "  - 중첩 항목",
        "",
        "1. 첫 번째",
        "2. 두 번째",
        "",
        "- [x] 완료",
        "- [ ] 미완료",
      ].join("\n"),
      status: "valid",
    })
  })

  it("fenced code의 언어와 본문을 보존한다", () => {
    const markdown = "```typescript\nconst value = 1\n```"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        const node = $getRoot().getFirstChild()

        return $isCodeNode(node) ? node.getLanguage() : null
      })
    ).toBe("typescript")
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown,
      status: "valid",
    })
  })

  it("구분선을 블록 노드로 보존한다", () => {
    const markdown = "위 문단\n\n---\n\n아래 문단"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        return $getRoot()
          .getChildren()
          .map((node) => node.getType())
      })
    ).toEqual(["paragraph", "resource-horizontal-rule", "paragraph"])
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown,
      status: "valid",
    })
  })

  it("GFM 표의 머리글과 본문 셀을 보존한다", () => {
    const markdown = [
      "| **이름** | 상태 |",
      "| :--- | ---: |",
      "| 자료실 | 준비 |",
    ].join("\n")
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => $getRoot().getFirstChild()?.getType())
    ).toBe("table")
    expect(
      editor.read(() => {
        const table = $getRoot().getFirstChild()

        return $isTableNode(table)
          ? table
              .getChildren()
              .filter($isTableRowNode)
              .map((row) =>
                row
                  .getChildren()
                  .filter($isTableCellNode)
                  .map((cell) => cell.getHeaderStyles())
              )
          : []
      })
    ).toEqual([
      [TableCellHeaderStates.ROW, TableCellHeaderStates.ROW],
      [TableCellHeaderStates.NO_STATUS, TableCellHeaderStates.NO_STATUS],
    ])
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown: [
        "| **이름** | 상태 |",
        "| :----- | -: |",
        "| 자료실    | 준비 |",
      ].join("\n"),
      status: "valid",
    })
    expectStableNormalization(markdown)
  })

  it("HTTPS 이미지 URL과 대체 텍스트를 보존한다", () => {
    const markdown = "![자료 구조](https://images.example.com/tree.png)"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        const node = $getRoot().getFirstChild()

        return $isResourceImageNode(node)
          ? { alt: node.getAltText(), url: node.getUrl() }
          : null
      })
    ).toEqual({
      alt: "자료 구조",
      url: "https://images.example.com/tree.png",
    })
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown,
      status: "valid",
    })
  })

  it("escaped 대체 텍스트와 괄호가 있는 HTTPS 이미지 URL을 보존한다", () => {
    const markdown = "![대괄호 \\] 설명](https://images.example.com/a_(b).png)"
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, markdown)

    expect(
      editor.getEditorState().read(() => {
        const node = $getRoot().getFirstChild()

        return $isResourceImageNode(node)
          ? { alt: node.getAltText(), url: node.getUrl() }
          : null
      })
    ).toEqual({
      alt: "대괄호 ] 설명",
      url: "https://images.example.com/a_(b).png",
    })
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown: "![대괄호 \\] 설명](https://images.example.com/a_\\(b\\).png)",
      status: "valid",
    })
    expectStableNormalization(markdown)
  })

  it("위험한 링크와 HTTPS가 아닌 이미지를 거부한다", () => {
    const markdown = [
      "[위험 링크](javascript:alert(1))",
      "",
      "![안전하지 않은 이미지](http://images.example.com/image.png)",
      "",
      '[제목이 있는 위험 링크](data:text/plain,unsafe "설명")',
      "",
      "![](https://images.example.com/missing-alt.png)",
    ].join("\n")

    expect(normalizeResourceMarkdown(markdown)).toEqual({
      issues: [
        {
          code: "unsafe-link-url",
          url: "javascript:alert(1)",
        },
        {
          code: "unsafe-image-url",
          url: "http://images.example.com/image.png",
        },
        {
          code: "unsafe-link-url",
          url: "data:text/plain,unsafe",
        },
        {
          code: "unsupported-link-title",
        },
        {
          code: "missing-image-alt",
        },
      ],
      status: "invalid",
    })
  })

  it("원시 HTML을 실행 가능한 노드가 아닌 literal code로 보존한다", () => {
    const markdown = '<script>alert("실행 금지")</script>'
    const editor = createResourceDocumentEditor()

    expect(replaceResourceDocumentMarkdown(editor, markdown)).toEqual({
      status: "valid",
    })
    expect(
      editor.getEditorState().read(() => {
        const node = $getRoot().getFirstChild()

        return {
          text: node?.getTextContent(),
          type: node?.getType(),
        }
      })
    ).toEqual({
      text: markdown,
      type: "code",
    })
    expect(normalizeResourceMarkdown(markdown)).toEqual({
      markdown: ["```html", '<script>alert("실행 금지")</script>', "```"].join(
        "\n"
      ),
      status: "valid",
    })
    expectStableNormalization(markdown)
  })

  it("URL 속성·link-like text·중첩 tag가 있는 raw HTML을 literal code로 안정화한다", () => {
    const fixtures = [
      '<iframe src="https://example.com"></iframe>',
      '<div><a href="javascript:alert(1)">중첩 링크</a></div>',
      '<section data-value="[링크](https://example.com)"><span>본문</span></section>',
    ]

    for (const fixture of fixtures) {
      const first = normalizeResourceMarkdown(fixture)

      expect(first.status).toBe("valid")

      if (first.status !== "valid") {
        throw new Error("raw HTML fixture가 거부되었습니다.")
      }

      const second = normalizeResourceMarkdown(first.markdown)

      expect(second).toEqual(first)

      if (second.status !== "valid") {
        throw new Error("정규화한 raw HTML fixture가 다시 거부되었습니다.")
      }

      expect(normalizeResourceMarkdown(second.markdown)).toEqual(second)
    }
  })

  it("여러 줄 raw HTML을 실행하지 않는 literal code로 줄바꿈까지 보존한다", () => {
    const markdown = [
      "<div>",
      '  <a href="https://example.com">링크</a>',
      "</div>",
    ].join("\n")

    expect(expectStableNormalization(markdown)).toBe(
      [
        "```html",
        "<div>",
        '  <a href="https://example.com">링크</a>',
        "</div>",
        "```",
      ].join("\n")
    )
  })

  it("지원하지 않는 Lexical text format·style·mode를 export 전에 거부한다", () => {
    const underlineEditor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(underlineEditor, "본문")
    underlineEditor.update(
      () => {
        const text = $getRoot().getFirstDescendant()

        if (!$isTextNode(text)) {
          throw new Error("fixture text node를 찾지 못했습니다.")
        }

        text.toggleFormat("underline")
      },
      { discrete: true }
    )
    expect(readResourceDocumentMarkdown(underlineEditor)).toEqual({
      issues: [{ code: "unsupported-text-format", format: "underline" }],
      status: "invalid",
    })

    const styleEditor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(styleEditor, "본문")
    styleEditor.update(
      () => {
        const text = $getRoot().getFirstDescendant()

        if (!$isTextNode(text)) {
          throw new Error("fixture text node를 찾지 못했습니다.")
        }

        text.setStyle("color: red")
      },
      { discrete: true }
    )
    expect(readResourceDocumentMarkdown(styleEditor)).toEqual({
      issues: [{ code: "unsupported-text-style", style: "color: red" }],
      status: "invalid",
    })

    const modeEditor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(modeEditor, "본문")
    modeEditor.update(
      () => {
        const text = $getRoot().getFirstDescendant()

        if (!$isTextNode(text)) {
          throw new Error("fixture text node를 찾지 못했습니다.")
        }

        text.setMode("token")
      },
      { discrete: true }
    )
    expect(readResourceDocumentMarkdown(modeEditor)).toEqual({
      issues: [{ code: "unsupported-text-mode", mode: "token" }],
      status: "invalid",
    })
  })

  it("Markdown에 투영되지 않는 Element layout 속성을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "본문")
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild()

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture paragraph node를 찾지 못했습니다.")
        }

        paragraph.setDirection("rtl")
        paragraph.setFormat("center")
        paragraph.setIndent(1)
        paragraph.setStyle("color: red")
        paragraph.setTextFormat(1)
        paragraph.setTextStyle("font-size: 16px")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "direction",
          value: "rtl",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "format",
          value: "center",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "indent",
          value: 1,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "style",
          value: "color: red",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "text-format",
          value: 1,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "paragraph",
          property: "text-style",
          value: "font-size: 16px",
        },
      ],
      status: "invalid",
    })
  })

  it("DOM reconciler가 하위 텍스트에서 계산한 Element 포맷 캐시를 허용한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "**본문**")
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild()

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture paragraph node를 찾지 못했습니다.")
        }

        paragraph.setTextFormat(1)
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      markdown: "**본문**",
      status: "valid",
    })
  })

  it("Markdown에 투영되지 않는 Link title·target·rel 속성을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "[링크](https://example.com)")
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild()

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture paragraph node를 찾지 못했습니다.")
        }

        const link = paragraph.getFirstChild()

        if (!$isLinkNode(link)) {
          throw new Error("fixture link node를 찾지 못했습니다.")
        }

        link.setTitle("링크 설명")
        link.setTarget("_blank")
        link.setRel("noopener")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "link",
          property: "rel",
          value: "noopener",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "link",
          property: "target",
          value: "_blank",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "link",
          property: "title",
          value: "링크 설명",
        },
      ],
      status: "invalid",
    })
  })

  it("Lexical에서 생성된 위험한 Link URL을 저장 경계에서 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "[링크](https://example.com)")
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild()

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture paragraph node를 찾지 못했습니다.")
        }

        const link = paragraph.getFirstChild()

        if (!$isLinkNode(link)) {
          throw new Error("fixture link node를 찾지 못했습니다.")
        }

        link.setURL("javascript:alert(1)")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "link",
          property: "url",
          value: "javascript:alert(1)",
        },
      ],
      status: "invalid",
    })
  })

  it("GFM으로 표현할 수 없는 중첩 Link를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "[바깥](https://outer.example)")
    editor.update(
      () => {
        const paragraph = $getRoot().getFirstChild()

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture paragraph node를 찾지 못했습니다.")
        }

        const outerLink = paragraph.getFirstChild()

        if (!$isLinkNode(outerLink)) {
          throw new Error("fixture outer link node를 찾지 못했습니다.")
        }

        outerLink.append(
          $createLinkNode("https://inner.example").append(
            $createTextNode("중첩")
          )
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          childType: "link",
          code: "unsupported-lexical-hierarchy",
          parentType: "link",
        },
      ],
      status: "invalid",
    })
  })

  it("Heading h4부터 h6까지 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "# 제목")
    editor.update(
      () => {
        const heading = $getRoot().getFirstChild()

        if (!$isHeadingNode(heading)) {
          throw new Error("fixture heading node를 찾지 못했습니다.")
        }

        heading.setTag("h4")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "heading",
          property: "tag",
          value: "h4",
        },
      ],
      status: "invalid",
    })
  })

  it("Markdown에 투영되지 않는 Code theme을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(
      editor,
      "```typescript\nconst value = 1\n```"
    )
    editor.update(
      () => {
        const code = $getRoot().getFirstChild()

        if (!$isCodeNode(code)) {
          throw new Error("fixture code node를 찾지 못했습니다.")
        }

        code.setTheme("dark")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "code",
          property: "theme",
          value: "dark",
        },
      ],
      status: "invalid",
    })
  })

  it.each(["ts meta", "`", "typescript\nhtml"])(
    "GFM fence info string으로 표현할 수 없는 Code language %j를 거부한다",
    (language) => {
      const editor = createResourceDocumentEditor()

      editor.update(
        () => {
          $getRoot().append(
            $createCodeNode(language).append($createTextNode("const value = 1"))
          )
        },
        { discrete: true }
      )

      expect(readResourceDocumentMarkdown(editor)).toEqual({
        issues: [
          {
            code: "unsupported-lexical-property",
            nodeType: "code",
            property: "language",
            value: language,
          },
        ],
        status: "invalid",
      })
    }
  )

  it("Code의 syntax highlight 상태와 자식 Text 서식을 거부한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        $getRoot().append(
          $createCodeNode("typescript")
            .setIsSyntaxHighlightSupported(true)
            .append($createTextNode("const value = 1").toggleFormat("bold"))
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "code",
          property: "syntax-highlight",
          value: true,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "text",
          property: "format",
          value: 1,
        },
      ],
      status: "invalid",
    })
  })

  it("알 수 없는 Text format bit를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            $createTextNode("본문").setFormat(1 << 20)
          )
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "text",
          property: "format",
          value: 1 << 20,
        },
      ],
      status: "invalid",
    })
  })

  it("Heading과 TableCell 문단의 hard LineBreak를 export 전에 거부한다", () => {
    const headingEditor = createResourceDocumentEditor()

    headingEditor.update(
      () => {
        $getRoot().append(
          $createHeadingNode("h2").append(
            $createTextNode("앞"),
            $createLineBreakNode(),
            $createTextNode("뒤")
          )
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(headingEditor)).toEqual({
      issues: [
        {
          childType: "linebreak",
          code: "unsupported-lexical-hierarchy",
          parentType: "heading",
        },
      ],
      status: "invalid",
    })

    const tableEditor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(tableEditor, "| 열 |\n| --- |\n| 값 |")
    tableEditor.update(
      () => {
        const table = $getRoot().getFirstChild()
        const row = $isTableNode(table) ? table.getFirstChild() : null
        const cell = $isTableRowNode(row) ? row.getFirstChild() : null
        const paragraph = $isTableCellNode(cell) ? cell.getFirstChild() : null

        if (!$isElementNode(paragraph)) {
          throw new Error("fixture table paragraph node를 찾지 못했습니다.")
        }

        paragraph.append($createLineBreakNode(), $createTextNode("추가"))
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(tableEditor)).toEqual({
      issues: [
        {
          childType: "linebreak",
          code: "unsupported-lexical-hierarchy",
          parentType: "paragraph",
        },
      ],
      status: "invalid",
    })
  })

  it.each(["**`code`**", "*`code`*", "~~`code`~~", "***`code`***"])(
    "inline code 바깥 서식 손실을 import 전에 거부한다: %s",
    (markdown) => {
      expect(validateResourceMarkdown(markdown)).toEqual({
        issues: [{ code: "unsupported-formatted-inline-code" }],
        status: "invalid",
      })
    }
  )

  it("Markdown에 투영되지 않는 ListItem value를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "3. 첫째\n4. 둘째")
    editor.update(
      () => {
        const list = $getRoot().getFirstChild()

        if (!$isListNode(list)) {
          throw new Error("fixture list node를 찾지 못했습니다.")
        }

        const secondItem = list.getChildAtIndex(1)

        if (!$isListItemNode(secondItem)) {
          throw new Error("fixture list item node를 찾지 못했습니다.")
        }

        secondItem.setValue(9)
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "listitem",
          property: "value",
          value: 9,
        },
      ],
      status: "invalid",
    })
  })

  it("목록 종류와 맞지 않는 checked 상태를 거부하고 check의 undefined는 미체크로 허용한다", () => {
    const bulletEditor = createResourceDocumentEditor()
    let bulletValidation: ReturnType<
      typeof $validateResourceDocumentStructure
    > | null = null

    replaceResourceDocumentMarkdown(bulletEditor, "- 항목")
    bulletEditor.update(
      () => {
        const list = $getRoot().getFirstChild()
        const item = $isListNode(list) ? list.getFirstChild() : null

        if (!$isListItemNode(item)) {
          throw new Error("fixture list item node를 찾지 못했습니다.")
        }

        Reflect.set(item.getWritable(), "__checked", true)
        bulletValidation = $validateResourceDocumentStructure()
      },
      { discrete: true }
    )

    expect(bulletValidation).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "listitem",
          property: "checked",
          value: true,
        },
      ],
      status: "invalid",
    })

    const checkEditor = createResourceDocumentEditor()
    let checkValidation: ReturnType<
      typeof $validateResourceDocumentStructure
    > | null = null

    replaceResourceDocumentMarkdown(checkEditor, "- [ ] 항목")
    checkEditor.update(
      () => {
        const list = $getRoot().getFirstChild()
        const item = $isListNode(list) ? list.getFirstChild() : null

        if (!$isListItemNode(item)) {
          throw new Error("fixture check list item node를 찾지 못했습니다.")
        }

        Reflect.set(item.getWritable(), "__checked", undefined)
        checkValidation = $validateResourceDocumentStructure()
      },
      { discrete: true }
    )

    expect(checkValidation).toEqual({ status: "valid" })
  })

  it.each([
    ["bullet", 2],
    ["check", 0],
    ["number", -2],
    ["number", Number.NEGATIVE_INFINITY],
    ["number", 1.5],
    ["number", 1_000_000_000],
    ["number", Number.POSITIVE_INFINITY],
  ] as const)("%s 목록의 표현 불가능한 start %s를 거부한다", (type, start) => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        $getRoot().append(
          $createListNode(type, start).append(
            $createListItemNode().append($createTextNode("항목"))
          )
        )
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "list",
          property: "start",
          value: start,
        },
      ],
      status: "invalid",
    })
  })

  it.each([
    ["bullet", "ol"],
    ["number", "ul"],
    ["unknown", "ul"],
  ] as const)("목록 type %s와 tag %s의 불일치를 거부한다", (type, tag) => {
    const editor = createResourceDocumentEditor()
    let validation: ReturnType<
      typeof $validateResourceDocumentStructure
    > | null = null

    editor.update(
      () => {
        const list = $createListNode("bullet").append(
          $createListItemNode().append($createTextNode("항목"))
        )

        $getRoot().append(list)
        Reflect.set(list.getWritable(), "__listType", type)
        Reflect.set(list.getWritable(), "__tag", tag)
        validation = $validateResourceDocumentStructure()
      },
      { discrete: true }
    )

    expect(validation).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "list",
          property: type === "unknown" ? "list-type" : "tag",
          value: type === "unknown" ? type : tag,
        },
      ],
      status: "invalid",
    })
  })

  it("목록 항목의 본문 뒤에만 중첩 목록을 허용한다", () => {
    const editor = createResourceDocumentEditor()

    editor.update(
      () => {
        const nested = $createListNode("bullet").append(
          $createListItemNode().append($createTextNode("하위"))
        )
        const item = $createListItemNode().append(
          $createTextNode("앞"),
          nested,
          $createTextNode("뒤")
        )

        $getRoot().append($createListNode("bullet").append(item))
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          childType: "text",
          code: "unsupported-lexical-hierarchy",
          parentType: "listitem",
        },
      ],
      status: "invalid",
    })
  })

  it("본문 없는 indent wrapper 목록 항목을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "- 항목")
    editor.update(
      () => {
        const list = $getRoot().getFirstChild()
        const item = $isListNode(list) ? list.getFirstChild() : null

        if (!$isListItemNode(item)) {
          throw new Error("fixture list item node를 찾지 못했습니다.")
        }

        item.setIndent(3)
      },
      { discrete: true }
    )

    const result = readResourceDocumentMarkdown(editor)

    expect(result.status).toBe("invalid")
    expect(result).toMatchObject({
      issues: expect.arrayContaining([
        {
          code: "unsupported-list-item-structure",
        },
      ]),
    })
  })

  it("Markdown에 투영되지 않는 Table layout 속성을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "| 열 |\n| --- |\n| 값 |")
    editor.update(
      () => {
        const table = $getRoot().getFirstChild()

        if (!$isTableNode(table)) {
          throw new Error("fixture table node를 찾지 못했습니다.")
        }

        table.setColWidths([120])
        table.setFrozenColumns(1)
        table.setFrozenRows(1)
        table.setRowStriping(true)
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-table-column-widths",
          widths: [120],
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "table",
          property: "frozen-columns",
          value: 1,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "table",
          property: "frozen-rows",
          value: 1,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "table",
          property: "row-striping",
          value: true,
        },
      ],
      status: "invalid",
    })
  })

  it("Markdown에 투영되지 않는 TableRow·TableCell 속성을 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "| 열 |\n| --- |\n| 값 |")
    editor.update(
      () => {
        const table = $getRoot().getFirstChild()

        if (!$isTableNode(table)) {
          throw new Error("fixture table node를 찾지 못했습니다.")
        }

        const row = table.getFirstChild()

        if (!$isTableRowNode(row)) {
          throw new Error("fixture table row node를 찾지 못했습니다.")
        }

        const cell = row.getFirstChild()

        if (!$isTableCellNode(cell)) {
          throw new Error("fixture table cell node를 찾지 못했습니다.")
        }

        row.setHeight(40)
        cell.setColSpan(2)
        cell.setRowSpan(2)
        cell.setWidth(120)
        cell.setBackgroundColor("#ffffff")
        cell.setHeaderStyles(TableCellHeaderStates.NO_STATUS)
        cell.setVerticalAlign("middle")
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          code: "unsupported-lexical-property",
          nodeType: "tablerow",
          property: "height",
          value: 40,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "col-span",
          value: 2,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "row-span",
          value: 2,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "width",
          value: 120,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "background-color",
          value: "#ffffff",
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "header-state",
          value: TableCellHeaderStates.NO_STATUS,
        },
        {
          code: "unsupported-lexical-property",
          nodeType: "tablecell",
          property: "vertical-align",
          value: "middle",
        },
      ],
      status: "invalid",
    })
  })

  it("행마다 표 열 수가 다른 Lexical 구조를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(
      editor,
      "| 첫째 | 둘째 |\n| --- | --- |\n| 값 1 | 값 2 |"
    )
    editor.update(
      () => {
        const table = $getRoot().getFirstChild()

        if (!$isTableNode(table)) {
          throw new Error("fixture table node를 찾지 못했습니다.")
        }

        const bodyRow = table.getLastChild()

        if (!$isTableRowNode(bodyRow)) {
          throw new Error("fixture table body row를 찾지 못했습니다.")
        }

        bodyRow.getLastChild()?.remove()
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          actual: 1,
          code: "unsupported-table-row-width",
          expected: 2,
          row: 1,
        },
      ],
      status: "invalid",
    })
  })

  it("지원 node의 부적절한 Lexical hierarchy를 export 전에 거부한다", () => {
    const editor = createResourceDocumentEditor()

    replaceResourceDocumentMarkdown(editor, "| 열 |\n| --- |\n| 값 |")
    editor.update(
      () => {
        const table = $getRoot().getFirstChild()

        if (!$isTableNode(table)) {
          throw new Error("fixture table node를 찾지 못했습니다.")
        }

        const row = table.getFirstChild()

        if (!$isTableRowNode(row)) {
          throw new Error("fixture table row node를 찾지 못했습니다.")
        }

        const cell = row.getFirstChild()

        if (!$isTableCellNode(cell)) {
          throw new Error("fixture table cell node를 찾지 못했습니다.")
        }

        cell.clear().append($createHeadingNode("h2"))
      },
      { discrete: true }
    )

    expect(readResourceDocumentMarkdown(editor)).toEqual({
      issues: [
        {
          childType: "heading",
          code: "unsupported-lexical-hierarchy",
          parentType: "tablecell",
        },
      ],
      status: "invalid",
    })
  })

  it("코드와 escaped literal 안의 URL 문법은 검증 대상이 아니다", () => {
    const markdown = [
      "`[인라인 코드](javascript:alert(1))`",
      "",
      "```markdown",
      "[fenced code](data:text/plain,unsafe)",
      "```",
      "",
      "\\[일반 텍스트](javascript:alert(1))",
    ].join("\n")

    expect(validateResourceMarkdown(markdown)).toEqual({ status: "valid" })
  })

  it("reference 링크·이미지와 autolink를 실제 GFM AST 대상으로 검증한다", () => {
    const validMarkdown = [
      "[문서][doc] <https://example.com> <person@example.com>",
      "",
      "![트리][tree]",
      "",
      "[doc]: /resources/guide",
      "[tree]: https://images.example.com/tree.png",
    ].join("\n")

    expectStableNormalization(validMarkdown)
    expect(
      validateResourceMarkdown("[위험][link]\n\n[link]: javascript:alert(1)")
    ).toEqual({
      issues: [{ code: "unsafe-link-url", url: "javascript:alert(1)" }],
      status: "invalid",
    })
    expect(
      validateResourceMarkdown(
        "![위험][image]\n\n[image]: http://images.example.com/tree.png"
      )
    ).toEqual({
      issues: [
        {
          code: "unsafe-image-url",
          url: "http://images.example.com/tree.png",
        },
      ],
      status: "invalid",
    })
  })

  it("중복 reference definition은 GFM의 첫 정의 의미를 링크와 이미지에 적용한다", () => {
    expect(
      validateResourceMarkdown(
        "[링크][a]\n\n[a]: javascript:alert(1)\n[a]: https://safe.example"
      )
    ).toEqual({
      issues: [{ code: "unsafe-link-url", url: "javascript:alert(1)" }],
      status: "invalid",
    })

    const safeLink = expectStableNormalization(
      "[링크][a]\n\n[a]: https://safe.example\n[a]: javascript:alert(1)"
    )

    expect(safeLink).toBe("[링크](https://safe.example)")

    expect(
      validateResourceMarkdown(
        "![이미지][a]\n\n[a]: http://images.example.com/image.png\n[a]: https://images.example.com/image.png"
      )
    ).toEqual({
      issues: [
        {
          code: "unsafe-image-url",
          url: "http://images.example.com/image.png",
        },
      ],
      status: "invalid",
    })

    const safeImage = expectStableNormalization(
      "![이미지][a]\n\n[a]: https://images.example.com/image.png\n[a]: http://images.example.com/image.png"
    )

    expect(safeImage).toBe("![이미지](https://images.example.com/image.png)")
  })

  it("지원 subset 밖의 구조를 조용히 손실하지 않고 명시적으로 거부한다", () => {
    expect(validateResourceMarkdown("#### 제목")).toEqual({
      issues: [{ code: "unsupported-heading-depth", depth: 4 }],
      status: "invalid",
    })
    expect(
      validateResourceMarkdown('[링크](https://example.com "제목")')
    ).toEqual({
      issues: [{ code: "unsupported-link-title" }],
      status: "invalid",
    })
    expect(
      validateResourceMarkdown(
        '![이미지](https://images.example.com/image.png "제목")'
      )
    ).toEqual({
      issues: [{ code: "unsupported-image-title" }],
      status: "invalid",
    })
    expect(
      validateResourceMarkdown(
        "문장 속 ![이미지](https://images.example.com/image.png) 배치"
      )
    ).toEqual({
      issues: [{ code: "unsupported-inline-image" }],
      status: "invalid",
    })
    expect(validateResourceMarkdown("- [x] 완료\n- 일반 항목")).toEqual({
      issues: [{ code: "unsupported-mixed-task-list" }],
      status: "invalid",
    })
    expect(validateResourceMarkdown("> 첫 문단\n>\n> 둘째 문단")).toEqual({
      issues: [{ code: "unsupported-blockquote-structure" }],
      status: "invalid",
    })
    expect(validateResourceMarkdown("> > 중첩 인용")).toEqual({
      issues: [{ code: "unsupported-blockquote-structure" }],
      status: "invalid",
    })
  })

  it("GFM 표의 까다로운 셀 문법과 가변 셀 수를 정규화한 뒤 안정적으로 보존한다", () => {
    const markdown = [
      "이름 | 값 | 설명",
      ":--- | :---: | ---:",
      "`a\\|b` | a\\|b | **굵게**",
      "빈 셀 | |",
      "누락 셀 | 값",
      "초과 셀 | 값 | 설명 | 추가",
    ].join("\n")

    const normalized = expectStableNormalization(markdown)
    const editor = createResourceDocumentEditor()

    expect(normalized).toBe(
      [
        "| 이름     |   값  |     설명 |",
        "| :----- | :--: | -----: |",
        "| `a\\|b` | a\\|b | **굵게** |",
        "| 빈 셀    |      |        |",
        "| 누락 셀   |   값  |        |",
        "| 초과 셀   |   값  |     설명 |",
      ].join("\n")
    )
    expect(replaceResourceDocumentMarkdown(editor, markdown)).toEqual({
      status: "valid",
    })
    expect(
      editor.read(() => {
        const table = $getRoot().getFirstChild()

        return $isTableNode(table)
          ? table
              .getChildren()
              .filter($isTableRowNode)
              .map((row) => row.getChildrenSize())
          : []
      })
    ).toEqual([3, 3, 3, 3, 3])
  })

  it("표를 의도했지만 성립하지 않는 delimiter를 명시적으로 거부한다", () => {
    expect(validateResourceMarkdown("| 이름 | 상태 |\n| : | --- |")).toEqual({
      issues: [{ code: "malformed-table-delimiter", line: 2 }],
      status: "invalid",
    })
  })
})

function expectStableNormalization(markdown: string): string {
  const first = normalizeResourceMarkdown(markdown)

  expect(first.status).toBe("valid")

  if (first.status !== "valid") {
    throw new Error("유효한 Markdown fixture가 거부되었습니다.")
  }

  expect(normalizeResourceMarkdown(first.markdown)).toEqual(first)
  return first.markdown
}

function readFormattingSegments(markdown: string) {
  const editor = createResourceDocumentEditor()
  const result = replaceResourceDocumentMarkdown(editor, markdown)

  if (result.status !== "valid") {
    throw new Error("inline format fixture가 거부되었습니다.")
  }

  return editor.read(() => {
    return $getRoot()
      .getAllTextNodes()
      .map((node) => ({
        bold: node.hasFormat("bold"),
        code: node.hasFormat("code"),
        italic: node.hasFormat("italic"),
        parent: node.getParent()?.getType() ?? null,
        strikethrough: node.hasFormat("strikethrough"),
        text: node.getTextContent(),
      }))
  })
}

const resourceInlineFormats = [
  "bold",
  "italic",
  "strikethrough",
] as const satisfies readonly TextFormatType[]

const resourceInlineFormatSets: readonly (readonly TextFormatType[])[] = [
  [],
  ["bold"],
  ["italic"],
  ["strikethrough"],
  ["bold", "italic"],
  ["bold", "strikethrough"],
  ["italic", "strikethrough"],
  ["bold", "italic", "strikethrough"],
]

function createFormattedFixtureText(
  text: string,
  formats: readonly TextFormatType[]
) {
  const node = $createTextNode(text)

  for (const format of formats) {
    node.toggleFormat(format)
  }

  return node
}

function readCharacterFormatting(
  editor: ReturnType<typeof createResourceDocumentEditor>
): readonly (readonly TextFormatType[])[] {
  return editor.read(() => {
    return $getRoot()
      .getAllTextNodes()
      .flatMap((node) =>
        [...node.getTextContent()].map(() =>
          resourceInlineFormats.filter((format) => node.hasFormat(format))
        )
      )
  })
}
