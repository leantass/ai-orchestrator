const paths = require('./hermes-entrypoint-materialization-verification.path.cjs');
const inspect = require('./hermes-entrypoint-materialization-verification.inspect.cjs');
const runtime = require('./hermes-entrypoint-materialization-verification.execute.cjs');
module.exports = { ...paths, ...inspect, ...runtime };
