import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { componentGuides } from "../src/lib/component-guides";

const workspaceRoot = dirname(dirname(import.meta.filename));
const repositoryRoot = dirname(dirname(workspaceRoot));
const packageUiRoot = join(repositoryRoot, "packages", "shared", "ui", "src", "components", "ui");
const outputRoot = join(workspaceRoot, "src", "generated", "component-examples");

const exportLocations = new Map<string, string>();
const packageUiFiles = (await readdir(packageUiRoot)).filter((fileName) =>
  fileName.endsWith(".tsx"),
);

const packageUiSources = await Promise.all(
  packageUiFiles.map(async (fileName) => ({
    fileName,
    source: await readFile(join(packageUiRoot, fileName), "utf8"),
  })),
);

for (const { fileName, source } of packageUiSources) {
  const slug = fileName.replace(/\.tsx$/, "");
  const exportBlocks = [...source.matchAll(/export\s*\{([\s\S]*?)\}/g)];
  const exportBlock = exportBlocks.at(-1)?.[1] ?? "";

  for (const entry of exportBlock.split(",")) {
    const exportName = entry
      .trim()
      .replace(/^type\s+/, "")
      .split(/\s+as\s+/)
      .at(-1)
      ?.trim();

    if (exportName) exportLocations.set(exportName, slug);
  }
}

function rewriteExampleImports(source: string) {
  return source
    .replace(/\\u\{([\dA-Fa-f]+)\}/g, (_, codePoint: string) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replace(/\\u([\dA-Fa-f]{4})/g, (_, codePoint: string) =>
      String.fromCharCode(Number.parseInt(codePoint, 16)),
    )
    .replaceAll("@/components/ui/", "@workspace/ui/components/ui/")
    .replaceAll("@/registry/luma/ui/", "@workspace/ui/components/ui/")
    .replaceAll("@/registry/luma/blocks/", "@workspace/ui/blocks/")
    .replaceAll("@/registry/luma/hooks/", "@workspace/ui/hooks/")
    .replaceAll("@/registry/luma/lib/", "@workspace/ui/lib/");
}

function rewritePreviewAssetUrls(source: string) {
  return source
    .replace(
      /(\bsrc\s*=\s*)(["'])\/([^"']+)\2/g,
      (_, prefix: string, quote: string, assetPath: string) =>
        `${prefix}{import.meta.env.BASE_URL.replace(/\\/?$/, "/") + ${quote}${assetPath}${quote}}`,
    )
    .replace(
      /(\bsrc\s*:\s*)(["'])\/([^"']+)\2/g,
      (_, prefix: string, quote: string, assetPath: string) =>
        `${prefix}import.meta.env.BASE_URL.replace(/\\/?$/, "/") + ${quote}${assetPath}${quote}`,
    );
}

function splitLeadingImports(source: string) {
  const imports: string[] = [];
  let rest = source.trimStart();

  while (rest.startsWith("import ")) {
    const match = rest.match(/^import\s+[\s\S]*?\sfrom\s+["'][^"']+["']\s*;?\s*/);
    if (!match) break;
    imports.push(match[0].trim());
    rest = rest.slice(match[0].length).trimStart();
  }

  return { imports, body: rest.trim() };
}

function importedNames(imports: string[]) {
  const names = new Set<string>();

  for (const statement of imports) {
    const bindings = statement.slice("import".length, statement.lastIndexOf("from"));
    for (const match of bindings.matchAll(/\b[A-Z][A-Za-z0-9]*\b/g)) names.add(match[0]);
  }

  return names;
}

function inferredImports(body: string, imports: string[]) {
  const knownNames = importedNames(imports);
  const symbols = new Map<string, string[]>();

  for (const match of body.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
    const symbol = match[1];
    if (knownNames.has(symbol)) continue;
    const slug = exportLocations.get(symbol);
    if (!slug) continue;
    symbols.set(slug, [...(symbols.get(slug) ?? []), symbol]);
    knownNames.add(symbol);
  }

  return [...symbols.entries()].map(
    ([slug, names]) =>
      `import { ${names.toSorted().join(", ")} } from "@workspace/ui/components/ui/${slug}";`,
  );
}

function wrapSnippet(source: string) {
  const { imports, body } = splitLeadingImports(source);
  const generatedImports = inferredImports(body, imports);
  const content = body.startsWith(";(") ? `{${body.slice(1)}}` : body;

  return `${[...imports, ...generatedImports].join("\n")}\n\nexport default function GeneratedExample() {\n  return (\n    <>\n${content}\n    </>\n  );\n}\n`;
}

function makeExampleModule(source: string) {
  const rewritten = rewritePreviewAssetUrls(rewriteExampleImports(source)).trim();
  const hasDefaultExport = /export\s+default\s+function\s+/.test(rewritten);
  const hasNamedFunction = /export\s+function\s+[A-Za-z0-9_]+\s*\(/.test(rewritten);

  if (!hasDefaultExport && !hasNamedFunction) return wrapSnippet(rewritten);

  const moduleSource = hasDefaultExport
    ? rewritten
    : rewritten.replace(/export\s+function\s+([A-Za-z0-9_]+)\s*\(/, "export default function $1(");

  return `${moduleSource}\n`;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const examples = Object.values(componentGuides).flatMap((guide) =>
  guide.examples
    .filter((example) => example.preview !== false)
    .map((example) => ({ guide, example })),
);

await Promise.all(
  examples.map(async ({ guide, example }) => {
    const outputPath = join(outputRoot, guide.slug, `${example.id}.tsx`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, makeExampleModule(example.code), "utf8");
  }),
);

console.log(
  `${examples.length}개 문서 예제 프리뷰를 ${relative(workspaceRoot, outputRoot)}에 생성했습니다.`,
);
