# Kế hoạch viết mô tả các điểm tham quan

Ngày 18/11/2026. Nối tiếp [kế hoạch tháng 11](NEXT_STEPS_PLAN_2026_11.md). Ưu tiên của thầy: làm chi tiết các điểm du lịch trước.

## 1. Danh sách điểm du lịch của đảo (thầy chốt 18/11/2026)

Cả đảo chỉ có 7 điểm sau:

| # | Điểm | Trên bản đồ hiện nay | Cảnh 1:1 |
| --- | --- | --- | --- |
| 1 | Cảng Vạn Gia | Có | Có (đi bộ được) |
| 2 | Hải đăng Vĩnh Thực | Có | Có (phần của thầy) |
| 3 | Đền thờ Tướng quân Lê Bá Đức | **Chưa có**, cần tọa độ | Chưa |
| 4 | Trường TH&THCS Vĩnh Thực | Có | Chưa |
| 5 | Phân hiệu Vĩnh Trung | Có | Có |
| 6 | Bãi Đầu Đông | Có | Chưa |
| 7 | Bãi Bến Hèn | **Chưa có**, cần tọa độ | Chưa |

Bản đồ hiện có 2 điểm **không thuộc danh sách** và sẽ bỏ: Trường Mầm non Vĩnh Thực, Cảng Vụng Dầm.

## 1b. Hiện trạng nội dung

| Nhóm | Số điểm | Nội dung hiện có | Vấn đề |
| --- | --- | --- | --- |
| Địa danh trên bản đồ đảo (`poiData.js`, `ISLAND_POI_LIST`) | 7 theo danh sách mới (5 đã có, 2 cần thêm) | Mỗi điểm 1 đoạn mô tả + 2–3 dòng chi tiết | Viết cho người làm mô hình, không phải cho học sinh. Nhiều số liệu chưa ghi nguồn. Các thẻ phần lớn dùng chung một ảnh. Đền Lê Bá Đức và Bãi Bến Hèn chưa có gì. |
| Điểm trong Phân hiệu Vĩnh Trung (`poiData.js`, `POI_LIST`) | 6 | Mô tả dài, nhiều số đo | Đọc như hồ sơ kỹ thuật ("chuẩn mặt bằng vệ tinh Google Maps", "52.0m × 8.6m"). Có ảnh thật. |
| Điểm trong Cảng Vạn Gia (`van-gia-stops.json`) | 6 | Bản nháp 2–3 câu mỗi điểm | Viết theo mô hình, chưa được thầy xác nhận. |
| Điểm trong cảnh hải đăng (`lighthouse/tour.js`) | 3 | Chỉ có lời chỉ đường | **Phần của thầy (Codex).** Claude chỉ đề xuất nội dung, không sửa file. |

Tổng: 22 điểm, trong đó Claude soạn được 19, còn 3 điểm hải đăng là phần thầy quyết định.

**Số liệu cần kiểm chứng trước khi giữ lại** (hiện đang hiện cho học sinh xem):
- Hải đăng: "xây năm 1962", "tháp 18 m", "tâm sáng 84,5 m", "tầm sáng 21 hải lý", "Mũi Đầu Tán".
- Cảng Vạn Gia: "Bến Mũi Ngọc ↔ Cảng Vạn Gia khoảng 15–20 phút".
- Bãi Đầu Đông: "bờ cát hình lưỡi liềm", "rừng phi lao".
- Phân hiệu Vĩnh Trung: các khẩu hiệu trích nguyên văn (cần khớp với ảnh chụp).

**Hai điểm mới cần viết từ đầu**, cần nguồn chắc chắn trước khi viết:
- Đền thờ Tướng quân Lê Bá Đức: nhân vật, sự tích, năm xây hoặc trùng tu, ngày lễ hội. Đây là nội dung lịch sử – tín ngưỡng nên chỉ dùng nguồn thầy, ban quản lý đền, chính quyền địa phương hoặc báo chính thống; không viết theo suy đoán.
- Bãi Bến Hèn: vị trí, đặc điểm bãi, nguồn gốc tên gọi (nếu có).

## 2. Người đọc và giọng văn

- **Người đọc:** học sinh tiểu học và THCS, đọc trên điện thoại khi đang đi trong cảnh 3D.
- **Giọng văn:** nói với học sinh ("em", "bạn"), câu ngắn, tả cái nhìn thấy được trước rồi mới tới thông tin.
- **Không dùng** số đo kỹ thuật, thuật ngữ dựng hình hay tên công cụ (Google Maps, mô hình, tỷ lệ 1:1) trong phần học sinh đọc. Những thông tin này chuyển sang ghi chú cho giáo viên.
- **Độ dài:** phần hiện trên thẻ không quá 60–80 chữ; phần mở rộng không quá 120 chữ.

## 3. Khuôn mẫu cho mỗi điểm

Mỗi điểm dùng cùng một cấu trúc, để thầy cô dễ sửa và để Chặng A (nhiệm vụ, câu hỏi) dùng lại được:

| Trường | Nội dung | Ví dụ (Bến tàu khách, Cảng Vạn Gia) |
| --- | --- | --- |
| `title` | Tên ngắn, người dân hay gọi | Bến tàu khách Vạn Gia |
| `intro` | 2–3 câu: đang đứng ở đâu, nhìn thấy gì | Em vừa bước xuống cầu dẫn. Hai bên cầu treo những chiếc lốp xe cũ… |
| `emCoBiet` | 1 điều thú vị, có nguồn | Lốp xe treo ở mép cầu giúp vỏ tàu không bị trầy khi sóng đánh vào bờ. |
| `hayTim` | 1 chi tiết để học sinh tự tìm trong cảnh | Tìm chiếc phao cứu sinh màu cam gần bậc lên xuống. |
| `cauHoi` | 1 câu trắc nghiệm, 3 đáp án, 1 đúng | Lốp xe treo ở mép cầu dùng để làm gì? |
| `anh` | Ảnh thật (nếu có), kèm người chụp | |
| `nguon` | Nguồn của từng thông tin | "Thầy xác nhận 20/11", "Cổng TTĐT Móng Cái" |
| `ghiChuGiaoVien` | Thông tin cho giáo viên: số đo, bối cảnh, gợi ý dạy | |

