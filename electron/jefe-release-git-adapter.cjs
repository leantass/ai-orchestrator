const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { sanitizeRemoteUrl } = require('./jefe-release-contract.cjs')

const execFileAsync = promisify(execFile)
function fail(code, message, details = {}) { const error = new Error(message); error.code = code; error.details = details; throw error }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex') }
function safePath(value) { if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.includes('..') || value.includes('\\')) fail('UNSAFE_GIT_PATH', 'Git paths must be safe relative paths.'); return value }
function safeBranch(value) { if (typeof value !== 'string' || !/^[A-Za-z0-9._/-]+$/.test(value) || value.startsWith('-') || value.includes('..')) fail('UNSAFE_GIT_REF', 'Git ref is invalid.'); return value }
function safeTag(value) { if (typeof value !== 'string' || !/^release-[a-z][a-z0-9-]{1,100}$/.test(value)) fail('UNSAFE_GIT_REF', 'Git tag is invalid.'); return value }
function safeMessage(value) { return String(value).replace(/[\r\n]/gu, ' ').replace(/(?:token|password|secret|api[_-]?key)\s*[:=]\s*\S+/giu, '$1=[redacted]').slice(0, 180) }
function createGitAdapter({ repoRoot } = {}) {
  if (!repoRoot || !path.isAbsolute(repoRoot)) fail('INVALID_GIT_ROOT', 'Git adapter root must be absolute.')
  async function git(args, options = {}) {
    try { return (await execFileAsync('git', args, { cwd: repoRoot, shell: false, windowsHide: true, maxBuffer: 2 * 1024 * 1024, ...options })).stdout.trim() } catch (error) { fail(error.code === 'ENOENT' ? 'GIT_NOT_AVAILABLE' : 'GIT_COMMAND_FAILED', 'Git command failed.', { exitCode: error.code, stderr: String(error.stderr || '').slice(0, 500) }) }
  }
  async function gitRaw(args) {
    try { return (await execFileAsync('git', args, { cwd: repoRoot, shell: false, windowsHide: true, maxBuffer: 2 * 1024 * 1024 })).stdout } catch (error) { fail(error.code === 'ENOENT' ? 'GIT_NOT_AVAILABLE' : 'GIT_COMMAND_FAILED', 'Git command failed.', { exitCode: error.code, stderr: String(error.stderr || '').slice(0, 500) }) }
  }
  async function readRepository() {
    const top = await git(['rev-parse', '--show-toplevel'])
    const branch = await git(['branch', '--show-current'])
    const headSha = await git(['rev-parse', 'HEAD'])
    const remoteRaw = await git(['config', '--get', 'remote.origin.url']).catch(() => '')
    return { repoIdentity: `repo-${sha256(top).slice(0, 32)}`, branch, headSha, remoteUrl: sanitizeRemoteUrl(remoteRaw || null), topLevel: top }
  }
  async function status() { const output = await git(['status', '--porcelain=v1', '--untracked-files=all']); return output ? output.split(/\r?\n/u).map((line) => line.slice(3)).filter(Boolean) : [] }
  async function assertAllowlist(files) {
    const allowed = new Set(files.map((file) => safePath(typeof file === 'string' ? file : file.relativePath)))
    const dirty = await status()
    const unexpected = dirty.filter((entry) => !allowed.has(entry.replace(/^..\s/u, '')))
    if (unexpected.length) fail('DIRTY_WORKTREE_OUTSIDE_ALLOWLIST', 'Worktree contains changes outside the delivery allowlist.', { paths: unexpected })
    for (const item of files) { const relativePath = safePath(typeof item === 'string' ? item : item.relativePath); const expected = typeof item === 'string' ? null : item.sha256; if (expected) { const actual = sha256(await fs.promises.readFile(path.join(repoRoot, relativePath))); if (actual !== expected) fail('DELIVERY_INTEGRITY_MISMATCH', 'Allowlisted file hash does not match delivery.', { relativePath }) } }
    return { pass: true, files: [...allowed] }
  }
  async function commit({ request, files } = {}) {
    const baseline = await readRepository(); await assertAllowlist(files)
    const allowlisted = files.map((file) => safePath(typeof file === 'string' ? file : file.relativePath))
    await git(['add', '--', ...allowlisted])
    const message = safeMessage(`release ${request.identity.projectId}/${request.identity.versionId}: approved delivery`)
    await git(['-c', 'user.name=JEFE Release Executor', '-c', 'user.email=jefe-release@invalid.example', 'commit', '-m', message])
    const commitSha = await git(['rev-parse', 'HEAD']); const treeSha = await git(['show', '-s', '--format=%T', commitSha]); const parentSha = await git(['show', '-s', '--format=%P', commitSha])
    return { commitSha, treeSha, parentSha, message, baseline }
  }
  async function findCommit({ request, expectedFiles = [], expectedHashes = {} } = {}) {
    const message = safeMessage(`release ${request.identity.projectId}/${request.identity.versionId}: approved delivery`)
    const output = await git(['log', '--all', '--format=%H%x00%T%x00%P%x00%s%x00'])
    const fields = output ? output.split('\0').filter(Boolean) : []
    for (let index = 0; index + 3 < fields.length; index += 4) if (fields[index + 3] === message) {
      const commitSha = fields[index]; const parentSha = fields[index + 2].split(/\s+/u)[0] || ''
      const changed = await git(['diff-tree', '--no-commit-id', '--name-only', '-r', commitSha]).then((value) => value ? value.split(/\r?\n/u).filter(Boolean) : [])
      if (parentSha && changed.every((item) => expectedFiles.includes(item))) {
        let hashesMatch = true
        for (const relativePath of expectedFiles) if (expectedHashes[relativePath]) { const content = await gitRaw(['show', `${commitSha}:${relativePath}`]); if (sha256(Buffer.from(content)) !== expectedHashes[relativePath]) hashesMatch = false }
        if (hashesMatch) return { commitSha, treeSha: fields[index + 1], parentSha, message, reconciled: true }
      }
    }
    return null
  }
  async function push({ remote = 'origin', branch, expectedHeadSha } = {}) {
    safeBranch(branch); const ref = await git(['ls-remote', '--heads', remote, branch]); const remoteSha = ref ? ref.split(/\s+/u)[0] : null
    if (remoteSha && remoteSha !== expectedHeadSha) {
      try { await git(['merge-base', '--is-ancestor', remoteSha, expectedHeadSha]) } catch { fail('REMOTE_REF_DIVERGED', 'Remote ref diverged; force push is not permitted.', { remoteSha }) }
    }
    if (remoteSha === expectedHeadSha) return { remote, branch, commitSha: expectedHeadSha, reconciled: true }
    await git(['push', '--porcelain', remote, `HEAD:refs/heads/${branch}`])
    const after = await git(['ls-remote', '--heads', remote, branch]); const pushedSha = after.split(/\s+/u)[0]
    if (pushedSha !== expectedHeadSha) fail('REMOTE_REF_MISMATCH', 'Remote ref did not reach the expected commit.')
    return { remote, branch, commitSha: pushedSha, reconciled: false }
  }
  async function readRemoteRef({ remote = 'origin', branch } = {}) { safeBranch(branch); const output = await git(['ls-remote', '--heads', remote, branch]); return output ? output.split(/\s+/u)[0] : null }
  async function tag({ tag, commitSha, message } = {}) { safeTag(tag); const existing = await git(['rev-parse', '-q', '--verify', `refs/tags/${tag}`]).catch(() => ''); if (existing) { if (existing === commitSha) return { tag, commitSha, reconciled: true }; fail('TAG_DIVERGED', 'Release tag already points elsewhere.') } await git(['tag', '-a', tag, commitSha, '-m', safeMessage(message)]); return { tag, commitSha, reconciled: false } }
  return Object.freeze({ readRepository, status, assertAllowlist, commit, findCommit, push, readRemoteRef, tag })
}
module.exports = { createGitAdapter }
