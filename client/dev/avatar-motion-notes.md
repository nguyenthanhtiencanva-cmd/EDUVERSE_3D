# Kiểm tra chuyển động nhân vật — cập nhật 18/11/2026

Bản chỉnh tỷ lệ bậc và tư thế đã triển khai ngày 17/11/2026 (`a4882ba`,
`9144d55`). Bản phát hành ngày 18/11 gồm sân mở rộng, lối vào tháp và điều
khiển thủ công cùng cấu hình/GLB đồng bộ; tài liệu này chưa xác nhận kết quả
triển khai công khai.

Nhân vật hiện có `tourist.glb` được giữ nguyên. Lớp chỉnh tư thế chạy sau
animation, rồi khôi phục trước khung tiếp theo; mỗi nhân vật có bộ xương riêng.

Đã thêm:

- Thu khuỷu tay khi chạy, giữ chuyển động đầu và kính.
- Dò điểm tiếp xúc dưới giày và giải khớp đùi/gối để chân bám nền.
- Đổi chân luân phiên trên cầu thang, nâng chân qua cạnh bậc, điều chỉnh hông.
- Giảm tốc độ trên cầu thang đồi và cầu thang xoắn; đồng bộ thời gian di chuyển
  với bước mô phỏng khi tốc độ khung hình thấp.
- Dò đúng mặt bậc đồi, phần bậc chồng nhau, bậc cửa nhà, 7 bậc mới vào hiên
  tròn và tầng xoắn gần nhân vật.
- Bỏ ghim chân khi nhảy và đặt lại chân khi chuyển vị trí.

## Xem và so sánh

Từ thư mục `client`, chạy `npm run dev`, mở `/dev/avatar-review.html`. Chọn
đứng/đi/chạy/lên/xuống/cầu thang xoắn; bật tắt **Áp dụng chỉnh sửa** để so sánh
tư thế. Mở `/dev/lighthouse-walk-review.html` để kiểm tra cảnh `LegacyWorld`
và bộ điều khiển thật. Các nút QA cho phép đặt nhân vật ở chân đồi, sân mới,
cửa tháp hoặc ban công; giữ tiến/lùi 3 giây và kiểm tra đứng yên 2 giây sau
khi thả cần. Hai trang chỉ phục vụ phát triển, không nằm trong bản build chính.

## Đi tới tháp và tự leo

Đi theo lối lát sáng từ đầu thang đồi qua sân, lên 7 bậc vào hiên tròn rồi
tới cửa **tháp hải đăng chính**. Chỉ khi ở gần đúng cửa và đúng tầng mới có
thể nhấn **E** hoặc nút **Vào cầu thang**. Thao tác này đưa nhân vật vào vị trí
đầu cầu thang; không khởi động tự leo.

Giữ **W** hoặc đẩy joystick tiến để đi theo chiều đã vào cầu thang; giữ **S**
hoặc kéo joystick lùi để đi ngược. Thả điều khiển thì dừng tại chỗ. Có thể vào
từ sân để đi lên hoặc từ ban công để đi xuống. Camera xoay theo hướng di
chuyển; hướng tham chiếu điều khiển được giữ trong một lần giữ phím/joystick
để thao tác đi ngang không biến thành vòng tròn khi camera quay theo. Khi
người dùng chủ động xoay góc nhìn, camera nhường điều khiển hướng nhìn.

Trong chế độ cầu thang xoắn, chỉ nhóm vật liệu `Tower cutaway ` của vỏ tháp
mờ đi để thấy nhân vật. Cầu thang xoắn là mô hình minh họa tương tác, chưa có
dữ liệu đo đạc để xác nhận nội thất thực tế.

## Xác minh

- `npm run test:avatar`: 9 bài kiểm tra trên đúng hình học và bộ xương của GLB
  dành cho web. Bao gồm bước mô phỏng tương ứng 20/30/60 FPS, lên và xuống bậc
  cao khoảng 16,1 cm, 7 bậc mới vào hiên, chiều dài xương, khôi phục tư thế,
  nhảy và chuyển vị trí.
