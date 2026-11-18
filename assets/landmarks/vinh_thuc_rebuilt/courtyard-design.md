# Sân mở rộng và đường vào tháp chính — 18/11/2026

Bản phát hành này gồm sân mở rộng, đường đi liên tục từ thang đồi tới cửa
tháp hải đăng chính và điều khiển lên/xuống cầu thang xoắn. Nguồn Blender,
GLB cảnh quan, GLB web, cấu hình và mã điều khiển được cập nhật đồng bộ trong
commit. Tài liệu này chưa xác nhận kết quả triển khai công khai. Bản sửa
bậc/tư thế trước đó đã triển khai ngày 17/11 qua `a4882ba` và `9144d55`.

## Hình học và cấu hình

Kích thước bên dưới là lựa chọn cho mô hình tương tác dựa trên ảnh/video,
không phải kích thước khảo sát tại hải đăng. Đơn vị là mét. Tọa độ web dùng Y
làm chiều cao; chuyển sang Blender bằng `(x, y, z) → (x, -z, y)`.

| Hạng mục | Kích thước hiện tại |
| --- | --- |
| Sân | 38 × 21 m = 798 m², tăng 318 m² (66,25%) từ 480 m² |
| Biên sân trong cấu hình | x từ −18 tới 20; z từ −9,1 tới 11,9; sàn y=0,075 |
| Lối lát sáng | Rộng 2,4 m, nối đầu thang đồi tới bậc vào hiên tròn |
| Bậc hiên mới | 7 bậc, cao 0,147857 m/bậc; rộng 2,4 m, sâu 0,34 m |
| Sàn hiên tròn | y=1,11 m; lan can mở tại lối lên |
| Cửa tháp chính | Lỗ Boolean rộng 1,1 m, cao 2,4 m trong thân tháp dưới |
| Thang đồi | 110 bậc, rộng 2,6 m; cao 0,160936 m/bậc |
| Khoảng cách tâm bậc đồi | 0,300257 m; mesh sâu 0,318257 m kể cả phần chồng |
| Đầu/chân thang đồi | Đầu z=11,9, y=0,07; chân z=44,628, y=−17,472 |

`client/src/world/lighthouse/courtyard.json` là cấu hình chung cho sân, tuyến
lát, bậc hiên và cửa tháp. `hill-stairs.json` điều khiển thang đồi; sân mới đẩy
đầu thang từ z=7,9 tới z=11,9, giữ nguyên chân dốc và cao độ hai đầu. Giới hạn
đi bộ chừa 0,5 m từ biên sân; mô hình va chạm chặn nhà, cột, lan can hiên và
thân tháp, cho qua tại lối đã mở. Các giới hạn này là xấp xỉ bằng hình học đơn
giản, không phải va chạm chính xác từng tam giác.

## Điều khiển và góc nhìn

Chỉ gần cửa cầu thang và đúng tầng mới hiện nút **Vào cầu thang** hoặc nhận
phím **E**. Nhân vật được đặt tại đầu cầu thang tương ứng rồi chờ điều khiển.
Giữ W/joystick tiến để đi theo chiều vào, S/joystick lùi để đảo chiều; thả thì
dừng. Có thể bắt đầu từ sân hoặc ban công. Việc bấm nút không tự chạy cả tuyến.

Camera bám hướng di chuyển. Hướng tham chiếu được giữ trong mỗi lần giữ phím
hoặc joystick để camera quay theo không khiến thao tác đi ngang chạy vòng
tròn. Khi chủ động xoay góc nhìn, người dùng giữ quyền điều khiển camera.

Cầu thang xoắn 112 bậc, 4 vòng trong ứng dụng là mô hình minh họa nội thất.
Khi sử dụng, chỉ vật liệu có tiền tố `Tower cutaway ` mờ đi để nhìn thấy nhân
vật; đây không phải bản dựng nội thất thực tế đã đo đạc. Khoảng cách tâm hai
bàn chân trên bậc vẫn khoảng 17,5 cm sau lớp chỉnh tư thế.

