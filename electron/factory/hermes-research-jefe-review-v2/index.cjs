const paths = require('./hermes-research-jefe-review-v2.path.cjs');
const runtime = require('./hermes-research-jefe-review-v2.execute.cjs');
module.exports = { ...paths, ...runtime };
