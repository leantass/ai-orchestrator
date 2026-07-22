const paths = require('./hermes-research-result-ingestion-v2.path.cjs');
const runtime = require('./hermes-research-result-ingestion-v2.execute.cjs');
module.exports = { ...paths, ...runtime };
