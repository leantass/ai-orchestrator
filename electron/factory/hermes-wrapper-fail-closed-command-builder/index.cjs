function denyWrapperCommandBuild(reason) {
  return { reason, message: `Blocked by fail-closed wrapper builder rule: ${reason}` };
}

module.exports = {
  denyWrapperCommandBuild,
  wrapperBuilderRuntimeBoundary: {
    codeOnly: true,
    executesHermes: false,
    executesWrapperAgainstHermes: false,
    readsCredentials: false,
    usesTransport: false,
    passesPrompt: false,
    buildsRunnableCommandNow: false,
  },
};
