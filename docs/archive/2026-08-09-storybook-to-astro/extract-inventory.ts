import { readdir, readFile } from "node:fs/promises"
import { relative, resolve } from "node:path"

import ts from "typescript"

const root = resolve(import.meta.dir, "../../..")
const storiesRoot = resolve(root, "apps/storybook/src/stories")

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name)
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path])
    })
  )

  return nested
    .flat()
    .filter((path) => path.endsWith(".stories.tsx"))
    .sort()
}

function kebab(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_/]+/g, "-")
    .toLowerCase()
}

function destinationFor(title: string, story: string) {
  const parts = title.split("/")
  const section = parts[0]
  const name = parts.at(-1) ?? title
  const anchor = `story-${kebab(story)}`

  if (title === "Components/UI/Status")
    return `/docs/components/spinner#${anchor}`
  if (title === "Components/UI/ThemeSelector") {
    return `/docs/extensions/theme-selector#${anchor}`
  }
  if (title.startsWith("Components/UI/")) {
    return `/docs/components/${kebab(name)}#${anchor}`
  }
  if (title.startsWith("Components/Lesson/")) {
    return `/docs/extensions/lesson/${kebab(name)}#${anchor}`
  }
  if (title === "Patterns/Admin") return `/docs/patterns/admin#${anchor}`
  if (title === "Recipes/Course Management") {
    return `/docs/recipes/course-management#${anchor}`
  }
  if (title === "Quality/Checklist") return `/docs/quality/content#${anchor}`
  if (section === "Foundations") {
    return `/docs/foundations/${kebab(name)}#${anchor}`
  }

  throw new Error(`목적지를 결정할 수 없습니다: ${title}`)
}

function stringProperty(
  object: ts.ObjectLiteralExpression,
  propertyName: string
) {
  const property = object.properties.find(
    (candidate): candidate is ts.PropertyAssignment =>
      ts.isPropertyAssignment(candidate) &&
      candidate.name.getText().replace(/["']/g, "") === propertyName
  )
  if (!property) return undefined
  if (ts.isStringLiteralLike(property.initializer))
    return property.initializer.text
  return undefined
}

const files = await listFiles(storiesRoot)
const modules = []

for (const file of files) {
  const sourceText = await readFile(file, "utf8")
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const title = sourceText.match(/title:\s*["']([^"']+)["']/)?.[1]
  if (!title) throw new Error(`title이 없습니다: ${file}`)

  const stories = []
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    if (
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    )
      continue

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
        continue
      const story = declaration.name.text
      const object = ts.isObjectLiteralExpression(declaration.initializer)
        ? declaration.initializer
        : undefined
      const leading = sourceText.slice(
        statement.getFullStart(),
        statement.getStart(source)
      )
      const comments = [...leading.matchAll(/\/\*\*([\s\S]*?)\*\//g)]
        .flatMap((match) => match[1].split("\n"))
        .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
        .filter(Boolean)
      stories.push({
        id: `${kebab(title)}--${kebab(story)}`,
        exportName: story,
        label: object ? (stringProperty(object, "name") ?? story) : story,
        description: comments.join(" "),
        destination: destinationFor(title, story),
        hasPlay: Boolean(
          object?.properties.some(
            (property) => property.name?.getText() === "play"
          )
        ),
      })
    }
  }

  modules.push({
    source: relative(root, file).replaceAll("\\", "/"),
    title,
    hasCiTest: /["']ci-test["']/.test(sourceText),
    hasArgs: /\bargs\s*:/.test(sourceText),
    hasArgTypes: /\bargTypes\s*:/.test(sourceText),
    stories,
  })
}

const mdx = [
  {
    id: "getting-started-welcome",
    source: "apps/storybook/src/docs/getting-started/welcome.mdx",
    destination: "/docs/getting-started",
  },
  {
    id: "quality-accessibility-checklist",
    source: "apps/storybook/src/docs/quality/accessibility-checklist.mdx",
    destination: "/docs/quality/accessibility",
  },
]

const inventory = {
  generatedAt: "2026-08-09",
  counts: {
    modules: modules.length,
    stories: modules.reduce(
      (total, module) => total + module.stories.length,
      0
    ),
    ciTestModules: modules.filter((module) => module.hasCiTest).length,
    playStories: modules
      .flatMap((module) => module.stories)
      .filter((story) => story.hasPlay).length,
    mdx: mdx.length,
  },
  modules,
  mdx,
}

console.log(JSON.stringify(inventory, null, 2))
