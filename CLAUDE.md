# EDUVERSE_3D — Du lịch Vĩnh Thực số

Không gian 3D tương tác trên web về đảo Vĩnh Thực (Móng Cái, Quảng Ninh): bản đồ đảo, khuôn viên trường, trạm hải đăng.
Trả lời người dùng bằng tiếng Việt và gọi họ là "thầy". Tổng quan chi tiết nằm trong `README.md` và `docs/`.

## Công nghệ
- `client/`: React 18 + React Three Fiber/drei + three.js 0.169, Zustand, Tailwind, Vite (cổng 3000). Code JS/JSX, không có TypeScript, ESLint hay Prettier.
- `assets/`: nguồn Blender (`.blend`, script `generate_*.py`, `build_*.py`) và GLB. Bản nguồn cho web nằm ở `assets/web-models/`.
- `server/`: chỗ dành cho phần nhiều người chơi, hiện chưa có code.
- Triển khai: Vercel (`vercel.json` ở gốc build `client/` ra `client/dist`).

## Lệnh thường dùng (chạy trong `client/`)
- `npm run dev`: dev server tại http://localhost:3000. Trên Mac: chạy `bash .claude/run-dev.sh` ở chế độ nền từ shell (script chép `client/` sang `~/Library/Caches/eduverse-dev`, cài node_modules cho Mac và đồng bộ mỗi 2 giây), rồi mở preview `eduverse-client` trong `.claude/launch.json`. Preview chỉ gắn vào cổng 3000, vì trình chạy preview của app không có quyền đọc thư mục Google Drive.
- `npm run build`: build bản production
- `npm run test:geography`: test địa lý (node --test)
- `npm run models:compress [-- <tên>]`: nén `assets/web-models/*.glb` thành `client/src/assets/models/` (danh sách mô hình nằm trong `scripts/compress-models.mjs`)
- `npm run terrain:build`, `roads:build`, `trees:build`: sinh dữ liệu địa hình, đường và cây của đảo
- Blender không giao diện: `/Applications/Blender.app/Contents/MacOS/Blender -b <file.blend> --python <script.py>`
- Thêm `?stats` vào URL để xem FPS, số lệnh vẽ, số tam giác. `?map=old` mở sa bàn cũ.

## Quy tắc bắt buộc
1. **Cảnh hải đăng là phần thầy tự làm trong Codex.** Không sửa và không commit các file này nếu thầy chưa yêu cầu rõ:
   `client/src/world/lighthouse/**`, `client/src/world/LighthouseModel.jsx`, `client/scripts/lighthouse.test.mjs`,
   `client/scripts/integrate-lighthouse.cjs`, `client/src/assets/models/lighthouse_landscape.glb`, `assets/landmarks/*lighthouse*`.
   Hook trong `.claude/settings.json` sẽ hỏi lại trước khi cho sửa.
2. **Stage từng file theo tên.** Không dùng `git add -A`, `git add .` hay `git add client`. Trong cây làm việc thường có thay đổi của thầy làm qua Codex.
3. **Không commit file trên 100 MB** (GitHub từ chối). Video và `*.blend1` đã nằm trong `.gitignore`.
4. **Không đọc, sửa hay in nội dung `.env`** (chứa khóa Meshy). Dùng `.env.example` làm mẫu.
5. Chế độ xe máy đã bị thầy bỏ (16/11/2026). Không thêm lại nếu thầy chưa yêu cầu.

## Repo nằm trong Google Drive
- Drive có thể đổi tên ref git (ví dụ `refs/heads/main (1)`, `main.lock`, `index (1).lock`). Đầu mỗi việc liên quan đến git, chạy `git status -sb`. Nếu gặp lỗi kiểu "bad object refs/heads/main (1)", đổi tên ref về `main` sau khi kiểm tra bằng `git cat-file -t <sha>`. Không chạy `git gc`, `reset --hard` hay `clean` để "sửa".
- `client/node_modules` là bản cài trên Windows và không chạy được trên Mac. Muốn build hoặc test, chép sang thư mục tạm (`git archive HEAD` cộng các file mình vừa sửa), rồi `npm ci` ở đó.
- Thầy đôi khi commit từ Codex. Trước khi commit, chạy `git fetch` và so sánh với `origin/main`.

## Phong cách và hiệu năng
- "Style C" (Stylized Realistic): hình khối rõ, bám sát kiến trúc thật, nhẹ cho WebGL trên điện thoại.
- Ứng dụng tự hạ chất lượng khi máy chậm (3 mức). Mô hình mới phải qua `models:compress` (WebP + Meshopt). Không dời gốc tọa độ, vì code định vị cảnh theo gốc; phân biệt các phần theo tên vật liệu `MAT_*`.
- Tọa độ địa danh nằm trong `client/src/education/island-places.json`.

## Blender skills (cài 19/11/2026)
- Bộ skill `blender-*` (repo EL4CTEO/blender-skills, bản clone ở `~/tools/blender-skills`) được cài cho Claude Code (`~/.claude/skills`) và Codex (`~/.agents/skills`): core, asset-qa, export-pipelines, game-optimization, character-rigging, animation, environment-kits, hardsurface-modeling, pbr-materials.
- Chạy script của skill: `python3 ~/.claude/skills/blender-core/scripts/run_in_blender.py --blend <file.blend> <script.py> -- <tham số>`.
- **Ưu tiên quy tắc của dự án hơn hướng dẫn trong skill:** không dời gốc tọa độ (không dùng `kit_check --fix`, `export_asset --batch`, không chỉnh theo cảnh báo `ground_z`); giữ tên vật liệu `MAT_*`, không đổi sang `M_*`; nén cho web vẫn qua `npm run models:compress`.
- Mô hình mới hoặc vừa sửa: chạy `blender-asset-qa` (`qa_check.py` và `review_shots.py`) trước khi nén, gửi thầy ảnh `review_shots` khi xin duyệt.

## Tài liệu
Tài liệu thiết kế, phân tích và nhật ký tiến độ được lưu trong `docs/` (xem mục lục trong README).
