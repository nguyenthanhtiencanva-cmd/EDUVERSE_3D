import { COURTYARD, LIGHTHOUSE_WORLD, stairEntryAt, TOWER, VIEWPOINT } from '../world/lighthouse/layout.js';
import VAN_GIA_DATA from '../education/van-gia-stops.json' with { type: 'json' };

const CAMPUS_PROGRESS_KEY = 'eduverse-campus-stops-v1';

const vanGiaById = Object.fromEntries(VAN_GIA_DATA.stops.map((s) => [s.id, s]));

/**
 * Danh sách điểm tương tác [E] dùng chung cho cả 3 cảnh 1:1 (Hải đăng, Cảng Vạn Gia, Phân hiệu Vĩnh Trung).
 * Trường `audioUrl` để sẵn null cho giai đoạn bổ sung thuyết minh tiếng Việt sau này.
 */
export const INTERACTABLES = {
  lighthouse: [
    {
      id: 'lh-board-stairs',
      scope: 'lighthouse',
      level: 'ground',
      kind: 'board',
      stopId: 'hill-stairs',
      title: 'Đường Lên Trạm Hải Đăng Vĩnh Thực',
      category: 'Bảng chỉ dẫn di tích',
      actionLabel: 'Đọc bảng giới thiệu',
      position: [2.75, VIEWPOINT.y, 45.35],
      facing: Math.PI / 2,
      radius: 2.9,
      image: '/images/preview_island_overview.png',
      description:
        'Lối bậc đá dẫn từ sườn đồi Mũi Đầu Tán lên sân Trạm Hải đăng Vĩnh Thực ở cực Đông Bắc đảo. Đi hết 110 bậc đá sườn đồi là tới khoảng sân lát gạch đỏ trước nhà quản lý và chân tháp đèn.',
      details: [
        { label: 'Vị trí', value: 'Mũi Đầu Tán — cực Đông Bắc đảo Vĩnh Thực' },
        { label: 'Lộ trình', value: '110 bậc đá sườn đồi → Sân trạm → Vòm chân tháp → Ban công 18m' },
        { label: 'Gợi ý điều khiển', value: 'Giữ Shift để chạy, nhấn V để chuyển góc nhìn thứ nhất' },
      ],
      audioUrl: null,
    },
    {
      id: 'lh-board-courtyard',
      scope: 'lighthouse',
      level: 'ground',
      kind: 'board',
      title: 'Khuôn Viên Trạm & Nhà Quản Lý Đèn Biển',
      category: 'Kiến trúc lịch sử',
      actionLabel: 'Xem thông tin trạm đèn',
      position: [1.4, COURTYARD.floorY, 9.6],
      facing: -Math.PI / 4,
      radius: 3.2,
      image: '/images/preview_island_overview.png',
      description:
        'Trên đỉnh đồi là sân gạch đỏ kết nối nhà quản lý mái ngói đỏ kiểu Pháp và phòng truyền thống với tháp đèn biển. Trạm do lực lượng bảo đảm an toàn hàng hải trực vận hành quanh năm.',
      details: [
        { label: 'Hạng mục', value: 'Nhà quản lý mái ngói đỏ Mansard, sân gạch đỏ & khuôn viên trực gác' },
        { label: 'Nhiệm vụ', value: 'Bảo đảm an toàn hàng hải cho tàu thuyền qua vịnh Bắc Bộ' },
      ],
      audioUrl: null,
    },
    {
      id: 'lh-board-tower',
      scope: 'lighthouse',
      level: 'ground',
      kind: 'board',
      stopId: 'rotunda',
      title: 'Hải Đăng Vĩnh Thực (Xây Dựng Năm 1962)',
      category: 'Biểu tượng Chủ quyền & Hàng hải',
      actionLabel: 'Đọc lịch sử Hải đăng',
      position: [-5.3, COURTYARD.floorY, 6.2],
      facing: Math.PI * 0.18,
      radius: 3.2,
      image: '/images/preview_island_overview.png',
      description:
        'Được xây dựng từ năm 1962, Hải đăng Vĩnh Thực mệnh danh là "Mắt thần vùng biển Đông Bắc Tổ quốc". Tháp hình trụ sơn vàng kem nổi bật với 4 gân trắng dọc thân và hiên vòm tròn 8 trụ dưới chân tháp.',
      details: [
        { label: 'Chiều cao tháp', value: '18,0 m (cầu thang xoắn ốc 112 bậc bên trong)' },
        { label: 'Tâm sáng', value: '84,5 m so với mực nước biển' },
        { label: 'Tầm hiệu lực', value: '21 hải lý' },
        { label: 'Khám phá tiếp', value: 'Bước lên 7 bậc vào cửa tháp và nhấn E để leo cầu thang xoắn' },
      ],
      audioUrl: null,
    },
    {
      id: 'lh-board-balcony',
      scope: 'lighthouse',
      level: 'balcony',
      kind: 'board',
      noStand: true,
      stopId: 'sea-view',
      title: 'Ban Công Đèn Biển — Toàn Cảnh Đông Bắc',
      category: 'Điểm ngắm cảnh trên cao',
      actionLabel: 'Xem thông tin tầm nhìn',
      position: [TOWER.x, TOWER.balconyY, TOWER.z + 1.55],
      facing: 0,
      radius: 2.6,
      image: '/images/preview_island_overview.png',
      description:
        'Từ hành lang ban công cao 18 m sát buồng đèn, du khách có thể quan sát trọn vẹn đường bờ biển phía Đông Bắc đảo Vĩnh Thực và vùng biển biên giới vịnh Bắc Bộ. Hãy thử nhấn V sang góc nhìn thứ nhất và chọn chế độ Đêm để xem đèn hải đăng quét sáng.',
      details: [
        { label: 'Cao độ ban công', value: '19,35 m trên mặt đồi (~84,5 m tâm sáng mực nước biển)' },
        { label: 'Trải nghiệm', value: 'Xoay 360° quanh buồng đèn, ngắm bình minh / hoàng hôn / đêm' },
      ],
      audioUrl: null,
    },
  ],

  vangia: [
    {
      id: 'vg-npc-staff',
      scope: 'vangia',
      kind: 'npc',
      stopId: 'vg-cau-dan',
      speaker: 'Nhân viên bến Cảng Vạn Gia',
      title: 'Hướng Dẫn Xuống Tàu & Lên Đảo',
      category: 'NPC hướng dẫn',
      actionLabel: 'Trò chuyện với nhân viên bến',
      position: [1.6, -1.6, 26.5],
      facing: -Math.PI / 2,
      radius: 4.5,
      image: '/images/preview_island_overview.png',
      description:
        '"Chào mừng bạn tới Cảng Vạn Gia — cửa ngõ đường biển nối đất liền Mũi Ngọc ra đảo Vĩnh Thực! Bạn đi dọc cầu dẫn lên bậc thang phía trước là gặp biển chào mừng, nhà chờ phòng vé và dãy hàng quán ven kè."',
      details: [
        { label: 'Tuyến xuồng cao tốc', value: 'Bến Mũi Ngọc (TP. Móng Cái) ↔ Cảng Vạn Gia (~15–20 phút)' },
        { label: 'Đặc trưng cầu dẫn', value: 'Treo lốp đệm chắn va hai bên thành cầu khi tàu cập mạn' },
      ],
      audioUrl: null,
    },
    {
      id: 'vg-board-welcome',
      scope: 'vangia',
      kind: 'board',
      stopId: 'vg-bien-chao',
      title: vanGiaById['vg-bien-chao']?.title || 'Biển chào mừng đảo Vĩnh Thực',
      category: 'Bảng thông tin cảng',
      actionLabel: 'Đọc bảng thông tin bến',
      position: [5.0, 0, -1.0],
      facing: 0,
      radius: 4.2,
      image: '/images/preview_island_overview.png',
      description: vanGiaById['vg-bien-chao']?.description || '',
      details: [
        { label: 'Vị trí', value: 'Đỉnh bậc lên mặt bến Cảng Vạn Gia (bờ Bắc đảo)' },
        { label: 'Điểm kế tiếp', value: 'Rẽ phải sang Nhà chờ & Phòng vé, hoặc rẽ trái dọc hàng quán ven kè' },
      ],
      audioUrl: null,
    },
    {
      id: 'vg-board-waiting',
      scope: 'vangia',
      kind: 'board',
      stopId: 'vg-nha-cho',
      title: vanGiaById['vg-nha-cho']?.title || 'Nhà chờ và phòng vé',
      category: 'Bảng thông tin cảng',
      actionLabel: 'Xem thông tin nhà chờ',
      position: [30.0, 0, -7.0],
      facing: 0,
      radius: 4.5,
      image: '/images/preview_island_overview.png',
      description: vanGiaById['vg-nha-cho']?.description || '',
      details: [
        { label: 'Chức năng', value: 'Bán vé xuồng/tàu khách, khu ghế chờ & bãi xe đón khách vào xã' },
      ],
      audioUrl: null,
    },
    {
      id: 'vg-npc-vendor',
      scope: 'vangia',
      kind: 'npc',
      stopId: 'vg-hang-quan',
      speaker: 'Cô bán hàng ven kè',
      title: 'Dãy Hàng Quán Ven Kè Cảng Vạn Gia',
      category: 'NPC địa phương',
      actionLabel: 'Trò chuyện với cô bán hàng',
      position: [-49.0, 0, -4.1],
      facing: 0,
      radius: 4.2,
      image: '/images/preview_island_overview.png',
      description:
        '"Khách chờ tàu ra đất liền hay mới đặt chân lên đảo đều hay ghé mấy quán bạt ven kè này nghỉ mát, uống trà ngắm thuyền neo đậu. Đi thêm về phía tây là tới Nhà hải quan và cầu cảng bê tông lớn đấy!"',
      details: [
        { label: 'Không gian', value: vanGiaById['vg-hang-quan']?.description || 'Quán nhỏ che bạt nhìn ra mặt vịnh' },
      ],
      audioUrl: null,
    },
    {
      id: 'vg-board-customs',
      scope: 'vangia',
      kind: 'board',
      stopId: 'vg-hai-quan',
      title: vanGiaById['vg-hai-quan']?.title || 'Nhà hải quan và Trạm Vạn Gia',
      category: 'Bảng thông tin cảng',
      actionLabel: 'Xem thông tin Trạm Vạn Gia',
      position: [-80.0, 0, -8.0],
      facing: 0,
      radius: 5.0,
      image: '/images/preview_island_overview.png',
      description: vanGiaById['vg-hai-quan']?.description || '',
      details: [
        { label: 'Vai trò', value: 'Quản lý hoạt động xuất nhập cảnh & kiểm soát tàu thuyền vùng biển biên giới' },
      ],
      audioUrl: null,
    },
    {
      id: 'vg-npc-fisher',
      scope: 'vangia',
      kind: 'npc',
      stopId: 'vg-cau-cang',
      speaker: 'Bác ngư dân đảo Vĩnh Thực',
      title: 'Cầu Cảng Bê Tông & Nghề Biển Đảo',
      category: 'NPC địa phương',
      actionLabel: 'Trò chuyện với ngư dân',
      position: [-114.5, 0, 18.0],
      facing: Math.PI / 2,
      radius: 5.0,
      image: '/images/preview_island_overview.png',
      description:
        '"Cầu cảng bê tông này vươn ra luồng nước sâu để tàu hàng và tàu công tác cập bến thuận lợi kể cả lúc thủy triều xuống. Sáng sớm ghe thuyền của bà con trên đảo cập bờ nhộn nhịp lắm."',
      details: [
        { label: 'Kết cấu', value: vanGiaById['vg-cau-cang']?.description || 'Cầu cảng bê tông vươn ra vùng nước sâu' },
      ],
      audioUrl: null,
    },
  ],

  campus: [
    {
      id: 'cp-board-playground',
      scope: 'campus',
      kind: 'board',
      stopId: 'cp-board-playground',
      title: 'Khu Vui Chơi Vận Động & Sân Trường Vĩnh Trung',
      category: 'Bảng giới thiệu khuôn viên',
      actionLabel: 'Xem thông tin khu vui chơi',
      position: [-1.0, 0, 5.2],
      facing: Math.PI / 2,
      radius: 3.6,
      image: '/images/486288996_1164972682088150_5203325261111208779_n.jpg',
      description:
        'Hai ô cỏ lớn nằm ngang giữa sân trường là khu vui chơi vận động cho học sinh tiểu học, trang bị khung leo lập phương, thang cầu vồng, nhà cầu trượt chóp nón vàng và thú nhún lò xo.',
      details: [
        { label: 'Vị trí', value: 'Giữa sân trường Phân hiệu Vĩnh Trung (tọa độ 21.37126°N, 107.90434°E)' },
        { label: 'Tiện ích sân', value: '2 ô cỏ vận động, sân cầu lông và hàng ghế đá quanh sân' },
      ],
      audioUrl: null,
    },
    {
      id: 'cp-board-blda',
      scope: 'campus',
      kind: 'board',
      stopId: 'cp-board-blda',
      title: 'Tòa Nhà A — Dãy Phòng Học Chính (3 Tầng)',
      category: 'Bảng giới thiệu công trình',
      actionLabel: 'Xem thông tin Tòa nhà A',
      position: [11.8, 0, 5.5],
      facing: -Math.PI / 2,
      radius: 3.8,
      image: '/images/486607577_1164971158754969_5964131103210838734_n.jpg',
      description:
        'Dãy phòng học chính 3 tầng dài 52 m ở cánh Đông sân trường, gồm các lớp Tiểu học và THCS có bàn ghế gỗ đôi, bục giảng, bảng xanh. Bạn có thể bước lên hành lang Tầng 1 và đi thẳng vào lớp học để tham quan.',
      details: [
        { label: 'Quy mô', value: '52,0 m × 8,6 m × 10,8 m (3 tầng, 10 nhịp phòng học)' },
        { label: 'Khẩu hiệu', value: '"Mỗi thầy giáo, cô giáo là một tấm gương đạo đức tự học và sáng tạo"' },
      ],
      audioUrl: null,
    },
    {
      id: 'cp-board-stage',
      scope: 'campus',
      kind: 'board',
      stopId: 'cp-board-stage',
      title: 'Tòa Nhà B & Sân Khấu Lễ Đài Chào Cờ',
      category: 'Bảng giới thiệu công trình',
      actionLabel: 'Xem thông tin Lễ đài',
      position: [1.4, 0, -16.4],
      facing: 0,
      radius: 4.0,
      image: '/images/486703373_1164970822088336_2558455371153302740_n.jpg',
      description:
        'Dãy nhà 2 tầng phía Bắc kết hợp lễ đài chào cờ đầu tuần và tổ chức các sự kiện lớn của nhà trường, nổi bật với bậc tam cấp gạch đỏ, pano Bác Hồ và khẩu hiệu "Quản lý tốt - Dạy tốt - Học tốt".',
      details: [
        { label: 'Nghi thức', value: 'Sân khấu 7 bậc gạch đỏ, cột cờ trung tâm & hệ thống loa phát thanh' },
        { label: 'Cảnh quan', value: 'Đôi chậu cảnh gốm xanh và hàng cây tùng bách tán hai bên' },
      ],
      audioUrl: null,
    },
    {
      id: 'cp-board-c2',
      scope: 'campus',
      kind: 'board',
      stopId: 'cp-board-c2',
      title: 'Tòa C2 (2 Tầng) & Nhà Đa Năng C1',
      category: 'Bảng giới thiệu công trình',
      actionLabel: 'Xem thông tin khu Cánh Tây',
      position: [-21.2, 0, -3.5],
      facing: Math.PI / 2,
      radius: 4.2,
      image: '/images/frame_020.jpg',
      description:
        'Tổ hợp cánh Tây gồm Tòa C2 hai tầng 8 nhịp bậc đá đỏ mang khẩu hiệu "Dù khó khăn đến đâu cũng phải thi đua dạy tốt, học tốt" và Nhà Đa Năng C1 phục vụ thể chất, sinh hoạt tập thể.',
      details: [
        { label: 'Tòa C2', value: '26,0 m × 8,2 m (2 tầng, 8 nhịp cột, bậc đá granite đỏ)' },
        { label: 'Phụ trợ', value: 'Nhà Đa Năng C1 & lán xe học sinh mái xanh phía Nam' },
      ],
      audioUrl: null,
    },
    {
      id: 'cp-board-gate',
      scope: 'campus',
      kind: 'board',
      stopId: 'cp-board-gate',
      title: 'Cổng Trường Chính & Đường Liên Thôn',
      category: 'Bảng giới thiệu công trình',
      actionLabel: 'Xem thông tin Cổng trường',
      position: [7.2, 0, 27.5],
      facing: Math.PI,
      radius: 4.2,
      image: '/images/frame_025.jpg',
      description:
        'Cổng chính Phân hiệu Vĩnh Trung mở ra trục đường liên thôn xã đảo, nổi bật với khẩu hiệu "Hiền tài là nguyên khí quốc gia" và nhà trực bảo vệ mái ngói đỏ ngay cạnh cổng.',
      details: [
        { label: 'Khẩu hiệu cổng', value: '"HIỀN TÀI LÀ NGUYÊN KHÍ QUỐC GIA"' },
        { label: 'Vị trí', value: 'Phía Nam khuôn viên, tiếp giáp trục đường xuyên đảo Vĩnh Thực' },
      ],
      audioUrl: null,
    },
  ],
};

