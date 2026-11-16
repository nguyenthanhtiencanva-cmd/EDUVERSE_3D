---
name: deploy
description: Kiểm tra và đưa EDUVERSE_3D lên Vercel — build từ bản sao sạch, chạy test, rồi xin thầy đồng ý trước khi push hoặc deploy.
disable-model-invocation: true
---

# Đưa bản mới lên Vercel

Chỉ chạy khi thầy gọi `/deploy`. Mỗi bước đưa ra ngoài (push, deploy) đều phải được thầy đồng ý ngay trong lượt đó.

## 1. Kiểm tra git (repo nằm trong Google Drive)
- `git status -sb`. Nếu ref bị Drive đổi tên (`main (1)`, `main.lock`), sửa theo hướng dẫn trong CLAUDE.md trước.
- `git fetch` rồi so sánh với `origin/main`, vì thầy có thể đã commit từ Codex.
- Liệt kê các thay đổi chưa commit, tách riêng phần của thầy (hải đăng, Codex). Không tự commit phần đó.

## 2. Build và test trong thư mục tạm
```bash
SCR="$(mktemp -d)"; git archive HEAD | tar -x -C "$SCR"
cd "$SCR/client" && npm ci && npm run test:geography && npm run build
```
- `lighthouse.test.mjs` là test của thầy. Chạy được thì chạy (`node --test scripts/lighthouse.test.mjs`), nhưng không sửa.
- Báo dung lượng `dist/` và 5 file lớn nhất trong `dist/assets/`.
- Có test hỏng hoặc build lỗi thì dừng lại và báo nguyên văn lỗi.

## 3. Xem thử
`npm run preview` trong thư mục tạm, mở bằng trình duyệt tích hợp, chụp bản đồ đảo và khuôn viên trường.

## 4. Đưa lên (hỏi thầy trước)
- Nếu dự án Vercel đã nối với GitHub, bản mới lên khi push `main`: `git push origin main`.
- Nếu không, deploy bằng CLI từ thư mục gốc repo: `npx vercel@latest --prod`. Thầy tự đăng nhập Vercel; Claude không nhập mật khẩu hay token.
- Sau khi lên, mở https://client-gilt-eta-41.vercel.app với `?stats` để xác nhận bản mới chạy.

> Chưa xác nhận Vercel đang deploy theo cách nào. Lần đầu chạy, hỏi thầy rồi cập nhật lại mục này.
