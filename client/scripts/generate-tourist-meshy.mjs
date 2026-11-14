#!/usr/bin/env node
/**
 * Tạo nhân vật 3D Du khách bằng Meshy AI (Text-to-3D T-Pose -> Refine PBR -> Auto-Rigging -> Idle/Walk/Run)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(CLIENT_DIR, '..');
const CHAR_DIR = path.resolve(ROOT_DIR, 'assets', 'characters');
const PUBLIC_MODELS_DIR = path.resolve(CLIENT_DIR, '..', 'assets', 'web-models');
const STATE_FILE = path.join(CHAR_DIR, 'meshy_tourist_state.json');

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
  console.log(`⏳ [${label}] Đang xử lý task ${taskId}...`);
  while (true) {
    const task = await meshyFetch(`${endpoint}/${taskId}`);
    const status = task.status;
    const progress = task.progress ?? 0;
    console.log(`   [${label}] ${status} (${progress}%)`);
    if (status === 'SUCCEEDED') return task;
    if (status === 'FAILED' || status === 'CANCELED' || status === 'EXPIRED') {
      throw new Error(`[${label}] Task thất bại (${status}): ${JSON.stringify(task.task_error || task)}`);
    }
    await new Promise((r) => setTimeout(r, 6000));
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

async function main() {
  const state = loadState();

  // 1. Preview (Text-to-3D T-Pose)
  if (!state.previewTaskId) {
    console.log('🚀 Bước 1/4: Tạo hình khối 3D Nam du khách (T-Pose)...');
    const previewCreated = await meshyFetch('/openapi/v2/text-to-3d', {
      method: 'POST',
      body: {
        mode: 'preview',
        prompt:
          'full body young Vietnamese male tourist character, friendly handsome face, neat short black hair, wearing a stylish teal windbreaker jacket over a cream t-shirt, slim dark grey outdoor trousers, white and teal sporty sneakers, wearing a compact yellow travel backpack on his back, stylized realistic 3D game character, clean proportions',
        art_style: 'realistic',
        pose_mode: 't-pose',
        should_remesh: true,
        topology: 'quad',
        target_polycount: 12000,
      },
    });
    state.previewTaskId = previewCreated.result;
    saveState(state);
  }
  const previewTask = await pollTask('/openapi/v2/text-to-3d', state.previewTaskId, '1/4 Preview');
  state.previewThumbnail = previewTask.thumbnail_url;
  saveState(state);

  // 2. Refine (PBR Texturing)
  if (!state.refineTaskId) {
    console.log('🎨 Bước 2/4: Phủ vật liệu PBR chi tiết (Refine)...');
    const refineCreated = await meshyFetch('/openapi/v2/text-to-3d', {
      method: 'POST',
      body: {
        mode: 'refine',
        preview_task_id: state.previewTaskId,
        enable_pbr: true,
        texture_prompt:
          'clean stylized realistic game character textures, natural warm skin tone, clear eyes and eyebrows, matte teal windbreaker jacket with subtle seams, cream shirt, yellow canvas travel backpack, dark grey pants, clean white and teal sneakers',
      },
    });
    state.refineTaskId = refineCreated.result;
    saveState(state);
  }
  const refineTask = await pollTask('/openapi/v2/text-to-3d', state.refineTaskId, '2/4 Refine');
  state.refineGlbUrl = refineTask.model_urls?.glb;
  state.refineThumbnail = refineTask.thumbnail_url;
  saveState(state);

  if (refineTask.thumbnail_url) {
    await downloadFile(refineTask.thumbnail_url, path.join(CHAR_DIR, 'tourist_meshy_preview.png'));
  }

  // 3. Auto-Rigging (tự động tạo khung xương + Walk + Run)
  if (!state.rigTaskId) {
    console.log('🦴 Bước 3/4: Tự động gắn xương (Auto-Rigging) và tạo hoạt ảnh Walk / Run...');
    const rigCreated = await meshyFetch('/openapi/v1/rigging', {
      method: 'POST',
      body: {
        input_task_id: state.refineTaskId,
        height_meters: 1.72,
      },
    });
    state.rigTaskId = rigCreated.result;
    saveState(state);
  }
  const rigTask = await pollTask('/openapi/v1/rigging', state.rigTaskId, '3/4 Rigging');
  state.rigResult = rigTask.result;
  saveState(state);

  // 4. Idle Animation
  if (!state.idleAnimTaskId) {
    console.log('🧍 Bước 4/4: Tạo hoạt ảnh đứng tự nhiên (Idle)...');
    try {
      const animCreated = await meshyFetch('/openapi/v1/animations', {
        method: 'POST',
        body: {
          rig_task_id: state.rigTaskId,
          action_id: 0,
        },
      });
      state.idleAnimTaskId = animCreated.result;
      saveState(state);
    } catch (err) {
      console.warn('⚠️ Không tạo được task Idle riêng qua action_id=0:', err.message);
    }
  }

  if (state.idleAnimTaskId) {
    try {
      const idleTask = await pollTask('/openapi/v1/animations', state.idleAnimTaskId, '4/4 Idle Animation');
      state.idleResult = idleTask.result;
      saveState(state);
    } catch (err) {
      console.warn('⚠️ Bỏ qua Idle task riêng:', err.message);
    }
  }

  // Tải các file GLB về thư mục assets/characters và assets/web-models
  const basic = state.rigResult?.basic_animations || {};
  if (state.rigResult?.rigged_character_glb_url) {
    await downloadFile(
      state.rigResult.rigged_character_glb_url,
      path.join(CHAR_DIR, 'tourist_meshy_rigged.glb')
    );
  }
  if (basic.walking_glb_url) {
    await downloadFile(basic.walking_glb_url, path.join(CHAR_DIR, 'tourist_meshy_walk.glb'));
    await downloadFile(basic.walking_glb_url, path.join(PUBLIC_MODELS_DIR, 'tourist_meshy_walk.glb'));
  }
  if (basic.running_glb_url) {
    await downloadFile(basic.running_glb_url, path.join(CHAR_DIR, 'tourist_meshy_run.glb'));
    await downloadFile(basic.running_glb_url, path.join(PUBLIC_MODELS_DIR, 'tourist_meshy_run.glb'));
  }
  if (state.idleResult?.animation_glb_url) {
    await downloadFile(state.idleResult.animation_glb_url, path.join(CHAR_DIR, 'tourist_meshy_idle.glb'));
    await downloadFile(state.idleResult.animation_glb_url, path.join(PUBLIC_MODELS_DIR, 'tourist_meshy_idle.glb'));
  }

  console.log('\n🎉 Hoàn tất quy trình Meshy AI cho nhân vật Du khách!');
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
