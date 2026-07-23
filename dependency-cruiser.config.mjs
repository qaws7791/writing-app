/** @type {import("dependency-cruiser").IConfiguration} */
const config = {
  forbidden: [
    {
      name: "no-circular-runtime-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { circular: true, dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-unlisted-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
    {
      name: "frontends-do-not-import-server-or-db",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: {
        path: [
          "^packages/(modules|infra)/",
          "^packages/config/env/src/parse-env\\.ts$",
          "node_modules/drizzle-orm(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/drizzle-orm(?:/|$)",
        ],
        pathNot: "^packages/infra/(auth|http-client)/",
      },
    },
  ],
  options: {
    exclude: {
      path: "(^|/)(?:\\.next|\\.turbo|coverage|dist|storybook-static)(?:/|$)",
    },
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },
    enhancedResolveOptions: {
      conditionNames: ["types", "import", "node", "default"],
      exportsFields: ["exports"],
    },
    preserveSymlinks: false,
    tsPreCompilationDeps: true,
  },
}

export default config
