# EDUVERSE 3D: Kiểm duyệt và bản thiết kế nâng cấp

Ngày 14/11/2026, tại commit `31634ad`. Tài liệu này nối tiếp [bản kiểm duyệt ngày 11/11](EDUVERSE_3D_OPTIMIZATION_PLAN.md).

Phạm vi kiểm tra: mã nguồn `client/`, các file GLB phục vụ web, cấu hình Vercel, repo GitHub. Đã chạy: 3 bài test địa lý (đều qua), build production (thành công), `npm audit` (0 lỗ hổng). Chưa đo: FPS, draw call thực tế và trải nghiệm trên điện thoại thật.

## 1. Hiện trạng

| Hạng mục | Số đo |
| --- | --- |
| Mã nguồn web | khoảng 3.000 dòng, 22 file trong `client/src` |
| JavaScript production | 1.106 kB (310 kB gzip), gồm 2 chunk |
| Thư mục build `dist` | 63 MB, trong đó 31 MB là mô hình và 8,5 MB là Cesium |
| Bản trên Vercel | trùng với build từ commit mới nhất |
| CI, PR, issue | không có |
| `server/` | chỉ có 4 thư mục rỗng |

Mô hình đang được dùng:

| File | Dung lượng | Tam giác | Phần mesh | Ghi chú |
| --- | ---: | ---: | ---: | --- |
| `school_campus.glb` | 5,37 MB | 45.516 | 2.117 | 17 texture PNG |
| `vinh_thuc_island_v3.glb` | 2,50 MB | 92.377 | 26 | không texture |
| `hai_dang_vinh_thuc_v2.glb` | 4,84 MB | 29.170 | 1 | 3 texture JPEG, tổng 2,8 MB |
| `tourist_meshy.glb` | 2,03 MB | 22.677 | 1 | có Idle, Walk, Run |

Không file nào dùng nén hình học (Draco, Meshopt) hay nén texture (KTX2).

## 2. Kết quả kiểm duyệt

### Đã sửa so với bản 11/11

- Nút nhảy cảm ứng đã dùng chung logic với phím Space.
- Input được xóa khi mất focus hoặc hủy thao tác.
- Vị trí người chơi ghi vào store mỗi 0,08 giây thay vì mỗi frame.
- Đã bỏ `preserveDrawingBuffer`.
- Có màn hình báo lỗi và nút thử lại khi cảnh 3D hỏng.

### Còn tồn tại

| Mức | Phát hiện | Vị trí |
| --- | --- | --- |
| P1 | Ba POI trỏ tới `frame_020.jpg` và `frame_025.jpg`, hai ảnh này không có trong `client/public/images`. Người dùng thấy ảnh thay thế. | [poiData.js](../client/src/education/poiData.js) dòng 245, 278, 294 |
| P1 | Ba mô hình (trường, đảo, hải đăng) được tải ngay khi mở trang, tổng 12,7 MB, dù người dùng chỉ thấy đảo. | `useGLTF.preload` trong [CampusModel.jsx](../client/src/world/CampusModel.jsx), [LighthouseScene.jsx](../client/src/world/lighthouse/LighthouseScene.jsx) |
| P1 | Trường có 2.117 phần mesh rời, mỗi phần là một draw call, và tất cả đều đổ bóng. Đây là điểm nghẽn chính trên điện thoại. | [CampusModel.jsx](../client/src/world/CampusModel.jsx) |
| P1 | Va chạm trong trường là 5 hình chữ nhật viết tay, mặt đất cố định ở độ cao 0. Không khớp khi mô hình thay đổi, không đi được bậc thang. | [CharacterController.jsx](../client/src/world/CharacterController.jsx) dòng 8 |
| P2 | Cesium không còn được dùng (`GeographicIsland.jsx` không được import ở đâu) nhưng vẫn nằm trong dependencies và 8,5 MB file của nó vẫn được chép vào mỗi bản build. | [vite.config.js](../client/vite.config.js) |
| P2 | 6 file GLB trong `client/public` không được dùng hoặc trùng nội dung, tổng khoảng 16 MB được đưa lên Vercel. | xem mục 3, đợt 1 |
| P2 | Vercel trả mô hình với `cache-control: max-age=0`, mỗi lần mở lại đều phải hỏi lại máy chủ. | [vercel.json](../vercel.json) |
| P2 | Manifest dùng ảnh 1920×1080 nặng 2,3 MB làm icon 192 và 512. Chưa có service worker, nên chưa cài được như PWA đúng nghĩa và không chạy offline. | [manifest.json](../client/public/manifest.json) |
| P2 | Nút bật/tắt âm thanh có trên HUD nhưng ứng dụng không có âm thanh nào. | [HUDOverlay.jsx](../client/src/ui/HUDOverlay.jsx) dòng 219 |
| P2 | Bóng đổ 2048×2048 và khử răng cưa bật cố định, không có mức chất lượng cho máy yếu, không giới hạn DPR. | [LegacyWorld.jsx](../client/src/LegacyWorld.jsx), [SceneLighting.jsx](../client/src/world/SceneLighting.jsx) |
| P3 | Không có CI. Lỗi build hoặc đường dẫn ảnh, mô hình sai chỉ lộ ra sau khi đã lên Vercel. | repo GitHub |
| P3 | `node_modules` trong thư mục Google Drive được cài trên Windows, nên `npm run build` không chạy được trên máy Mac này. | `client/node_modules` |
| P3 | File `.blend` và `.glb` thô (10–15 MB mỗi file) nằm thẳng trong git, mỗi lần sửa thêm một bản vào lịch sử. | `assets/` |
| P3 | README còn ghi địa chỉ IP nội bộ và mô tả Socket.IO, đi bộ góc nhìn thứ nhất, không còn đúng với code. | [README.md](../README.md) |

