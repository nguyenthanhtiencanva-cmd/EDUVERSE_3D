# Kế hoạch dựng nhà minh họa trên bản đồ đảo Vĩnh Thực

Ngày 19/11/2026. Chờ thầy duyệt trước khi làm. Căn cứ: [nghiên cứu bản đồ quy hoạch](VINH_THUC_PLANNING_MAPS_STUDY.md).

## 1. Mục tiêu

Làng xóm hiện lên trên bản đồ như ảnh mẫu Nha Trang: nhà mái đỏ, mái tôn, nhà ống xếp dọc đường, dày ở trung tâm xã và quanh cảng, thưa dần ra hai đầu đảo. Đây là **nhà minh họa**: đúng vùng dân cư theo quy hoạch, không đúng từng căn nhà thật (không có dữ liệu nhà thật cho đảo).

## 2. Đặt nhà ở đâu

1. **Vùng được phép:** hành lang dân cư màu hồng trên bản đồ định hướng sử dụng đất (đất ở nông thôn xen thương mại dịch vụ) dọc trục Đông–Tây, và khu quanh Cảng Vạn Gia. Mình đặt ảnh quy hoạch khớp lên tọa độ thật bằng 4 điểm mốc (hai đầu đảo, cảng Vạn Gia, hải đăng) rồi tách vùng màu hồng. Ảnh này chỉ dùng để tính vị trí, không đưa vào ứng dụng. Sai số ước lượng 50–100 m.
2. **Bám đường:** nhà xếp hai bên đường chính và đường phụ trong vùng được phép, lùi khỏi mép đường 15–30 m, quay mặt ra đường, khoảng cách giữa hai nhà 20–40 m.
3. **Mật độ:** dày nhất quanh Trường TH&THCS Vĩnh Thực (trung tâm xã), Cảng Vạn Gia và Phân hiệu Vĩnh Trung; thưa dần ra xa.
4. **Không đặt nhà:** trong khu đất quốc phòng; trên bãi cát, mặt nước, sườn dốc; trong vòng 60 m quanh các công trình địa danh đã có; trên mặt đường.
5. **Số lượng:** dân số khoảng 5.407 người, tức khoảng 1.300–1.500 hộ. Vì nhà được phóng to để nhìn thấy (mục 3), mình đề nghị đặt **khoảng 500–700 nhà**, đủ cảm giác làng mà không chen chúc.

## 3. Hình dáng nhà

Năm kiểu nhà quen thuộc ở vùng ven biển miền Bắc, dựng bằng khối đơn giản:

| Kiểu | Mô tả | Tỷ lệ |
| --- | --- | --- |
| Nhà cấp 4 mái ngói đỏ | Một tầng, mái dốc hai phía | 35% |
| Nhà mái tôn xanh hoặc xám | Một tầng, mái tôn thấp | 25% |
| Nhà ống 2–3 tầng | Mặt tiền hẹp, mái bằng, tường kem, vàng, trắng | 20% |
| Nhà 2 tầng mái Thái | Mái dốc bốn phía, ngói đỏ | 15% |
| Nhà dịch vụ, quán | Một tầng có mái hiên, chỉ ở gần cảng và bãi biển | 5% |

- Màu tường thay đổi giữa các nhà (kem, vàng, trắng, hồng nhạt), màu mái theo kiểu nhà.
- **Phóng to khoảng 2,5 lần** so với nhà thật (cao khoảng 15–25 m trên bản đồ), cho tương xứng với cây (cao khoảng 45 m) và địa hình đã phóng đại chiều đứng.

## 4. Kỹ thuật và hiệu năng

- Script mới `npm run houses:build` sinh vị trí, kiểu và hướng nhà vào `client/src/education/island-houses.json`, chạy lại được khi đổi quy tắc.
- Vẽ mỗi kiểu nhà bằng một lệnh vẽ (tổng 5 lệnh vẽ), khoảng 30–40 tam giác mỗi nhà, tức khoảng 25 nghìn tam giác cho 700 nhà.
- Mức chất lượng Thấp vẽ một nửa số nhà.
- Chạy lại `trees:build` để bỏ cây trong khu nhà, tránh cây mọc giữa nhà.

## 5. Các bước và duyệt

