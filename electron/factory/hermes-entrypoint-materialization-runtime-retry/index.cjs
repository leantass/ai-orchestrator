const paths = require('./hermes-entrypoint-materialization-runtime-retry.path.cjs');
const runtime = require('./hermes-entrypoint-materialization-runtime-retry.execute.cjs');

module.exports = { ...paths, ...runtime };
