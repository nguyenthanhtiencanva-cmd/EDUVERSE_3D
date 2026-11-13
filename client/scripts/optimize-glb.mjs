#!/usr/bin/env node
/**
 * Nén texture trong 1 file GLB (vd. mô hình xuất từ Meshy AI) để tải nhanh trên web.
 *   node scripts/optimize-glb.mjs <input.glb> <output.glb> [--max 1024] [--quality 82]
 * - Ảnh baseColor/emissive -> JPEG; ảnh có kênh alpha giữ PNG (chỉ thu nhỏ).
 * - Dùng `sips` có sẵn trên macOS, không cần cài thêm thư viện.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const [input, output] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const flag = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const MAX = Number(flag('max', 1024));
const QUALITY = String(flag('quality', 82));
const PNG_TO_JPG = args.includes('--png-to-jpg'); // dùng khi texture PNG không cần kênh alpha (vd. normal map)
if (!input || !output) {
  console.error('Cách dùng: node scripts/optimize-glb.mjs <input.glb> <output.glb> [--max 1024]');
  process.exit(1);
}

const buf = fs.readFileSync(input);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('Không phải file GLB');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
const binLen = buf.readUInt32LE(20 + jsonLen);
const bin = buf.subarray(20 + jsonLen + 8, 20 + jsonLen + 8 + binLen);

const pad4 = (b, byte = 0) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), byte)]) : b);

function resizeImage(imgBuf, mime, img) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'glbopt-'));
  const toJpg = PNG_TO_JPG && mime === 'image/png';
  const isPng = mime === 'image/png' && !toJpg;
  const inFile = path.join(tmp, mime === 'image/png' ? 'in.png' : 'in.jpg');
  const outFile = path.join(tmp, isPng ? 'out.png' : 'out.jpg');
  try {
    fs.writeFileSync(inFile, imgBuf);
    const sipsArgs = ['-Z', String(MAX)];
    if (!isPng) sipsArgs.push('-s', 'format', 'jpeg', '-s', 'formatOptions', QUALITY);
    execFileSync('sips', [...sipsArgs, inFile, '--out', outFile], { stdio: 'ignore' });
    const out = fs.readFileSync(outFile);
    if (toJpg) { img.mimeType = 'image/jpeg'; return out; }
    return out.length < imgBuf.length ? out : imgBuf;
  } catch {
    return imgBuf;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// Ảnh nào dùng cho baseColor có alpha? Giữ nguyên định dạng gốc cho PNG để an toàn.
const imageViews = new Map();
(json.images || []).forEach((img, idx) => {
  if (img.bufferView !== undefined) imageViews.set(img.bufferView, idx);
});

const newChunks = [];
let offset = 0;
json.bufferViews = json.bufferViews.map((bv, bvIdx) => {
  let data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
  if (imageViews.has(bvIdx)) {
    const img = json.images[imageViews.get(bvIdx)];
    const before = data.length;
    const mimeBefore = img.mimeType;
    data = resizeImage(Buffer.from(data), mimeBefore, img);
    console.log(`🖼  Ảnh #${imageViews.get(bvIdx)} (${mimeBefore} -> ${img.mimeType}): ${(before / 1024).toFixed(0)} KB -> ${(data.length / 1024).toFixed(0)} KB`);
  }
  const padded = pad4(Buffer.from(data));
  const nb = { ...bv, byteOffset: offset, byteLength: data.length };
  newChunks.push(padded);
  offset += padded.length;
  return nb;
});
const newBin = Buffer.concat(newChunks);
json.buffers = [{ byteLength: newBin.length }];

const jsonBuf = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + newBin.length, 8);
const jh = Buffer.alloc(8);
jh.writeUInt32LE(jsonBuf.length, 0);
jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8);
bh.writeUInt32LE(newBin.length, 0);
bh.writeUInt32LE(0x004e4942, 4);
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, jh, jsonBuf, bh, newBin]));
console.log(`✅ ${input} (${(buf.length / 1048576).toFixed(2)} MB) -> ${output} (${(fs.statSync(output).size / 1048576).toFixed(2)} MB)`);
