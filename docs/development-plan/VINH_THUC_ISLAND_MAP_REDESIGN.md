# Kế hoạch thiết kế lại bản đồ tổng quan đảo Vĩnh Thực

Ngày 14/11/2026. Nối tiếp [nghiên cứu bản đồ tổng thể](VINH_THUC_OVERVIEW_MAP_STUDY.md) và [bản thiết kế nâng cấp](../EDUVERSE_3D_UPGRADE_BLUEPRINT.md). Đây là kế hoạch, chưa có dòng code nào được viết.

## 1. Hiện trạng

Sa bàn đang chạy (`vinh_thuc_island_v3.glb`) được sinh bởi [build-island-from-map.py](../../client/scripts/build-island-from-map.py) từ một ảnh ranh giới hành chính ([reference_vinh_thuc_map.png](../../assets/school/reference_vinh_thuc_map.png)).

| Điểm | Hiện tại |
| --- | --- |
| Đường bờ | Vẽ lại theo ảnh ranh giới, đúng hình dáng chung |
| Địa hình | Đồi do script tự đặt, không theo cao độ thật |
| Tỷ lệ | Cả đảo ép vào 144 đơn vị, công trình phóng to nhiều lần so với đảo |
| Vị trí địa danh | Tọa độ riêng của sa bàn, không quy đổi được ra GPS |
| Xung quanh | Chỉ có biển, không thấy đất liền Móng Cái hay các đảo lân cận |
| Dung lượng | 0,54 MB, 92.377 tam giác, 28 lệnh vẽ |

Dự án đã có sẵn dữ liệu thật nhưng chưa dùng cho sa bàn:

- **Cao độ:** lưới Copernicus GLO-30 ([vinh-thuc.f32](../../client/public/terrain/vinh-thuc.f32), 1297×793 điểm, khoảng 30 m mỗi điểm). Điểm cao nhất trong vùng đảo là khoảng 166 m.
- **Ảnh tô màu:** [vinh-thuc-style.png](../../client/public/terrain/vinh-thuc-style.png), có đường bờ thật, dải màu nước theo khoảng cách tới bờ, cả đất liền và các đảo lân cận.
- **Tọa độ GPS:** mới có một điểm là Phân hiệu Vĩnh Trung (21,3712629° B, 107,9043412° Đ), ghi chú là chờ kiểm chứng thực địa.

## 2. Mục tiêu

1. Đảo có hình dáng, địa hình và tỷ lệ thật, học sinh nhận ra được nơi mình sống.
2. Mọi địa danh đặt theo tọa độ GPS, thêm điểm mới chỉ cần thêm một dòng dữ liệu.
3. Ba cấp xem theo nghiên cứu trước: **Toàn đảo → Khu vực → Điểm tham quan**.
4. Không nặng hơn hiện tại: lượt mở đầu vẫn dưới 3 MB, sa bàn dưới 60 lệnh vẽ.
5. Dùng được trên điện thoại: nhãn không chồng nhau, chọn điểm được bằng danh sách.

## 3. Thiết kế đề xuất

### 3.1 Địa hình từ dữ liệu thật

- Viết script Node (`scripts/build-island-terrain.mjs`) cắt lưới cao độ quanh đảo, dựng lưới tam giác và xuất GLB. Không cần Blender.
- Vùng phẳng dùng ít tam giác, vùng dốc và đường bờ dùng nhiều. Mục tiêu dưới 60.000 tam giác (hiện 92.377).
- Phủ ảnh tô màu có sẵn lên địa hình thay cho 28 vật liệu rời. Cả đảo còn một lệnh vẽ.
- Đất liền và đảo lân cận giữ lại nhưng làm mờ và thấp chi tiết, để định hướng.
- Mặt biển là một mặt phẳng riêng có gợn sóng nhẹ; ở mức chất lượng Thấp thì đứng yên.

### 3.2 Hệ tọa độ

- Một hàm duy nhất đổi (kinh độ, vĩ độ) sang tọa độ cảnh, dùng chung cho địa hình, địa danh, camera và bản đồ mini.
- Tỷ lệ ngang giữ đúng. Tỷ lệ đứng là điểm cần quyết định (mục 6).

### 3.3 Địa danh

- Tách khỏi code thành `public/content/island-pois.json`. Mỗi điểm có: mã, tên, kinh độ, vĩ độ, nguồn tọa độ, loại, mức ưu tiên, ảnh, mô tả, cảnh 3D nếu có.
- Độ cao của ghim lấy từ địa hình, không nhập tay.
- Năm chặng ưu tiên theo nghiên cứu trước: Bến Vạn Gia, Phân hiệu Vĩnh Trung, Bến Hèn, Bãi Đầu Đông, Hải đăng Vĩnh Thực. Năm điểm còn lại trong dữ liệu hiện có là địa danh phụ.
- Bài test kiểm tra mọi điểm nằm trên đất liền của đảo và mọi ảnh tồn tại.

### 3.4 Nhãn và ghim

- Ghim là phần tử HTML bám theo điểm 3D, chữ luôn nét ở mọi mức thu phóng.
- Chặng ưu tiên: chấm vàng, nhãn luôn hiện. Địa danh phụ: chỉ hiện khi camera đủ gần.
- Khi hai nhãn chồng nhau, nhãn ưu tiên thấp hơn tự ẩn.
- Trên điện thoại có nút **Các chặng** mở danh sách để chọn.

### 3.5 Camera ba cấp

