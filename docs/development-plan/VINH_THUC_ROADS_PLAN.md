# Kế hoạch dựng trục đường và giao thông đảo Vĩnh Thực

Ngày 19/11/2026. Chờ thầy duyệt. Làm trước [kế hoạch dựng nhà](VINH_THUC_HOUSES_PLAN.md), vì nhà sẽ xếp theo đường.

## 1. Hiện trạng

| Hạng mục | Hiện có | Vấn đề |
| --- | --- | --- |
| Đường chính | 27,1 km, từ Cảng Vụng Dầm đến hải đăng, lấy từ OpenStreetMap | Vẽ bằng nét mảnh cố định, không có bề rộng, không thấy mặt đường khi tới gần |
| Đường phụ | 19,1 km (khu dân cư, đường mòn) | Chỉ hiện khi camera hạ thấp, cùng kiểu nét |
| Dốc | 2,5 km đường chính và 2,9 km đường phụ dốc hơn 12% | Đường bám theo lưới cao độ 30 m nên gồ ghề; với độ phóng đại chiều đứng 3 lần, có đoạn trông như leo vách |
| Đoạn qua chỗ trũng | Khoảng 0,7 km đường chính đi qua chỗ cao độ gần 0 (đầm, bãi) | Đường nằm sát mặt nước, không có đê hay cầu |
| Tuyến phà | Vạn Gia – Mũi Ngọc, nét đứt | Không có tàu chạy, chưa có bến phà |
| Cảng Vạn Gia | Khối công trình thu nhỏ | Mô hình Blender đã dựng nhưng chưa duyệt và chưa đưa vào |

Theo bản đồ quy hoạch giao thông: trục Đông–Tây, nhánh Bắc–Nam từ cảng Vạn Gia, đường dọc bờ Bắc ra mũi Đông, Bến cảng Vạn Gia, Khu neo đậu tàu Vạn Gia. Dữ liệu OpenStreetMap đã có gần đủ các tuyến này; đoạn bờ Bắc ngay phía Đông cảng có thể còn hở (cần kiểm tra).

## 2. Đề xuất

### Bước 1. Mặt đường thật thay cho nét vẽ

- Dựng dải mặt đường có bề rộng, trải trên địa hình, chia ba cấp:

  | Cấp | Mặt đường | Bề rộng hiển thị |
  | --- | --- | --- |
  | Trục chính | Nhựa xám, vạch giữa trắng nét đứt, lề nhạt | Khoảng 20 m (thật khoảng 7 m, phóng to cho thấy được) |
  | Đường liên thôn, khu dân cư | Bê tông xám sáng | Khoảng 12 m |
  | Đường mòn | Đất nâu nhạt | Khoảng 6 m, chỉ hiện khi tới gần |

- Ngã ba, ngã tư được bo tròn để các dải đường nối liền.
- Mỗi cấp đường là một lệnh vẽ.

### Bước 2. Đường êm theo địa hình

- **Làm phẳng nền đường:** sửa lưới địa hình để đào, đắp một dải dọc đường, cho đường không chìm vào sườn đồi hay lơ lửng.
- **Làm mượt độ dốc:** san cao độ dọc tuyến, giới hạn khoảng 10%, để đường trông như đường đèo uốn theo sườn.
- **Đoạn qua chỗ trũng:** dựng đê có kè đá hai bên, hoặc cầu ngắn nếu bên dưới có nước.

### Bước 3. Công trình giao thông

- **Cảng Vạn Gia:** đưa mô hình Blender vào sau khi thầy duyệt và chỉnh xong.
- **Bến phà tạm Vạn Gia** và **Bến Mũi Ngọc** phía đất liền.
- **Khu neo đậu tàu Vạn Gia:** cụm thuyền đánh cá neo ở bờ Bắc, phía Tây cảng.
- **Biển báo, cột mốc** ở các ngã ba chính, ghi tên hướng đi (ví dụ "Hải đăng", "Cảng Vạn Gia").

