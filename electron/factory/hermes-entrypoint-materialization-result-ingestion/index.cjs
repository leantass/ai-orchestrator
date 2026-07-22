const paths = require('./hermes-entrypoint-materialization-result-ingestion.path.cjs');
const runtime = require('./hermes-entrypoint-materialization-result-ingestion.execute.cjs');
module.exports = { ...paths, ...runtime };
