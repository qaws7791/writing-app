export type GuideProp = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type GuideExample = {
  id: string;
  title: string;
  description: string;
  code: string;
  /** Override the live example key, or set false only when the example cannot be rendered. */
  preview?: string | false;
  note?: string;
};

export type ComponentGuide = {
  slug: string;
  summary: string;
  examples: GuideExample[];
  usageNotes: string[];
  accessibility: string[];
  props?: GuideProp[];
  related?: string[];
};

export type ComponentGuideMap = Record<string, ComponentGuide>;
