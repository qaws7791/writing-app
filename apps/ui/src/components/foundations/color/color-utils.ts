type Rgb = { a: number; b: number; g: number; r: number };

export type WcagLevel = "fail" | "aa-large" | "aa" | "aaa-large" | "aaa";

export type ContrastResult = {
  hex: string;
  levelLarge: WcagLevel;
  levelNormal: WcagLevel;
  ratio: number;
};

let colorProbe: HTMLDivElement | null = null;

function getColorProbe(): HTMLDivElement {
  if (!colorProbe) {
    colorProbe = document.createElement("div");
    colorProbe.style.display = "none";
    colorProbe.style.position = "absolute";
    colorProbe.style.pointerEvents = "none";
    document.body.appendChild(colorProbe);
  }

  return colorProbe;
}

function normalizeCssVar(cssVar: string): string {
  return cssVar.startsWith("--") ? cssVar : `--${cssVar}`;
}

function resolveCssColor(cssVar: string): string {
  const probe = getColorProbe();
  probe.style.backgroundColor = `var(${normalizeCssVar(cssVar)})`;
  return getComputedStyle(probe).backgroundColor;
}

function parseRgb(color: string): Rgb | null {
  const rgbMatch = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );

  if (!rgbMatch) return null;

  return {
    r: Number(rgbMatch[1]),
    g: Number(rgbMatch[2]),
    b: Number(rgbMatch[3]),
    a: rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]),
  };
}

function toHex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(rgb: Rgb): number {
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(foreground: Rgb, background: Rgb): number {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getWcagLevel(ratio: number, isLargeText: boolean): WcagLevel {
  if (isLargeText) {
    if (ratio >= 4.5) return "aaa-large";
    if (ratio >= 3) return "aa-large";
    return "fail";
  }

  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  return "fail";
}

export function getContrastResult(
  foregroundCssVar: string,
  backgroundCssVar: string,
): ContrastResult | null {
  const foregroundRgb = parseRgb(resolveCssColor(foregroundCssVar));
  const backgroundRgb = parseRgb(resolveCssColor(backgroundCssVar));

  if (!foregroundRgb || !backgroundRgb) return null;

  const ratio = getContrastRatio(foregroundRgb, backgroundRgb);

  return {
    ratio,
    hex: rgbToHex(foregroundRgb),
    levelNormal: getWcagLevel(ratio, false),
    levelLarge: getWcagLevel(ratio, true),
  };
}

export function getResolvedHex(cssVar: string): string | null {
  const rgb = parseRgb(resolveCssColor(cssVar));
  return rgb ? rgbToHex(rgb) : null;
}

export function pickForegroundOn(backgroundCssVar: string): string {
  const backgroundRgb = parseRgb(resolveCssColor(backgroundCssVar));

  if (!backgroundRgb) return "var(--foreground)";

  const foregroundRgb = parseRgb(resolveCssColor("--foreground"));
  const canvasRgb = parseRgb(resolveCssColor("--background"));

  if (!foregroundRgb || !canvasRgb) return "var(--foreground)";

  return getContrastRatio(foregroundRgb, backgroundRgb) >=
    getContrastRatio(canvasRgb, backgroundRgb)
    ? "var(--foreground)"
    : "var(--background)";
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

export function wcagLabel(level: WcagLevel): string {
  switch (level) {
    case "aaa":
      return "AAA";
    case "aaa-large":
      return "AAA 큰 텍스트";
    case "aa":
      return "AA";
    case "aa-large":
      return "AA 큰 텍스트";
    default:
      return "미달";
  }
}

export function wcagPasses(level: WcagLevel): boolean {
  return level !== "fail";
}
