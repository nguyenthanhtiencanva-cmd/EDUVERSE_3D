# EDUVERSE 3D -- Hồ sơ dự án và dữ liệu bàn giao cho Antigravity

> **Mục đích:** Tài liệu Markdown này tổng hợp bối cảnh, yêu cầu, quyết định và hướng triển khai đã trao đổi về dự án dựng mô hình 3D ngôi trường thực tế. Có thể đưa trực tiếp vào Antigravity làm tài liệu đầu vào.
>
> **Phạm vi:** Đây là bản tổng hợp có cấu trúc từ nội dung hội thoại và thông tin dự án hiện có, không phải bản sao nguyên văn toàn bộ lịch sử chat.

---

## 1. Mục tiêu dự án

Xây dựng một môi trường trường học 3D có thể khám phá bằng trình duyệt, theo định hướng **EDUVERSE 3D**.

- Dựng lại **ngôi trường thực tế của người dùng**, không dùng một campus mẫu chung chung.
- Phong cách hình ảnh: **Style C -- stylized realistic**, gần cảm giác môi trường Roblox nhưng có kiến trúc và bố cục trường học thật.
- Người dùng có thể đi lại, khám phá khuôn viên và tương tác với các khu vực.
- Nền tảng mục tiêu: **Website + PWA**.
- Quy mô dự kiến ban đầu: **10--50 người chơi đồng thời**.
- Ưu tiên trước mắt: tái tạo đúng khuôn viên và công trình; chưa cần triển khai multiplayer hoặc tính năng học tập ngay.

## 2. Trường học cần dựng

Trong ngữ cảnh các trao đổi trước, trường được nhắc đến là:

**Trường TH&THCS Vĩnh Thực**.

Lưu ý cho Antigravity: tên trường này xuất hiện trong thông tin dự án trước đây, nhưng cần xác nhận lại với người dùng trước khi coi là dữ liệu định danh cuối cùng của mô hình.

Các khu vực cần khảo sát/dựng nếu có trong thực tế:
- Cổng trường và biển tên.
- Sân trường.
- Các dãy nhà học.
- Hành lang, cầu thang và mặt tiền.
- Nhà xe và các công trình phụ trợ.
- Cây xanh, bồn hoa, sân chơi, đường đi.
- Các khu vực chức năng khác theo hiện trạng.

Không tự ý thêm công trình hoặc thay đổi sơ đồ khuôn viên nếu chưa có bằng chứng từ ảnh/video hoặc xác nhận của người dùng.

## 3. Tư liệu đầu vào

Người dùng hỏi liệu **video quay từ trên cao bằng flycam/drone** có dùng được không.

Kết luận: Có. Video trên cao rất hữu ích để dựng mặt bằng và bố cục tổng thể.

### 3.1. Video nên có
1. Góc nhìn từ trên cao, gần vuông góc xuống khuôn viên để xác định ranh giới và bố cục.
2. Một vòng bay chậm quanh khuôn viên để thấy các mặt công trình.
3. Góc nghiêng khoảng 45 độ để thấy chiều cao, mái và hình khối công trình.
4. Các đoạn quay riêng cổng trường, sân trường và từng dãy nhà nếu có thể.

### 3.2. Tư liệu bổ sung nên có
Video trên cao không đủ để tái tạo chính xác các chi tiết mặt đứng. Nên bổ sung:
- Video quay ở tầm mắt, đi dọc mặt tiền từng dãy nhà.
- Ảnh chụp chính diện và hai bên công trình.
- Ảnh cổng trường, biển tên, cửa sổ, hành lang, cầu thang.
- Bản vẽ mặt bằng hoặc sơ đồ khuôn viên nếu có.
- Kích thước thực tế của một số vật chuẩn (ví dụ chiều rộng cổng, chiều dài sân, kích thước cửa) nếu đo được.

**Trạng thái hiện tại:** Chưa có video/ảnh trường được cung cấp trong phần hội thoại này. Không được giả định đã có tư liệu hoặc tự dựng chi tiết kiến trúc chưa được xác minh.

## 4. Các repository GitHub đã khảo sát

Người dùng yêu cầu tìm repository GitHub về chủ đề campus/trường học 3D và muốn nghiên cứu để tham khảo, **không chỉnh sửa các repo gốc**.

### 4.1. `jarheadjoe/virtualCampus`
- URL: https://github.com/jarheadjoe/virtualCampus
- Dự án virtual campus dùng Unity.
- README mô tả khả năng thay/import mô hình trường/campus của riêng mình, thêm mục tiêu tương tác và thay ảnh minimap.
- Có đề cập bản chạy Windows standalone và WebGL.
- Phiên bản Unity được README ghi nhận trong quá trình thử nghiệm: Unity 2020.3.30f1c1.
- MIT license theo thông tin đã khảo sát.
- Dự án có quy mô nhỏ và hoạt động cập nhật đã cũ.

**Giá trị tham khảo:** Cách tổ chức campus, thay mô hình trường thực tế, điểm tương tác và minimap.
**Không nên chọn làm nền tảng chính** nếu mục tiêu ưu tiên là Website + PWA với hệ sinh thái Three.js/React.

### 4.2. `abmah/College-Campus-3D-Visualization`
- URL: https://github.com/abmah/College-Campus-3D-Visualization
- Dùng Blender để dựng campus, sau đó đưa mô hình vào Three.js.
- README mô tả texture baking, điều khiển góc nhìn người thứ nhất, raycasting để tương tác với công trình/dữ liệu, GSAP cho hiệu ứng giao diện và Chart.js cho trực quan hóa.
- README nêu MIT license, nhưng `package.json` có thông tin `UNLICENSED`; cần kiểm tra lại giấy phép và quyền sử dụng trước khi sao chép bất kỳ mã nguồn/tài nguyên nào.

