const { executeFactoryHermesPythonInstallVerification } = require('./hermes-python-install-verification.execute.cjs');
const verificationPaths = require('./hermes-python-install-verification.path.cjs');

module.exports = { executeFactoryHermesPythonInstallVerification, ...verificationPaths };
