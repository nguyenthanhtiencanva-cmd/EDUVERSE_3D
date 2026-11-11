# Kiểm duyệt và kế hoạch tối ưu EDUVERSE 3D

Ngày 11/11/2026. Phạm vi gồm mã nguồn web, hai mô hình GLB phục vụ trình duyệt, pipeline Blender, dữ liệu POI và cấu hình Vercel. Các số liệu hình học được đọc từ GLB. Build production đã chạy thành công. FPS, draw call thực tế, trải nghiệm thiết bị thật và bản triển khai Vercel cần đo trong đợt đầu.

## Số liệu hiện tại

| Hạng mục | Dung lượng | Phần mesh | Tam giác |
| --- | ---: | ---: | ---: |
| Trường Vĩnh Trung | 5,63 MB | 2.117 | 45.516 |
| Sa bàn đảo Vĩnh Thực | 2,15 MB | 286 | 66.040 |
| JavaScript production | 1.116,75 kB, 313,27 kB gzip | | |

Số phần mesh được đếm theo primitive gắn vào node trong GLB. Draw call thực tế phụ thuộc góc nhìn, vật liệu và các lượt render bóng. Hai mô hình đang được yêu cầu ngay khi ứng dụng khởi tạo, tổng 7,78 MB GLB với bộ nhớ đệm trống.

## Kết quả kiểm duyệt

| Mức | Phát hiện | Căn cứ |
| --- | --- | --- |
| P1 | Hai ảnh tư liệu `frame_020.jpg` và `frame_025.jpg` có trong hồ sơ khảo sát nhưng thiếu ở thư mục web. Ba POI tham chiếu đến hai đường dẫn này. | [Dữ liệu POI](../client/src/education/poiData.js) |
| P1 | Nút nhảy cảm ứng ghi `joystickInput.isJumping`, còn bộ điều khiển hiện kích hoạt nhảy qua Space. Góc nhìn cảm ứng giữ delta cuối và áp dụng lại mỗi frame cho đến khi nhấc tay. | [Joystick](../client/src/ui/VirtualJoystick.jsx), [Camera](../client/src/world/CameraController.jsx) |
| P1 | Di chuyển trong sân chỉ giới hạn tọa độ X/Z và dùng mặt đất cố định. Có nguy cơ xuyên tường và đi sai cao độ ở bậc thang hoặc dốc. | [Camera](../client/src/world/CameraController.jsx) |
| P1 | Cả hai GLB được preload khi mở sa bàn. Mọi mesh đều bật đổ và nhận bóng, vật liệu bị ép hai mặt, bản đồ bóng đặt 2048 × 2048. | [Trường](../client/src/world/CampusModel.jsx), [Đảo](../client/src/world/IslandModel.jsx), [Ánh sáng](../client/src/world/SceneLighting.jsx) |
| P2 | Mỗi frame đi bộ tạo vector và ghi một mảng vị trí mới vào Zustand, khiến minimap nhận cập nhật liên tục. Canvas giữ framebuffer qua `preserveDrawingBuffer`. | [Camera](../client/src/world/CameraController.jsx), [Minimap](../client/src/ui/MiniMap.jsx), [Canvas](../client/src/App.jsx) |
| P2 | Manifest khai báo icon 192 × 192 và 512 × 512 bằng ảnh 1920 × 1080 nặng 2,38 MB. Chưa có đăng ký service worker cho offline. | [Manifest](../client/public/manifest.json), [Điểm vào web](../client/src/main.jsx) |

Các bản GLB trong `assets/school` và `client/public/models` hiện khớp SHA-256. Giữ việc sinh tài sản web trong pipeline Blender để lần xuất sau tái lập được kết quả tối ưu.

## Thứ tự triển khai

1. **Đo hiện trạng và sửa lỗi trải nghiệm.** Chốt một máy tính và ít nhất một điện thoại Android tầm trung, thêm iPhone nếu có. Ghi phiên bản trình duyệt, độ phân giải và điều kiện mạng. Đo ba lượt tải lạnh và tải lại. Chạy cùng tuyến đảo → POI → trường → flycam → đi bộ → quay lại đảo. Ghi thời gian đến lúc điều khiển được, byte tải, frame time p50/p95, draw call và tam giác tại các góc cố định. Khôi phục hai ảnh POI ở kích thước phù hợp. Dùng chung logic nhảy cho bàn phím và cảm ứng, tiêu thụ delta nhìn một lần và xóa input khi hủy thao tác hoặc mất focus. Thêm trạng thái lỗi và thử lại khi GLB tải hỏng.
2. **Giảm tải lượt mở đầu.** Chỉ tải GLB đảo khi mở trang. Bắt đầu tải trường khi người dùng chọn vào trường, sau đó đo thời gian chuyển cảnh trước khi cân nhắc tải trước lúc rảnh. Giữ HUD có thể sử dụng trong lúc tải, kiểm tra cache khi quay lại. Chuyển ảnh POI nặng sang định dạng web có kích thước phù hợp. Đánh giá nén hình học và texture bằng tổng dung lượng gồm decoder, thời gian giải mã và ảnh đối chiếu.
3. **Giảm chi phí render trường.** Gộp mesh tĩnh theo vật liệu và theo cụm công trình để giữ frustum culling. Dùng instancing cho chi tiết lặp lại phù hợp. Chỉ bật hai mặt và đổ bóng trên các nhóm thực sự cần. Đo cấu hình DPR và chất lượng bóng cho thiết bị yếu, thử bỏ `preserveDrawingBuffer` sau khi xác minh luồng chụp ảnh. Tái sử dụng vector và giới hạn cập nhật minimap theo thay đổi vị trí. So lại biển chữ, tỷ lệ, bố cục và bóng qua bộ ảnh ở góc cố định ngày, hoàng hôn và đêm.
4. **Hoàn thiện va chạm và phát hành.** Tạo collider đơn giản cho nền, tường, cổng và các bậc cần đi được. Thử ở FPS thấp, kiểm tra điểm xuất phát và thao tác quay lại flycam. Dùng build từ lockfile, thêm kiểm tra tự động đường dẫn POI và mô hình trong CI. Xác minh Vercel Preview trả đúng định dạng GLB, ảnh và manifest. Nếu phạm vi phát hành gồm offline, thống nhất cảnh nào cần mở offline rồi làm icon đúng kích thước, chính sách cache theo phiên bản và kiểm tra nâng cấp. Rà nguồn, quyền sử dụng và thông tin nhận dạng trong ảnh tư liệu trước khi bổ sung ảnh lên bản công khai.

## Tiêu chí nghiệm thu đề xuất

- Lượt mở sa bàn giảm 5,63 MB GLB tải sớm với bộ nhớ đệm trống. Luồng mở trường và quay lại đảo chạy ổn định.
- Giảm ít nhất 50% draw call ở góc trường đại diện so với số đo ban đầu, với bố cục và biển chữ đạt yêu cầu khi đối chiếu ảnh.
- Frame time p95 khi đi bộ không quá 33,3 ms trên Android mục tiêu ở cấu hình nhẹ. Xác nhận ngưỡng sau khi chọn thiết bị và đo mốc ban đầu.
- Tất cả ảnh POI tải đúng. Nút nhảy và xoay hoạt động trên thiết bị thật, không kẹt input khi bị gián đoạn. Luồng đi bộ qua sân, tường, cổng và bậc vượt qua checklist va chạm.
- Build sạch từ lockfile và kiểm thử các luồng chính trên Vercel Preview. Để multiplayer sau các đợt trên vì `server/` hiện chỉ có cấu trúc thư mục.
