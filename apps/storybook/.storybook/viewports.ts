import type { ViewportMap } from "storybook/viewport"

const viewports = {
  "mobile-sm": {
    name: "mobile-sm",
    styles: {
      height: "800px",
      width: "360px",
    },
  },
  "mobile-lg": {
    name: "mobile-lg",
    styles: {
      height: "932px",
      width: "430px",
    },
  },
  tablet: {
    name: "tablet",
    styles: {
      height: "1112px",
      width: "834px",
    },
  },
  desktop: {
    name: "desktop",
    styles: {
      height: "900px",
      width: "1280px",
    },
  },
  wide: {
    name: "wide",
    styles: {
      height: "1000px",
      width: "1440px",
    },
  },
} satisfies ViewportMap

export { viewports }
