# Nghiên cứu cấu trúc Cảng Vạn Gia (đảo Vĩnh Thực)

Ngày 20/11/2026. Mục đích: có sơ đồ bố trí cảng sát thực tế để sau này dựng cảnh 3D theo Style C. Chưa khảo sát thực địa. Chưa sửa code hay mô hình.

Tệp kèm theo trong thư mục này:

- `so_do_cang_van_gia.svg`: sơ đồ bố trí hiện trạng, lưới 50 m, đánh số 1–11.
- `anh_ve_tinh_doi_chieu.jpg`: ảnh vệ tinh có chồng đường bờ và đường của OpenStreetMap, cùng số với sơ đồ. Ảnh chỉ dùng để tham khảo nội bộ, không đưa vào ứng dụng.

Quy ước mức tin cậy dùng trong tài liệu:

- **[XM]** Đã xác minh: có văn bản nhà nước, báo chính thống, hoặc dữ liệu OSM khớp với ảnh vệ tinh.
- **[ẢNH]** Đọc từ ảnh vệ tinh. Vị trí sai khoảng ±10 m. Chưa rõ năm chụp.
- **[ĐOÁN]** Suy luận. Cần thầy hoặc người địa phương xác nhận.

---

## 1. Tóm tắt

1. Cảng Vạn Gia nằm ở **bờ Bắc đảo Vĩnh Thực**, nhìn sang Mũi Ngọc (đất liền Móng Cái) cách khoảng 4,7 km theo phương Bắc–Đông Bắc. Điểm bến trên OSM: **21,39299° B, 107,94538° Đ**. Tọa độ này trùng với `island-cang-van-gia` trong `client/src/education/island-places.json`. **[XM]**
2. Thực tế đây là **một cụm bến nhỏ dài khoảng 450 m dọc bờ**, gồm ba phần: (a) mũi đất có điểm bến khách và cụm nhà công vụ, (b) bãi cảng hàng hóa san lấp khoảng 0,76 ha ở phía Tây, mép bến khoảng 130 m, (c) dãy nhà dân dọc đường trục và ven bờ phía Đông. **[ẢNH + OSM]**
3. Trong quy hoạch cảng biển, "bến cảng Vạn Ninh, Vạn Gia" thuộc **cảng biển Quảng Ninh, nhóm "khu bến khác"**. Quy hoạch cho tiếp nhận tàu đến 20.000 tấn, có bến tổng hợp, hàng lỏng/khí, hành khách và bến cho phương tiện thủy nội địa. Đây là **định hướng**, chưa phải công trình đã có. **[XM]**
4. Luồng hàng hải Vạn Gia hiện hữu: đáy rộng **120 m**, độ sâu **−6,0 m** (đo 7/2020) và **−5,8 m** (đo 7/2024) theo số 0 hải đồ. **[XM]** Tọa độ tim luồng và vị trí phao chưa lấy được.
5. Năm 2026: tháng 6 khởi công cải tạo **bến phà tạm** ở khu cảng. Ngày 12/11/2026 công bố mở **Bến thủy nội địa xã Vĩnh Thực** tại thôn Vạn Gia. Bến có tổng diện tích quy hoạch 16.000 m² (đất 7.307 m², nước 8.693 m²), **bến nghiêng bê tông** cho phà một lưỡi, khai thác đến hết 31/12/2027. **[XM]** Vị trí chính xác của bến nghiêng chưa xác định.

## 2. Vị trí và đối chiếu với dữ liệu đảo

Gốc tọa độ của sơ đồ là điểm bến OSM (node 642980512, `amenity=ferry_terminal`, tên "Vạn Gia"). Trục x hướng Đông, trục y hướng Bắc, đơn vị mét.

