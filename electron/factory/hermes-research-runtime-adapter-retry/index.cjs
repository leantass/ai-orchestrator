const paths = require('./hermes-research-runtime-adapter-retry.path.cjs');
const runtime = require('./hermes-research-runtime-adapter-retry.execute.cjs');
module.exports = { ...paths, ...runtime };
