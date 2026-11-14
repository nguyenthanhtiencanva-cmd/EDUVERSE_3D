#!/usr/bin/env node
/**
 * EDUVERSE 3D — Local 2D-to-3D Converter (Stable Fast 3D on Apple Silicon M1 MPS)
 *
 * Chuyển đổi ảnh 2D (.png / .jpg / .webp) thành mô hình 3D (.glb) có sẵn PBR Texture
 * trực tiếp trên MacBook Pro M1 (Metal MPS GPU) thông qua Stability-AI/stable-fast-3d.
 *
 * Cách sử dụng:
 *   npm run sf3d -- <đường-dẫn-ảnh> [tên-file-glb-đầu-ra] [tùy-chọn]
 *
 * Ví dụ:
 *   npm run sf3d -- ./anh-mau.jpg hai_dang_test.glb
 *   npm run sf3d -- ./anh-mau.png thuyen_danh_ca.glb --resolution 1024 --remesh triangle --vertices 8000
 *   npm run sf3d -- --status
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(CLIENT_DIR, 'public', 'models');

const SF3D_HOME = process.env.SF3D_HOME || path.join(os.homedir(), '.eduverse-sf3d');
const SF3D_REPO = path.join(SF3D_HOME, 'sf3d-repo');
const SF3D_WEIGHTS = path.join(SF3D_HOME, 'weights');
const SF3D_PYTHON = path.join(SF3D_HOME, 'venv', 'bin', 'python');
const SF3D_RUN_SCRIPT = path.join(SF3D_REPO, 'run.py');

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║   EDUVERSE 3D — Stable Fast 3D Local CLI (Apple Silicon M1 Metal MPS)       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Cách dùng:
  npm run sf3d -- <đường_dẫn_ảnh> [tên_file_glb] [tùy_chọn]
  npm run sf3d -- --status

Tham số:
  <đường_dẫn_ảnh>        Đường dẫn ảnh 2D đầu vào (.png, .jpg, .jpeg, .webp)
  [tên_file_glb]         Tên file .glb lưu vào client/public/assets/models/
                         (hoặc đường dẫn tuyệt đối/tương đối bất kỳ)

Tùy chọn:
  --resolution <int>     Độ phân giải PBR Texture Atlas (mặc định: 1024)
  --remesh <mode>        Chế độ tối ưu lưới: none | triangle | quad (mặc định: none)
  --vertices <int>       Giới hạn số đỉnh (vertex count), ví dụ 6000 (mặc định: -1)
  --device <dev>         Thiết bị chạy: mps | cpu (mặc định: mps trên Apple Silicon)
  --model <repo_id>      HuggingFace repo ID (mặc định: patrickbdevaney/stable-fast-3d)
  --status               Kiểm tra trạng thái cài đặt Stable Fast 3D & GPU Metal MPS
`);
}

function checkStatus() {
  console.log('🔍 Kiểm tra môi trường Stable Fast 3D trên MacBook...');
  console.log(`  • Thư mục cài đặt : ${SF3D_HOME}`);
  console.log(`  • Mã nguồn SF3D   : ${fs.existsSync(SF3D_RUN_SCRIPT) ? '✅ Đã cài đặt' : '❌ Chưa tìm thấy'}`);
  console.log(`  • Python 3.11 Venv: ${fs.existsSync(SF3D_PYTHON) ? '✅ Đã cài đặt' : '❌ Chưa tìm thấy'}`);

  if (!fs.existsSync(SF3D_PYTHON)) {
    process.exit(1);
  }

  const checkCode = [
    'import torch, texture_baker, uv_unwrapper',
    'print(f"  • PyTorch Version : {torch.__version__}")',
    'print(f"  • Apple Metal MPS : {\'✅ Khả dụng (Apple M1 GPU)\' if torch.backends.mps.is_available() else \'⚠️ Không khả dụng\'}")',
    'print("  • C++/Metal Ext   : ✅ texture_baker & uv_unwrapper đã biên dịch thành công")',
  ].join('; ');

  const res = spawnSync(SF3D_PYTHON, ['-c', checkCode], { stdio: 'inherit' });
  process.exit(res.status ?? 0);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--status')) {
  checkStatus();
}

const positional = [];
let textureResolution = '1024';
let remeshOption = 'none';
let targetVertexCount = '-1';
let device = 'mps';
const hasLocalWeights = fs.existsSync(path.join(SF3D_WEIGHTS, 'model.safetensors'));
let pretrainedModel = process.env.SF3D_MODEL || (hasLocalWeights ? SF3D_WEIGHTS : 'cocktailpeanut/sf3d');

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--resolution' && args[i + 1]) {
    textureResolution = args[++i];
  } else if (arg === '--remesh' && args[i + 1]) {
    remeshOption = args[++i];
  } else if (arg === '--vertices' && args[i + 1]) {
    targetVertexCount = args[++i];
  } else if (arg === '--device' && args[i + 1]) {
    device = args[++i];
  } else if (arg === '--model' && args[i + 1]) {
    pretrainedModel = args[++i];
  } else if (!arg.startsWith('--')) {
    positional.push(arg);
  }
}

const inputImageArg = positional[0];
if (!inputImageArg) {
  console.error('❌ Lỗi: Vui lòng cung cấp đường dẫn ảnh 2D đầu vào.');
  printHelp();
  process.exit(1);
}

const inputImagePath = path.resolve(process.cwd(), inputImageArg);
if (!fs.existsSync(inputImagePath)) {
  console.error(`❌ Không tìm thấy file ảnh: ${inputImagePath}`);
  process.exit(1);
}

const defaultBaseName = path.basename(inputImagePath, path.extname(inputImagePath))
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '_');

let outputGlbPath;
if (positional[1]) {
  const outArg = positional[1].endsWith('.glb') ? positional[1] : `${positional[1]}.glb`;
  outputGlbPath = outArg.includes(path.sep)
    ? path.resolve(process.cwd(), outArg)
    : path.join(MODELS_DIR, outArg);
} else {
  outputGlbPath = path.join(MODELS_DIR, `${defaultBaseName}_sf3d.glb`);
}

const tempOutputDir = path.join(SF3D_HOME, 'outputs', `${Date.now()}`);
fs.mkdirSync(tempOutputDir, { recursive: true });
fs.mkdirSync(path.dirname(outputGlbPath), { recursive: true });

console.log('🚀 Đang chạy Stable Fast 3D (Apple M1 Metal MPS)...');
console.log(`  • Ảnh 2D đầu vào  : ${inputImagePath}`);
console.log(`  • Mô hình 3D đích : ${outputGlbPath}`);
console.log(`  • Độ phân giải UV : ${textureResolution}px | Remesh: ${remeshOption}`);

const sf3dArgs = [
  SF3D_RUN_SCRIPT,
  inputImagePath,
  '--output-dir',
  tempOutputDir,
  '--pretrained-model',
  pretrainedModel,
  '--device',
  device,
  '--texture-resolution',
  String(textureResolution),
  '--remesh_option',
  remeshOption,
  '--target_vertex_count',
  String(targetVertexCount),
];

const result = spawnSync(SF3D_PYTHON, sf3dArgs, {
  cwd: SF3D_REPO,
  stdio: 'inherit',
  env: {
    ...process.env,
    PYTORCH_ENABLE_MPS_FALLBACK: '1',
    HF_HUB_DISABLE_XET: '1',
  },
});

if (result.status !== 0) {
  console.error(`❌ Quá trình tạo 3D thất bại (mã thoát: ${result.status}).`);
  process.exit(result.status ?? 1);
}

const generatedGlb = path.join(tempOutputDir, '0', 'mesh.glb');
if (!fs.existsSync(generatedGlb)) {
  console.error(`❌ Không tìm thấy file mesh.glb đầu ra tại: ${generatedGlb}`);
  process.exit(1);
}

fs.copyFileSync(generatedGlb, outputGlbPath);
const sizeKb = (fs.statSync(outputGlbPath).size / 1024).toFixed(1);
console.log(`\n✅ Hoàn tất! Đã lưu mô hình 3D (.glb) tại:`);
console.log(`   ${outputGlbPath} (${sizeKb} KB)`);