| Điểm | x, y (m) | Vĩ độ, kinh độ (WGS-84) | Nguồn |
|---|---|---|---|
| 1. Điểm bến khách (mốc) | 0, 0 | 21,39299, 107,94538 | OSM [XM] |
| 2. Tâm cụm nhà công vụ trên mũi đất | 10, −22 | 21,39279, 107,94548 | [ẢNH] |
| 3. Bãi bê tông nhỏ đầu đường xuống bến | −45, −52 | 21,39252, 107,94495 | [ẢNH] |
| 4. Góc Tây Bắc bãi cảng hàng hóa | −262, −95 | 21,39213, 107,94286 | OSM đường bờ [XM] |
| 4. Góc Đông Bắc bãi (đầu mép bến) | −132, −74 | 21,39232, 107,94411 | OSM đường bờ [XM] |
| 4. Tâm bãi | −170, −120 | 21,39190, 107,94374 | [ẢNH] |
| 5. Bến nhỏ phía Đông bãi | −93, −84 | 21,39223, 107,94449 | [ẢNH] |
| 7. Đường trục rẽ vào bãi | −95, −130 | 21,39181, 107,94447 | OSM [XM] |
| 9. Nhà mái dài phía Đông | 187, −14 | 21,39286, 107,94719 | [ẢNH] |
| 6. Thuyền cá neo (tâm) | −180, −45 | 21,39258, 107,94365 | [ẢNH] |
| 11. Sà lan, tàu hàng neo (tâm) | khoảng −100, +450 | 21,39706, 107,94442 | [ẢNH] |

Đối chiếu với các địa danh khác trong `island-places.json`, tính từ điểm bến:

- Trường TH&THCS Vĩnh Thực: 224 m về phía Đông, 2.585 m về phía Nam. Đường trục OSM (tertiary, way 528534213) nối thẳng từ cảng xuống khu này.
- Phân hiệu Vĩnh Trung: 4,25 km Tây, 2,4 km Nam.
- Hải đăng Vĩnh Thực: 5,9 km Đông, 0,36 km Bắc.
- Mũi Ngọc (bến OSM node 3548486132): 2,09 km Đông, 4,67 km Bắc. Tuyến OSM `route=ferry` (way 528534214) dài 5,35 km.

Cao độ địa hình (Copernicus DEM 30 m, `client/public/terrain/vinh-thuc.f32`):

- Mũi đất phía sau điểm bến lên dốc nhanh: khoảng 10 m ở 30 m vào bờ, 20–25 m ở 60 m, 40–50 m ở 100–150 m.
- Bãi cảng hàng hóa và thung lũng đường trục thấp và phẳng: khoảng 2–6 m.
- Đồi phía Tây bãi cao lên 30–50 m sau khoảng 200 m.

Lệch giữa OSM và ảnh: ở mũi đất, đường bờ OSM nằm ra phía biển khoảng 10–15 m so với ảnh. Khi dựng cảnh nên lấy mép bến theo ảnh, giữ điểm bến OSM làm mốc định vị.

## 3. Các hạng mục

Số thứ tự trùng với sơ đồ.

### 3.1. Bến khách và bến phà tạm (1)

- OSM có một cầu tàu rất ngắn, khoảng 8 m (way 1128033532, `man_made=pier`), từ mũi đất chìa ra biển. **[XM]**
- Ca nô khách Mũi Ngọc → Vạn Gia đi khoảng 15 phút (Công Thương, 2020). Lượng khách trung bình khoảng 450 lượt/ngày, cuối tuần và mùa du lịch 600–700 lượt (Thương hiệu & Công luận, 6/2026). **[XM]**
- Năm 2026 bến hiện có ở khu cảng được cải tạo thành **bến phà tạm**: cải tạo mặt bến và bổ sung hạng mục kỹ thuật để phà cập, rời. Báo không liệt kê hạng mục cụ thể. **[XM]**
- Bến thủy nội địa xã Vĩnh Thực: **bến nghiêng bê tông xi măng**, đón phà một lưỡi, có đường kết nối. Trung tâm Cung ứng dịch vụ xã quản lý. **[XM]**
- **[ĐOÁN]** Diện tích đất của bến mới (7.307 m²) gần bằng diện tích bãi cảng hàng hóa đo trên ảnh (khoảng 7.600 m²). Bến nghiêng có thể nằm ở bãi này hoặc ngay tại mũi đất. Hai bài báo ghi hai tên thôn khác nhau ("thôn Vạn Gia" và "thôn Vĩnh Thực 3"). Cần thầy xác nhận bằng ảnh chụp mới.