| Cấp | Góc nhìn | Hiện gì |
| --- | --- | --- |
| Toàn đảo | Gần thẳng từ trên xuống, hướng Bắc lên trên | Đảo, đất liền mờ, 5 chặng ưu tiên |
| Khu vực | Nghiêng khoảng 45° để thấy độ nổi | Thêm địa danh phụ, đường, công trình thu nhỏ |
| Điểm tham quan | Thẻ thông tin mở, nút **Bắt đầu đi bộ** | Ảnh, mô tả, lối vào cảnh 1:1 nếu có |

- Chọn ghim thì camera bay tới. Nút **Toàn đảo** đặt lại góc nhìn.
- Từ cảnh 1:1 quay về thì khôi phục đúng điểm và góc đang xem.

### 3.6 Công trình và đường

- Công trình thu nhỏ (trường, hải đăng, bến tàu, đền) đặt theo GPS, phóng to vừa đủ nhìn thấy ở cấp Khu vực và ẩn ở cấp Toàn đảo.
- Đường chính lấy từ OpenStreetMap, vẽ thành nét mảnh bám địa hình. Dùng thì phải ghi nguồn theo giấy phép ODbL.
- Hải đăng dùng lại mô hình đã duyệt. Các điểm chưa có mô hình thì dùng khối đơn giản.

## 4. Các đợt triển khai

Sa bàn mới phát triển song song sau địa chỉ `?map=new`. Sa bàn cũ vẫn là mặc định cho đến khi thầy duyệt.

| Đợt | Nội dung | Xong khi |
| --- | --- | --- |
| A | Script dựng địa hình, phủ ảnh tô màu, mặt biển | Mở `?map=new` thấy đảo đúng hình, đúng độ nổi |
| B | Hàm đổi tọa độ, file địa danh, bài test | 10 địa danh hiện đúng chỗ trên đảo |
| C | Ghim, nhãn, danh sách **Các chặng**, thẻ thông tin | Chọn được mọi điểm trên máy tính và điện thoại |
| D | Camera ba cấp, bay tới điểm, quay về từ cảnh 1:1 | Đi trọn tuyến đảo → điểm → trường → về đảo |
| E | Công trình thu nhỏ, đường, bản đồ mini | Cấp Khu vực có đường và công trình |
| F | Đo, so với sa bàn cũ, đổi mặc định, gỡ sa bàn cũ | Thầy duyệt; số đo đạt mục tiêu ở mục 2 |

Đợt A và B là nền, phải xong trước. C, D, E làm lần lượt vì cùng sửa phần giao diện đảo.

## 5. Rủi ro

- **Tọa độ địa danh.** Chín trong mười điểm chưa có GPS. Mình tra được tọa độ gần đúng từ bản đồ công khai, nhưng cần thầy xác nhận vì thầy biết thực địa.
- **Độ phân giải 30 m.** Đủ cho cấp Toàn đảo và Khu vực. Các đảo nhỏ trong vịnh Bến Hèn và mũi hải đăng có thể bị mất nét, cần so với ảnh ranh giới và chỉnh tay đường bờ nếu lệch.
- **Đảo thật thấp và dài.** Đỉnh cao nhất khoảng 166 m trên chiều dài cỡ 17–19 km (ước lượng từ lưới dữ liệu). Ở tỷ lệ đứng 1× đảo trông gần như phẳng.
- **Vị trí trường.** Mô hình Phân hiệu Vĩnh Trung phải đặt đúng hướng và cao độ trên địa hình thật; tọa độ hiện ghi là chờ kiểm chứng.

## 6. Việc cần thầy quyết định

1. **Hướng đi:** dựng lại đảo từ dữ liệu thật như kế hoạch này (đề xuất), hay giữ sa bàn vẽ tay hiện tại và chỉ làm lại ghim, nhãn, camera?
2. **Tỷ lệ đứng:** 1× (đúng thật, gần phẳng) hay phóng đại khoảng 2–2,5× (đề xuất, núi dễ nhận ra hơn)? Nghiên cứu trước chọn 1×.
3. **Tọa độ địa danh:** thầy cung cấp, hay mình tra bản nháp để thầy sửa?
4. **Phạm vi:** chỉ đảo Vĩnh Thực, hay hiện cả đất liền Móng Cái và các đảo lân cận ở dạng mờ (đề xuất)?

## 7. Tiến độ

- **14/11/2026, bản thử Đợt A:** mở bằng `?map=new` (thêm `&exag=2` để đổi độ phóng đại chiều đứng, mặc định 3; thêm `&stats` để xem số đo). Sa bàn cũ vẫn là mặc định.
  - Địa hình: `npm run terrain:build` dựng lưới 60 m từ Copernicus GLO-30, 56.544 tam giác, 0,22 MB sau khi nén.
  - Ảnh phủ: Sentinel-2 cloudless 2016 của EOX (giấy phép CC BY 4.0, phải ghi nguồn; dòng ghi nguồn đã có ở góc dưới phải), 3072×2010, 0,42 MB.
  - Mặt biển dùng ảnh tô màu có sẵn. Cả cảnh 4 lệnh vẽ, 60 FPS trên máy Mac.
  - Hai ghim thử: Phân hiệu Vĩnh Trung (tọa độ từ hồ sơ) và Hải đăng (ước lượng từ ảnh vệ tinh). Nhãn Trà Cổ, Đảo Cái Chiên là ước lượng, chờ đối chiếu.
  - Chưa có: mây, công trình thu nhỏ, đường, danh sách các chặng, camera ba cấp. Mép vùng dữ liệu biển còn lộ thành một dải ở chân trời.
