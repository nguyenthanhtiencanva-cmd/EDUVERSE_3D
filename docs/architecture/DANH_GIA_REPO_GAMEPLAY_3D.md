# Đánh giá các repository gameplay 3D cho EDUVERSE_3D

Ngày 18/11/2026. Đối chiếu bản "Báo cáo phân tích repository gameplay 3D" (thầy gửi) với code hiện có của dự án.
Số liệu lấy từ GitHub API và npm registry ngày 18/11/2026.

## 1. Dự án đang dùng gì

Báo cáo kết luận "chọn theo stack hiện có", nên đây là điểm xuất phát:

| Thành phần | Phiên bản trong `client/package.json` |
| --- | --- |
| React / React DOM | 18.3 |
| @react-three/fiber | 8.17 |
| @react-three/drei | 9.114 |
| three | 0.169 |
| Va chạm | three-mesh-bvh 0.7.8 (dò tia trên lưới mô hình, không dùng engine vật lý) |

Những phần báo cáo coi là "cần xây" mà dự án **đã có và đang chạy**:

| Hạng mục trong báo cáo | Đã có ở đâu |
| --- | --- |
| Nạp GLB từ Blender/Meshy, nén, LOD theo chất lượng | `scripts/compress-models.mjs` (WebP + Meshopt), 3 mức chất lượng tự hạ |
| Nhân vật góc nhìn thứ ba: đi, chạy, nhảy, hoạt ảnh | `world/CharacterController.jsx`, `player/avatarMotion.js` (đặt chân trên bậc của thầy) |
| Va chạm tường, mặt đất, bậc thang | `world/campusCollision.js` (BVH, dùng chung trường và Cảng Vạn Gia), `lighthouse/layout.js` |
| Camera không xuyên tường | `campusCameraDistance` |
| Cần điều khiển ảo trên điện thoại | `ui/VirtualJoystick.jsx` |
| Điểm tham quan có kích hoạt theo khoảng cách, lưu tiến độ | `lighthouse/tour.js`, `vangia/layout.js` + `education/van-gia-stops.json` |
| Kịch bản MVP "Khám phá Hải đăng" (mục 6 của báo cáo) | Cảnh hải đăng 1:1 của thầy: sân, cầu thang sườn đồi, cầu thang xoắn, ban công, 3 điểm tham quan |

Vậy Giai đoạn 0–1 của báo cáo (audit, spike điều khiển nhân vật) **đã xong**. Phần còn thiếu thật sự là: hệ nhiệm vụ / câu hỏi, NPC, và một lớp "vật thể tương tác" dùng chung. Không thư viện nào trong danh sách cung cấp sẵn các phần này.

## 2. Từng repository