- `node --test scripts/lighthouse-navigation.test.mjs`: 8 bài kiểm tra đường
  liên tục tới cửa tháp, ranh giới/lan can, cao độ sân sau/hai bên, điều kiện
  vào cầu thang, dừng/đảo chiều và thoát hai đầu thang, giữ hướng đi khi thoát,
  cùng camera theo hướng di chuyển.
- `node --test scripts/lighthouse.test.mjs`: 5 bài kiểm tra cảnh hải đăng.
- `npm run test:geography`: 4 bài kiểm tra địa hình/bản đồ.
- `npm run build`: bản dựng Vite.
- Báo cáo hình học sân: 534 điểm mặt sàn (gồm 20 mẫu sân sau/hai bên) và 18
  tia qua lối vào trên GLB web đã nén, không có lỗi; sai số cao độ lớn nhất
  khoảng 9,8 mm. Bộ điều hướng và cảnh hải đăng có tổng cộng 13 bài kiểm tra.

Giới hạn: các số FPS trên là bước thời gian mô phỏng, chưa phải đo hiệu năng
điện thoại. Các bài kiểm tra tiếp xúc dùng điểm dò dưới giày, không chứng minh
mọi tam giác cơ thể không va vào bậc. Báo cáo hình học và các ảnh render
Blender không thay thế việc xem chuyển động trong trang thử để đánh giá dáng
người, góc camera và thao tác trên thiết bị thực.

## Sửa tỷ lệ bậc đồi

40 bậc phóng lớn được thay bằng 110 bậc, cao khoảng 16,1 cm. Sân mở rộng
chuyển đầu thang từ z=7,9 m tới z=11,9 m (y=0,07 m); chân dốc vẫn ở
z=44,628 m, y=-17,472 m. Khoảng cách tâm bậc hiện là 30,0 cm, chiều sâu mesh
31,8 cm kể cả phần chồng 1,8 cm; thang rộng 2,6 m. Tỷ lệ nhân vật giữ nguyên.
Cấu hình dùng chung tại
`client/src/world/lighthouse/hill-stairs.json` điều khiển Blender, mô hình thử, dò chân và
va chạm. Đã bỏ thao tác thu nhỏ lan can lúc tải cảnh vì lan can được dựng đúng
kích thước ngay trong nguồn. `stairs_human_scale.png` và
`stair_scale_verification.json` là kết quả lịch sử ngày 17/11 với khoảng cách
tâm bậc 33,7 cm, không phải bằng chứng cho cấu hình hiện tại. Ảnh là render
Blender, không phải ảnh gameplay. Khoảng cách tâm bậc hiện tại 30,0 cm được
kiểm tra trong `courtyard_geometry_verification.json` cùng mặt sân mới.

Khi triển khai bản sân mới, phải đưa đồng thời `hill-stairs.json`,
`courtyard.json`, lớp điều khiển/chỉnh chuyển động và GLB đã nén lên cùng một
phiên bản. Cấu hình nằm trong `client` để bản dựng Vercel không phụ thuộc vào
tệp ngoài thư mục ứng dụng. Xem [thiết kế sân và cách tái tạo](../../assets/landmarks/vinh_thuc_rebuilt/courtyard-design.md).

## Thu khoảng cách hai chân khi leo bậc

Điểm đặt bàn chân trên cầu thang dùng vị trí dưới khớp hông của mô hình,
thay cho vị trí chân dang rộng trong tư thế nghỉ. Khoảng cách tâm hai bàn chân
khi đi thẳng giảm từ khoảng 29,3 cm xuống 17,5 cm. Các bài kiểm tra ở cả hai
chiều trên bậc đồi và cầu thang xoắn kiểm soát chân bắt chéo, độ dang đầu gối
và điểm dò dưới giày bám mặt bậc. Chuyển động gốc trên nền phẳng được giữ nguyên.
