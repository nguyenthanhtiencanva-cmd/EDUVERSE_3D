# Hải đăng Vĩnh Thực — dựng lại theo ảnh

Nguồn tham chiếu: bốn ảnh do thầy cung cấp trong `anh truong/hai dang/`.

- `vinh_thuc_lighthouse.blend`: mô hình kiến trúc, vật liệu, camera và đèn render.
- `vinh_thuc_lighthouse.glb`: cụm kiến trúc để nhập vào công cụ 3D; chưa tích hợp vào website.
- `overview.png`, `front.png`: hai góc kiểm tra mô hình.
- Script tái tạo: `../rebuild_lighthouse.py` (Blender 4.2).

Mô hình diễn giải hình khối nhìn thấy trong ảnh: tháp thuôn vàng kem, gân trắng, ban công con tiện, lồng đèn, hiên tròn có vòm, nhà mái Mansard đỏ, sân và cầu thang. Kích thước là ước lượng theo ảnh, không phải bản khảo sát 1:1. Mặt khuất được suy đoán. Chưa dựng nội thất, cầu thang xoắn bên trong, cây cối và địa hình thực địa. Vật liệu mới, chưa tái hiện đầy đủ vết phong hóa.

Hệ trục Blender: Z hướng lên; mặt tiền nhìn về -Y. GLB được xuất theo chuyển đổi trục chuẩn của Blender. Không thay thế các tài sản hoặc cơ chế va chạm hiện có của dự án.

## Bản cảnh quan theo video — 16/11/2026

- `vinh_thuc_lighthouse_landscape.blend`: bản riêng gồm kiến trúc, đồi, cây xanh, đường, biển và ánh sáng; có thể chỉnh sửa từng đối tượng.
- `vinh_thuc_lighthouse_landscape.glb`: kiến trúc và cảnh quan, không kèm mặt biển và ánh sáng; gộp mesh khi xuất để giảm số node.
- `landscape_overview.png`, `landscape_side.png`: ảnh render kiểm tra.
- `video_reference/`: 8 khung hình được trích từ video người dùng cung cấp bằng Blender; khung 00, 05, 06, 07 dùng để đối chiếu cụm hải đăng.
- Script: `../add_lighthouse_landscape.py`.

Bố cục quan sát được: cầu thang thẳng dài qua khoảng cỏ trống, cây tán rộng và cây bụi phủ dày hai bên, đường bên phải chạy sát vạt đất đá lộ, sườn đồi đổ xuống biển. Độ cao, khoảng cách, đường bờ và vị trí từng cây là ước lượng thị giác, không phải dữ liệu khảo sát/GIS hay tái dựng quang trắc. Mô hình theo phong cách giản lược.

## Chỉnh tỷ lệ cầu thang — 17/11/2026

- Cảnh quan trong thư mục này đã được tích hợp vào bản mã nguồn web qua `export_lighthouse_web.py`.
- 40 bậc cũ (cao 44,8 cm) được thay bằng 110 bậc cao khoảng 16,1 cm, sâu 33,7 cm, rộng 2,6 m. Điểm nối đầu thang bám mép sân; chân dốc và địa hình giữ nguyên.
- Cấu hình chung: `../../../client/src/world/lighthouse/hill-stairs.json`; dựng bậc và lan can: `../hill_stairs.py`.
- Áp dụng lên nguồn Blender hiện có: `../resize_hill_stairs.py`. Script này không tạo lại cây/địa hình.
- Kiểm tra 330 điểm trên GLB đã nén và render đối chiếu với nhân vật: `../verify_stair_scale.py`.
- `stairs_human_scale.png` là ảnh đối chiếu tỷ lệ trong Blender, không phải ảnh chụp chuyển động trong trình duyệt.
- `stair_scale_verification.json` ghi số đo và sai số sau nén. Chưa công bố thay đổi tỷ lệ này lên website công khai.
