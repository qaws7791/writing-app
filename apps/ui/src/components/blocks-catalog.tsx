"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/primitives/tabs";

import BlockViewer from "@/src/components/block-viewer";
import { type BlockDemoSlug } from "@/src/components/login-block-demos";
import { type BlockSection } from "@/src/lib/block-docs";

export type BlocksCatalogBlock = {
  slug: string;
  title: string;
  description: string;
  installName: string;
  installCommand: string;
  code: string;
};

export type BlocksCatalogSection = Omit<BlockSection, "blocks"> & {
  blocks: BlocksCatalogBlock[];
};

type BlocksCatalogProps = {
  sections: BlocksCatalogSection[];
};

const TAB_PARAM = "tab";

function resolveTab(tab: string | undefined, sectionIds: Set<string>, fallback: string) {
  return tab && sectionIds.has(tab) ? tab : fallback;
}

function readTabFromUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return new URL(window.location.href).searchParams.get(TAB_PARAM) ?? undefined;
}

function syncTabToUrl(tab: string, defaultTab: string) {
  const url = new URL(window.location.href);

  if (tab === defaultTab) {
    url.searchParams.delete(TAB_PARAM);
  } else {
    url.searchParams.set(TAB_PARAM, tab);
  }

  window.history.replaceState(window.history.state, "", url);
}

export default function BlocksCatalog({ sections }: BlocksCatalogProps) {
  const defaultValue = sections[0]?.id ?? "learning";
  const sectionIds = new Set(sections.map((section) => section.id));
  // Static pages cannot read request search params at build time. This island is
  // client-only, so the first render can restore `?tab=` from the live URL.
  const [value, setValue] = useState(() => resolveTab(readTabFromUrl(), sectionIds, defaultValue));

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (typeof next !== "string" || !sectionIds.has(next)) {
          return;
        }

        setValue(next);
        syncTabToUrl(next, defaultValue);
      }}
      className="mt-14 gap-8"
    >
      <TabsList variant="line" className="gap-1">
        {sections.map((section) => (
          <TabsTrigger key={section.id} value={section.id} className="px-3.5 sm:px-4">
            {section.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="space-y-12 outline-none">
          <header className="max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.035em]">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-pretty text-muted-foreground sm:text-base sm:leading-7">
              {section.description}
            </p>
          </header>

          <div className="space-y-12">
            {section.blocks.map((block) => (
              <section key={block.slug} id={block.slug} className="scroll-mt-24">
                <h3 className="sr-only">{block.title}</h3>
                <BlockViewer
                  slug={block.slug as BlockDemoSlug}
                  title={block.title}
                  description={block.description}
                  installName={block.installName}
                  installCommand={block.installCommand}
                  code={block.code}
                />
              </section>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
