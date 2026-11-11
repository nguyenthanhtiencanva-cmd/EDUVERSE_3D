# Báo Cáo Nâng Cấp Chi Tiết 3D (Nhóm 1: Texture Chữ & Pano Thật, Vật Liệu PBR, Cây Phân Tầng & Bầu Trời Mây)

> [!IMPORTANT]
> Toàn bộ 4 hạng mục nâng cấp **Nhóm 1** đã được triển khai vào bộ sinh 3D [generate_blockout.py](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/generate_blockout.py), bộ tạo Texture [build_textures.ps1](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/build_textures.ps1), file Blender [school_campus_blockout.blend](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/school_campus_blockout.blend) và xuất trực tiếp sang WebGL [school_campus.glb](file:///d:/ANTIGRAVITY/EDUVERSE_3D/client/public/models/school_campus.glb).

---

## 1. Slide Đối Chiếu Trực Quan: Ảnh Chụp Thực Tế vs. Render 3D Đã Nâng Cấp Nhóm 1

````carousel
![Ảnh thực tế 2: Tòa B & Sân Khấu Lễ Đài Chào Cờ](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/.user_uploaded/media_1794221645860_a48243fd.jpg)
<!-- slide -->
![Kết quả 3D Nhóm 1: Pano Bác Hồ thật + Thư Bác Hồ, chữ khẩu hiệu tiếng Việt sắc nét, bậc gạch đỏ có mạch vữa, chậu gốm xanh vàng & tùng bách tán 4 tầng](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/preview_photo2_stage.png)
<!-- slide -->
![Ảnh thực tế 1: Tòa C2 (Dãy nhà 2 tầng cánh Tây)](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/.user_uploaded/media_1794221645851_275eea0a.jpg)
<!-- slide -->
![Kết quả 3D Nhóm 1: Tòa C2 với băng rôn chữ vàng thật, bậc đá granite đỏ lấm tấm hạt, cửa kính 4 cánh khung trắng & sân bê tông kẻ ô](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/preview_photo1_bld_c2.png)
<!-- slide -->
![Ảnh thực tế 3: Khu vui chơi vận động 2 ô cỏ ngang & Mặt Đông Nhà Đa Năng C1](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/.user_uploaded/media_1794221645862_079c4da4.jpg)
<!-- slide -->
![Kết quả 3D Nhóm 1: Bầu trời mây tự nhiên, sảnh Nhà Đa Năng ốp đá granite nâu vàng, cây bàng Đài Loan 3 tầng tán lá, thảm cỏ PBR & biển tên cổng trường](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/preview_photo3_playground_gym.png)
<!-- slide -->
![Toàn cảnh 3D khuôn viên trường với mái ngói đỏ lượn sóng, sân bê tông chia ô & đầy đủ biển hiệu](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/preview_aerial_overview.png)
<!-- slide -->
![Góc nhìn nghi lễ dưới sân trường hướng về Lễ đài và Tòa A](C:/Users/NTT-PC/.gemini/antigravity/brain/8b748b74-0f2d-46f6-be95-b368548eb6e7/preview_ground_ceremony.png)
````

---

## 2. Chi Tiết 4 Hạng Mục Đã Triển Khai Trong Nhóm 1

### ① Dán Ảnh Pano Bác Hồ Thật & Kết Xuất Chữ Tiếng Việt Độ Phân Giải Cao (`assets/school/textures/tex_*.png`)
- **Pano đôi Bác Hồ tầng 2 Tòa B ([tex_uncle_ho_pano.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_uncle_ho_pano.png))**: Bên trái cắt trực tiếp bức chân dung Bác Hồ quàng khăn đỏ cho thiếu nhi từ ảnh chụp thực tế của thầy; bên phải tái tạo sắc nét toàn văn bức thư Bác Hồ gửi học sinh trên nền vàng kèm chữ ký *"HỒ CHÍ MINH"*.
- **Toàn bộ hệ thống khẩu hiệu tiếng Việt**:
  - Lễ đài Tòa B ([tex_slogan_stage.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_stage.png)): `"QUẢN LÝ TỐT - DẠY TỐT - HỌC TỐT"` kèm họa tiết hoa sen vàng hai đầu.
  - Hai diềm mái Tòa B ([tex_slogan_tree_left.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_tree_left.png) & [tex_slogan_tree_right.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_tree_right.png)): Chữ đỏ viền trắng trên nền xanh dương `"VÌ LỢI ÍCH MƯỜI NĂM THÌ PHẢI TRỒNG CÂY"` và `"VÌ LỢI ÍCH TRĂM NĂM THÌ PHẢI TRỒNG NGƯỜI"`.
  - Tòa C2 cánh Tây ([tex_slogan_bld_c2.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_bld_c2.png)): `"“DÙ KHÓ KHĂN ĐẾN ĐÂU CŨNG PHẢI THI ĐUA DẠY TỐT, HỌC TỐT”"`.
  - Tòa A cánh Đông ([tex_slogan_bld_a_main.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_bld_a_main.png) & [tex_slogan_bld_a_sub.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_slogan_bld_a_sub.png)): `"MỖI THẦY GIÁO, CÔ GIÁO LÀ MỘT TẤM GƯƠNG ĐẠO ĐỨC, TỰ HỌC VÀ SÁNG TẠO"` và `"TIÊN HỌC LỄ - HẬU HỌC VĂN"`.
  - Cổng trường chính ([tex_gate_sign.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_gate_sign.png)): `"TRƯỜNG TH & THCS VĨNH THỰC — HIỀN TÀI LÀ NGUYÊN KHÍ QUỐC GIA"`.
  - Chậu cảnh gốm xanh đắp nổi vàng ([tex_planter_blue_ornate.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/tex_planter_blue_ornate.png)): Hoa văn khung vàng đắp nổi trên nền men gốm xanh.

### ② Vân Bề Mặt Vật Liệu PBR (`assets/school/textures/pbr_*.png`)
- **Mặt sân bê tông ([pbr_courtyard_concrete.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/pbr_courtyard_concrete.png) + Bump map)**: Có khe co giãn chia ô bê tông và độ nhám hạt cốt liệu tự nhiên.
- **Mái ngói đỏ lượn sóng ([pbr_roof_red_tile.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/pbr_roof_red_tile.png) + Bump map)**: Tạo sóng ngói dọc và ngấn xếp lớp ngói ngang trên toàn bộ mái Tòa A, B, C2, D, Cổng và Nhà bảo vệ.
- **Bậc gạch gốm đỏ lễ đài ([pbr_terracotta_steps.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/pbr_terracotta_steps.png))**: Có đường mạch vữa (ron gạch) trắng rõ nét trên cả 7 bậc tam cấp 3 phía.
- **Đá hoa cương đỏ & nâu vàng ([pbr_granite_pinkred.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/pbr_granite_pinkred.png) & [pbr_granite_beige.png](file:///d:/ANTIGRAVITY/EDUVERSE_3D/assets/school/textures/pbr_granite_beige.png))**: Vân hạt đá granite tự nhiên cho bậc tam cấp Tòa C2 và sảnh Đông Nhà Đa Năng C1.

### ③ Tăng Độ Chi Tiết Hình Học (Cây Nhiều Tầng, Bonsai & Khung Cửa Chia Ô)
- **Tùng bách tán 4 tầng tán lá (`PROP_Araucaria_*`)** dọc hành lang Tòa B và **Bonsai 3 cụm tán lá (`PROP_OrnateBonsaiPad_*`)** trên 2 chậu gốm xanh.
- **Cây bàng Đài Loan non (`TREE_Sapling_*`)** trên khu vui chơi được dựng 3 tầng tán lá xòe ngang nhiều cụm kèm 3 cọc gỗ chống.
- **Hệ cửa sổ 4 cánh khung trắng chia đố (`create_detailed_window_ns/ew`)** đồng bộ trên cả Tòa A, Tòa B và Tòa C2 với kính bán trong suốt nhìn thấy bàn ghế bên trong lớp học.

### ④ Bầu Trời Mây Tự Nhiên & Đổ Bóng 4K Trên Web 3D
- Tích hợp bầu trời mây Cumulus tự nhiên trong Blender (`EDUVERSE_World`) và `<Sky />` + `<ContactShadows />` + lọc nét nghiêng `anisotropy = 16` trong [CampusModel.jsx](file:///d:/ANTIGRAVITY/EDUVERSE_3D/client/src/world/CampusModel.jsx) và [SceneLighting.jsx](file:///d:/ANTIGRAVITY/EDUVERSE_3D/client/src/world/SceneLighting.jsx).
