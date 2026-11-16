---
name: model-pipeline
description: Đưa một mô hình 3D từ Blender vào web cho EDUVERSE_3D — chạy script Blender không giao diện, xuất GLB vào assets/web-models/, nén bằng models:compress, rồi báo dung lượng và số tam giác trước/sau. Dùng khi thầy thêm hoặc sửa mô hình (trường, đảo, nhân vật, địa danh) và cần cập nhật bản trên web.
argument-hint: "<tên mô hình hoặc script Blender>"
---

# Đưa mô hình 3D lên web

Mô hình cần xử lý: $ARGUMENTS

## 1. Xác định nguồn
- Tìm script sinh hoặc xuất trong `assets/` (`generate_*.py`, `build_*.py`, `export_*_web.py`) hoặc file `.blend` tương ứng.
- Mở `client/scripts/compress-models.mjs` và tìm mục trong `MODELS` khớp với mô hình (`source` → `output`). Nếu là mô hình mới, thêm một mục mới: `texture: 1024` cho mô hình nhiều texture, `merge: true` chỉ khi code không cần tên mesh.
- Nếu file thuộc cảnh hải đăng (`*lighthouse*`, `hai_dang*`), dừng lại và hỏi thầy trước (xem CLAUDE.md).

## 2. Chạy Blender (không giao diện)
```bash
/Applications/Blender.app/Contents/MacOS/Blender -b "<file.blend>" --python "<script.py>"
```
- Không có file `.blend` thì bỏ `<file.blend>`: `Blender -b --python <script.py>`.
- Xuất GLB vào `assets/web-models/<source>.glb`. Không dời gốc tọa độ. Giữ tên vật liệu `MAT_*`, vì code dựa vào đó.
- Ghi lại lỗi hoặc cảnh báo Blender in ra.

## 3. Nén cho web
`client/node_modules` là bản cài trên Windows (Drive), nên chạy ở thư mục tạm:
```bash
SCR="$(mktemp -d)"; git archive HEAD client | tar -x -C "$SCR"
cp client/scripts/compress-models.mjs "$SCR/client/scripts/"
mkdir -p "$SCR/assets/web-models" && cp "assets/web-models/<source>.glb" "$SCR/assets/web-models/"
cd "$SCR/client" && npm run models:compress -- <output-không-đuôi>
```
Sau đó chép `"$SCR/client/src/assets/models/<output>.glb"` về `client/src/assets/models/`.

## 4. Báo cáo
Dùng `npx @gltf-transform/cli@4.1.1 inspect <file>` cho cả bản nguồn và bản nén, rồi báo bảng:

| | Nguồn | Bản web |
|---|---|---|
| Dung lượng | | |
| Số tam giác | | |
| Số lệnh vẽ (mesh × vật liệu) | | |
| Texture lớn nhất | | |

Cảnh báo khi bản web trên 5 MB, trên 300k tam giác, hoặc có texture trên 2048 px. Đề xuất cho subagent `webgl-perf-reviewer` xem lại nếu vượt.

## 5. Kiểm tra trong trình duyệt
Chạy `bash .claude/run-dev.sh` ở chế độ nền (nếu cổng 3000 chưa có server), mở preview `eduverse-client` với `?stats`, rồi chụp màn hình cảnh có mô hình. Không commit, trừ khi thầy yêu cầu. Khi commit, stage từng file theo tên.
