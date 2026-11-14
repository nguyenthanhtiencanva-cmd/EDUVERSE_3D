# EDUVERSE 3D -- Virtual Campus

Dự án tái hiện không gian trường học thực tế trên môi trường 3D tương tác Web (Website + PWA), định hướng phong cách **Stylized Realistic (Style C)**.

## 📌 Tổng Quan Dự Án
- **Mục tiêu:** Tái tạo khuôn viên trường học thực tế (dự kiến: *Trường TH&THCS Vĩnh Thực*).
- **Công nghệ nền tảng:** Blender, Three.js / React Three Fiber, React, Zustand, Tailwind CSS, Vite. Triển khai trên Vercel.
- **Phong cách thị giác:** Stylized Realistic (Style C - hình khối rõ nét, tối ưu hiệu năng WebGL/Mobile, thân thiện như Roblox nhưng bám sát kiến trúc thực).
- **Quy mô mở rộng:** Dự kiến hỗ trợ 10--50 người chơi đồng thời ở giai đoạn sau. Hiện chưa có phần nhiều người chơi.

## 📁 Cấu Trúc Thư Mục
```text
EDUVERSE_3D/
├── assets/          # Mô hình 3D, textures, âm thanh
│   ├── school/      # Công trình, sân bãi, cây xanh, props
│   ├── characters/  # Avatar người chơi
│   └── textures/    # Texture atlas, material maps
├── client/          # Ứng dụng Web / PWA (React + React Three Fiber)
├── server/          # Dành cho backend nhiều người chơi (hiện chỉ có thư mục rỗng)
└── docs/            # Tài liệu kiến trúc, hồ sơ khảo sát, mặt bằng
    └── EDUVERSE_3D_PROJECT_HANDOFF.md
```

## 📋 Tài Liệu & Dữ Liệu Dự Án (Project Documentation & Backups)
Toàn bộ tài liệu kỹ thuật, hồ sơ bàn giao, kế hoạch triển khai và nhật ký phân tích được sao lưu trực tiếp trong thư mục `docs/`:
- **Kiểm duyệt & bản thiết kế nâng cấp (14/11/2026):** [docs/EDUVERSE_3D_UPGRADE_BLUEPRINT.md](docs/EDUVERSE_3D_UPGRADE_BLUEPRINT.md)
- **Hồ sơ bàn giao & bối cảnh dự án:** [docs/EDUVERSE_3D_PROJECT_HANDOFF.md](docs/EDUVERSE_3D_PROJECT_HANDOFF.md)
- **Thiết kế kiến trúc kỹ thuật & Pipeline:** [docs/architecture/EDUVERSE_3D_TECHNICAL_BLUEPRINT.md](docs/architecture/EDUVERSE_3D_TECHNICAL_BLUEPRINT.md)
- **Báo cáo khảo sát mặt bằng & Kiến trúc thực tế:** [docs/school-blueprint/SCHOOL_SITE_PLAN_ANALYSIS.md](docs/school-blueprint/SCHOOL_SITE_PLAN_ANALYSIS.md)
- **Quy chuẩn lưới & Hướng dẫn Blockout 3D:** [docs/architecture/BLOCKOUT_3D_SPECIFICATION.md](docs/architecture/BLOCKOUT_3D_SPECIFICATION.md)
- **Kịch bản tự động sinh Blockout 1:1:** [assets/school/generate_blockout.py](assets/school/generate_blockout.py)
- **File mô hình 3D Blender dự án:** [assets/school/school_campus_blockout.blend](assets/school/school_campus_blockout.blend)
- **File 3D WebGL GLB xuất bản:** [assets/school/school_campus_blockout.glb](assets/school/school_campus_blockout.glb)
- **Kho ảnh tư liệu khảo sát thực tế:** [docs/school-blueprint/reference_photos/](docs/school-blueprint/reference_photos/)
- **Quy tắc sao lưu dữ liệu:** Mọi tài liệu thiết kế, phân tích, đặc tả yêu cầu, nhật ký tiến độ sẽ luôn được ghi và sao lưu trực tiếp vào cây thư mục của dự án (`docs/`).

---

## 🚀 Trải Nghiệm 3D Trực Tiếp Trên Trình Duyệt

- **Bản trực tuyến:** [https://client-gilt-eta-41.vercel.app](https://client-gilt-eta-41.vercel.app)
- **Chạy trên máy:**
  ```bash
  cd client
  npm install
  npm run dev
  ```
  Sau đó mở [http://localhost:3000](http://localhost:3000). Điện thoại cùng Wifi mở theo địa chỉ "Network" mà Vite in ra.
- **Mô hình 3D:** bản nguồn nằm ở `assets/web-models/`. Sau khi sửa hoặc thêm mô hình, chạy `npm run models:compress` trong `client/` để sinh bản nén vào `client/src/assets/models/` (cần mạng ở lần chạy đầu để tải công cụ `gltf-transform`).
- **Lưu ý:** `node_modules` phải được cài trên chính máy đang chạy. Bản cài từ hệ điều hành khác (đồng bộ qua Google Drive) sẽ không build được.

### Ba không gian
- **Sa bàn đảo Vĩnh Thực:** nhìn toàn cảnh từ trên cao, 6 góc nhìn có sẵn (toàn đảo, bến tàu Vạn Gia, phân hiệu Vĩnh Trung, điểm chính Đầu Đông, hải đăng, bến cá Mũi Tây).
- **Phân hiệu Vĩnh Trung:** khuôn viên trường tỷ lệ 1:1, có chế độ tham quan.
- **Trạm hải đăng Vĩnh Thực (1962):** leo cầu thang sườn đồi và cầu thang xoắn trong tháp lên ban công.

### Tính năng
- **Flycam:** xoay, phóng to/thu nhỏ, chuyển nhanh giữa các góc nhìn có sẵn.
- **Đi bộ góc nhìn thứ ba:** phím `W, A, S, D` hoặc mũi tên để đi, `Shift` để chạy, `Space` để nhảy, kéo chuột để xoay, `E` để lên/xuống tháp hải đăng. Điện thoại dùng cần điều khiển ảo.
- **Bản đồ mini:** hiện vị trí và hướng nhìn của nhân vật.
- **Điểm tham quan (POI):** bấm vào huy hiệu để xem thông tin và ảnh thực địa.
- **Ánh sáng:** ban ngày, hoàng hôn, ban đêm.
- **Chất lượng hình ảnh:** ba mức Thấp, Vừa, Cao (nút đồng hồ trên thanh công cụ). Ứng dụng tự hạ mức khi máy chạy chậm, cho đến khi người dùng tự chọn.
- **Đo hiệu năng:** thêm `?stats` vào cuối địa chỉ trang để xem FPS, số lệnh vẽ và số tam giác.
