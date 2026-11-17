# Kiểm tra chuyển động nhân vật — 17/11/2026

Nhân vật hiện có `tourist.glb` được giữ nguyên. Lớp chỉnh tư thế chạy sau
animation, rồi khôi phục trước khung tiếp theo; mỗi nhân vật có bộ xương riêng.

Đã thêm:

- Thu khuỷu tay khi chạy, giữ chuyển động đầu và kính.
- Dò điểm tiếp xúc dưới giày và giải khớp đùi/gối để chân bám nền.
- Đổi chân luân phiên trên cầu thang, nâng chân qua cạnh bậc, điều chỉnh hông.
- Giảm tốc độ trên cầu thang đồi và cầu thang xoắn; đồng bộ thời gian di chuyển
  với bước mô phỏng khi tốc độ khung hình thấp.
- Dò đúng mặt bậc đồi, phần bậc chồng nhau, 7 bậc cửa và tầng xoắn gần nhân vật.
- Bỏ ghim chân khi nhảy và đặt lại chân khi chuyển vị trí.

## Xem và so sánh

Chạy `npm run dev`, mở `/dev/avatar-review.html`. Chọn đứng/đi/chạy/lên/xuống/
cầu thang xoắn; bật tắt **Áp dụng chỉnh sửa** để so sánh. Trang này phục vụ kiểm
tra khi phát triển, không nằm trong bản build ứng dụng chính.

## Xác minh

- `npm run test:avatar`: 8 bài kiểm tra trên đúng hình học và bộ xương của GLB
  dành cho web. Bao gồm bước mô phỏng tương ứng 20/30/60 FPS, lên và xuống bậc
  cao khoảng 16,1 cm, chiều dài xương, khôi phục tư thế, nhảy và chuyển vị trí.
- `node scripts/lighthouse.test.mjs`: 5 bài kiểm tra cảnh hải đăng.
- `node scripts/geography.test.mjs`: 4 bài kiểm tra địa hình/bản đồ.
- `npm run build`: bản dựng Vite.
- Trình duyệt đã tải cảnh hải đăng và trang thử với GLB đầy đủ texture; không
  ghi nhận lỗi JavaScript trong các thao tác kiểm tra.

Giới hạn: các số FPS trên là bước thời gian mô phỏng, chưa phải đo hiệu năng
điện thoại. Các bài kiểm tra tiếp xúc dùng điểm dò dưới giày, không chứng minh
mọi tam giác cơ thể không va vào bậc. Công cụ chụp trình duyệt hết thời gian
chờ; chưa hoàn thành duyệt hình ảnh chuyển động bằng ảnh chụp. Cần xem trực
tiếp trang thử để đánh giá dáng người.

## Sửa tỷ lệ bậc đồi

40 bậc phóng lớn được thay bằng 110 bậc, cao khoảng 16,1 cm và sâu 33,7 cm.
Điểm đầu bám mép sân thật (z=7,9 m, y=0,07 m); chân dốc vẫn ở z=44,628 m,
y=-17,472 m. Địa hình và tỷ lệ nhân vật giữ nguyên. Cấu hình dùng chung tại
`client/src/world/lighthouse/hill-stairs.json` điều khiển Blender, mô hình thử, dò chân và
va chạm. Đã bỏ thao tác thu nhỏ lan can lúc tải cảnh vì lan can được dựng đúng
kích thước ngay trong nguồn. `verify_stair_scale.py` kiểm tra 330 tia trên GLB
đã nén và dựng ảnh đối chiếu tỷ lệ trong Blender, không phải ảnh gameplay.

Khi triển khai, phải đưa đồng thời cấu hình bậc, lớp chỉnh chuyển động và GLB
đã nén lên cùng một phiên bản. Cấu hình nằm trong `client` để bản dựng Vercel
không phụ thuộc vào tệp ngoài thư mục ứng dụng.

## Thu khoảng cách hai chân khi leo bậc

Điểm đặt bàn chân trên cầu thang dùng vị trí dưới khớp hông của mô hình,
thay cho vị trí chân dang rộng trong tư thế nghỉ. Khoảng cách tâm hai bàn chân
khi đi thẳng giảm từ khoảng 29,3 cm xuống 17,5 cm. Kiểm tra cả hai chiều trên
bậc đồi và cầu thang xoắn: chân không bắt chéo, gối không xoè rộng và giày
vẫn bám mặt bậc. Chuyển động gốc trên nền phẳng được giữ nguyên.
