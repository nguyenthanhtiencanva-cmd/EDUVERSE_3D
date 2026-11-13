#!/usr/bin/env node
/**
 * EDUVERSE 3D — Công cụ kết nối Meshy AI API (Text-to-3D & Image-to-3D)
 * Tài liệu API: https://docs.meshy.ai
 *
 * Cách dùng:
 *   node scripts/meshy-api.mjs balance
 *   node scripts/meshy-api.mjs image-to-3d "<đường_dẫn_ảnh_hoặc_URL>" --out "<tên_file.glb>" [--polycount 5000]
 *   node scripts/meshy-api.mjs text-to-3d "<mô_tả_3D>" --out "<tên_file.glb>" [--style realistic] [--polycount 5000]
 *   node scripts/meshy-api.mjs status <task_id> [--type image|text]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(CLIENT_DIR, '..');
const DEFAULT_OUTPUT_DIR = path.resolve(CLIENT_DIR, 'public', 'models');

const API_BASE = 'https://api.meshy.ai';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.join(ROOT_DIR, '.env'));
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(CLIENT_DIR, '.env'));
loadEnvFile(path.join(CLIENT_DIR, '.env.local'));

function getApiKey() {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey === 'msy_YOUR_API_KEY_HERE') {
    console.error(
      '❌ Chưa tìm thấy MESHY_API_KEY.\n' +
        '👉 Vui lòng tạo file .env ở thư mục gốc EDUVERSE_3D với nội dung:\n' +
        '   MESHY_API_KEY=msy_xxxxxxxxxxxxxxxxxxxx\n' +
        '   (Lấy API key tại: https://www.meshy.ai/settings/api)'
    );
    process.exit(1);
  }
  return apiKey;
}

async function meshyRequest(endpoint, { method = 'GET', body } = {}) {
  const apiKey = getApiKey();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Meshy API lỗi (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function toImageUrlOrDataUri(inputPathOrUrl) {
  if (/^https?:\/\//i.test(inputPathOrUrl) || /^data:image\//i.test(inputPathOrUrl)) {
    return inputPathOrUrl;
  }
  const resolved = path.isAbsolute(inputPathOrUrl)
    ? inputPathOrUrl
    : path.resolve(process.cwd(), inputPathOrUrl);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Không tìm thấy file ảnh: ${resolved}`);
  }
  const ext = path.extname(resolved).toLowerCase();
  const mimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const mime = mimeMap[ext] || 'image/jpeg';
  const base64 = fs.readFileSync(resolved).toString('base64');
  return `data:${mime};base64,${base64}`;
}

async function pollTask(endpoint, taskId, intervalMs = 5000) {
  console.log(`⏳ Đang theo dõi tiến độ task: ${taskId} ...`);
  while (true) {
    const task = await meshyRequest(`${endpoint}/${taskId}`);
    const status = task.status;
    const progress = task.progress ?? 0;
    process.stdout.write(`\r   Trạng thái: ${status} (${progress}%)   `);

    if (status === 'SUCCEEDED') {
      process.stdout.write('\n');
      return task;
    }
    if (status === 'FAILED' || status === 'CANCELED' || status === 'EXPIRED') {
      process.stdout.write('\n');
      throw new Error(`Task kết thúc với trạng thái ${status}: ${JSON.stringify(task.task_error || task)}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function downloadGlb(glbUrl, outFilename) {
  if (!glbUrl) {
    throw new Error('Không tìm thấy đường dẫn model_urls.glb trong kết quả trả về.');
  }
  const outPath = path.isAbsolute(outFilename)
    ? outFilename
    : path.join(DEFAULT_OUTPUT_DIR, outFilename.endsWith('.glb') ? outFilename : `${outFilename}.glb`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  console.log(`⬇️  Đang tải mô hình GLB về: ${outPath} ...`);
  const res = await fetch(glbUrl);
  if (!res.ok) {
    throw new Error(`Tải GLB thất bại (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(2);
  console.log(`✅ Đã lưu thành công: ${outPath} (${sizeMb} MB)`);
  return outPath;
}

function parseFlags(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

async function main() {
  const { positional, flags } = parseFlags(process.argv.slice(2));
  const command = positional[0];

  if (!command || command === 'help' || flags.help) {
    console.log(`
Sử dụng Meshy AI CLI cho EDUVERSE 3D:
  1. Kiểm tra số dư credit:
     npm run meshy -- balance

  2. Tạo mô hình 3D từ ảnh thực địa (Image-to-3D):
     npm run meshy -- image-to-3d "../docs/ref_photo_bld_c2.jpg" --out bld_c2_meshy.glb --polycount 5000

  3. Tạo mô hình 3D từ văn bản (Text-to-3D Preview + Refine):
     npm run meshy -- text-to-3d "Ngọn hải đăng Vĩnh Thực màu trắng ven biển, stylized realistic" --out hai_dang.glb --polycount 5000

  4. Kiểm tra trạng thái 1 task bất kỳ:
     npm run meshy -- status <task_id> --type image
`);
    return;
  }

  if (command === 'balance') {
    const data = await meshyRequest('/openapi/v1/balance');
    console.log('💰 Số dư tài khoản Meshy AI:', data);
    return;
  }

  if (command === 'status') {
    const taskId = positional[1];
    if (!taskId) throw new Error('Vui lòng truyền <task_id>');
    const type = flags.type === 'text' ? '/openapi/v2/text-to-3d' : '/openapi/v1/image-to-3d';
    const task = await meshyRequest(`${type}/${taskId}`);
    console.log(JSON.stringify(task, null, 2));
    if (flags.out && task.model_urls?.glb) {
      await downloadGlb(task.model_urls.glb, flags.out);
    }
    return;
  }

  if (command === 'image-to-3d') {
    const imageInput = positional[1];
    if (!imageInput) throw new Error('Vui lòng truyền đường dẫn ảnh hoặc URL ảnh.');
    const polycount = Number(flags.polycount || 5000);
    const topology = flags.topology || 'triangle';
    const imageUrl = toImageUrlOrDataUri(imageInput);

    console.log(`🚀 Đang gửi yêu cầu Image-to-3D (target_polycount=${polycount}, topology=${topology})...`);
    const created = await meshyRequest('/openapi/v1/image-to-3d', {
      method: 'POST',
      body: {
        image_url: imageUrl,
        enable_pbr: true,
        should_remesh: true,
        should_texture: true,
        topology,
        target_polycount: polycount,
      },
    });

    const taskId = created.result;
    console.log(`📌 Đã tạo Image-to-3D Task ID: ${taskId}`);
    const completed = await pollTask('/openapi/v1/image-to-3d', taskId);
    console.log(`🎉 Hoàn tất! GLB URL: ${completed.model_urls?.glb}`);

    const outName = flags.out || `meshy_img_${taskId}.glb`;
    await downloadGlb(completed.model_urls?.glb, outName);
    return;
  }

  if (command === 'text-to-3d') {
    const prompt = positional[1];
    if (!prompt) throw new Error('Vui lòng nhập câu lệnh mô tả 3D (prompt).');
    const polycount = Number(flags.polycount || 5000);
    const topology = flags.topology || 'triangle';
    const artStyle = flags.style || 'realistic';

    console.log(`🚀 Bước 1/2: Tạo hình khối Preview cho "${prompt}"...`);
    const previewRes = await meshyRequest('/openapi/v2/text-to-3d', {
      method: 'POST',
      body: {
        mode: 'preview',
        prompt,
        art_style: artStyle,
        should_remesh: true,
        topology,
        target_polycount: polycount,
      },
    });

    const previewTaskId = previewRes.result;
    console.log(`📌 Preview Task ID: ${previewTaskId}`);
    const previewDone = await pollTask('/openapi/v2/text-to-3d', previewTaskId);

    if (flags['preview-only']) {
      const outName = flags.out || `meshy_preview_${previewTaskId}.glb`;
      await downloadGlb(previewDone.model_urls?.glb, outName);
      return;
    }

    console.log(`🎨 Bước 2/2: Tạo Texture PBR (Refine) cho task ${previewTaskId}...`);
    const refineRes = await meshyRequest('/openapi/v2/text-to-3d', {
      method: 'POST',
      body: {
        mode: 'refine',
        preview_task_id: previewTaskId,
        enable_pbr: true,
      },
    });

    const refineTaskId = refineRes.result;
    console.log(`📌 Refine Task ID: ${refineTaskId}`);
    const refineDone = await pollTask('/openapi/v2/text-to-3d', refineTaskId);

    const outName = flags.out || `meshy_text_${refineTaskId}.glb`;
    await downloadGlb(refineDone.model_urls?.glb, outName);
    return;
  }

  throw new Error(`Lệnh không hợp lệ: ${command}. Chạy "npm run meshy -- help" để xem hướng dẫn.`);
}

main().catch((err) => {
  console.error(`\n❌ Lỗi: ${err.message}`);
  process.exit(1);
});