| Repository | Sao | Cập nhật gần nhất | Giấy phép | Nhận xét cho dự án này |
| --- | --- | --- | --- | --- |
| [pmndrs/ecctrl](https://github.com/pmndrs/ecctrl) | 817 | 06/09/2026 | MIT | Xem mục 2.1. Bản mới không chạy với stack hiện tại. |
| [3merillon/React-Three-Fiber-Character-Controller](https://github.com/3merillon/React-Three-Fiber-Character-Controller) | 5 | 19/08/2025 | MIT | Demo cá nhân, ít người dùng, hơn một năm không cập nhật. Chỉ để tham khảo. |
| [playcanvas/engine](https://github.com/playcanvas/engine) | 17.324 | 18/11/2026 | MIT | Engine khác hẳn three.js. Chuyển sang là viết lại toàn bộ cảnh, giao diện và va chạm. Không nên. |
| [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) | 26.396 | 18/11/2026 | Apache-2.0 | Tương tự PlayCanvas: viết lại từ đầu. Không nên. |
| [hh-hang/three-player-controller](https://github.com/hh-hang/three-player-controller) | 316 | 30/10/2026 | MIT | Gần với cách làm của dự án nhất. Xem mục 2.2. |
| [manuelhintermayr/sketchbook-rapier](https://github.com/manuelhintermayr/sketchbook-rapier) | 0 | 07/09/2026 | MIT | Bản fork của Sketchbook gốc ([swift502/Sketchbook](https://github.com/swift502/Sketchbook), 1.752 sao, **đã lưu trữ – ngừng phát triển**). Bản fork chưa ai dùng. Chỉ đọc ý tưởng (xe, NPC), không nhập code. |

### 2.1. Ecctrl: không phù hợp lúc này

- **Bản 2.x** (2.0.2, 06/09/2026) đòi React ≥ 19.2, @react-three/fiber ≥ 9.4, drei ≥ 10.7, three ≥ 0.184, @react-three/rapier ≥ 2.2 và leva. Dùng nó nghĩa là nâng cấp **toàn bộ** stack (React 18 → 19, R3F 8 → 9, drei 9 → 10, three 0.169 → 0.184). Việc này đụng vào mọi cảnh, kể cả phần hải đăng và nhân vật thầy đang làm.
- **Bản 1.x** cuối cùng chạy với React 18 / R3F 8 là 1.0.92 (26/11/2024). Đây là nhánh cũ, không còn cập nhật, và vẫn đòi three ≥ 0.170 (dự án đang 0.169).
- Cả hai bản đều cần **Rapier** (engine vật lý WebAssembly): tải thêm khoảng 0,77 MB (đã nén gzip) cho riêng phần vật lý, và phải dựng lại collider cho mọi cảnh.
- Lợi ích thu về chủ yếu là bộ điều khiển nhân vật, thứ dự án đã có và đã khớp với từng cảnh (cầu thang xoắn, ban công, bậc cầu dẫn ở Cảng Vạn Gia).

Kết luận: chi phí lớn, lợi ích nhỏ. Chỉ nên xét lại khi có lý do khác buộc phải lên React 19 / R3F 9.

### 2.2. three-player-controller: nguồn tham khảo tốt nhất

- Dùng đúng hai thư viện dự án đang có: three.js và three-mesh-bvh. Không cần engine vật lý riêng.
- Có những tính năng dự án có thể học: va chạm bằng **khối viên nang** (thay cho vài tia dò ngang hiện nay), dựng BVH trong Web Worker để không giật khi tải cảnh, camera lò xo né vật cản, Foot IK, di chuyển theo lộ trình (hữu ích cho NPC đi lại), phương tiện.
- Hạn chế: viết kiểu three.js thuần, phải bọc lại cho React Three Fiber. Phiên bản 0.x nên API còn có thể đổi. Tài liệu chính viết tiếng Trung (có bản tiếng Anh).

Cách dùng hợp lý: **đọc và học cách làm từng phần**, đưa vào code hiện có khi cần (ví dụ va chạm viên nang nếu nhân vật hay kẹt góc tường), không thay cả bộ điều khiển.

## 3. Đề xuất

1. **Giữ** bộ điều khiển nhân vật và va chạm BVH hiện có. Không chuyển sang Ecctrl, PlayCanvas hay Babylon.js.
2. **Tham khảo** three-player-controller cho từng tính năng cụ thể, khi gặp vấn đề thật: kẹt góc tường → va chạm viên nang; giật khi tải cảnh lớn → dựng BVH trong Worker; NPC đi lại → plugin lộ trình.
3. **Dồn sức vào phần còn thiếu** mà không thư viện nào có sẵn, theo [kế hoạch tháng 11](../development-plan/NEXT_STEPS_PLAN_2026_11.md) (Chặng A): nhiệm vụ, câu hỏi trắc nghiệm, sổ tay, lưu tiến độ. Làm theo nguyên tắc báo cáo nêu đúng: nội dung để trong JSON cho giáo viên sửa, như `van-gia-stops.json`.
4. Bỏ qua mục 7 "Quy trình triển khai trên Windows" của báo cáo: máy làm việc hiện nay là macOS, và quy trình chạy, build đã ghi trong `CLAUDE.md`.

## 4. Những điều báo cáo nêu đúng và nên giữ làm nguyên tắc

- Một hệ render và một cách xử lý va chạm cho mỗi cảnh (dự án đang làm vậy: three.js + BVH).
- Điểm tương tác quản lý bằng dữ liệu (ID, vị trí, nội dung), không gắn cứng vào mô hình.
- Đo hiệu năng trên máy thật trước khi mở rộng (dùng `?stats`).
- Kiểm tra giấy phép trước khi chép code: cả sáu repository đều là MIT hoặc Apache-2.0, nếu chép đoạn code nào thì giữ ghi chú bản quyền.
