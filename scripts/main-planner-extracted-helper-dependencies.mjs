import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function listMainHelperModuleNames(repoRoot) {
  return fs
    .readdirSync(path.join(repoRoot, 'electron'))
    .filter((name) => /^main-.*-helpers\.cjs$/u.test(name))
    .sort((left, right) => left.localeCompare(right))
}

export function loadMainPlannerExtractedHelperDependencies(repoRoot) {
  return listMainHelperModuleNames(repoRoot).reduce(
    (collected, moduleName) => ({
      ...collected,
      ...require(path.join(repoRoot, 'electron', moduleName)),
    }),
    {},
  )
}