### 3.2. Cụm nhà công vụ trên mũi đất (2)

- Ảnh cho thấy 4–5 nhà mái ngói đỏ, khối 12–18 m, trong khuôn viên có tường rào khoảng 53 × 35 m, ngay sau điểm bến. **[ẢNH]**
- Báo chí xác nhận có **Hải quan cửa khẩu cảng Vạn Gia** (nay thuộc Chi cục Hải quan khu vực VIII) và **Đồn Biên phòng Cửa khẩu Cảng Vạn Gia** tại cảng. Bài Công Thương (2020) ghi trụ sở hải quan nằm gần bến. **[XM]** Chưa xác định được nhà nào thuộc cơ quan nào. **[ĐOÁN]**
- Theo nguyên tắc trong `VINH_THUC_PLANNING_MAPS_STUDY.md`, không đánh dấu hay mô tả đất quốc phòng. Trong cảnh chỉ nên ghi chung là "khu nhà công vụ cửa khẩu".

### 3.3. Bãi bê tông nhỏ và đường xuống bến (3)

- Bãi khoảng 30 × 15 m, nằm ở chỗ đường công vụ OSM (way 528534212, dài 86 m) rẽ ra mũi đất. **[ẢNH + OSM]**
- **[ĐOÁN]** Đây là chỗ xe đón khách, phù hợp với mô tả "nhà chờ, chỗ đỗ xe" trong cảnh 1:1 hiện có.

### 3.4. Bãi cảng hàng hóa (4)

- Nền san lấp hình gần tam giác, khoảng **0,76 ha**, mặt đất hoặc cát, có lối xe chạy. **[ẢNH]**
- Mép bến phía biển thẳng, dài khoảng **130 m**, chạy theo hướng Đông–Đông Bắc. Đường bờ OSM bám theo mép này. **[XM]**
- Phía Tây Nam có đường OSM (way 806395408) bao quanh bãi. Góc Tây Bắc có vài nhà nhỏ. **[XM + ẢNH]**
- **[ĐOÁN]** Đây là bến hàng của "cảng biển Vạn Gia". Năm 2017, UBND Móng Cái ghi cảng sâu hơn 10 m, tàu 10.000 tấn cập được. Con số này mâu thuẫn với độ sâu luồng −5,8 đến −6 m. Có thể nó chỉ vùng nước neo, chuyển tải ngoài eo, không phải mép bến này.

### 3.5. Bến nhỏ và dải hẹp phía Đông bãi (5)

- Một đoạn bờ kè khoảng 50 m nối bãi với chân mũi đất, có vài công trình nhỏ. **[ẢNH]**
- Dải tối hẹp, khoảng 6 × 86 m, chạy Bắc–Nam sát mép Đông của bãi. Có thể là mương thoát nước hoặc mái nhà dài. **[ĐOÁN]**

### 3.6. Thuyền cá neo (6)

- Khoảng 15–20 thuyền nhỏ và vài bè nằm trước bãi, cách bờ 20–60 m. **[ẢNH]**
- Bản đồ quy hoạch giao thông xã có ký hiệu "Khu neo đậu tàu Vạn Gia" ở bờ Bắc, phía Tây cảng. Vị trí này khớp. **[XM, theo bản đồ đăng báo]**
- Danh sách 11 khu neo đậu tránh trú bão cho tàu cá của Quảng Ninh (QĐ 582/QĐ-TTg, 2024) **không có Vạn Gia**. Vì vậy chỉ gọi là "chỗ neo đậu thuyền", không gọi là khu tránh trú bão chính thức.

### 3.7–3.8. Đường trục và nhà dọc đường (7, 8)

- Đường trục Bắc–Nam (OSM tertiary) đi từ mũi đất, qua thung lũng thấp sau bãi, xuống trung tâm xã. **[XM]**
- Ảnh cho thấy khoảng 15–20 nhà ống, mái tôn hoặc ngói, xếp liền phía Đông đường trong đoạn 50–160 m đầu. **[ẢNH]**
- Quy hoạch (QĐ 228, 2025) ghi bề rộng đường "khu vực cảng Vạn Gia" là 20,5–25 m. Đây là bề rộng quy hoạch, không phải đường hiện có (xem `docs/quy-hoach/vinh-thuc-2026-11-16/`).

