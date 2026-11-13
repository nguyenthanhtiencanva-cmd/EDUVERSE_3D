# Nghiên cứu bản đồ tổng thể Vĩnh Thực

Ba ảnh tham chiếu gợi ý một hành trình từ bản đồ nhìn xa, qua địa hình nhìn nghiêng, đến sa bàn công trình. Với Vĩnh Thực, có thể dùng ba mức **Toàn đảo → Khu vực → Điểm tham quan** để dẫn người dùng vào các chặng du lịch.

| Ảnh | Đặc điểm quan sát được | Áp dụng cho Vĩnh Thực |
| --- | --- | --- |
| 1. Toàn quốc | Góc nhìn gần từ trên xuống. Phần địa lý chính rõ nét, vùng ngoài giảm tương phản. Ghim có nhãn ngắn. Dải nút ở mép dưới chuyển vùng. | Mở bằng toàn đảo và một phần bờ đất liền để định hướng. Hiện một nhóm nhỏ ghim ưu tiên. Có nút **Toàn đảo** để đặt lại góc nhìn và **Các chặng** để chọn địa điểm từ danh sách. |
| 2. Nha Trang | Camera nghiêng thấp hơn để thấy độ nổi của núi, vịnh và bờ biển. Màu nước sáng ở ven bờ, đậm hơn phía ngoài. Các khu tương tác có nhãn vàng, địa danh nền dùng chữ trắng. | Khi chọn ghim, camera bay tới khu vực và nghiêng để lộ hình địa hình. Dùng màu và kích thước nhãn để phân biệt khu vực có thể chọn với tên địa danh đọc để định hướng. |
| 3. Chi tiết thành phố | Nhà nền được giản lược thành khối sáng. Công trình nổi bật có hình dáng riêng. Nhãn của điểm đang chọn có viền xanh. | Trong mỗi khu vực, dựng khối nhà và cây nhẹ, dành mô hình chi tiết cho bến, trường, bãi biển hoặc hải đăng có tư liệu. Chọn điểm để mở thông tin và vào cảnh đi bộ nếu đã sẵn sàng. |

Các ảnh cho thấy cách trình bày và chuyển cấp độ. Chúng chưa đủ để xác nhận công nghệ, nguồn bản đồ hay tỷ lệ của bản tham chiếu.

## Luồng sử dụng đề xuất

1. **Toàn đảo.** Khung hình bao trọn đảo, nhìn gần từ trên xuống và định hướng Bắc. Hiện trước các chặng trong kịch bản hiện có gồm Bến Vạn Gia, Phân hiệu Vĩnh Trung, Bến Hèn, Bãi Đầu Đông và Hải đăng Vĩnh Thực. Trên màn hình nhỏ, gom các nhãn bị chồng và cho chọn chặng từ danh sách.
2. **Khu vực.** Chọn một ghim để bay tới khu vực. Ghim đang chọn sáng rõ. Các địa danh phụ hiện thêm khi đủ gần. Một bảng gọn hiển thị tên, ảnh, mô tả và khả năng tham quan. Vị trí ghim dùng tọa độ đã đối chiếu với tư liệu.
3. **Điểm tham quan.** Nút **Bắt đầu đi bộ** mở cảnh cục bộ với nhân vật du khách MPFB2 khi cảnh đã tích hợp. Trên bản đồ có thể tiếp tục xem ảnh và thông tin các điểm chưa có cảnh đi bộ. Nút **Về bản đồ** khôi phục góc nhìn và điểm đang chọn.

Màu nền đề xuất là đất xanh rêu, cát sáng và biển xanh lam. Dải màu nước chuyển theo khoảng cách tới bờ để thể hiện phong cách bản đồ. Cao độ địa hình giữ tỷ lệ đứng 1×. Ghim dùng chữ sáng trên nền xanh đậm, chấm vàng cho điểm có thể chọn, viền xanh kèm trạng thái chữ cho điểm đang mở. Ưu tiên nhãn địa danh chính và khả năng đọc trên điện thoại.

## Cách triển khai trên mã hiện có

