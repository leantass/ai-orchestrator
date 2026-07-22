const reviewPaths = require('./hermes-python-install-jefe-review.path.cjs');
const { executeFactoryHermesPythonInstallJefeReview } = require('./hermes-python-install-jefe-review.execute.cjs');

module.exports = { executeFactoryHermesPythonInstallJefeReview, ...reviewPaths };
