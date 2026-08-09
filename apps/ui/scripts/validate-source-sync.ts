import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const appRoot = dirname(dirname(import.meta.filename));
const repositoryRoot = dirname(dirname(appRoot));
const registryRoot = join(appRoot, "registry", "luma");
const packageRoot = join(repositoryRoot, "packages", "shared", "ui", "src");
const packageStylesRoot = join(packageRoot, "styles");
const failures: string[] = [];

function extractCssBlock(source: string, marker: string) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`CSS block을 찾을 수 없습니다: ${marker}`);

  const openingBraceIndex = source.indexOf("{", markerIndex);
  let depth = 0;
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBraceIndex + 1, index);
  }

  throw new Error(`CSS block이 닫히지 않았습니다: ${marker}`);
}

function normalizeCssValue(value: string) {
  return value.replaceAll(/\s+/g, " ").trim();
}

function cssVariables(source: string) {
  return Object.fromEntries(
    [...source.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      normalizeCssValue(match[2]),
    ]),
  );
}

function normalizeReferenceVariables(variables: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(variables).map(([name, value]) => [
      name.replace(/^--/, "").replace(/^ref-/, ""),
      value.replaceAll("var(--ref-", "var(--"),
    ]),
  );
}

function compareVariables(
  label: string,
  expected: Record<string, string>,
  actual: Record<string, string>,
) {
  const expectedNames = Object.keys(expected).toSorted();
  const actualNames = Object.keys(actual).toSorted();
  if (expectedNames.join("\n") !== actualNames.join("\n")) {
    const missingNames = expectedNames.filter((name) => !actualNames.includes(name));
    const extraNames = actualNames.filter((name) => !expectedNames.includes(name));
    failures.push(
      `${label}: token 이름 불일치 (누락: ${missingNames.join(", ") || "없음"}; 초과: ${extraNames.join(", ") || "없음"})`,
    );
    return;
  }

  for (const name of expectedNames) {
    if (normalizeCssValue(actual[name]) !== expected[name]) {
      failures.push(`${label}: ${name} 값 불일치`);
    }
  }
}

const comparisons = [
  {
    label: "UI",
    registry: join(registryRoot, "ui"),
    workspace: join(packageRoot, "components", "ui"),
    extensionFiles: new Set([
      "csp-provider.test.tsx",
      "csp-provider.tsx",
      "theme-selector.test.tsx",
      "theme-selector.tsx",
    ]),
  },
  {
    label: "Block",
    registry: join(registryRoot, "blocks"),
    workspace: join(packageRoot, "blocks"),
    extensionFiles: new Set<string>(),
  },
  {
    label: "Hook",
    registry: join(registryRoot, "hooks"),
    workspace: join(packageRoot, "hooks"),
    extensionFiles: new Set<string>(),
  },
];

function contractFingerprint(source: string) {
  const exportNames = new Set<string>();
  for (const block of source.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const entry of block[1].split(",")) {
      const name = entry
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .at(-1)
        ?.trim();
      if (name) exportNames.add(name);
    }
  }
  for (const declaration of source.matchAll(
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z0-9_]+)/g,
  )) {
    exportNames.add(declaration[1]);
  }
  if (/export\s+default\s+[A-Za-z0-9_]+/.test(source)) exportNames.add("default");

  const dataSlots = [...source.matchAll(/data-slot=["']([^"']+)["']/g)].map((match) => match[1]);
  return JSON.stringify({
    exports: [...exportNames].toSorted(),
    dataSlots: [...new Set(dataSlots)].toSorted(),
  });
}

const comparisonFailures = await Promise.all(
  comparisons.map(async (comparison) => {
    const [registryEntries, workspaceEntries] = await Promise.all([
      readdir(comparison.registry),
      readdir(comparison.workspace),
    ]);
    const registryFiles = registryEntries.filter((file) => /\.tsx?$/.test(file)).toSorted();
    const workspaceFiles = workspaceEntries
      .filter(
        (file) =>
          /\.tsx?$/.test(file) &&
          !comparison.extensionFiles.has(file) &&
          !file.endsWith(".test.tsx"),
      )
      .toSorted();
    const currentFailures: string[] = [];
    const missingFromWorkspace = registryFiles.filter((file) => !workspaceFiles.includes(file));
    const missingFromRegistry = workspaceFiles.filter((file) => !registryFiles.includes(file));
    if (missingFromWorkspace.length)
      currentFailures.push(
        `${comparison.label}: workspace 누락 ${missingFromWorkspace.join(", ")}`,
      );
    if (missingFromRegistry.length)
      currentFailures.push(`${comparison.label}: registry 누락 ${missingFromRegistry.join(", ")}`);

    const sourceFailures = await Promise.all(
      registryFiles
        .filter((file) => workspaceFiles.includes(file))
        .map(async (file) => {
          const [registrySource, workspaceSource] = await Promise.all([
            readFile(join(comparison.registry, file), "utf8"),
            readFile(join(comparison.workspace, file), "utf8"),
          ]);
          return contractFingerprint(registrySource) === contractFingerprint(workspaceSource)
            ? undefined
            : `${comparison.label}: 공개 export 또는 data-slot 불일치 ${file}`;
        }),
    );

    currentFailures.push(
      ...sourceFailures.filter((failure): failure is string => Boolean(failure)),
    );
    return currentFailures;
  }),
);
failures.push(...comparisonFailures.flat());