`hayTim` và `cauHoi` để sẵn trong dữ liệu nhưng chưa hiện cho tới khi làm Chặng A.

## 4. Quy tắc về nguồn

1. Mỗi thông tin có số, năm, tên riêng hay khẩu hiệu đều phải có `nguon`.
2. Thứ tự tin cậy: thầy hoặc người dân xác nhận > ảnh chụp thực địa > trang chính thức (UBND, Cổng TTĐT Móng Cái, Bộ đội Biên phòng, Cục Bảo đảm an toàn hàng hải) > báo chính thống > nguồn khác.
3. Chưa có nguồn thì không hiện cho học sinh. Ghi vào `ghiChuGiaoVien` với nhãn "cần kiểm chứng".
4. Phần tả cảnh (màu mái, lan can, biển hiệu…) lấy từ ảnh thật, không lấy từ mô hình 3D.

## 5. Dữ liệu để ở đâu

- Đưa toàn bộ mô tả ra file JSON trong `client/src/education/`, theo cách đã làm với `van-gia-stops.json`. Thầy cô sửa chữ mà không cần đụng code:
  - `island-places-content.json`: 7 địa danh trên bản đồ đảo (thay phần chữ trong `ISLAND_POI_LIST`).
  - `vinh-trung-stops.json`: 6 điểm trong Phân hiệu Vĩnh Trung.
  - `van-gia-stops.json`: chuyển sang khuôn mẫu mới.
- `poiData.js` chỉ giữ tọa độ, góc camera và cờ cảnh 3D, rồi đọc chữ từ JSON.
- Hải đăng: Claude viết đề xuất vào `docs/`, thầy tự đưa vào `tour.js` nếu muốn.

## 6. Các bước

| Bước | Việc | Ai làm | Kết quả |
| --- | --- | --- | --- |
| 1 | Chốt khuôn mẫu và giọng văn (mục 2–3) | Thầy duyệt | Khuôn mẫu cố định |
| 2 | Cập nhật bản đồ theo danh sách 7 điểm: bỏ Mầm non và Vụng Dầm, thêm ghim Đền Lê Bá Đức và Bãi Bến Hèn (khi có tọa độ); tách chữ ra JSON | Claude | Bản đồ đúng 7 điểm, chữ nằm trong JSON |
| 3 | Thu thập nguồn: ảnh của thầy, trang chính thức, báo | Thầy gửi ảnh và thông tin địa phương; Claude tìm nguồn công khai | Bảng nguồn cho từng điểm |
| 4 | Viết lại **Cảng Vạn Gia** (6 điểm) và thẻ đảo của nó | Claude soạn, thầy sửa | Mẫu hoàn chỉnh đầu tiên |
| 5 | Viết các địa danh còn lại trên bản đồ đảo: Trường TH&THCS, Phân hiệu Vĩnh Trung, Bãi Đầu Đông, Hải đăng (thẻ đảo), rồi Đền Lê Bá Đức và Bãi Bến Hèn khi đã có nguồn | Claude soạn, thầy sửa | 7/7 thẻ đảo |
| 6 | Viết lại 6 điểm Phân hiệu Vĩnh Trung cho học sinh | Claude soạn, thầy sửa | Số đo kỹ thuật chuyển sang ghi chú giáo viên |
| 7 | Đề xuất nội dung 3 điểm hải đăng | Claude soạn đề xuất | File đề xuất trong `docs/` cho thầy |
| 8 | Đọc thử với 2–3 học sinh, sửa chỗ khó hiểu | Thầy | Bản dùng được trên lớp |

Cảng Vạn Gia làm trước vì cảnh đã đi bộ được và đang có bản nháp. Xong điểm này thì thầy duyệt một lần, các điểm sau theo cùng mẫu.

## 7. Cần thầy cung cấp

- **Vị trí** của Đền thờ Tướng quân Lê Bá Đức và Bãi Bến Hèn (Plus Code hoặc ghim Google Maps, như thầy đã gửi cho hai trường).
- **Ảnh thật** của từng điểm, nhất là Cảng Vạn Gia, Đền Lê Bá Đức, Bãi Đầu Đông và Bãi Bến Hèn. Cho vào `assets/landmarks/<tên điểm>/reference/`.
- **Tư liệu về Đền Lê Bá Đức**: sự tích, ngày lễ, bảng giới thiệu ở đền (chụp ảnh là đủ).
- **Thông tin địa phương** khó tìm trên mạng: tên người dân hay gọi, giờ tàu, câu chuyện, phong tục, sản vật.
- **Xác nhận** các số liệu ở mục 1.
- **Quyết định:** học sinh lớp mấy là người đọc chính? Có cần bản tiếng Anh không?

## 8. Xong khi

- 19 điểm Claude phụ trách đều theo khuôn mẫu, có `nguon` cho mọi số liệu, và thầy đã duyệt.
- Bản đồ đảo có đúng 7 điểm theo danh sách của thầy, mỗi thẻ có ảnh riêng.
- Thầy cô sửa được mọi chữ trong JSON mà không cần đụng code.
