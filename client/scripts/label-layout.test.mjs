import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutLabels } from '../src/world/labelLayout.js';

// Bề rộng nhãn giả lập theo số ký tự (trong Node không có canvas để đo chữ).
const widths = (text) => ({ normal: text.length * 6.6 + 26, compact: text.length * 5.5 + 18 });
const pin = (id, x, y, name, rank, shortName) => ({
  id, x, y, rank, widths: widths(name), shortWidths: shortName ? widths(shortName) : undefined,
});

test('hai ghim sát nhau: nhãn tránh nhau, không nhãn nào bị ẩn khi còn chỗ', () => {
  const sides = layoutLabels([pin('den', 500, 300, 'Đền thờ Tướng quân Lê Bá Đức', 1), pin('bai', 540, 290, 'Bãi Bến Hèn', 2)], [], 1000, 540);
  assert.notEqual(sides.den.side, 'hidden');
  assert.notEqual(sides.bai.side, 'hidden');
  assert.notEqual(sides.den.side, 'right'); // bên phải ghim "den" là ghim "bai"
});

test('nhãn nền bị ẩn khi chạm nhãn ghim', () => {
  const sides = layoutLabels([pin('cang', 500, 300, 'Cảng Vạn Gia', 1)], [{ id: 'bg', box: { l: 520, t: 255, r: 640, b: 275 } }], 1000, 540);
  assert.equal(sides.bg, 'hidden');
});

test('quá chật: thà ẩn nhãn còn hơn để nhãn đè lên nhau', () => {
  const pins = Array.from({ length: 12 }, (_, i) => pin(`p${i}`, 120 + (i % 4) * 20, 110 + Math.floor(i / 4) * 20, 'Một địa danh khá dài', i));
  const sides = layoutLabels(pins, [], 300, 200);
  assert.ok(Object.values(sides).some((p) => p.side === 'hidden'));
});

test('ghim sát mép phải: nhãn chuyển sang trái thay vì tràn ra ngoài', () => {
  const sides = layoutLabels([pin('den', 960, 300, 'Đền Lê Bá Đức', 1)], [], 1000, 540);
  assert.equal(sides.den.side, 'left');
});

test('hai ghim chồng nhau: ghim sau dời ngang cho tách ra, ghim trước giữ nguyên', () => {
  const sides = layoutLabels([pin('bai', 500, 300, 'Bãi Bến Hèn', 1), pin('den', 510, 296, 'Đền thờ Tướng quân Lê Bá Đức', 2)], [], 1000, 540);
  assert.equal(sides.bai.dx, 0);
  assert.ok(Math.abs(sides.den.dx) >= 34);
  assert.notEqual(sides.den.side, 'hidden');
});

test('góc từ trên xuống (vị trí ghim đo trên trang 18/11): đủ cả 7 nhãn, Đền dùng chú thích', () => {
  const pins = [
    pin('PH', 284, 393, 'Phân hiệu Vĩnh Trung', 6), pin('HD', 584, 321, 'Hải đăng Vĩnh Thực', 7),
    pin('VG', 430, 331, 'Cảng Vạn Gia', 5), pin('DD', 505, 389, 'Bãi Đầu Đông', 4),
    pin('TH', 436, 398, 'Trường TH&THCS Vĩnh Thực', 1, 'Trường TH&THCS'), pin('BH', 334, 417, 'Bãi Bến Hèn', 2),
    pin('DEN', 383, 409, 'Đền thờ Tướng quân Lê Bá Đức', 3, 'Đền Lê Bá Đức'),
  ];
  const sides = layoutLabels(pins, [], 819, 749);
  assert.deepEqual(Object.values(sides).filter((p) => p.side === 'hidden'), []);
  assert.equal(sides.DEN.side, 'callout');
});

test('góc toàn đảo (vị trí ghim đo từ ảnh chụp 18/11): đủ cả 7 nhãn', () => {
  const pins = [
    pin('PH', 276, 375, 'Phân hiệu Vĩnh Trung', 5),
    pin('BH', 342, 388, 'Bãi Bến Hèn', 2),
    pin('DEN', 362, 392, 'Đền thờ Tướng quân Lê Bá Đức', 3, 'Đền Lê Bá Đức'),
    pin('TH', 436, 380, 'Trường TH&THCS Vĩnh Thực', 1, 'Trường TH&THCS'),
    pin('DD', 482, 375, 'Bãi Đầu Đông', 4),
    pin('VG', 426, 322, 'Cảng Vạn Gia', 6),
    pin('HD', 621, 305, 'Hải đăng Vĩnh Thực', 7),
  ];
  const sides = layoutLabels(pins, [], 800, 731);
  assert.deepEqual(Object.values(sides).filter((p) => p.side === 'hidden'), []);
});
