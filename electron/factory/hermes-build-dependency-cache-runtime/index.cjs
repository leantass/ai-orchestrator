const paths = require('./hermes-build-dependency-cache-runtime.path.cjs');
const runtime = require('./hermes-build-dependency-cache-runtime.execute.cjs');
module.exports = { ...paths, ...runtime };
