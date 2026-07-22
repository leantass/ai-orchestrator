const fs = require('node:fs/promises');
const path = require('node:path');
const https = require('node:https');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const ALLOWED_HOSTS = new Set(['api.github.com', 'github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com', 'releases.astral.sh']);
const USER_AGENT = 'jefe-factory-uv-provisioning-runtime';
const ARTIFACT_NAME = 'uv-x86_64-pc-windows-msvc.zip';
const CHECKSUM_NAME = `${ARTIFACT_NAME}.sha256`;

function assertAllowedUrl(rawUrl) { const parsed = new URL(rawUrl); if (parsed.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed.'); if (!ALLOWED_HOSTS.has(parsed.hostname)) throw new Error(`URL host is not allowlisted: ${parsed.hostname}`); return parsed; }
function requestBuffer(rawUrl, maxBytes, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects.'));
    const parsed = assertAllowedUrl(rawUrl);
    const req = https.request(parsed, { method: 'GET', timeout: 60000, headers: { 'user-agent': USER_AGENT, accept: 'application/octet-stream, application/json' } }, (res) => {
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        res.resume();
        if (!location) return reject(new Error('Redirect without location.'));
        return resolve(requestBuffer(new URL(location, parsed).toString(), maxBytes, redirects + 1));
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return reject(new Error(`HTTPS request failed with status ${res.statusCode}.`)); }
      const chunks = []; let total = 0;
      res.on('data', (chunk) => { total += chunk.length; if (total > maxBytes) { req.destroy(new Error('Download exceeded maximum size.')); return; } chunks.push(chunk); });
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), finalUrl: parsed.toString(), host: parsed.hostname }));
    });
    req.on('timeout', () => req.destroy(new Error('HTTPS request timed out.')));
    req.on('error', reject);
    req.end();
  });
}
async function fetchUvReleaseMetadata() {
  const { buffer } = await requestBuffer('https://api.github.com/repos/astral-sh/uv/releases/latest', 2 * 1024 * 1024);
  return JSON.parse(buffer.toString('utf8'));
}
function selectUvAssets(metadata) {
  const assets = Array.isArray(metadata.assets) ? metadata.assets : [];
  const artifact = assets.find((asset) => asset.name === ARTIFACT_NAME);
  const checksum = assets.find((asset) => asset.name === CHECKSUM_NAME);
  if (!artifact) return { releaseTag: metadata.tag_name, error: 'blocked_no_supported_artifact' };
  if (!checksum) return { releaseTag: metadata.tag_name, artifact, error: 'blocked_checksum_unavailable' };
  return { releaseTag: metadata.tag_name, artifact, checksum };
}
async function downloadUvArtifactAndChecksum(downloadsRoot) {
  const metadata = await fetchUvReleaseMetadata();
  const selected = selectUvAssets(metadata);
  if (selected.error) return { status: selected.error, releaseTag: selected.releaseTag };
  const releaseRoot = path.join(downloadsRoot, selected.releaseTag);
  await fs.mkdir(releaseRoot, { recursive: true });
  const artifactPath = path.join(releaseRoot, ARTIFACT_NAME);
  const checksumPath = path.join(releaseRoot, CHECKSUM_NAME);
  const artifactUrl = selected.artifact.browser_download_url;
  const checksumUrl = selected.checksum.browser_download_url;
  assertAllowedUrl(artifactUrl); assertAllowedUrl(checksumUrl);
  const artifactDownload = await requestBuffer(artifactUrl, 100 * 1024 * 1024);
  const checksumDownload = await requestBuffer(checksumUrl, 1024 * 1024);
  await fs.writeFile(artifactPath, artifactDownload.buffer);
  await fs.writeFile(checksumPath, checksumDownload.buffer);
  const artifactSha256 = crypto.createHash('sha256').update(artifactDownload.buffer).digest('hex');
  const checksumText = checksumDownload.buffer.toString('utf8').trim();
  const checksumSha256 = parseChecksum(checksumText);
  return { status: 'downloaded', releaseTag: selected.releaseTag, artifactName: ARTIFACT_NAME, artifactPath, checksumPath, artifactUrlHost: new URL(artifactDownload.finalUrl).hostname, checksumUrlHost: new URL(checksumDownload.finalUrl).hostname, artifactSha256, checksumSha256 };
}
function parseChecksum(text) { const match = text.match(/\b[a-f0-9]{64}\b/iu); return match ? match[0].toLowerCase() : undefined; }
module.exports = { downloadUvArtifactAndChecksum, parseChecksum, ARTIFACT_NAME };
