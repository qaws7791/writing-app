import { Agent } from "@mastra/core/agent"
import { Mastra } from "@mastra/core/mastra"
import { RequestContext } from "@mastra/core/request-context"
import { InMemoryStore } from "@mastra/core/storage"
import { createTool } from "@mastra/core/tools"

export const createMastraTool = createTool
export { RequestContext as MastraRequestContext }

export function createManagedMastraAgent(
  input: ConstructorParameters<typeof Agent>[0]
) {
  const agent = new Agent(input)
  const mastra = new Mastra({
    agents: { [agent.id]: agent },
    logger: false,
    storage: new InMemoryStore(),
  })
  let closePromise: Promise<void> | undefined

  return Object.freeze({
    agent,
    close() {
      closePromise ??= mastra.shutdown()
      return closePromise
    },
  })
}