- **Bản đồ địa lý.** Module CesiumJS đã đọc dữ liệu Copernicus GLO-30 và hiển thị ảnh nền Esri trực tuyến. Điểm vào chính hiện mở sa bàn Three.js, nên cần nối lại chế độ bản đồ địa lý trong giao diện. Có thể dùng CesiumJS cho hai mức Toàn đảo và Khu vực, dùng React Three Fiber cho cảnh đi bộ. Tải cảnh GLB chi tiết khi chọn chặng tương ứng. [Điểm vào ứng dụng](../../client/src/App.jsx) · [Module bản đồ địa lý](../../client/src/world/GeographicIsland.jsx) · [Địa hình CesiumJS](https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/)
- **Địa hình và bờ biển.** Dùng lưới Copernicus hiện có cho độ nổi tổng thể. Bổ sung đường bờ và đường đi từ dữ liệu GIS phù hợp, đối chiếu các vùng thiếu với ảnh khảo sát được phép sử dụng. OpenStreetMap là nguồn ứng viên cho lớp vector, với ghi nguồn và điều kiện ODbL nếu sử dụng. GLO-30 có khoảng lưới 30 m và biểu diễn bề mặt gồm cả cây, công trình. Cảnh đi bộ cần mặt đường, nền sân và bậc riêng. [Dữ liệu dự án](../../client/public/terrain/vinh-thuc.json) · [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM) · [Giấy phép OpenStreetMap](https://www.openstreetmap.org/copyright)
- **Địa danh.** Gắn dữ liệu mỗi điểm với một mã ổn định, tọa độ GPS, nguồn kiểm chứng, góc camera, nội dung giới thiệu và cảnh 3D nếu có. Dữ liệu hiện có chứa cả tọa độ riêng của sa bàn minh họa. Chỉ đưa vị trí lên bản đồ địa lý sau khi đối chiếu. [Danh mục địa danh](../../client/src/education/poiData.js)
- **Chặng thử.** Ưu tiên Phân hiệu Vĩnh Trung vì đã có mô hình khuôn viên và ghim trong bản đồ địa lý thử nghiệm. Cần đối chiếu tọa độ, cao độ và hướng đặt mô hình. Nhân vật MPFB2 đã có GLB, phần điều khiển trong chặng vẫn cần tích hợp. [Kế hoạch tour](VINH_THUC_THIRD_PERSON_TOUR.md) · [Nhân vật du khách](../../assets/characters/tourist_mpfb.glb)

## Bản thử để duyệt

1. **Mở toàn đảo.** Thấy đường bờ, độ nổi địa hình, các chặng ưu tiên và nút đặt lại góc nhìn. Thử bố cục trên máy tính và điện thoại.
2. **Chọn một chặng.** Camera chuyển mượt sang góc nghiêng, nhãn đang chọn nổi rõ và thẻ địa danh mở đúng. Có thể chọn lại bằng danh sách khi các ghim gần nhau.
3. **Vào khuôn viên.** Mở cảnh Phân hiệu Vĩnh Trung, kiểm tra điểm xuất phát của du khách và trở lại đúng điểm đang xem trên bản đồ. Đo dung lượng tải ban đầu, thời gian mở chặng và frame time trên thiết bị mục tiêu trước khi mở rộng.

## Chạy bản thử

Trong thư mục `client`, chạy `npm run dev`. Mở **Các chặng → Phân hiệu Vĩnh Trung → Bắt đầu đi bộ**. Nút **Về bản đồ** khôi phục camera và điểm đã chọn trong phiên làm việc.

Bản đồ mở mặc định bằng lớp tô màu lưu trong dự án. Tệp này được tạo từ lưới cao độ và mặt nạ nước Copernicus của hai ô N21 E107 và N21 E108. Màu nước là hiệu ứng minh họa theo khoảng cách tới đất. Dùng `node scripts/prepare-island-style.mjs` từ thư mục `client` để tạo lại ảnh bản đồ. Có thể bật ảnh vệ tinh Esri trong giao diện khi có kết nối. [Sổ tay sản phẩm Copernicus](https://dataspace.copernicus.eu/sites/default/files/media/files/2024-06/geo1988-copernicusdem-spe-002_producthandbook_i5.0.pdf)

Bản thử dùng tọa độ trường trong hồ sơ và bộ va chạm xấp xỉ của khuôn viên. Nhân vật du khách được tải khi vào chặng trường. Bốn chặng còn lại hiện trong danh sách để thấy phạm vi hành trình và đang chờ bổ sung dữ liệu.
