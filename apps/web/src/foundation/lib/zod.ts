import z from "zod"

/**
 * Creates a Zod codec for JSON string serialization and deserialization.
 *
 * This function creates a bidirectional codec that can decode JSON strings into typed objects
 * and encode typed objects back into JSON strings, with automatic validation against a provided schema.
 *
 * @template T - The Zod schema type to validate against
 * @param schema - A Zod schema that defines the expected structure of the parsed JSON data
 * @returns A Zod codec that handles JSON string ↔ object conversion with validation
 *
 * @example
 * // Define a schema for user data
 * const userSchema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 *
 * // Create the codec
 * const jsonToObject = jsonCodec(userSchema);
 *
 * // Decode JSON string to typed object
 * const decoded = jsonToObject.decode('{"name":"Alice","age":30}');
 * // => { name: "Alice", age: 30 }
 *
 * // Encode typed object to JSON string
 * const encoded = jsonToObject.encode({ name: "Bob", age: 25 });
 * // => '{"name":"Bob","age":25}'
 *
 * // Invalid JSON throws Zod validation error
 * jsonToObject.decode('~~invalid~~');
 * // throws ZodError with code "invalid_format" and format "json"
 */
export const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString)
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        })
        return z.NEVER
      }
    },
    encode: (value) => JSON.stringify(value),
  })
