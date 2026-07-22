const paths = require('./hermes-build-dependency-cache-approval.path.cjs');
const runtime = require('./hermes-build-dependency-cache-approval.execute.cjs');
module.exports = { ...paths, ...runtime };