### 3.9. Ven bờ phía Đông (9)

- Khoảng 6–8 nhà mái xám, tôn, dọc một đường ven bờ dài khoảng 200 m về phía Đông. Cuối dãy có một nhà mái dài màu trắng, khoảng 10 × 16 m. **[ẢNH]**
- OSM chưa có đoạn đường này. Quy hoạch có "đường dọc bờ Bắc từ Vạn Gia ra mũi Đông". **[ĐOÁN]** Đây là phần đầu của tuyến đó.

### 3.10. Tuyến ca nô và phà (10)

- OSM: Vạn Gia → Mũi Ngọc, `route=ferry`, không cho ô tô, dài khoảng 5,35 km, phương vị khoảng 24°. **[XM]**
- Tuyến phà Mũi Ngọc/Núi Đỏ – Vĩnh Thực dự kiến khai thác từ tháng 11/2026. Chưa có nguồn xác nhận đã chạy. Tỉnh đang tìm nhà đầu tư PPP cho tuyến phà chính thức. **[XM]**

### 3.11. Vùng nước, luồng, khu neo chờ (11)

- QĐ 1061/QĐ-BXD (29/6/2026), phụ lục quy hoạch kết cấu hạ tầng cảng biển: "Khu vực Mũi Chùa, Vạn Gia: vị trí vùng nước khu vực Mũi Chùa và Vạn Gia", phục vụ **neo chờ kết hợp chuyển tải hàng hóa**, tàu đến 20.000 tấn. Mục luồng hàng hải có "Luồng Vạn Gia cho tàu trọng tải đến 20.000 tấn hoặc lớn hơn khi đủ điều kiện". **[XM]**
- Ảnh vệ tinh có 4–6 sà lan, tàu hàng dài 50–80 m neo cách bờ khoảng 350–600 m. **[ẢNH]**
- Thông báo hàng hải QNH-17-2020: đáy luồng rộng 120 m, sâu −6,0 m (bình đồ 13/7/2020). QNH-24-2024: −5,8 m (bình đồ 23/7/2024). Chiều dài luồng (một số bài báo ghi 9,2 km) và tọa độ phao chưa lấy được từ văn bản gốc. **[XM một phần]**
- Vùng nước cảng biển khu vực Vạn Gia – Hải Hà do Cảng vụ Hàng hải Quảng Ninh quản lý theo Thông tư 50/2025/TT-BXD, hiệu lực 1/2/2026. Chưa đọc được danh sách điểm ranh giới VH1… (trang văn bản không tải được). **[XM một phần]**
- Năm 2023, Đồn Biên phòng ghi nhận 22.702 lượt phương tiện vào cảng: 48 tàu, 22.645 xuồng, cùng 1.567 lượt phương tiện thủy nội địa đến. Hàng chủ yếu là hàng đông lạnh (156.405 tấn). **[XM]** Như vậy phần lớn phương tiện là xuồng, ca nô nhỏ.

## 4. Tàu thuyền hoạt động

| Loại | Căn cứ | Gợi ý dựng (Style C) |
|---|---|---|
| Ca nô, tàu khách nhỏ Mũi Ngọc – Vạn Gia | Báo 2020, 2026 [XM] | Dài 12–15 m, vỏ trắng có sọc màu, cabin kính |
| Phà một lưỡi (từ cuối 2026) | QĐ mở bến [XM] | Phà sàn phẳng, một ram ở mũi, dài 30–40 m [ĐOÁN về cỡ] |
| Xuồng, thuyền cá gỗ | Ảnh, số liệu biên phòng [XM] | Dài 6–10 m, gom thành cụm neo |
| Sà lan, tàu hàng neo ngoài eo | Ảnh [ẢNH], QĐ 1061 [XM] | Dài 50–80 m, đặt xa bờ 400–600 m, chỉ làm cảnh nền |
| Tàu công vụ (hải quan, biên phòng) | Báo [XM về có lực lượng]; cỡ [ĐOÁN] | Tàu vỏ xanh hoặc xám, dài 15–25 m |

