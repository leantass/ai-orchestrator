function buildCommandRendererBlocker(reason) {
  return { reason, message: `Blocked by fail-closed renderer rule: ${reason}` };
}

module.exports = {
  buildCommandRendererBlocker,
  rendererRuntimeBoundary: {
    codeOnly: true,
    executesHermes: false,
    readsCredentials: false,
    usesTransport: false,
    passesPrompt: false,
    buildsRunnableCommandNow: false,
  },
};