### Bước 4. Giao thông chuyển động (tùy chọn)

- Tàu khách chạy qua lại trên tuyến phà Vạn Gia – Mũi Ngọc.
- Vài xe máy, ô tô nhỏ tự chạy trên trục chính cho cảnh có sức sống. Đây là xe trang trí, người chơi không lái.

### Bước 5. Lớp "Quy hoạch 2030" (tùy chọn)

- Nút bật tắt hiện các tuyến đường, cảng trong quy hoạch mà thực tế chưa có, bằng nét đứt màu khác, để học sinh so sánh hiện tại và tương lai.
- Mình tự vẽ lại theo bản đồ quy hoạch, không nhúng ảnh của báo.

## 3. Hiệu năng

Mặt đường khoảng 30–40 nghìn tam giác, 3 lệnh vẽ. Xe và tàu chạy là các lệnh vẽ nhỏ, tắt ở mức chất lượng Thấp.

## 4. Thứ tự và duyệt

1. Làm Bước 1 và 2, gửi thầy ảnh bốn góc nhìn (toàn đảo, nhìn nghiêng, đường đèo, đoạn qua đầm) để duyệt.
2. Làm Bước 3 sau khi thầy duyệt mô hình Cảng Vạn Gia.
3. Bước 4 và 5 làm nếu thầy muốn.

Ước lượng: Bước 1 và 2 khoảng một phiên; Bước 3 khoảng một phiên; Bước 4 và 5 mỗi bước khoảng nửa phiên.

## 5. Cần thầy quyết định

1. Dựng đường theo **hiện trạng** (OpenStreetMap, đề nghị), hay vẽ theo **quy hoạch**?
2. Đường có **tên** không (ví dụ "Đường xuyên đảo")? Nếu có, thầy cho danh sách tên.
3. Có làm **xe và tàu chạy** (Bước 4) không?
4. Có làm **lớp Quy hoạch 2030** (Bước 5) không?

## 6. Tiến độ

- **19/11/2026, Bước 1 và 2 (chờ thầy duyệt):** thầy chọn dựng theo hiện trạng (OpenStreetMap).
  - Dữ liệu: 27,1 km đường chính, 10,0 km đường phụ, 9,1 km đường mòn (`npm run roads:build`, đường mòn nay tách riêng).
  - Nền đường: `client/scripts/lib/island-ground.mjs` tính mặt cắt dọc êm (giới hạn dốc 10%, đắp tối thiểu 1,8 m qua đầm) rồi kéo các đỉnh lưới địa hình trong vòng 45 m quanh đường về cao độ đó. Đoạn dốc trên 12% giảm từ 4,1 km xuống 0; dốc lớn nhất từ 35% xuống 11%. Địa hình, mặt đường và cây cùng dùng mặt đất này.
  - Mặt đường: `npm run roadmesh:build` dựng `vinh_thuc_roads.glb`: trục chính rộng 20 m có vạch giữa vàng nét đứt, đường phụ bê tông 12 m, đường mòn đất 6 m (chỉ hiện khi camera hạ thấp), 61 ngã ba bo tròn, kè đá ở đoạn qua đầm. Khoảng 25 nghìn tam giác, 0,55 MB (không lượng tử hóa để khỏi lệch khỏi địa hình).
  - Nhìn từ xa (camera cao hơn 35 đơn vị) vẫn vẽ thêm nét mảnh theo tim đường, vì mặt đường thật khi đó quá nhỏ.
  - Thứ tự chạy lại khi đổi đường: `roads:build` → `terrain:build` → `roadmesh:build` → `trees:build` → `models:compress -- terrain` và `-- roads`.
- **19/11/2026, đường phụ dễ thấy hơn (theo ý thầy):** đường phụ rộng 16 m, màu kem sáng; đường mòn rộng 10 m, màu đất sáng, hiện khi camera thấp hơn 130 đơn vị; nét mảnh của đường phụ hiện ở mọi góc nhìn xa (dày 2,2 điểm ảnh), đường chính 3 điểm ảnh.