export const CAMPUS_STOPS = INTERACTABLES.campus;

export function getInteractablesForScope(worldScope, lighthouseLevel = 'ground') {
  const list = INTERACTABLES[worldScope] || [];
  if (worldScope !== 'lighthouse') return list;
  return list.filter((item) => !item.level || item.level === lighthouseLevel);
}

/**
 * Tìm điểm tương tác [E] gần nhất quanh nhân vật (chỉ hoạt động khi đang đi bộ `cameraMode === 'fps'`).
 * Tại Hải đăng, cửa cầu thang xoắn được ưu tiên hàng đầu khi nhân vật đứng đúng cửa tháp.
 */
export function findNearbyInteraction({
  worldScope,
  cameraMode,
  lighthouseLevel = 'ground',
  playerPosition,
  playerTeleport = null,
}) {
  if (cameraMode !== 'fps' || playerTeleport || !Array.isArray(playerPosition)) return null;
  const [px, eyeY, pz] = playerPosition;
  const feetY = eyeY - 1.4;

  if (worldScope === 'lighthouse') {
    const entry = stairEntryAt({ x: px, y: feetY, z: pz }, lighthouseLevel);
    if (entry) {
      return {
        id: 'lh-stairs-entry',
        scope: 'lighthouse',
        kind: 'stairs',
        level: lighthouseLevel,
        title: lighthouseLevel === 'balcony' ? 'Cầu thang xoắn đi xuống' : 'Cầu thang xoắn lên tháp',
        actionLabel: lighthouseLevel === 'balcony' ? 'Đi xuống cầu thang xoắn' : 'Leo cầu thang xoắn lên tháp',
        position: [entry.pose.x, entry.pose.y, entry.pose.z],
        radius: 0.7,
      };
    }
    if (lighthouseLevel === 'spiral') return null;
  }

  const candidates = getInteractablesForScope(worldScope, lighthouseLevel);
  let closest = null;
  let closestDist = Infinity;

  for (const item of candidates) {
    const [ix, iy, iz] = item.position;
    if (worldScope === 'lighthouse' && Math.abs(feetY - iy) > 2.2) continue;
    const dist = Math.hypot(px - ix, pz - iz);
    if (dist <= item.radius && dist < closestDist) {
      closest = item;
      closestDist = dist;
    }
  }
  return closest;
}

export function readCampusProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(CAMPUS_PROGRESS_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((id) => CAMPUS_STOPS.some((stop) => stop.id === id))
      : [];
  } catch {
    return [];
  }
}

export function saveCampusProgress(ids) {
  try {
    localStorage.setItem(CAMPUS_PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    // Lưu tạm trong phiên nếu trình duyệt chặn storage.
  }
}

export const LIGHTHOUSE_INTERACT_SPAWN = LIGHTHOUSE_WORLD.spawn;
