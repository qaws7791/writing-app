import autosaveWriting from "./autosave-writing"
import createWriting from "./create-writing"
import deleteWriting from "./delete-writing"
import getWriting from "./get-writing"
import listWritings from "./list-writings"

export function writingRoutes() {
  return [
    listWritings,
    createWriting,
    getWriting,
    autosaveWriting,
    deleteWriting,
  ] as const
}