**Giá trị tham khảo:** Quy trình Blender → Three.js, tối ưu texture, điều khiển đi bộ và tương tác bằng raycasting.
**Lưu ý:** Không mặc định rằng mọi thành phần trong repo đều có thể tái sử dụng hợp pháp chỉ dựa vào README.

### 4.3. `Nitin23123/3d-virtual-campus`
- URL: https://github.com/Nitin23123/3d-virtual-campus
- Dự án campus 3D nhiều người chơi trên trình duyệt.
- Công nghệ được mô tả: Next.js 15, React 19, Three.js, React Three Fiber, Zustand, Express 5, Socket.IO, MongoDB/Mongoose; WebRTC được dự kiến cho voice chat.
- Cấu trúc có các phần quản lý Player, OtherPlayers, KeyboardControls, Chat, VoiceChat, SocketManager và server.
- README/docs mô tả đồng bộ vị trí người chơi, chat và kiến trúc client/server.

**Những hạn chế đã nhận diện trong lần khảo sát trước:**
- Cảnh 3D hiện mới ở mức nền và nhân vật capsule; chưa có mô hình campus thực tế hoàn chỉnh.
- MongoDB đã kết nối nhưng phần lưu trữ dữ liệu thực tế còn thiếu.
- Voice chat/WebRTC chưa hoàn chỉnh do thiếu một số xử lý signaling phía server.
- Cần tối ưu tần suất gửi vị trí và xác thực chuyển động phía server.
- Không nên coi cách đồng bộ hiện tại là kiến trúc production-ready cho 10--50 người chơi.

**Giá trị tham khảo:** Phân chia client/server, quản lý trạng thái người chơi, Socket.IO, chat và ý tưởng đồng bộ multiplayer.
**Khuyến nghị:** Chỉ tham khảo kiến trúc và ý tưởng; không triển khai nguyên trạng.

## 5. Định hướng công nghệ đề xuất

Định hướng đã thống nhất ở mức đề xuất:
- **Blender:** dựng mô hình trường, công trình, vật thể và tối ưu tài nguyên 3D.
- **Three.js / React Three Fiber:** nền tảng hiển thị 3D trên trình duyệt.
- **React + PWA:** giao diện và khả năng cài đặt như ứng dụng web.
- **Zustand hoặc giải pháp state management tương đương:** quản lý trạng thái client khi cần.
- **Socket.IO:** có thể dùng cho đồng bộ multiplayer ở giai đoạn sau.
- **Backend riêng:** quản lý phòng, người chơi, tương tác và dữ liệu học tập khi các giai đoạn sau cần đến.

Không khóa cứng phiên bản thư viện trước khi kiểm tra tương thích, bảo trì và yêu cầu triển khai thực tế.

## 6. Kiến trúc thư mục tham khảo

```text
EDUVERSE-3D/
├── assets/
│   ├── school/
│   │   ├── gate/
│   │   ├── buildings/
│   │   ├── classrooms/
│   │   ├── playground/
│   │   ├── vegetation/
│   │   └── props/
│   ├── characters/
│   ├── textures/
│   └── audio/
├── client/
│   └── src/
│       ├── world/
│       ├── player/
│       ├── interaction/
│       ├── multiplayer/
│       ├── education/
│       └── ui/
├── server/
│   ├── rooms/
│   ├── players/
│   ├── synchronization/
│   └── education/
├── docs/
│   ├── architecture/
│   ├── school-blueprint/
│   ├── asset-inventory/
│   └── development-plan/
└── README.md
```

## 7. Lộ trình triển khai đề xuất

- **Giai đoạn 1 -- Khảo sát và dựng mặt bằng:** Thu thập tư liệu flycam/ảnh; xác định ranh giới & sơ đồ 2D.
- **Giai đoạn 2 -- Dựng mô hình trường trong Blender:** Dựng blockout, chi tiết hóa, tối ưu UV, texture baking, LOD, GLTF export.
- **Giai đoạn 3 -- Đưa mô hình lên Website:** Scene Three.js/R3F, ánh sáng, va chạm (Octree/BVH), điều khiển di chuyển, PWA.
- **Giai đoạn 4 -- Nhân vật và tương tác:** Avatar 3D, raycasting tương tác tòa nhà, minimap, UI panel.
- **Giai đoạn 5 -- Multiplayer:** Client-server đồng bộ vị trí, chat, kiểm tra tải 10--50 CCU.
- **Giai đoạn 6 -- Tính năng giáo dục:** Lớp học ảo, trắc nghiệm, nhiệm vụ học tập.

## 8. Nguyên tắc làm việc với repository

1. Không chỉnh sửa, commit hoặc ghi đè lên ba repository tham khảo.
2. Tạo dự án EDUVERSE mới, độc lập.
3. Chỉ sao chép mã/tài nguyên khi đã kiểm tra giấy phép và điều kiện sử dụng.
4. Ưu tiên học kiến trúc và tự triển khai module phù hợp.
5. Không đưa thông tin đăng nhập, API key hoặc dữ liệu cá nhân vào repository.
6. Ghi lại nguồn gốc tài sản, giấy phép và thay đổi trong tài liệu dự án.