## 5. So với cảnh 1:1 hiện có

Cảnh hiện có gồm `assets/landmarks/cang_van_gia/build_cang_van_gia.py`, `client/src/world/vangia/` và `client/src/education/van-gia-stops.json`. Cảnh dựng một mặt bến thẳng dài khoảng 223 m, có bậc xuống bến tàu khách, cầu dẫn, dãy hải quan và trạm, hàng quán ven kè, cầu cảng bê tông có lan can, đồi phía sau.

Đối chiếu với ảnh vệ tinh:

- **Khớp:** đồi dốc ngay sau bến, cụm nhà mái đỏ cạnh điểm bến, dãy nhà và quán dọc đường, thuyền neo trước bến.
- **Khác:** bờ thật **không thẳng**. Mũi đất nhô ra ở điểm bến, bờ quặt khoảng 70 m vào trong rồi chạy thẳng sang Tây theo mép bãi hàng. Bãi hàng 0,76 ha và đường trục rẽ vào thung lũng **chưa có** trong cảnh.
- **Chưa rõ [ĐOÁN]:** cầu cảng bê tông dài có lan can trong cảnh tương ứng với công trình nào ngoài thực tế. Ảnh vệ tinh không thấy cầu tàu dài nào chìa ra biển, có thể vì ảnh chụp trước 2026. Thầy đối chiếu giúp với ảnh thầy đã chụp từ biển.

## 6. Kích thước gợi ý cho bản dựng sau (Style C)

Khung cảnh đề xuất rộng khoảng 600 × 350 m (x từ −300 đến +250, y từ −250 đến +100). Phạm vi này gồm mũi đất, bãi hàng, đường trục và mặt nước neo. Mỗi hạng mục:

| Hạng mục | Kích thước gợi ý | Ghi chú |
|---|---|---|
| Mép bến bãi hàng | 130 m, cao hơn nước 2,5–3,5 m | Kè đá có tường bê tông, tô đúng hướng ĐĐB |
| Bãi hàng | khoảng 0,76 ha, phẳng, nền đất pha cát | Vài container, đống vật liệu |
| Mũi đất bến khách | rộng khoảng 60 m, dốc lên 20 m sau 60 m | Giữ bậc và cầu dẫn đã có |
| Bến nghiêng phà | 15–20 m × 10–12 m, dốc khoảng 1:8 | [ĐOÁN]: chưa có bản vẽ |
| Khuôn viên nhà công vụ | 53 × 35 m, 4–5 nhà 2–3 tầng | Không ghi tên cơ quan quốc phòng |
| Đường trục | mặt đường hiện có 6–7 m | [ĐOÁN] theo ảnh |
| Dãy nhà ống | 15–20 căn, mặt tiền 4–6 m | Dùng lại kiểu nhà trong `VINH_THUC_HOUSES_PLAN.md` |

Giữ gốc tọa độ theo quy tắc dự án. Nếu dựng lại, nên đặt gốc cảnh ở điểm bến OSM (0, 0) để khớp với ghim trên bản đồ đảo.

## 7. Việc cần thầy xác nhận

1. Bến nghiêng phà 2026 nằm ở mũi đất (1) hay ở bãi hàng (4)? Một ảnh chụp mới là đủ.
2. Cầu cảng bê tông dài trong cảnh 1:1 là công trình nào ngoài thực tế?
3. Nhà nào là hải quan, nhà nào là trạm biên phòng? Thầy có muốn ghi tên trong cảnh không?
4. Có cần lấy bản gốc Thông tư 50/2025/TT-BXD và thông báo hàng hải mới nhất để vẽ ranh vùng nước, tim luồng không? (Cần một nguồn tải được bản PDF.)

## 8. Nguồn

Văn bản và thông báo:

