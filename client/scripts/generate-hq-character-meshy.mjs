#!/usr/bin/env node
/**
 * EDUVERSE 3D — Pipeline Phương án 2 (High-Detail 4 góc không kính -> Auto-Rig -> Pack GLB 2K)
 *
 * Đầu vào: 4 ảnh turnaround đồng bộ không đeo kính (Front, Right, Back, Left)
 * Đầu ra : assets/characters/tourist_hq_packed.glb (2K textures, ~45k-60k faces, Idle + Walk + Run)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(CLIENT_DIR, '..');
const CHAR_DIR = path.resolve(ROOT_DIR, 'assets', 'characters');

const PRESETS = {
  hq: {
    prefix: 'tourist_hq',
    stateFile: path.join(CHAR_DIR, 'meshy_hq_tourist_state.json'),
    images: [
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_hq_front_1794804144470.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_hq_right_1794804225847.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_custom_back_1794803524748.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_hq_left_1794804232294.jpg',
    ],
    texturePrompt:
      'ultra crisp realistic 3D game character textures, clear sharp dark brown Asian eyes and neat eyebrows, natural warm skin shading, clean spiky black hair, teal-and-white athletic track jacket with sharp zipper seams, crisp yellow-and-slate sporty backpack straps and zippers, charcoal joggers, clean white-and-teal sneakers',
  },
  tshirt: {
    prefix: 'tourist_tshirt',
    stateFile: path.join(CHAR_DIR, 'meshy_tshirt_tourist_state.json'),
    images: [
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_tshirt_front_1794809705514.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_tshirt_right_1794809792452.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_tshirt_back_1794809784716.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_tshirt_left_1794809792152.jpg',
    ],
    texturePrompt:
      'ultra crisp realistic 3D game character textures, clear sharp dark brown Asian eyes and neat eyebrows, natural warm skin shading on face neck and bare forearms, clean spiky black hair, breathable teal-blue short-sleeve crew-neck sporty t-shirt with crisp white chevron chest stripe and sleeve cuffs, bright yellow-and-slate travel backpack with clean zippers, charcoal joggers, white-and-teal sneakers',
  },
  compact: {
    prefix: 'tourist_compact',
    stateFile: path.join(CHAR_DIR, 'meshy_compact_tourist_state.json'),
    images: [
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_compact_front_1794810969073.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_compact_right_1794810975833.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_compact_back_1794810882771.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_compact_left_1794810976188.jpg',
    ],
    texturePrompt:
      'ultra crisp realistic 3D game character textures, clear sharp dark brown Asian eyes and neat eyebrows, natural warm skin shading on face neck and bare forearms, clean spiky black hair, breathable teal-blue short-sleeve crew-neck sporty t-shirt with crisp white chevron chest stripe and sleeve cuffs, slim compact mustard-yellow and slate-gray mini daypack resting cleanly on upper back, charcoal joggers, white-and-teal sneakers',
  },
  salomon: {
    prefix: 'tourist_salomon',
    stateFile: path.join(CHAR_DIR, 'meshy_salomon_tourist_state.json'),
    images: [
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_salomon_front_1794824374881.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_salomon_right_1794824381982.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_salomon_back_1794824379685.jpg',
      '/Users/macbookpro13/.gemini/antigravity/brain/8ccee418-501b-41e1-9157-c6473ca4a56e/tourist_salomon_left_1794824384691.jpg',
    ],
    texturePrompt:
      'ultra crisp realistic 3D game character textures, clear sharp dark brown Asian eyes and neat eyebrows, natural warm skin shading on face neck and bare forearms, clean spiky black hair, vivid azure sky-blue Salomon breathable micro-mesh athletic short-sleeve crew-neck t-shirt with small dark navy chest logo, bright mustard-yellow and slate-gray compact mini daypack resting on upper back, charcoal joggers, white-and-teal sneakers',
  },
};

const presetIdx = process.argv.indexOf('--preset');
const presetName = presetIdx !== -1 && process.argv[presetIdx + 1] ? process.argv[presetIdx + 1] : 'hq';
const ACTIVE_PRESET = PRESETS[presetName] || PRESETS.hq;
const STATE_FILE = ACTIVE_PRESET.stateFile;
const IMG_PATHS = ACTIVE_PRESET.images;

const API_BASE = 'https://api.meshy.ai';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT_DIR, '.env'));

const API_KEY = process.env.MESHY_API_KEY;
if (!API_KEY) {
  console.error('❌ Thiếu MESHY_API_KEY trong .env');
  process.exit(1);
}

function toDataUri(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Không tìm thấy ảnh: ${filePath}`);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function meshyFetch(endpoint, { method = 'GET', body } = {}) {
  const headers = { Authorization: `Bearer ${API_KEY}` };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function pollTask(endpoint, taskId, label) {
  console.log(`⏳ [${label}] Theo dõi task ${taskId}...`);
  while (true) {
    const task = await meshyFetch(`${endpoint}/${taskId}`);
    const status = task.status;
    const progress = task.progress ?? 0;
    console.log(`   [${label}] ${status} (${progress}%)`);
    if (status === 'SUCCEEDED') return task;
    if (status === 'FAILED' || status === 'CANCELED' || status === 'EXPIRED') {
      throw new Error(`[${label}] Task thất bại (${status}): ${JSON.stringify(task.task_error || task)}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function downloadFile(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không thể tải ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  console.log(`✅ Đã lưu: ${destPath} (${(buf.byteLength / 1024 / 1024).toFixed(2)} MB)`);
}

function parseGlb(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`Invalid GLB: ${filePath}`);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binLen = buf.readUInt32LE(20 + jsonLen);
  const binStart = 20 + jsonLen + 8;
  const bin = buf.subarray(binStart, binStart + binLen);
  return { json, bin };
}

function pad4(buf, padByte = 0x00) {
  const rem = buf.length % 4;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem, padByte)]);
}

function packAnimationsFullRes(idlePath, walkPath, runPath, outPath) {
  const idleGlb = parseGlb(idlePath);
  const walkGlb = parseGlb(walkPath);
  const runGlb = parseGlb(runPath);

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

  const idleAnim = outJson.animations[0];
  const hipsNodeIdx = outJson.nodes.findIndex((n) => n.name === 'Hips');
  const hipsRotChannel = idleAnim.channels.find(
    (ch) => ch.target.node === hipsNodeIdx && ch.target.path === 'rotation'
  );
  const hipsRotAccIdx = hipsRotChannel ? idleAnim.samplers[hipsRotChannel.sampler].output : -1;
  const hipsRotBvIdx = hipsRotAccIdx >= 0 ? outJson.accessors[hipsRotAccIdx].bufferView : -1;

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
    const { buffer, byteOffset, byteLength, ...restMeta } = bv;
    appendBufferChunk(rawSlice, restMeta);
  }

  outJson.animations[0].name = 'Idle';

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
        bvMap.set(srcBvIdx, appendBufferChunk(slice, restMeta));
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
      target: { node: ch.target.node, path: ch.target.path },
    }));

    outJson.animations.push({ name: targetName, samplers: newSamplers, channels: newChannels });
  }

  appendAnimationFrom(walkGlb, 'Walk');
  appendAnimationFrom(runGlb, 'Run');

  outJson.bufferViews = newBufferViews;
  const binChunk = pad4(Buffer.concat(chunkParts), 0x00);
  outJson.buffers = [{ byteLength: binChunk.length }];

  const jsonChunk = pad4(Buffer.from(JSON.stringify(outJson), 'utf8'), 0x20);
  const totalByteLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalByteLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  const finalGlb = Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalGlb);
  console.log(`✅ Đã đóng gói GLB giữ nguyên Texture gốc 2K: ${outPath} (${(finalGlb.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function createMultiImageTask(imageUrls) {
  // Try high-detail options first; fall back cleanly if API validates stricter schema
  const attempts = [
    {
      image_urls: imageUrls,
      ai_model: 'latest',
      pose_mode: 'a-pose',
      geometry_resolution: '2k',
      topology: 'triangle',
      target_polycount: 60000,
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
      texture_prompt: ACTIVE_PRESET.texturePrompt,
    },
    {
      image_urls: imageUrls,
      ai_model: 'latest',
      pose_mode: 'a-pose',
      topology: 'triangle',
      target_polycount: 60000,
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
    },
    {
      image_urls: imageUrls,
      ai_model: 'latest',
      pose_mode: 'a-pose',
      topology: 'quad',
      target_polycount: 45000,
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
    },
  ];

  let lastErr;
  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`📡 Gửi yêu cầu Multi-Image-to-3D HQ (cấu hình #${i + 1})...`);
      return await meshyFetch('/openapi/v1/multi-image-to-3d', {
        method: 'POST',
        body: attempts[i],
      });
    } catch (err) {
      console.warn(`⚠️ Cấu hình #${i + 1} bị từ chối: ${err.message}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

async function main() {
  const state = loadState();

  if (!state.modelTaskId) {
    console.log('🚀 Bước 1/4: Nạp 4 ảnh (Front, Right, Back, Left) lên Meshy Multi-Image-to-3D...');
    const imageUrls = IMG_PATHS.map(toDataUri);
    const created = await createMultiImageTask(imageUrls);
    state.modelTaskId = created.result;
    saveState(state);
  }

  const modelTask = await pollTask('/openapi/v1/multi-image-to-3d', state.modelTaskId, '1/4 Multi-Image HQ');
  state.modelGlbUrl = modelTask.model_urls?.glb;
  state.modelThumbnail = modelTask.thumbnail_url;
  saveState(state);

  const prefix = ACTIVE_PRESET.prefix;
  if (modelTask.model_urls?.glb) {
    await downloadFile(modelTask.model_urls.glb, path.join(CHAR_DIR, `${prefix}_raw.glb`));
  }
  if (modelTask.thumbnail_url) {
    await downloadFile(modelTask.thumbnail_url, path.join(CHAR_DIR, `${prefix}_meshy_preview.png`));
  }

  if (!state.rigTaskId) {
    console.log('🦴 Bước 2/4: Tự động gắn xương (Auto-Rigging 1.72m)...');
    const rigCreated = await meshyFetch('/openapi/v1/rigging', {
      method: 'POST',
      body: {
        input_task_id: state.modelTaskId,
        height_meters: 1.72,
      },
    });
    state.rigTaskId = rigCreated.result;
    saveState(state);
  }
  const rigTask = await pollTask('/openapi/v1/rigging', state.rigTaskId, '2/4 Auto-Rigging');
  state.rigResult = rigTask.result;
  saveState(state);

  if (!state.idleTaskId) {
    console.log('🧍 Bước 3/4: Tạo hoạt ảnh Idle...');
    const idleCreated = await meshyFetch('/openapi/v1/animations', {
      method: 'POST',
      body: {
        rig_task_id: state.rigTaskId,
        action_id: 0,
      },
    });
    state.idleTaskId = idleCreated.result;
    saveState(state);
  }
  const idleTask = await pollTask('/openapi/v1/animations', state.idleTaskId, '3/4 Idle Animation');
  state.idleResult = idleTask.result;
  saveState(state);

  const basic = state.rigResult?.basic_animations || {};
  const riggedPath = path.join(CHAR_DIR, `${prefix}_rigged.glb`);
  const walkPath = path.join(CHAR_DIR, `${prefix}_walk.glb`);
  const runPath = path.join(CHAR_DIR, `${prefix}_run.glb`);
  const idlePath = path.join(CHAR_DIR, `${prefix}_idle.glb`);

  if (state.rigResult?.rigged_character_glb_url) {
    await downloadFile(state.rigResult.rigged_character_glb_url, riggedPath);
  }
  if (basic.walking_glb_url) await downloadFile(basic.walking_glb_url, walkPath);
  if (basic.running_glb_url) await downloadFile(basic.running_glb_url, runPath);
  if (state.idleResult?.animation_glb_url) await downloadFile(state.idleResult.animation_glb_url, idlePath);

  if (fs.existsSync(idlePath) && fs.existsSync(walkPath) && fs.existsSync(runPath)) {
    console.log('📦 Bước 4/4: Gộp Idle + Walk + Run giữ nguyên Texture 2K...');
    packAnimationsFullRes(idlePath, walkPath, runPath, path.join(CHAR_DIR, `${prefix}_packed.glb`));
  }

  console.log('🎉 Hoàn tất phần Meshy HQ! Sẵn sàng cho bước gắn kính 3D rời bằng Blender.');
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