## Tái tạo và kiểm tra

Chạy từ gốc repository, dùng Blender 4.2 có lệnh `blender` trong PATH. Bước
đầu cập nhật trực tiếp tệp cảnh quan `.blend` hiện có, đồng thời xuất GLB nguồn
và ba ảnh kiểm tra; cần giữ bản nguồn này nếu muốn tái tạo đầy đủ cảnh.

```powershell
blender --background --python assets/landmarks/redesign_lighthouse_courtyard.py -- --render
blender --background --python assets/landmarks/export_lighthouse_web.py
node client/scripts/courtyard-probes.mjs
blender --background --python assets/landmarks/verify_courtyard.py
```

`export_lighthouse_web.py` giảm hình học cây riêng, giữ chi tiết kiến trúc rồi
nén Draco. GLB web hiện tại tại `client/src/assets/models/lighthouse_landscape.glb`
có dung lượng 1.678.100 byte. Muốn chỉ render lại cảnh đã lưu, dùng
`-- --render --render-only` cho script thiết kế sân.

Từ thư mục `client`:

```powershell
npm run test:avatar
node --test scripts/lighthouse-navigation.test.mjs scripts/lighthouse.test.mjs
npm run test:geography
npm run build
npm run dev
```

Trang `/dev/lighthouse-walk-review.html` gắn trực tiếp `LegacyWorld` cùng bộ
điều khiển của ứng dụng. Nút QA đặt vị trí giúp kiểm tra ở chân đồi/sân/cửa/
ban công, giữ tiến/lùi 3 giây và xác nhận dừng sau khi thả. Để kiểm tra đường
liên tục, đi từ **Chân đồi** qua sân tới cửa tháp mà không dùng nút đặt vị trí.
Trang `/dev/avatar-review.html` dùng để so sánh bật/tắt chỉnh tư thế.

## Bằng chứng và giới hạn

- `courtyard_design_report.json` ghi kích thước được tạo từ cấu hình.
- `courtyard_runtime_probes.json` lấy cao độ mong đợi từ mã runtime;
  `courtyard_geometry_verification.json` đối chiếu với GLB web đã nén: 534
  mẫu mặt sàn (gồm 20 mẫu sân sau/hai bên), 18 tia qua lối vào, không có lỗi;
  sai số lớn nhất 0,009799503 m. Báo cáo bao gồm thang đồi với khoảng cách
  tâm bậc hiện tại 30,0 cm.
- `stairs_human_scale.png` và `stair_scale_verification.json` lưu kết quả
  lịch sử ngày 17/11 với khoảng cách tâm bậc 33,7 cm; không dùng để xác nhận
  cấu hình sân/thang hiện tại. Script `verify_stair_scale.py` có thể tạo lại
  hai tệp này theo cấu hình mới, nhưng sẽ thay thế bằng chứng lịch sử.
- Bộ kiểm tra tự động gồm 9 bài chuyển động nhân vật, 8 bài điều hướng sân/
  leo thủ công/camera và 5 bài cảnh hải đăng (13 bài điều hướng và cảnh).
  Kiểm tra ở 20/30/60 FPS dùng bước thời gian mô phỏng, không phải kết quả
  đo FPS trên điện thoại.
- `courtyard_design.png`, `courtyard_entrance.png`, `courtyard_plan.png` là
  ảnh render Blender, không phải ảnh chụp gameplay. Chúng xác nhận bố cục
  tĩnh; đánh giá cảm giác điều khiển và camera cần thao tác trong trình duyệt.
- Tia kiểm tra chỉ lấy mẫu một số vị trí trên đường và ở lối cửa/lan can;
  không chứng minh toàn bộ cơ thể không xuyên mọi chi tiết của mô hình.

Khi triển khai, đưa GLB nén, hai cấu hình JSON và mã điều khiển/va chạm/chỉnh
tư thế vào cùng một phiên bản để hình nhìn thấy khớp với mặt đi bộ.
