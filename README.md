# EDUVERSE 3D -- Virtual Campus

Dự án tái hiện không gian trường học thực tế trên môi trường 3D tương tác Web (Website + PWA), định hướng phong cách **Stylized Realistic (Style C)**.

## 📌 Tổng Quan Dự Án
- **Mục tiêu:** Tái tạo khuôn viên trường học thực tế (dự kiến: *Trường TH&THCS Vĩnh Thực*).
- **Công nghệ nền tảng:** Blender, Three.js / React Three Fiber, React, PWA, Zustand, Socket.IO.
- **Phong cách thị giác:** Stylized Realistic (Style C - hình khối rõ nét, tối ưu hiệu năng WebGL/Mobile, thân thiện như Roblox nhưng bám sát kiến trúc thực).
- **Quy mô mở rộng:** Hỗ trợ 10--50 người chơi đồng thời ở các giai đoạn sau.

## 📁 Cấu Trúc Thư Mục
```text
EDUVERSE_3D/
├── assets/          # Mô hình 3D, textures, âm thanh
│   ├── school/      # Công trình, sân bãi, cây xanh, props
│   ├── characters/  # Avatar người chơi
│   └── textures/    # Texture atlas, material maps
├── client/          # Ứng dụng Web / PWA (React + React Three Fiber)
├── server/          # Backend đồng bộ & multiplayer (Node.js / Socket.IO)
└── docs/            # Tài liệu kiến trúc, hồ sơ khảo sát, mặt bằng
    └── EDUVERSE_3D_PROJECT_HANDOFF.md
```

## 📋 Tài Liệu & Dữ Liệu Dự Án (Project Documentation & Backups)
Toàn bộ tài liệu kỹ thuật, hồ sơ bàn giao, kế hoạch triển khai và nhật ký phân tích được sao lưu trực tiếp trong thư mục `docs/`:
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

## 🚀 Trải Nghiệm 3D Trực Tiếp Trên Trình Duyệt (Web & PWA)

Ứng dụng web 3D tương tác đã được triển khai hoàn tất tại thư mục `client/`:
- **Địa chỉ máy chủ cục bộ:** [http://localhost:3000](http://localhost:3000)
- **Truy cập mạng nội bộ / Điện thoại (cùng Wifi):** `http://192.168.1.28:3000`
- **Các tính năng nổi bật:**
  - **Chế độ Flycam (Toàn cảnh):** Xoay 360°, phóng to/thu nhỏ, chuyển đổi nhanh giữa 6 góc nhìn điện ảnh (*Toàn cảnh Flycam*, *Chào cờ*, *Sân khấu*, *Tòa A*, *Nhà Đa Năng*, *Cổng trường*).
  - **Chế độ Đi bộ 1:1 (FPS Explorer):** Dùng phím `W, A, S, D` + Di chuột để đi bộ, phím `Space` để nhảy. Trên điện thoại hỗ trợ cụm phím ảo Dual Virtual Joystick.
  - **Bản đồ Radar Mini 2D (MiniMap):** Định vị vị trí và hướng nhìn của người chơi theo thời gian thực.
  - **Điểm nóng tương tác (Hotspots / POIs):** Bấm vào các huy hiệu để mở bảng thông số kiến trúc và ảnh chụp thực địa.
  - **Chu kỳ ánh sáng ngày/đêm:** Chuyển đổi linh hoạt giữa *Ban ngày nắng ấm*, *Hoàng hôn rực rỡ* và *Đêm trăng lên đèn*.
