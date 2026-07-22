const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const { assertFactoryUvProvisioningPathContained } = require('./uv-provisioning-runtime.path.cjs');

const EOCD = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const ZIP64_EOCD = 0x06064b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;
const ZIP64_EXTRA = 0x0001;
const MAX_ENTRY_BYTES = 100 * 1024 * 1024;

function readUInt64(buffer, offset) {
  const value = buffer.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('ZIP64 value exceeds safe integer range.');
  return Number(value);
}
function findEndOfCentralDirectory(buffer) {
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD) return i;
  }
  throw new Error('ZIP EOCD not found.');
}
function findZip64EndOfCentralDirectoryLocator(buffer, eocdOffset) {
  const locatorOffset = eocdOffset - 20;
  if (locatorOffset < 0 || buffer.readUInt32LE(locatorOffset) !== ZIP64_LOCATOR) throw new Error('ZIP64 locator not found.');
  return locatorOffset;
}
function readZip64EndOfCentralDirectory(buffer, locatorOffset) {
  const diskWithZip64Eocd = buffer.readUInt32LE(locatorOffset + 4);
  const zip64EocdOffset = readUInt64(buffer, locatorOffset + 8);
  const totalDisks = buffer.readUInt32LE(locatorOffset + 16);
  if (diskWithZip64Eocd !== 0 || totalDisks !== 1) throw new Error('Multi-disk ZIP64 archives are forbidden.');
  if (buffer.readUInt32LE(zip64EocdOffset) !== ZIP64_EOCD) throw new Error('Invalid ZIP64 EOCD record.');
  const diskNumber = buffer.readUInt32LE(zip64EocdOffset + 16);
  const centralDirectoryStartDisk = buffer.readUInt32LE(zip64EocdOffset + 20);
  if (diskNumber !== 0 || centralDirectoryStartDisk !== 0) throw new Error('Multi-disk ZIP archives are forbidden.');
  return {
    entries: readUInt64(buffer, zip64EocdOffset + 32),
    centralSize: readUInt64(buffer, zip64EocdOffset + 40),
    centralOffset: readUInt64(buffer, zip64EocdOffset + 48),
  };
}
function readCentralDirectoryInfo(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const diskNumber = buffer.readUInt16LE(eocdOffset + 4);
  const centralStartDisk = buffer.readUInt16LE(eocdOffset + 6);
  if (diskNumber !== 0 || centralStartDisk !== 0) throw new Error('Multi-disk ZIP archives are forbidden.');
  const entries16 = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize32 = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset32 = buffer.readUInt32LE(eocdOffset + 16);
  if (entries16 === 0xffff || centralSize32 === 0xffffffff || centralOffset32 === 0xffffffff) {
    return readZip64EndOfCentralDirectory(buffer, findZip64EndOfCentralDirectoryLocator(buffer, eocdOffset));
  }
  return { entries: entries16, centralSize: centralSize32, centralOffset: centralOffset32 };
}
function parseZip64ExtraField(extra, needed) {
  let offset = 0;
  while (offset + 4 <= extra.length) {
    const headerId = extra.readUInt16LE(offset);
    const size = extra.readUInt16LE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = dataStart + size;
    if (dataEnd > extra.length) throw new Error('Invalid ZIP extra field length.');
    if (headerId === ZIP64_EXTRA) {
      let dataOffset = dataStart;
      const values = {};
      for (const key of ['uncompressedSize', 'compressedSize', 'localHeaderOffset']) {
        if (needed[key]) {
          if (dataOffset + 8 > dataEnd) throw new Error('ZIP64 extra field is incomplete.');
          values[key] = readUInt64(extra, dataOffset);
          dataOffset += 8;
        }
      }
      return values;
    }
    offset = dataEnd;
  }
  return {};
}
function isSafeZipEntryName(name) {
  const normalized = name.replace(/\\/g, '/');
  if (path.isAbsolute(normalized) || normalized.startsWith('/') || normalized.split('/').includes('..')) return undefined;
  const base = path.posix.basename(normalized).toLowerCase();
  return base === 'uv.exe' || base === 'uvx.exe' ? base : undefined;
}
function resolveZipEntrySizesAndOffset(raw, extra) {
  const needed = {
    uncompressedSize: raw.uncompressedSize === 0xffffffff,
    compressedSize: raw.compressedSize === 0xffffffff,
    localHeaderOffset: raw.localHeaderOffset === 0xffffffff,
  };
  const zip64 = Object.values(needed).some(Boolean) ? parseZip64ExtraField(extra, needed) : {};
  const resolved = {
    uncompressedSize: needed.uncompressedSize ? zip64.uncompressedSize : raw.uncompressedSize,
    compressedSize: needed.compressedSize ? zip64.compressedSize : raw.compressedSize,
    localHeaderOffset: needed.localHeaderOffset ? zip64.localHeaderOffset : raw.localHeaderOffset,
  };
  for (const [key, value] of Object.entries(resolved)) if (!Number.isSafeInteger(value)) throw new Error(`ZIP entry ${key} is not safe.`);
  if (resolved.compressedSize > MAX_ENTRY_BYTES || resolved.uncompressedSize > MAX_ENTRY_BYTES) throw new Error('ZIP entry exceeds maximum allowed size.');
  return resolved;
}
function readCentralDirectoryEntries(buffer) {
  const info = readCentralDirectoryInfo(buffer);
  const entries = [];
  let offset = info.centralOffset;
  const end = info.centralOffset + info.centralSize;
  for (let i = 0; i < info.entries; i += 1) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== CENTRAL) throw new Error('Invalid central directory header.');
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const raw = {
      compressedSize: buffer.readUInt32LE(offset + 20),
      uncompressedSize: buffer.readUInt32LE(offset + 24),
      localHeaderOffset: buffer.readUInt32LE(offset + 42),
    };
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttrs = buffer.readUInt32LE(offset + 38);
    const nameStart = offset + 46;
    const extraStart = nameStart + nameLength;
    const next = extraStart + extraLength + commentLength;
    if (next > end) throw new Error('Central directory entry escapes directory bounds.');
    const name = buffer.subarray(nameStart, extraStart).toString('utf8');
    const extra = buffer.subarray(extraStart, extraStart + extraLength);
    const wanted = isSafeZipEntryName(name);
    if (wanted) entries.push({ wanted, flags, method, externalAttrs, ...resolveZipEntrySizesAndOffset(raw, extra) });
    offset = next;
  }
  return entries;
}
async function extractAllowedUvExecutables(buffer, binRoot) {
  await fs.mkdir(binRoot, { recursive: true });
  const extracted = [];
  for (const entry of readCentralDirectoryEntries(buffer)) {
    if (entry.flags & 0x1) throw new Error('Encrypted ZIP entries are forbidden.');
    if (![0, 8].includes(entry.method)) throw new Error(`Unsupported ZIP method ${entry.method}.`);
    if (((entry.externalAttrs >>> 16) & 0o170000) === 0o120000) throw new Error('ZIP symlinks are forbidden.');
    const localOffset = entry.localHeaderOffset;
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL) throw new Error('Invalid local file header.');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + entry.compressedSize;
    if (dataEnd > buffer.length) throw new Error('ZIP compressed data escapes archive bounds.');
    const compressed = buffer.subarray(dataStart, dataEnd);
    const data = entry.method === 0 ? compressed : zlib.inflateRawSync(compressed);
    if (data.length !== entry.uncompressedSize) throw new Error('ZIP uncompressed size mismatch.');
    const outPath = assertFactoryUvProvisioningPathContained(path.join(binRoot, entry.wanted));
    await fs.writeFile(outPath, data, { mode: 0o755 });
    extracted.push(entry.wanted);
  }
  if (!extracted.includes('uv.exe')) {
    const error = new Error('uv.exe was not found in ZIP.');
    error.blockerId = 'uv_executable_not_found_in_zip';
    throw error;
  }
  return { extracted };
}
async function extractUvExecutablesFromZip(zipPath, binRoot) {
  return extractAllowedUvExecutables(await fs.readFile(zipPath), binRoot);
}
module.exports = { extractUvExecutablesFromZip, findEndOfCentralDirectory, findZip64EndOfCentralDirectoryLocator, readZip64EndOfCentralDirectory, readCentralDirectoryEntries, parseZip64ExtraField, resolveZipEntrySizesAndOffset, isSafeZipEntryName, extractAllowedUvExecutables };
