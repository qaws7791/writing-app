import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const appRoot = dirname(dirname(import.meta.filename));
const repositoryRoot = dirname(dirname(appRoot));
const registryRoot = join(appRoot, "registry", "luma");
const packageRoot = join(repositoryRoot, "packages", "shared", "ui", "src");
const failures: string[] = [];

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

if (failures.length) {
  console.error(
    `Registry와 workspace source 동기화 실패 (${failures.length})\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  "Registry UI·block·hook·utils와 @workspace/ui의 파일, export와 data-slot 동기화를 확인했습니다.",
);
