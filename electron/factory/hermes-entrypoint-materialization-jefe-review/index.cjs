const paths = require('./hermes-entrypoint-materialization-jefe-review.path.cjs');
const runtime = require('./hermes-entrypoint-materialization-jefe-review.execute.cjs');

module.exports = { ...paths, ...runtime };
