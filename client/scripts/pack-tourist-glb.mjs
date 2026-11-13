#!/usr/bin/env node
/**
 * Gộp 3 hoạt ảnh (Idle, Walk, Run) từ Meshy AI vào 1 file GLB duy nhất (tourist_mpfb.glb & tourist_character.glb)
 * đồng thời nén nhẹ texture PBR về 1024px bằng công cụ sips của macOS để tối ưu tốc độ tải WebGL.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(CLIENT_DIR, '..');
const CHAR_DIR = path.resolve(ROOT_DIR, 'assets', 'characters');
const PUBLIC_MODELS_DIR = path.resolve(CLIENT_DIR, 'public', 'models');

function parseGlb(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error(`File không phải GLB hợp lệ: ${filePath}`);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.subarray(20, 20 + jsonLen).toString('utf8');
  const json = JSON.parse(jsonStr);
  const binStart = 20 + jsonLen + 8;
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const bin = buf.subarray(binStart, binStart + binLen);
  return { json, bin };
}

function pad4(buf, padByte = 0x00) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem, padByte)]);
}

function optimizeImageBuffer(imgBuf, maxDim = 1024) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meshy-tex-'));
  const inFile = path.join(tmpDir, 'in.jpg');
  const outFile = path.join(tmpDir, 'out.jpg');
  try {
    fs.writeFileSync(inFile, imgBuf);
    execFileSync('sips', ['-Z', String(maxDim), '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', inFile, '--out', outFile], {
      stdio: 'ignore',
    });
    return fs.readFileSync(outFile);
  } catch {
    return imgBuf;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function main() {
  const idleGlb = parseGlb(path.join(CHAR_DIR, 'tourist_meshy_idle.glb'));
  const walkGlb = parseGlb(path.join(CHAR_DIR, 'tourist_meshy_walk.glb'));
  const runGlb = parseGlb(path.join(CHAR_DIR, 'tourist_meshy_run.glb'));

  const outJson = structuredClone(idleGlb.json);
  const newBufferViews = [];
  const chunkParts = [];
  let currentOffset = 0;

  function appendBufferChunk(sliceBuf, bvMeta = {}) {
    const padded = pad4(sliceBuf, 0x00);
    const bvIndex = newBufferViews.length;
    newBufferViews.push({
      ...bvMeta,
      buffer: 0,
      byteOffset: currentOffset,
      byteLength: sliceBuf.length,
    });
    chunkParts.push(padded);
    currentOffset += padded.length;
    return bvIndex;
  }

  // Giảm góc xoay ngang của Hips trong animation Idle để nhân vật đứng thẳng hướng nhìn khi dừng lại
  const idleAnim = outJson.animations[0];
  const hipsNodeIdx = outJson.nodes.findIndex((n) => n.name === 'Hips');
  const hipsRotChannel = idleAnim.channels.find(
    (ch) => ch.target.node === hipsNodeIdx && ch.target.path === 'rotation'
  );
  const hipsRotAccIdx = hipsRotChannel ? idleAnim.samplers[hipsRotChannel.sampler].output : -1;
  const hipsRotBvIdx = hipsRotAccIdx >= 0 ? outJson.accessors[hipsRotAccIdx].bufferView : -1;

  // Sao chép toàn bộ bufferViews gốc của file Idle (tối ưu các bufferView chứa ảnh)
  const imageBvSet = new Set((outJson.images || []).map((img) => img.bufferView));
  for (let i = 0; i < outJson.bufferViews.length; i++) {
    const bv = outJson.bufferViews[i];
    const start = bv.byteOffset || 0;
    const rawSlice = Buffer.from(idleGlb.bin.subarray(start, start + bv.byteLength));
    if (i === hipsRotBvIdx) {
      const f32 = new Float32Array(rawSlice.buffer, rawSlice.byteOffset, rawSlice.byteLength / 4);
      let minX = Infinity, minY = Infinity, minZ = Infinity, minW = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity, maxW = -Infinity;
      for (let k = 0; k < f32.length; k += 4) {
        let qx = f32[k] * 0.25;
        let qy = f32[k + 1] * 0.1;
        let qz = f32[k + 2] * 0.25;
        let qw = f32[k + 3];
        const len = Math.hypot(qx, qy, qz, qw) || 1;
        qx /= len; qy /= len; qz /= len; qw /= len;
        f32[k] = qx; f32[k + 1] = qy; f32[k + 2] = qz; f32[k + 3] = qw;
        minX = Math.min(minX, qx); maxX = Math.max(maxX, qx);
        minY = Math.min(minY, qy); maxY = Math.max(maxY, qy);
        minZ = Math.min(minZ, qz); maxZ = Math.max(maxZ, qz);
        minW = Math.min(minW, qw); maxW = Math.max(maxW, qw);
      }
      outJson.accessors[hipsRotAccIdx].min = [minX, minY, minZ, minW];
      outJson.accessors[hipsRotAccIdx].max = [maxX, maxY, maxZ, maxW];
    }
    const slice = imageBvSet.has(i) ? optimizeImageBuffer(rawSlice, 1024) : rawSlice;
    const { buffer, byteOffset, byteLength, ...restMeta } = bv;
    appendBufferChunk(slice, restMeta);
  }

  // Đặt tên chuẩn cho animation đầu tiên là "Idle"
  outJson.animations[0].name = 'Idle';

  // Hàm thêm animation từ một GLB khác (cùng danh sách node 0..25)
  function appendAnimationFrom(sourceGlb, targetName) {
    const srcJson = sourceGlb.json;
    const srcBin = sourceGlb.bin;
    const srcAnim = srcJson.animations[0];

    const bvMap = new Map();
    const accMap = new Map();

    function cloneAccessor(srcAccIdx) {
      if (accMap.has(srcAccIdx)) return accMap.get(srcAccIdx);
      const srcAcc = structuredClone(srcJson.accessors[srcAccIdx]);
      const srcBvIdx = srcAcc.bufferView;
      if (!bvMap.has(srcBvIdx)) {
        const srcBv = srcJson.bufferViews[srcBvIdx];
        const start = srcBv.byteOffset || 0;
        const slice = srcBin.subarray(start, start + srcBv.byteLength);
        const { buffer, byteOffset, byteLength, ...restMeta } = srcBv;
        const newBvIdx = appendBufferChunk(slice, restMeta);
        bvMap.set(srcBvIdx, newBvIdx);
      }
      srcAcc.bufferView = bvMap.get(srcBvIdx);
      const newAccIdx = outJson.accessors.length;
      outJson.accessors.push(srcAcc);
      accMap.set(srcAccIdx, newAccIdx);
      return newAccIdx;
    }

    const newSamplers = srcAnim.samplers.map((s) => ({
      input: cloneAccessor(s.input),
      output: cloneAccessor(s.output),
      interpolation: s.interpolation || 'LINEAR',
    }));

    const newChannels = srcAnim.channels.map((ch) => ({
      sampler: ch.sampler,
      target: {
        node: ch.target.node,
        path: ch.target.path,
      },
    }));

    outJson.animations.push({
      name: targetName,
      samplers: newSamplers,
      channels: newChannels,
    });
  }

  appendAnimationFrom(walkGlb, 'Walk');
  appendAnimationFrom(runGlb, 'Run');

  outJson.bufferViews = newBufferViews;
  const binChunk = pad4(Buffer.concat(chunkParts), 0x00);
  outJson.buffers = [{ byteLength: binChunk.length }];

  const jsonRaw = Buffer.from(JSON.stringify(outJson), 'utf8');
  const jsonChunk = pad4(jsonRaw, 0x20); // pad JSON with spaces

  const totalByteLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalByteLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  const finalGlb = Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);

  const targets = [
    path.join(CHAR_DIR, 'tourist_mpfb.glb'),
    path.join(PUBLIC_MODELS_DIR, 'tourist_meshy.glb'),
    path.join(PUBLIC_MODELS_DIR, 'tourist_mpfb.glb'),
    path.join(PUBLIC_MODELS_DIR, 'tourist_character.glb'),
  ];

  for (const t of targets) {
    fs.writeFileSync(t, finalGlb);
    console.log(`✅ Đã đóng gói GLB (Idle + Walk + Run): ${t} (${(finalGlb.length / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Xóa các file tạm riêng lẻ trong public/models để giữ thư mục web gọn nhẹ
  for (const tempName of ['tourist_meshy_idle.glb', 'tourist_meshy_walk.glb', 'tourist_meshy_run.glb']) {
    const p = path.join(PUBLIC_MODELS_DIR, tempName);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

main();
