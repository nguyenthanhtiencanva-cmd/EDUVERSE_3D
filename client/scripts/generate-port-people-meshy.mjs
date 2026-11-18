#!/usr/bin/env node
/**
 * Dựng người dân Cảng Vạn Gia bằng Meshy AI (phong cách bán chân thật, hợp với cảnh dựng khối Style C).
 *
 *   node scripts/generate-port-people-meshy.mjs concepts [id...]  # Bước 1: ảnh mẫu tư thế chữ A (~6 credit/người)
 *   node scripts/generate-port-people-meshy.mjs build [id...]     # Bước 2: 3D + gắn xương + Idle (~38 credit/người)
 *   node scripts/generate-port-people-meshy.mjs status            # Xem trạng thái từng người
 *
 * Duyệt ảnh mẫu (assets/characters/port_people/<id>_concept.png) trước khi chạy bước 2.
 * Muốn làm lại ảnh mẫu của một người: xóa khóa của người đó trong state.json rồi chạy lại `concepts <id>`.
 * Trạng thái lưu trong assets/characters/port_people/state.json, nên chạy lại không tốn credit cho bước đã xong.
 * Kết quả: assets/web-models/port_<id>.glb (Idle + Walk + Run), nén cho web bằng `npm run models:compress -- port_`.
 * Hàm gộp hoạt ảnh dựa theo scripts/generate-custom-character-meshy.mjs.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT_DIR, 'assets', 'characters', 'port_people');
const WEB_MODELS_DIR = path.join(ROOT_DIR, 'assets', 'web-models');
const STATE_FILE = path.join(OUT_DIR, 'state.json');
const API_BASE = 'https://api.meshy.ai';

const STYLE =
  'Semi-realistic stylized 3D game character, full body, front view, standing in A-pose, single person, ' +
  'realistic human proportions, clean readable shapes, soft natural colors, plain light grey background, ' +
  'soft even lighting, no props in hands, no text, no logo.';

// Người dân ở Cảng Vạn Gia. Mô tả chung chung, không dựa theo người thật nào.
export const PEOPLE = [
  {
    id: 'ngu_dan',
    height: 1.65,
    prompt:
      'A Vietnamese fisherman in his fifties with sun-tanned skin and a calm friendly face, wearing a traditional ' +
      'conical palm-leaf hat (non la), a faded blue long-sleeve work shirt, dark brown trousers rolled up to mid-calf ' +
      'and simple rubber sandals.',
  },
  {
    id: 'ban_hang',
    height: 1.56,
    prompt:
      'A Vietnamese woman in her thirties who runs a small seaside drinks stall, hair tied back, wearing a cloth ' +
      'bucket hat, a light floral short-sleeve blouse, a plain cotton apron, loose dark trousers and plastic sandals.',
  },
  {
    id: 'nhan_vien_ben',
    height: 1.7,
    prompt:
      'A young Vietnamese ferry pier worker, short black hair, wearing a navy blue cap, a navy short-sleeve polo ' +
      'shirt under a bright orange life vest, dark work trousers and black sneakers.',
  },
  {
    id: 'khach_du_lich',
    height: 1.6,
    prompt:
      'A young Vietnamese woman tourist with long dark hair, wearing a wide-brim straw sun hat, a white short-sleeve ' +
      'T-shirt, light blue knee-length shorts, white sneakers and a small light backpack.',
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}
loadEnvFile(path.join(ROOT_DIR, '.env'));

function apiKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key || key === 'msy_YOUR_API_KEY_HERE') {
    console.error('Thiếu MESHY_API_KEY trong .env (xem .env.example).');
    process.exit(1);
  }
  return key;
}

async function meshy(endpoint, { method = 'GET', body } = {}) {
  const headers = { Authorization: `Bearer ${apiKey()}` };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${endpoint}: ${JSON.stringify(data)}`);
  return data;
}

async function poll(endpoint, id, label) {
  for (;;) {
    const task = await meshy(`${endpoint}/${id}`);
    process.stdout.write(`\r   ${label}: ${task.status} ${task.progress ?? 0}%   `);
    if (task.status === 'SUCCEEDED') {
      process.stdout.write('\n');
      return task;
    }
    if (['FAILED', 'CANCELED', 'EXPIRED'].includes(task.status)) {
      throw new Error(`${label} thất bại (${task.status}): ${JSON.stringify(task.task_error || {})}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  console.log(`   Đã lưu ${path.relative(ROOT_DIR, dest)} (${(buffer.length / 1048576).toFixed(2)} MB)`);
}

const readState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : {});
function writeState(state) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ---------- Gộp Idle + Walk + Run vào một GLB (theo generate-custom-character-meshy.mjs) ----------
function parseGlb(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`Không phải GLB: ${file}`);
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8'));
  const binLength = buf.readUInt32LE(20 + jsonLength);
  const binStart = 20 + jsonLength + 8;
  return { json, bin: buf.subarray(binStart, binStart + binLength) };
}

const pad4 = (buf, byte = 0) => (buf.length % 4 ? Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4), byte)]) : buf);

function shrinkImage(buf, maxDim = 1024) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'port-people-tex-'));
  try {
    fs.writeFileSync(path.join(dir, 'in'), buf);
    execFileSync('sips', ['-Z', String(maxDim), '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', path.join(dir, 'in'), '--out', path.join(dir, 'out.jpg')], { stdio: 'ignore' });
    return fs.readFileSync(path.join(dir, 'out.jpg'));
  } catch {
    return buf;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function packAnimations(idlePath, walkPath, runPath, outPath) {
  const idle = parseGlb(idlePath);
  const out = structuredClone(idle.json);
  const views = [];
  const chunks = [];
  let offset = 0;
  const append = (slice, meta = {}) => {
    const padded = pad4(slice);
    views.push({ ...meta, buffer: 0, byteOffset: offset, byteLength: slice.length });
    chunks.push(padded);
    offset += padded.length;
    return views.length - 1;
  };

  const imageViews = new Set((out.images || []).map((image) => image.bufferView));
  out.bufferViews.forEach((view, i) => {
    const start = view.byteOffset || 0;
    const raw = Buffer.from(idle.bin.subarray(start, start + view.byteLength));
    const { buffer, byteOffset, byteLength, ...meta } = view;
    if (imageViews.has(i)) {
      const shrunk = shrinkImage(raw);
      append(shrunk, meta);
      // Ảnh đã đổi sang JPEG khi thu nhỏ
      (out.images || []).filter((image) => image.bufferView === i).forEach((image) => (image.mimeType = 'image/jpeg'));
    } else {
      append(raw, meta);
    }
  });
  out.animations[0].name = 'Idle';

  for (const [file, name] of [[walkPath, 'Walk'], [runPath, 'Run']]) {
    const source = parseGlb(file);
    const animation = source.json.animations[0];
    const viewMap = new Map();
    const accessorMap = new Map();
    const cloneAccessor = (index) => {
      if (accessorMap.has(index)) return accessorMap.get(index);
      const accessor = structuredClone(source.json.accessors[index]);
      if (!viewMap.has(accessor.bufferView)) {
        const view = source.json.bufferViews[accessor.bufferView];
        const start = view.byteOffset || 0;
        const { buffer, byteOffset, byteLength, ...meta } = view;
        viewMap.set(accessor.bufferView, append(source.bin.subarray(start, start + view.byteLength), meta));
      }
      accessor.bufferView = viewMap.get(accessor.bufferView);
      out.accessors.push(accessor);
      accessorMap.set(index, out.accessors.length - 1);
      return out.accessors.length - 1;
    };
    out.animations.push({
      name,
      samplers: animation.samplers.map((s) => ({ input: cloneAccessor(s.input), output: cloneAccessor(s.output), interpolation: s.interpolation || 'LINEAR' })),
      channels: animation.channels.map((c) => ({ sampler: c.sampler, target: { node: c.target.node, path: c.target.path } })),
    });
  }

  out.bufferViews = views;
  const bin = pad4(Buffer.concat(chunks));
  out.buffers = [{ byteLength: bin.length }];
  const json = pad4(Buffer.from(JSON.stringify(out), 'utf8'), 0x20);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, jsonHeader, json, binHeader, bin]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, glb);
  console.log(`   Đã gộp Idle + Walk + Run: ${path.relative(ROOT_DIR, outPath)} (${(glb.length / 1048576).toFixed(2)} MB)`);
}

// ---------- Các bước ----------
async function concept(person, state) {
  const s = (state[person.id] ||= {});
  if (!s.conceptTaskId) {
    const created = await meshy('/openapi/v1/text-to-image', {
      method: 'POST',
      body: { ai_model: 'nano-banana-2', prompt: `${person.prompt} ${STYLE}`, pose_mode: 'a-pose' },
    });
    s.conceptTaskId = created.result;
    writeState(state);
  }
  const task = await poll('/openapi/v1/text-to-image', s.conceptTaskId, `${person.id} ảnh mẫu`);
  await download(task.image_urls[0], path.join(OUT_DIR, `${person.id}_concept.png`));
}

async function build(person, state) {
  const s = state[person.id];
  if (!s?.conceptTaskId) throw new Error(`${person.id}: chưa có ảnh mẫu, chạy "concepts" trước.`);
  if (!s.modelTaskId) {
    const created = await meshy('/openapi/v1/image-to-3d', {
      method: 'POST',
      body: {
        input_task_id: s.conceptTaskId,
        ai_model: 'latest',
        pose_mode: 'a-pose',
        should_remesh: true,
        topology: 'triangle',
        target_polycount: 10000, // Nhẹ cho web: vài người cùng lúc trên bến
        should_texture: true,
        texture_resolution: '2k',
        target_formats: ['glb'],
      },
    });
    s.modelTaskId = created.result;
    writeState(state);
  }
  const model = await poll('/openapi/v1/image-to-3d', s.modelTaskId, `${person.id} 3D`);
  if (model.thumbnail_url) await download(model.thumbnail_url, path.join(OUT_DIR, `${person.id}_preview.png`));

  if (!s.rigTaskId) {
    const created = await meshy('/openapi/v1/rigging', { method: 'POST', body: { input_task_id: s.modelTaskId, height_meters: person.height } });
    s.rigTaskId = created.result;
    writeState(state);
  }
  const rig = await poll('/openapi/v1/rigging', s.rigTaskId, `${person.id} gắn xương`);

  if (!s.idleTaskId) {
    const created = await meshy('/openapi/v1/animations', { method: 'POST', body: { rig_task_id: s.rigTaskId, action_id: 0 } });
    s.idleTaskId = created.result;
    writeState(state);
  }
  const idle = await poll('/openapi/v1/animations', s.idleTaskId, `${person.id} Idle`);

  const files = {
    idle: path.join(OUT_DIR, `${person.id}_idle.glb`),
    walk: path.join(OUT_DIR, `${person.id}_walk.glb`),
    run: path.join(OUT_DIR, `${person.id}_run.glb`),
  };
  await download(idle.result.animation_glb_url, files.idle);
  await download(rig.result.basic_animations.walking_glb_url, files.walk);
  await download(rig.result.basic_animations.running_glb_url, files.run);
  packAnimations(files.idle, files.walk, files.run, path.join(WEB_MODELS_DIR, `port_${person.id}.glb`));
  s.done = true;
  writeState(state);
}

async function main() {
  const [command, ...ids] = process.argv.slice(2);
  const chosen = ids.length ? PEOPLE.filter((person) => ids.includes(person.id)) : PEOPLE;
  const state = readState();
  if (command === 'status') {
    for (const person of PEOPLE) console.log(person.id, JSON.stringify(state[person.id] || {}));
    return;
  }
  if (!['concepts', 'build'].includes(command)) {
    console.log('Dùng: concepts [id...] | build [id...] | status');
    process.exit(1);
  }
  for (const person of chosen) {
    console.log(`\n== ${person.id} ==`);
    if (command === 'concepts') await concept(person, state);
    else await build(person, state);
  }
}

main().catch((error) => {
  console.error('\nLỗi:', error.message);
  process.exit(1);
});
