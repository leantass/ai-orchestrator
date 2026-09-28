const { createFirstVersionFromRun } = require('./jefe-project-creation.cjs')

async function materializeCommercialProject(input) {
  return createFirstVersionFromRun(input)
}

module.exports = { materializeCommercialProject }
