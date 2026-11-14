#!/usr/bin/env node
/**
 * Nén các mô hình nguồn trong assets/web-models/ thành bản phục vụ web trong client/src/assets/models/.
 *   npm run models:compress            # nén tất cả
 *   npm run models:compress -- hai_dang  # chỉ nén các file có tên chứa "hai_dang"
 *
 * Mỗi mô hình: gộp dữ liệu trùng -> (gộp mesh cùng vật liệu nếu có `merge`) -> thu texture -> WebP -> Meshopt.
 * Không dời gốc tọa độ của mô hình, vì code định vị cảnh theo tọa độ gốc.
 * Sau khi gộp, tên mesh không còn; code phân biệt các phần theo tên vật liệu (MAT_*).
 * Vite gắn mã băm nội dung vào tên file khi build, nên trình duyệt cache vĩnh viễn được.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = '@gltf-transform/cli@4.1.1';
const SOURCE = fileURLToPath(new URL('../../assets/web-models/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../src/assets/models/', import.meta.url));

const MODELS = [
  { source: 'school_campus.glb', output: 'school_campus.glb', texture: 1024, merge: true },
  { source: 'vinh_thuc_island_v3.glb', output: 'vinh_thuc_island.glb' },
  { source: 'hai_dang_vinh_thuc_v2.glb', output: 'hai_dang.glb', texture: 1024 },
  { source: 'tourist_meshy.glb', output: 'tourist.glb', texture: 1024 },
  { source: 'student_character.glb', output: 'student.glb' },
];

const megabytes = (file) => `${(fs.statSync(file).size / 1048576).toFixed(2)} MB`;
const filter = process.argv[2];
fs.mkdirSync(OUTPUT, { recursive: true });

for (const model of MODELS) {
  if (filter && !model.output.includes(filter)) continue;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'eduverse-glb-'));
  let current = path.join(SOURCE, model.source);
  let step = 0;
  const run = (command, ...options) => {
    const next = path.join(temp, `${++step}.glb`);
    execFileSync('npx', ['--yes', CLI, command, current, next, ...options], { stdio: ['ignore', 'ignore', 'inherit'] });
    current = next;
  };
  try {
    run('dedup');
    // Gộp các mesh tĩnh cùng vật liệu để giảm số lệnh vẽ. Tọa độ thế giới được giữ nguyên.
    if (model.merge) {
      run('flatten');
      run('join');
      run('prune');
    }
    if (model.texture) {
      run('resize', '--width', String(model.texture), '--height', String(model.texture));
      run('webp', '--quality', '82');
    }
    run('meshopt', '--level', 'medium');
    const target = path.join(OUTPUT, model.output);
    fs.copyFileSync(current, target);
    console.log(`${model.source} (${megabytes(path.join(SOURCE, model.source))}) -> ${model.output} (${megabytes(target)})`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
