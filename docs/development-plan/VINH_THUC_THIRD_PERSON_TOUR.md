# Kế hoạch hành trình du lịch đảo Vĩnh Thực ở góc nhìn thứ ba

Trạng thái **Chờ duyệt**

Người chơi chọn **Bắt đầu hành trình**, điều khiển một nhân vật nhìn từ phía sau và khám phá đảo theo các chặng. Tại mỗi điểm dừng, người chơi có thể xem ảnh và thông tin địa danh, đi dạo trong khu vực rồi chọn tiếp tục hành trình.

## Nhân vật và điều khiển

- **Nhân vật đề xuất** là một du khách trẻ theo phong cách 3D hiện tại, mặc áo khoác nhẹ, giày thể thao và đeo ba lô nhỏ. Tận dụng bộ xương từ nhân vật học sinh hiện có để tạo trang phục du khách và dùng lại ba hoạt ảnh đứng, đi, chạy. Giữ mẫu học sinh làm lựa chọn nếu thầy muốn hành trình mang tính trải nghiệm học đường.
- **Camera** mặc định đi theo sau lưng và hơi cao hơn vai. Người chơi kéo chuột hoặc vuốt để xoay quanh nhân vật, có thể đưa camera về sau lưng bằng một nút. Khi gặp tường hoặc vách đá, camera thu gần để giữ nhân vật trong khung hình.
- **Máy tính** dùng WASD hoặc phím mũi tên để đi, Shift để chạy, kéo chuột để xoay camera và E để xem điểm tham quan khi ở gần.
- **Điện thoại** dùng joystick trái để di chuyển, vuốt bên phải để xoay camera và chạm nút tương tác. Điều khiển được xóa khi mất tiêu điểm, đổi cảnh hoặc thao tác cảm ứng bị hủy.

Nhân vật học sinh GLB hiện có một bộ xương và ba hoạt ảnh `Idle`, `Walk`, `Run`. Bộ điều khiển đã có camera theo sau, nhưng đang gắn riêng vào khuôn viên và dùng mặt đất phẳng cùng các hộp va chạm của trường. [Mô hình](../../client/public/models/student_character.glb) · [Bộ điều khiển](../../client/src/world/CharacterController.jsx)

## Hành trình đề xuất

| Chặng | Trải nghiệm |
| --- | --- |
| Bến tàu Vạn Gia | Bắt đầu ở khu vực tham quan, làm quen điều khiển và mở bản đồ hành trình. |
| Phân hiệu Vĩnh Trung | Đến điểm dừng của trường. Có thể vào khuôn viên bằng cảnh 3D sẵn có và quay lại hành trình. |
| Bến Hèn | Đi dạo một đoạn bờ biển, mở ảnh tư liệu và nội dung giới thiệu. |
| Bãi Đầu Đông | Khám phá khu vực bãi biển và điểm ngắm cảnh. |
| Hải đăng Vĩnh Thực | Kết thúc tại điểm ngắm cảnh đã chọn, hiện các chặng đã ghé và cho phép xem lại. |

Thứ tự trên là kịch bản tham quan đề xuất. Trước khi dựng từng chặng, xác minh tọa độ điểm đến, lối đi công cộng và ảnh tư liệu. Người chơi đi bộ trong các đoạn được dựng chi tiết. Các quãng xa dùng **Đi đến chặng tiếp theo** trên bản đồ để giữ thời lượng tour. [Danh mục địa danh hiện có](../../client/src/education/poiData.js)

## Các đợt triển khai

| Đợt | Công việc | Bản để thầy xem |
| --- | --- | --- |
| 1. Nhân vật và camera | Tạo bản du khách từ bộ xương hiện có. Dùng một bộ điều khiển camera cho chế độ góc nhìn thứ ba. Thử vận tốc đi/chạy, góc xoay và va chạm trên khu vực trường. | Nhân vật có thể đi, chạy, xoay camera trên máy tính và điện thoại. |
| 2. Một chặng thử trên đảo | Ưu tiên Bến Vạn Gia nếu có đủ tư liệu. Chốt điểm xuất phát, đoạn đi bộ và một điểm tương tác. Dựng mặt đường, dốc và ranh giới nước. Thêm bản đồ chặng và cơ chế trở về vị trí an toàn. | Thầy có thể vào tour, đi hết một chặng, mở thông tin và quay về bản đồ. |
| 3. Nối các điểm tham quan | Thêm các chặng đã xác minh, đường dẫn vào trường, chỉ đường tới điểm tiếp theo và tiến độ đã ghé. Giữ lựa chọn khám phá tự do trong vùng đi bộ của mỗi chặng. | Tour hoàn chỉnh theo danh sách điểm dừng đã duyệt. |
| 4. Kiểm thử và tối ưu | Tải riêng mô hình theo chặng. Kiểm tra camera, va chạm, bộ nhớ khi đi qua nhiều cảnh và thao tác trên trình duyệt di động. | Bản xem thử để duyệt trước khi phát hành. |

## Tỷ lệ và dữ liệu địa hình

Dùng địa danh và bản đồ tổng quan để chọn chặng. Mỗi đoạn đi bộ có hệ tọa độ theo mét và mặt đi riêng để đặt chân nhân vật lên đường, dốc hoặc sân. Khi có dữ liệu xác minh, gắn mỗi đoạn vào tọa độ địa lý để đối chiếu vị trí trên bản đồ. Nền Copernicus khoảng 30 m hỗ trợ tổng quan đảo. Mặt đường, bậc và mép nước cần ảnh flycam có định vị, bản vẽ hoặc số đo tại điểm tham quan. [Thông tin dữ liệu địa hình trong dự án](../../client/public/terrain/vinh-thuc.json)

## Tiêu chí nghiệm thu đề xuất

- Hoàn thành luồng **Bản đồ → bắt đầu tour → điều khiển nhân vật → xem điểm tham quan → đổi chặng** bằng bàn phím và bằng cảm ứng.
- Nhân vật có hoạt ảnh phù hợp khi dừng, đi và chạy. Camera giữ nhân vật trong khung hình khi sát tường hoặc qua đoạn hẹp.
- Kiểm tra các vị trí dễ lỗi tại mỗi chặng gồm mép nước, dốc, góc tường và điểm xuất phát. Nếu nhân vật ra ngoài vùng đi bộ, có thể quay về điểm an toàn.
- Vào khuôn viên trường và trở về đúng chặng đang tham quan, giữ các điểm đã ghé.
- Mục tiêu ban đầu là frame time p95 không quá 33,3 ms trong đoạn đi bộ đại diện trên điện thoại Android mục tiêu. Chốt thiết bị và đo mốc trước khi tinh chỉnh.

## Các lựa chọn cần duyệt

1. **Nhân vật** — Du khách mặc áo khoác nhẹ và đeo ba lô, hoặc học sinh áo trắng khăn quàng đỏ.
2. **Chặng thử đầu tiên** — Bến Vạn Gia để thử hành trình du lịch, hoặc khu vực Phân hiệu Vĩnh Trung để tận dụng tư liệu và mô hình sẵn có.
3. **Cách khám phá** — Đi theo tuyến gợi ý và tự do trong từng chặng, hoặc mở các chặng cho người chơi tự chọn thứ tự từ đầu.