Không tìm thấy khóa API nào trong git. File `.env` chứa khóa Meshy được `.gitignore` loại trừ đúng cách.

## 3. Bản thiết kế nâng cấp

Năm đợt, xếp theo thứ tự nên làm. Mỗi đợt tự đứng được và có thể phát hành riêng.

### Đợt 1: Dọn dẹp và sửa lỗi nhìn thấy được (khoảng nửa ngày)

Không đổi hành vi, chỉ bỏ phần thừa và sửa lỗi hiển thị.

1. Khôi phục `frame_020.jpg` và `frame_025.jpg` từ `docs/school-blueprint/reference_photos/`, hoặc đổi 3 POI sang ảnh đang có.
2. Gỡ Cesium: xóa `GeographicIsland.jsx`, `geographic.css`, dependency `cesium`, `vite-plugin-static-copy` và khối `viteStaticCopy` trong `vite.config.js`. Giữ `geography.js` nếu còn muốn giữ bài test, nếu không thì bỏ cả hai.
3. Xóa các GLB không dùng trong `client/public`:
   - `models/hai_dang_vinh_thuc.glb` (trùng nội dung với bản `_v2`)
   - `models/vinh_thuc_island.glb` (bản cũ của `_v3`)
   - `models/tourist_character.glb`, `models/tourist_mpfb.glb` (trùng nội dung với `tourist_meshy.glb`)
   - `models/hai_dang_vinh_thuc_sf3d_v2.glb` và cả thư mục `assets/models/` (mô hình SF3D đã bị revert)
4. Bỏ nút âm thanh khỏi HUD cho đến khi có âm thanh thật (đợt 4).
5. Cập nhật README theo đúng hiện trạng.

Kết quả: bản build giảm từ 63 MB xuống khoảng 38 MB, không còn ảnh POI hỏng.

### Đợt 2: Tải nhanh hơn (1–2 ngày)

1. **Tải theo cảnh.** Tách `CampusModel` và `LighthouseScene` thành chunk `lazy()` riêng, bỏ `useGLTF.preload` ở đầu file. Lượt mở đầu chỉ tải đảo và hải đăng thu nhỏ. Khi người dùng di chuột vào nút "Vào trường" thì mới bắt đầu tải trước.
2. **Nén mô hình.** Thêm bước vào `scripts/optimize-glb.mjs` dùng `gltf-transform`: Meshopt cho hình học, WebP hoặc KTX2 cho texture, thu texture hải đăng về 1024 px. Mục tiêu: trường dưới 2 MB, hải đăng dưới 1,5 MB, nhân vật dưới 1 MB.
3. **Hải đăng trên sa bàn.** Sa bàn đang dùng nguyên mô hình 4,84 MB cho một vật thể cao vài pixel. Xuất một bản thu gọn khoảng 2.000 tam giác với texture 512 px cho sa bàn, giữ bản đầy đủ cho cảnh hải đăng.
4. **Cache.** Thêm `headers` vào `vercel.json`: `immutable, max-age=31536000` cho `/assets/*`; với `/models/*` và `/images/*` thì thêm mã phiên bản vào tên file rồi áp dụng cùng chính sách.
5. **Màn hình tải.** Thay dòng chữ chờ bằng thanh tiến độ dùng `useProgress` của drei.

Tiêu chí: lượt mở đầu với cache trống tải dưới 3 MB (hiện khoảng 14 MB kể cả JavaScript).

### Đợt 3: Chạy mượt trên điện thoại (2–3 ngày)

1. **Gộp mesh trường.** Trong pipeline Blender, gộp mesh tĩnh theo vật liệu và theo cụm công trình (tòa A, tòa B, nhà đa năng, sân, hàng rào). Dùng instancing cho cây, ghế, cột đèn. Mục tiêu: từ 2.117 xuống dưới 150 draw call.
2. **Mức chất lượng.** Thêm `quality: 'low' | 'medium' | 'high'` vào store, tự chọn bằng `PerformanceMonitor` của drei và cho người dùng đổi tay:

   | Mức | DPR tối đa | Bóng đổ | Khử răng cưa |
   | --- | --- | --- | --- |
   | Thấp | 1 | tắt | tắt |
   | Vừa | 1,5 | 1024 | bật |
   | Cao | 2 | 2048 | bật |