const [registryUtils, workspaceUtils] = await Promise.all([
  readFile(join(registryRoot, "lib", "utils.ts"), "utf8"),
  readFile(join(packageRoot, "lib", "utils.ts"), "utf8"),
]);
if (contractFingerprint(registryUtils) !== contractFingerprint(workspaceUtils)) {
  failures.push("Lib: 공개 export 불일치 utils.ts");
}

const [workspaceGlobals, workspaceReference, workspaceSemantic, workspaceMotion, appGlobals] =
  await Promise.all([
    readFile(join(packageStylesRoot, "globals.css"), "utf8"),
    readFile(join(packageStylesRoot, "tokens", "reference.css"), "utf8"),
    readFile(join(packageStylesRoot, "tokens", "semantic.css"), "utf8"),
    readFile(join(packageStylesRoot, "tokens", "motion.css"), "utf8"),
    readFile(join(appRoot, "src", "styles", "global.css"), "utf8"),
  ]);
const registryBase = JSON.parse(
  await readFile(join(appRoot, "registry", "base", "registry.json"), "utf8"),
).items.find((item: { name: string }) => item.name === "base");

if (!registryBase) {
  failures.push("Base: registry:base item 누락");
} else {
  const inlineTheme = cssVariables(extractCssBlock(workspaceGlobals, "@theme inline"));
  const runtimeTheme = cssVariables(extractCssBlock(workspaceGlobals, "@theme {"));
  const expectedTheme = Object.fromEntries(
    Object.entries({ ...inlineTheme, ...runtimeTheme }).filter(
      ([name]) => !name.startsWith("color-"),
    ),
  );
  const lightReference = normalizeReferenceVariables(
    cssVariables(extractCssBlock(workspaceReference, ":root")),
  );
  const expectedLight = {
    ...lightReference,
    radius: cssVariables(extractCssBlock(workspaceSemantic, ":root,"))["radius"],
    ...cssVariables(extractCssBlock(workspaceMotion, ":root")),
  };
  const expectedDark = {
    ...lightReference,
    ...normalizeReferenceVariables(cssVariables(extractCssBlock(workspaceReference, ".dark,"))),
  };

  compareVariables("Base theme", expectedTheme, registryBase.cssVars.theme);
  compareVariables("Base light", expectedLight, registryBase.cssVars.light);
  compareVariables("Base dark", expectedDark, registryBase.cssVars.dark);

  const workspaceContrast = extractCssBlock(workspaceSemantic, "@media (prefers-contrast: more)");
  const registryContrast = registryBase.css["@media (prefers-contrast: more)"];
  compareVariables(
    "Base high contrast light",
    cssVariables(extractCssBlock(workspaceContrast, ":root")),
    normalizeReferenceVariables(registryContrast[":root"]),
  );
  compareVariables(
    "Base high contrast dark",
    cssVariables(extractCssBlock(workspaceContrast, ".dark,")),
    normalizeReferenceVariables(registryContrast[".dark"]),
  );

  for (const name of ["breathe", "skeleton-breathe", "drift-in"]) {
    if (!registryBase.css[`@keyframes ${name}`]) failures.push(`Base: ${name} keyframe 누락`);
  }
  if (!registryBase.css["@utility no-scrollbar"]) {
    failures.push("Base: no-scrollbar utility 누락");
  }
  if (!registryBase.css["@media (prefers-reduced-motion: reduce)"]) {
    failures.push("Base: reduced motion media query 누락");
  }
}

if (!appGlobals.includes('@import "@workspace/ui/styles";')) {
  failures.push("Astro UI: @workspace/ui/styles import 누락");
}
if (/^:root\s*\{/m.test(appGlobals) || /^\.dark\s*\{/m.test(appGlobals)) {
  failures.push("Astro UI: 공통 light 또는 dark token 중복 선언");
}

if (failures.length) {
  console.error(
    `Registry와 workspace source 동기화 실패 (${failures.length})\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  "@workspace/ui token과 Astro·registry theme, registry UI·block·hook·utils 동기화를 확인했습니다.",
);
