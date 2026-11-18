# Hải đăng Vĩnh Thực — dựng lại theo ảnh

Nguồn tham chiếu: bốn ảnh do thầy cung cấp trong `anh truong/hai dang/`.

- `vinh_thuc_lighthouse.blend`: mô hình kiến trúc, vật liệu, camera và đèn render.
- `vinh_thuc_lighthouse.glb`: bản kiến trúc ban đầu để nhập vào công cụ 3D. Website dùng bản cảnh quan bên dưới.
- `overview.png`, `front.png`: hai góc kiểm tra mô hình.
- Script tái tạo: `../rebuild_lighthouse.py` (Blender 4.2).

Mô hình diễn giải hình khối nhìn thấy trong ảnh: tháp thuôn vàng kem, gân trắng, ban công con tiện, lồng đèn, hiên tròn có vòm, nhà mái Mansard đỏ, sân và cầu thang. Kích thước là ước lượng theo ảnh, không phải bản khảo sát 1:1. Mặt khuất được suy đoán. Bản kiến trúc ban đầu chưa có nội thất, cây cối và địa hình; bản web bổ sung cầu thang xoắn minh họa, không phải nội thất được đo đạc. Vật liệu mới, chưa tái hiện đầy đủ vết phong hóa.

Hệ trục Blender: Z hướng lên; mặt tiền nhìn về -Y. Chuyển từ Blender sang web: `(x, y, z) → (x, z, -y)`; trong web, Y là chiều cao. Bản cảnh quan web và cấu hình va chạm được cập nhật đồng bộ.

## Bản cảnh quan theo video — 16/11/2026

- `vinh_thuc_lighthouse_landscape.blend`: bản riêng gồm kiến trúc, đồi, cây xanh, đường, biển và ánh sáng; có thể chỉnh sửa từng đối tượng.
- `vinh_thuc_lighthouse_landscape.glb`: kiến trúc và cảnh quan, không kèm mặt biển và ánh sáng; gộp mesh khi xuất để giảm số node.
- `landscape_overview.png`, `landscape_side.png`: ảnh render kiểm tra.
- `video_reference/`: 8 khung hình được trích từ video người dùng cung cấp bằng Blender; khung 00, 05, 06, 07 dùng để đối chiếu cụm hải đăng.
- Script: `../add_lighthouse_landscape.py`.

Bố cục quan sát được: cầu thang thẳng dài qua khoảng cỏ trống, cây tán rộng và cây bụi phủ dày hai bên, đường bên phải chạy sát vạt đất đá lộ, sườn đồi đổ xuống biển. Độ cao, khoảng cách, đường bờ và vị trí từng cây là ước lượng thị giác, không phải dữ liệu khảo sát/GIS hay tái dựng quang trắc. Mô hình theo phong cách giản lược.

## Chỉnh tỷ lệ cầu thang — 17/11/2026

- Cảnh quan trong thư mục này đã được tích hợp vào bản mã nguồn web qua `export_lighthouse_web.py`.
- 40 bậc cũ (cao 44,8 cm) được thay bằng 110 bậc cao khoảng 16,1 cm, rộng 2,6 m. Bản ngày 17/11 có khoảng cách tâm bậc khoảng 33,7 cm; bản sân mở rộng ngày 18/11 bên dưới điều chỉnh còn 30,0 cm.
- Cấu hình chung: `../../../client/src/world/lighthouse/hill-stairs.json`; dựng bậc và lan can: `../hill_stairs.py`.
- Áp dụng lên nguồn Blender hiện có: `../resize_hill_stairs.py`. Script này không tạo lại cây/địa hình.
- Kiểm tra 330 điểm trên GLB đã nén và render đối chiếu với nhân vật: `../verify_stair_scale.py`.
- `stairs_human_scale.png` và `stair_scale_verification.json` lưu kết quả lịch sử ngày 17/11, khi khoảng cách tâm bậc còn 33,7 cm. Ảnh là render Blender, không phải ảnh chụp chuyển động trong trình duyệt; không dùng hai tệp này để xác nhận khoảng cách tâm bậc hiện tại 30,0 cm.
- Thay đổi tỷ lệ bậc và chỉnh tư thế nhân vật đã được triển khai ngày 17/11/2026 qua các phiên bản `a4882ba` và `9144d55`.

## Mở rộng sân và lối tới tháp chính — 18/11/2026

- Sân mới 38 × 21 m (798 m², trước đây 480 m²), lối lát sáng rộng 2,4 m dẫn từ đầu thang đồi tới hiên tròn của tháp chính.
- 7 bậc vào hiên, mỗi bậc cao khoảng 14,8 cm; mở lan can tại lối vào và khoét cửa thật trong mesh thân tháp, rộng 1,1 m, cao 2,4 m.
- Cấu hình chung `../../../client/src/world/lighthouse/courtyard.json` đồng bộ hình học Blender, mặt đi bộ và kiểm tra. Thang đồi giữ 110 bậc, đầu thang chuyển tới `z=11,9 m`; chân thang giữ `z=44,628 m`.
- Bản phát hành sân mở rộng gồm nguồn `.blend`, GLB cảnh quan, GLB web nén (1.678.100 byte), cấu hình và mã điều khiển đồng bộ. Tài liệu này chưa xác nhận kết quả triển khai công khai.
- `courtyard_design.png`, `courtyard_entrance.png`, `courtyard_plan.png` là ảnh render Blender để xem bố cục, không phải ảnh gameplay.
- `courtyard_geometry_verification.json`: 534 điểm kiểm tra mặt sàn (gồm 20 mẫu sân sau/hai bên), 18 tia kiểm tra lối qua lan can/cửa, không có lỗi; sai số mặt sàn lớn nhất khoảng 9,8 mm so với GLB web đã nén. Báo cáo này kiểm tra cả thang đồi có khoảng cách tâm bậc hiện tại 30,0 cm.

Xem [thiết kế, cách tái tạo và giới hạn kiểm chứng](courtyard-design.md) và [ghi chú điều khiển nhân vật](../../../client/dev/avatar-motion-notes.md).
