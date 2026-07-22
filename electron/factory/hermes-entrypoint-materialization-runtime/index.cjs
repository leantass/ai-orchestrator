const runtime = require('./hermes-entrypoint-materialization-runtime.execute.cjs');
const paths = require('./hermes-entrypoint-materialization-runtime.path.cjs');

module.exports = { ...paths, ...runtime };
