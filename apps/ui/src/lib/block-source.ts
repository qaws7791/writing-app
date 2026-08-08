const sourceModules = import.meta.glob("../../registry/luma/blocks/*.tsx", {
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

export function getBlockSource(slug: string) {
  const source = sources.get(slug);

  if (source === undefined) {
    throw new Error(`블록 '${slug}'의 수동 설치용 소스를 찾을 수 없습니다.`);
  }

  return source;
}
