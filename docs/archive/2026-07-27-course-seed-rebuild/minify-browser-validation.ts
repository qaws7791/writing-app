const source = await Bun.file(
  new URL("./browser-catalog-validation.js", import.meta.url)
).text()
const transpiler = new Bun.Transpiler({
  loader: "js",
  minifyWhitespace: true,
})
const transformed = transpiler.transformSync(`const validation = ${source};`)
const expression = transformed
  .replace(/^const validation=/u, "")
  .replace(/;$/u, "")

await Bun.write(
  new URL("./browser-catalog-validation.min.js", import.meta.url),
  expression
)
