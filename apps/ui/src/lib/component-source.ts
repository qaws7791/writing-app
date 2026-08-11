const sourceModules = import.meta.glob("../../../../packages/shared/ui/src/components/ui/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const sources = new Map(
  Object.entries(sourceModules).map(([path, source]) => {
    const slug =
      path
        .split("/")
        .at(-1)
        ?.replace(/\.tsx$/, "") ?? path;
    return [slug, source];
  }),
);

export function getComponentSource(slug: string) {
  const source = sources.get(slug);

  if (source === undefined) {
    throw new Error(`컴포넌트 '${slug}'의 소스를 찾을 수 없습니다.`);
  }

  return source;
}

export function getComponentExports(slug: string) {
  const source = getComponentSource(slug);
  const blocks = [...source.matchAll(/export\s*\{([\s\S]*?)\}/g)];
  const block = blocks.at(-1)?.[1] ?? "";

  return block
    .split(",")
    .map((value) => value.trim().replace(/^type\s+/, ""))
    .filter((value) => value && !/^(use|create|.*Variants$)/.test(value));
}

export function getUsageCode(slug: string, exports: string[]) {
  const primary = exports[0] ?? "Component";
  const importNames = exports.slice(0, Math.min(exports.length, 5)).join(", ");

  return `import { ${importNames} } from "@workspace/ui/components/ui/${slug}"

export function ${primary}Demo() {
  return <${primary}>콘텐츠</${primary}>
}`;
}
