const { executeFactoryUvProvisioningVerification } = require('./uv-provisioning-verification.execute.cjs');
const paths = require('./uv-provisioning-verification.path.cjs');
module.exports = { executeFactoryUvProvisioningVerification, ...paths };
