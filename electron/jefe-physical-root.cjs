const fs = require('fs')
const path = require('path')

function resolvePhysicalRoot(value) {
  const resolved = path.normalize(path.resolve(value))
  let cursor = resolved
  const suffix = []
  while (true) {
    try {
      const physicalBase = fs.realpathSync.native ? fs.realpathSync.native(cursor) : fs.realpathSync(cursor)
      return path.normalize(path.join(physicalBase, ...suffix))
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error?.code)) throw error
      const parent = path.dirname(cursor)
      if (parent === cursor) return resolved
      suffix.unshift(path.basename(cursor))
      cursor = parent
    }
  }
}

function physicalRootKey(value) {
  const physical = resolvePhysicalRoot(value)
  return process.platform === 'win32' ? physical.toLocaleLowerCase('en-US') : physical
}

module.exports = { physicalRootKey, resolvePhysicalRoot }
