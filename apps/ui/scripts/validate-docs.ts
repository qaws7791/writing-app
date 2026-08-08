import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { componentDocs } from "../src/lib/component-docs";
import { componentGuides } from "../src/lib/component-guides";
import { designSystemInventory } from "../src/lib/design-system-inventory";
import { docsSearchRecords } from "../src/lib/docs-catalog";
import { workspaceExtensionDocs } from "../src/lib/workspace-extension-docs";

const publicRoot = resolve(dirname(dirname(import.meta.filename)), "public");

const reservedIds = new Set([
  "preview",
  "installation",
  "usage",
  "usage-guidelines",
  "accessibility",
  "props",
  "api-reference",
]);
const knownSlugs = new Set(componentDocs.map((component) => component.slug));
const failures: string[] = [];

const expectedInventoryCounts = {
  modules: 39,
  stories: 154,
  ciTestModules: 35,
  playStories: 9,
  mdx: 2,
} as const;

for (const [key, value] of Object.entries(expectedInventoryCounts)) {
  if (designSystemInventory.counts[key as keyof typeof expectedInventoryCounts] !== value) {
    failures.push(`이전 inventory ${key}: ${value}개가 필요합니다.`);
  }
}

const inventoryStories = designSystemInventory.modules.flatMap((module) => module.stories);
const inventoryIds = new Set(inventoryStories.map((story) => story.id));
if (inventoryIds.size !== inventoryStories.length) failures.push("이전 story ID가 중복됩니다.");

const indexedPaths = new Set(docsSearchRecords.map((record) => record.href.split("#", 1)[0]));
for (const item of [...inventoryStories, ...designSystemInventory.mdx]) {
  const destination = item.destination.split("#", 1)[0];
  if (!indexedPaths.has(destination))
    failures.push(`${item.id}: 검색 index에 목적지 ${destination}가 없습니다.`);
}

const extensionTitles = new Set(workspaceExtensionDocs.map((doc) => doc.moduleTitle));
for (const module of designSystemInventory.modules.filter(
  (candidate) =>
    candidate.title.startsWith("Components/Lesson/") ||
    candidate.title === "Components/UI/ThemeSelector",
)) {
  if (!extensionTitles.has(module.title))
    failures.push(`${module.title}: workspace extension 문서가 없습니다.`);
}

for (const doc of workspaceExtensionDocs) {
  if (doc.props.length === 0) failures.push(`${doc.slug}: control과 Props 설명이 없습니다.`);
  if (doc.usageNotes.length < 2) failures.push(`${doc.slug}: 사용 지침이 2개보다 적습니다.`);
  if (doc.accessibility.length < 2) failures.push(`${doc.slug}: 접근성 지침이 2개보다 적습니다.`);
}

for (const component of componentDocs) {
  const guide = componentGuides[component.slug];

  if (!guide) {
    failures.push(`${component.slug}: 전용 가이드가 없습니다.`);
    continue;
  }

  if (guide.slug !== component.slug)
    failures.push(`${component.slug}: guide.slug가 일치하지 않습니다.`);
  if (!guide.summary.trim()) failures.push(`${component.slug}: summary가 비어 있습니다.`);
  if (guide.examples.length < 4) failures.push(`${component.slug}: 예제가 4개보다 적습니다.`);
  if (guide.examples.every((example) => example.preview === false))
    failures.push(`${component.slug}: 라이브 미리보기가 연결된 예제가 없습니다.`);
  if (guide.usageNotes.length < 2)
    failures.push(`${component.slug}: 사용 지침이 2개보다 적습니다.`);
  if (guide.accessibility.length < 2)
    failures.push(`${component.slug}: 접근성 지침이 2개보다 적습니다.`);
  if (!guide.props?.length) failures.push(`${component.slug}: 주요 Props가 없습니다.`);

  const ids = new Set<string>();
  for (const example of guide.examples) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(example.id)) {
      failures.push(`${component.slug}: 유효하지 않은 예제 id '${example.id}'`);
    }
    if (reservedIds.has(example.id))
      failures.push(`${component.slug}: 예약된 id '${example.id}'를 사용합니다.`);
    if (ids.has(example.id))
      failures.push(`${component.slug}: 예제 id '${example.id}'가 중복됩니다.`);
    if (!example.title.trim() || !example.description.trim() || !example.code.trim()) {
      failures.push(`${component.slug}/${example.id}: 제목, 설명 또는 코드가 비어 있습니다.`);
    }
    if (example.preview === false) {
      failures.push(
        `${component.slug}/${example.id}: 라이브 미리보기가 명시적으로 제외되었습니다.`,
      );
    }
    for (const match of example.code.matchAll(/\bsrc\s*(?:=|:)\s*["']\/([^"']+)["']/g)) {
      const assetPath = match[1].split(/[?#]/, 1)[0];
      if (!existsSync(resolve(publicRoot, assetPath))) {
        failures.push(
          `${component.slug}/${example.id}: public asset '/${assetPath}' does not exist.`,
        );
      }
    }
    ids.add(example.id);
  }

  for (const related of guide.related ?? []) {
    if (!knownSlugs.has(related))
      failures.push(`${component.slug}: 알 수 없는 관련 컴포넌트 '${related}'`);
  }
}

for (const slug of Object.keys(componentGuides)) {
  if (!knownSlugs.has(slug)) failures.push(`${slug}: 현재 레지스트리에 없는 가이드입니다.`);
}

if (failures.length > 0) {
  console.error(
    `문서 검증 실패 (${failures.length})\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

const exampleCount = Object.values(componentGuides).reduce(
  (total, guide) => total + guide.examples.length,
  0,
);
console.log(
  `${componentDocs.length}개 컴포넌트, ${exampleCount}개 registry 예제, ${inventoryStories.length}개 이전 예제와 ${designSystemInventory.mdx.length}개 문서의 규칙을 확인했습니다.`,
);