1. Đặt ảnh quy hoạch khớp tọa độ, tách vùng dân cư. **Gửi thầy ảnh vùng dân cư vẽ đè lên bản đồ để duyệt.**
2. Sinh vị trí nhà, dựng năm kiểu nhà, bỏ cây trùng.
3. Xem trên trình duyệt ở bốn góc: toàn đảo, nhìn nghiêng, cận cảnh cảng Vạn Gia, cận cảnh trung tâm xã. **Gửi thầy ảnh để duyệt.**
4. Chỉnh theo nhận xét, rồi mới commit và đưa lên Vercel.

Ước lượng: một phiên làm việc.

## 6. Cần thầy quyết định

1. **Số lượng:** khoảng 500–700 nhà (đề nghị), hay dày hơn cho giống thật?
2. **Năm kiểu nhà** trên có hợp với nhà ở Vĩnh Thực không, có kiểu nào thầy muốn thêm hay bỏ?
3. **Khu quanh đầm Tây Nam** (vùng Bến Hèn) có nhà dịch vụ trên quy hoạch: có đặt nhà ở đó không?
4. **Phóng to 2,5 lần** có được không, hay muốn nhà nhỏ đúng tỷ lệ thật (khi đó chỉ thấy rõ lúc bay sát)?

## 7. Tiến độ

- **19/11/2026, bản dựng đầu (chờ thầy duyệt):** thầy chọn đặt nhà theo **hiện trạng**: nhà xếp dọc đường đang có, chỉ trong vùng dân cư.
  - Vùng dân cư: vùng hồng trên bản đồ quy hoạch (nới thêm 130 m để bù sai số nắn ảnh) cộng 5 vùng `landuse=residential` của OpenStreetMap, bỏ các khu đất quốc phòng. Lưu ở `client/scripts/data/settlement-zones.json`.
  - Quanh Cảng Vạn Gia (bán kính 550 m) cho đặt nhà dọc đường xuống cảng dù quy hoạch không tô hồng, để có xóm bến; chỗ này cho phép sườn dốc hơn một chút.
  - `npm run houses:build` sinh 491 nhà: cấp 4 mái ngói 178, mái tôn 132, nhà ống 99, mái Thái 51, quán 31 (quán chỉ ở gần cảng và bãi biển). Mỗi nhà rộng 18–26 m, cách nhau ít nhất 26 m, lùi 14–26 m khỏi mép đường.
  - Mật độ: khoảng 136 nhà trong vòng 1 km quanh Trường TH&THCS Vĩnh Thực, 83 nhà quanh Phân hiệu Vĩnh Trung, 24 nhà trong 600 m quanh Cảng Vạn Gia.
  - Vẽ bằng 10 lệnh vẽ (tường và mái của 5 kiểu nhà); mức chất lượng Thấp vẽ một nửa số nhà. `trees:build` bỏ cây trong vòng 26 m quanh nhà.
  - Nhìn toàn đảo từ xa thì nhà quá nhỏ để thấy; nhà hiện rõ khi bay tới một địa điểm.
- **19/11/2026, chỉnh theo ảnh đường ra Bến Hèn thầy gửi:**
  - **Đường ra Bãi Bến Hèn:** OpenStreetMap chỉ ghi là đường mòn và dừng cách bãi khoảng 400 m. `scripts/lib/village-lanes.mjs` nâng đường này thành đường phụ (bê tông) và nối thẳng xuống mép bãi; `roads:build` tự áp dụng mỗi lần chạy. Dọc đường có xóm khoảng 35 nhà.
  - **Kiểu nhà mới "nhà vườn":** nhà cấp 4 mái ngói có chái bếp vuông góc phía sau (hình chữ L nhìn từ trên). Ở xóm chủ yếu là nhà mái ngói một tầng (cấp 4, nhà vườn); nhà ống, nhà mái Thái chỉ ở gần trung tâm. Mái ngói chuyển sang màu cam đỏ, mái tôn xám xanh nhạt, tường vôi trắng, kem.
  - Nhà lệch hướng ngẫu nhiên tới khoảng 13°, lùi 10–32 m khỏi mép đường.
  - **Cây vườn:** `trees:build` thêm một đến ba cây nhỏ ở hai bên và sau mỗi nhà (563 cây), cách tim đường ít nhất 16 m.
  - Tổng 452 nhà: cấp 4 158, nhà vườn 151, mái tôn 59, nhà ống 27, mái Thái 35, quán 22. 12 lệnh vẽ.
