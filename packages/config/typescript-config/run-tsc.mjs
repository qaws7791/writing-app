#!/usr/bin/env node

import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

const require = createRequire(import.meta.url)
const typescriptPackagePath = require.resolve("@typescript/native/package.json")
const compilerUrl = pathToFileURL(
  path.join(path.dirname(typescriptPackagePath), "bin/tsc")
).href

await import(compilerUrl)
