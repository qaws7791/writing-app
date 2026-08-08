import * as React from "react";

export function useThemeRevision(): number {
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setRevision((current) => current + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return revision;
}