3. **Bóng đổ có chọn lọc.** Chỉ công trình và nhân vật đổ bóng; mặt đất chỉ nhận bóng. Bỏ `DoubleSide` ép cho mọi vật liệu, chỉ bật ở lá cây và hàng rào.
4. **Va chạm theo mô hình.** Thay 5 hình chữ nhật viết tay bằng lưới va chạm xuất từ Blender (một mesh `COLLIDER_*` đơn giản đi kèm GLB) và dùng `three-mesh-bvh` để dò mặt đất và tường. Cảnh hải đăng chuyển sang cùng cơ chế, để [layout.js](../client/src/world/lighthouse/layout.js) chỉ còn giữ dữ liệu cầu thang xoắn.
5. **Đo.** Ghi frame time p50/p95 và số draw call trên một điện thoại Android tầm trung trước và sau.

Tiêu chí: frame time p95 khi đi bộ trong trường không quá 33 ms ở mức Thấp trên máy Android mục tiêu.

### Đợt 4: Nội dung giáo dục (3–5 ngày)

Đây là phần tạo ra giá trị cho học sinh; ba đợt trên là để nó chạy được trên máy các em.

1. **Tách dữ liệu khỏi code.** Chuyển `poiData.js` thành `public/content/pois.json` có schema, để giáo viên sửa nội dung mà không đụng vào code. Thêm bài test kiểm tra mọi đường dẫn ảnh và mô hình đều tồn tại.
2. **Nhiệm vụ tham quan.** Store đã có `visitedHotspots`. Dựng trên đó một danh sách nhiệm vụ cho mỗi cảnh (ví dụ "Tìm năm xây dựng hải đăng"), kèm câu hỏi trắc nghiệm ngắn ở mỗi POI và huy hiệu khi hoàn thành.
3. **Lưu tiến độ.** Dùng middleware `persist` của zustand để lưu vào `localStorage`: POI đã thăm, điểm, mức chất lượng.
4. **Âm thanh.** Tiếng sóng và gió ở đảo, tiếng trống trường, thuyết minh giọng đọc cho từng POI. Lúc này mới đưa nút âm thanh trở lại.
5. **PWA thật.** Icon đúng 192 và 512 px, service worker qua `vite-plugin-pwa`, cache sẵn cảnh đảo để mở được khi mạng yếu. Mạng ở đảo Vĩnh Thực không ổn định nên mục này có giá trị thực tế.
6. **Nhân vật học sinh.** `student_character.glb` (5.660 tam giác, nhẹ gấp 4 lần nhân vật du khách) đã có sẵn nhưng chưa dùng. Cho chọn nhân vật ở màn hình mở đầu.

### Đợt 5: Nền tảng và nhiều người chơi (sau cùng)

1. **CI.** Một workflow GitHub Actions: `npm ci`, test, build, kiểm tra đường dẫn tài nguyên. Chạy trên mỗi lần push.
2. **Git LFS** cho `*.blend` và các `*.glb` thô trong `assets/`. Chỉ giữ GLB đã tối ưu trong `client/public`.
3. **`node_modules` ra khỏi Google Drive.** Làm việc trên bản clone ngoài Drive, hoặc đánh dấu `node_modules` không đồng bộ, để mỗi máy cài bản đúng hệ điều hành của mình.
4. **TypeScript** cho store và dữ liệu POI trước, phần còn lại chuyển dần.
5. **Nhiều người chơi.** Chỉ bắt đầu khi đợt 3 đã đạt tiêu chí. Đề xuất: một phòng cho mỗi cảnh, tối đa 30 người, đồng bộ vị trí 10 lần/giây và nội suy ở máy khách. Vercel không chạy được máy chủ WebSocket lâu dài, nên cần chọn giữa dịch vụ realtime có sẵn (PartyKit, Liveblocks) và tự chạy Socket.IO trên một máy chủ riêng (Fly.io, Railway). Dịch vụ có sẵn ít việc vận hành hơn và hợp với quy mô 10–50 người trong README.

## 4. Thứ tự và phụ thuộc

- Đợt 1 làm trước, không phụ thuộc gì.
- Đợt 2 và đợt 3 độc lập với nhau, nhưng mục gộp mesh (3.1) và nén mô hình (2.2) cùng sửa pipeline xuất GLB, nên làm liền nhau.
- Đợt 4 nên chờ đợt 2, vì âm thanh và ảnh thêm vào sẽ làm nặng lượt tải nếu chưa có tải theo cảnh.
- Mục CI (5.1) nhỏ và có thể làm ngay cùng đợt 1.

## 5. Việc cần quyết định

1. Mô hình hải đăng: giữ bản Meshy đã duyệt và xóa hẳn các bản SF3D khỏi `client/public`, hay còn muốn giữ để so sánh?
2. Có giữ hướng bản đồ địa lý thật (Cesium) như một tính năng tương lai không? Nếu không thì gỡ hẳn ở đợt 1.
3. Thiết bị mục tiêu của học sinh là gì (điện thoại Android nào, máy tính phòng tin học)? Tiêu chí đợt 3 phụ thuộc vào câu trả lời này.
4. 11 file chưa commit (`anh truong/hai dang/`, các file nhân vật du khách, `hai_dang_front_raw.glb`): đưa lên git, đưa vào LFS, hay để ngoài repo?