1. Bộ Xây dựng, Phụ lục Quyết định 1061/QĐ-BXD ngày 29/6/2026, quy mô kết cấu hạ tầng cảng biển, mục I.1.đ, I.1.e và II.1. Bản PDF: [vpubnd.daklak.gov.vn](https://vpubnd.daklak.gov.vn/CMS/Content/VanBan/2026/7.2026/1061-QĐ-BXD%20PL.pdf). Đã đọc trực tiếp nội dung trích dẫn.
2. Cảng vụ Hàng hải Quảng Ninh, [Thông báo hàng hải QNH-17-2020 về thông số kỹ thuật luồng Vạn Gia](https://www.cangvuhanghaiquangninh.gov.vn/index.aspx?page=detail&id=1754), 17/7/2020.
3. Thông báo hàng hải QNH-24-2024 (bình đồ 23/7/2024, sâu 5,8 m): chỉ đọc qua trích đoạn kết quả tìm kiếm. Trang gốc trên vmsa.vn báo lỗi 404.
4. [Thông tư 50/2025/TT-BXD công bố vùng nước cảng biển Quảng Ninh](https://luatvietnam.vn/hang-hai/thong-tu-50-2025-tt-bxd-cong-bo-vung-nuoc-cang-bien-quang-ninh-hieu-luc-2026-421694-d1.html): chưa đọc được toàn văn.
5. [Quyết định 140/QĐ-TTg (2025), quy hoạch nhóm cảng biển](https://luatvietnam.vn/giao-thong/quyet-dinh-140-qd-ttg-2025-quy-hoach-nhom-cang-bien-ben-cang-thoi-ky-2021-2030-tam-nhin-nam-2050-386742-d1.html): bến Vạn Ninh, Vạn Gia 2–3 cầu cảng (theo bài tóm tắt).

Báo chí:

6. Báo Quảng Ninh, [Mở Bến thủy nội địa xã Vĩnh Thực](https://baoquangninh.vn/mo-ben-thuy-noi-dia-xa-vinh-thuc-post3426831.html), 12/11/2026.
7. Thương hiệu & Công luận, [Khởi công cải tạo, nâng cấp bến phà tạm khu vực cảng Vạn Gia](https://thuonghieucongluan.com.vn/khoi-cong-du-an-cai-tao-nang-cap-ben-pha-tam-khu-vuc-cang-van-gia-a322843.html), 16/6/2026.
8. Nguồn Lực, [Đồn Biên phòng Cửa khẩu Cảng Vạn Gia](https://nguonluc.com.vn/don-bien-phong-cua-khau-cang-van-gia-kien-dinh-vung-vang-niem-tin-cua-nguoi-dan-noi-hai-dao-a14139.html), 27/12/2023.
9. Công Thương, [Bình minh trên đảo Vĩnh Thực](https://congthuong.vn/binh-minh-tren-dao-vinh-thuc-131752.html), 24/1/2020.
10. Cổng TTĐT Móng Cái, [Giám sát công tác quản lý cảng, bến thủy nội địa](https://mongcai.gov.vn/vi-vn/tin/giam-sat-cong-tac-quan-ly-cang--ben-thuy-noi-dia-tai-tp-mong-cai/24021-58053-908505), 10/10/2017.
11. Báo Xây dựng, [Cảng vụ Hàng hải Quảng Ninh quản lý 6 khu vực hàng hải từ 1/2/2026](https://baoxaydung.vn/cang-vu-hang-hai-quang-ninh-quan-ly-6-khu-vuc-hang-hai-tu-1-2-2026-192251218230416203.htm).

Dữ liệu bản đồ:

12. © OpenStreetMap contributors (ODbL), tải qua API ngày 20/11/2026, khung 107,932–107,958 Đ, 21,384–21,402 B. Các đối tượng: node 642980512, 3548486132; way 1128033532, 528534212, 528534213, 528534214, 806395408, 962453377, 1411708654.
13. Esri World Imagery, mức phóng 18 (khoảng 0,56 m/điểm ảnh). Không rõ ngày chụp. Một phần phía Nam bị mây che.
14. Copernicus DEM GLO-30, theo `client/public/terrain/vinh-thuc.json`.
15. Tài liệu trong repo: `docs/development-plan/VINH_THUC_PLANNING_MAPS_STUDY.md`, `docs/quy-hoach/vinh-thuc-2026-11-16/NGHIEN_CUU_QUY_HOACH_VINH_THUC.md`.
