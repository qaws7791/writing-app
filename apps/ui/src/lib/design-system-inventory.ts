import inventory from "@/src/lib/design-system-inventory.json";

export type MigratedStory = (typeof inventory.modules)[number]["stories"][number] & {
  moduleTitle: string;
  source: string;
  hasCiTest: boolean;
  hasArgs: boolean;
  hasArgTypes: boolean;
};

export const designSystemInventory = inventory;

const migratedStories: MigratedStory[] = inventory.modules.flatMap((module) =>
  module.stories.map((story) => ({
    ...story,
    moduleTitle: module.title,
    source: module.source,
    hasCiTest: module.hasCiTest,
    hasArgs: module.hasArgs,
    hasArgTypes: module.hasArgTypes,
  })),
);

export function getMigratedStories(moduleTitle: string) {
  return migratedStories.filter((story) => story.moduleTitle === moduleTitle);
}

export function getStoryAnchor(exportName: string) {
  return `story-${exportName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
