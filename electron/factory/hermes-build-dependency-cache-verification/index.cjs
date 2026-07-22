const paths = require('./hermes-build-dependency-cache-verification.path.cjs');
const inspect = require('./hermes-build-dependency-cache-verification.inspect.cjs');
const runtime = require('./hermes-build-dependency-cache-verification.execute.cjs');

module.exports = { ...paths, ...inspect, ...runtime };
