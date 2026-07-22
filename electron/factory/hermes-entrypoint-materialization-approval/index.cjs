const { resolveFactoryHermesEntrypointMaterializationApprovalPaths, assertApprovalPathContained } = require('./hermes-entrypoint-materialization-approval.path.cjs');
const { evaluateFactoryHermesEntrypointMaterializationApproval, executeFactoryHermesEntrypointMaterializationApproval } = require('./hermes-entrypoint-materialization-approval.execute.cjs');

module.exports = {
  resolveFactoryHermesEntrypointMaterializationApprovalPaths,
  assertApprovalPathContained,
  evaluateFactoryHermesEntrypointMaterializationApproval,
  executeFactoryHermesEntrypointMaterializationApproval,
};
