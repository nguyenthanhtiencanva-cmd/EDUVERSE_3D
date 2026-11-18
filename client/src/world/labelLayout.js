// Xếp nhãn của các ghim trên màn hình để không nhãn nào đè lên nhãn hay ghim khác.
// Chạy lại mỗi khi camera đổi góc, nên xoay bản đồ theo hướng nào nhãn cũng tự tìm chỗ trống.
//
// Thứ tự cố gắng:
//   1. Ghim chồng lên nhau thì ghim xếp sau dời ngang (GeoPin vẽ đường dẫn về vị trí thật).
//   2. Mỗi nhãn chọn một trong các phía quanh ghim; tìm kiếm có quay lui để ít nhãn bị ẩn nhất.
//   3. Còn chật thì dùng tên ngắn, rồi cỡ nhãn gọn (chữ nhỏ hơn).
//   4. Vẫn không vừa thì nhãn ẩn, rê chuột vào ghim mới hiện.

// Kích thước ghim giọt nước (GeoPin): rộng 34, cao 44, mũi ghim ở đáy.
const PIN_W = 34;
const PIN_H = 44;
const GAP = 6;
const EDGE = 4; // Chừa mép màn hình
// Khoảng từ mũi ghim tới mép trên nhãn khi đặt thấp một hàng (khớp với GeoPin: mt-[42px]).
const FAR_DROP = 42;

// Hai cỡ nhãn, khớp với lớp CSS trong GeoPin.
export const LABEL_SIZES = {
  normal: { font: '700 12px', pad: 26, height: 30 }, // text-xs, px-3, py-1.5, viền
  compact: { font: '700 10px', pad: 18, height: 22 }, // text-[10px], px-2, py-1, viền
};

// Vị trí nhãn so với mũi ghim (x, y) cho từng phía; trả về hộp { l, t, r, b } theo điểm ảnh.
const SIDES = {
  right: (x, y, w, h) => ({ l: x + PIN_W / 2 + GAP, t: y - PIN_H + 3, r: x + PIN_W / 2 + GAP + w, b: y - PIN_H + 3 + h }),
  left: (x, y, w, h) => ({ l: x - PIN_W / 2 - GAP - w, t: y - PIN_H + 3, r: x - PIN_W / 2 - GAP, b: y - PIN_H + 3 + h }),
  top: (x, y, w, h) => ({ l: x - w / 2, t: y - PIN_H - GAP - h, r: x + w / 2, b: y - PIN_H - GAP }),
  bottom: (x, y, w, h) => ({ l: x - w / 2, t: y + 8, r: x + w / 2, b: y + 8 + h }),
  // Các góc chéo: nhãn bắt đầu từ giữa ghim, dùng khi bốn phía chính đều vướng.
  'bottom-right': (x, y, w, h) => ({ l: x, t: y + 8, r: x + w, b: y + 8 + h }),
  'bottom-left': (x, y, w, h) => ({ l: x - w, t: y + 8, r: x, b: y + 8 + h }),
  'top-right': (x, y, w, h) => ({ l: x, t: y - PIN_H - GAP - h, r: x + w, b: y - PIN_H - GAP }),
  'top-left': (x, y, w, h) => ({ l: x - w, t: y - PIN_H - GAP - h, r: x, b: y - PIN_H - GAP }),
  // Thấp hơn một hàng, nối với mũi ghim bằng vạch dọc (GeoPin vẽ vạch). Vạch cũng tính là vật cản.
  'bottom-far': (x, y, w, h) => ({ l: Math.min(x - w / 2, x - 1), t: y + 4, r: Math.max(x + w / 2, x + 1), b: y + FAR_DROP + h }),
};
const DEFAULT_ORDER = ['right', 'left', 'top', 'bottom', 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-far'];

// Chú thích: nhãn đặt xa ghim theo nhiều hướng, GeoPin vẽ đường nối từ đầu ghim tới nhãn.
// Chỉ dùng khi các phía sát ghim đều kín. (ox, oy) là tâm nhãn so với tâm đầu ghim.
const HEAD_DY = 28; // Tâm đầu ghim nằm trên mũi ghim 28 điểm ảnh
const CALLOUTS = [64, 96].flatMap((radius) =>
  [0, 30, 330, 60, 300, 90, 270, 120, 240, 150, 210, 180].map((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    return { ox: Math.round(Math.cos(angle) * radius), oy: Math.round(-Math.sin(angle) * radius * 0.75) };
  }),
);
const calloutBox = (x, y, w, h, { ox, oy }) => ({ l: x + ox - w / 2, t: y - HEAD_DY + oy - h / 2, r: x + ox + w / 2, b: y - HEAD_DY + oy + h / 2 });

// Khi hai ghim chồng nhau trên màn hình, ghim xếp sau được đẩy ngang theo các bước này (điểm ảnh).
const SPREAD_STEPS = [1, -1, 2, -2, 3, -3].map((step) => step * (PIN_W + 2));
const MAX_STEPS = 4000; // Giới hạn tìm kiếm mỗi lần xếp, đủ cho vài chục ghim trong khoảng 1 ms

const overlaps = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const pinBox = (x, y) => ({ l: x - PIN_W / 2, t: y - PIN_H, r: x + PIN_W / 2, b: y + 4 });

let context = null;
// Đo bề rộng chữ thật bằng canvas, theo đúng phông của trang.
export function textWidth(text, font) {
  if (typeof document === 'undefined') return text.length * (parseFloat(font.split(' ')[1]) || 12) * 0.55;
  if (!context) context = document.createElement('canvas').getContext('2d');
  context.font = `${font} ${getComputedStyle(document.body).fontFamily}`;
  return context.measureText(text).width;
}

// Bề rộng nhãn của một tên ở từng cỡ: { normal, compact }.
export function pinLabelWidths(text) {
  return Object.fromEntries(Object.entries(LABEL_SIZES).map(([size, { font, pad }]) => [size, textWidth(text, font) + pad]));
}

// Xếp nhãn ở một cỡ. Trả về { hidden, cost, sides, boxes }.
function solve(options, size) {
  const { height } = LABEL_SIZES[size];
  const lists = options.map(({ pin, inside, obstacles }) => {
    const order = pin.preferred ? [pin.preferred, ...DEFAULT_ORDER.filter((side) => side !== pin.preferred)] : DEFAULT_ORDER;
    const widths = [[pin.widths[size], false], ...(pin.shortWidths ? [[pin.shortWidths[size], true]] : [])];
    const fits = [];
    const spills = [];
    for (const [width, short] of widths) {
      for (const side of order) {
        const box = SIDES[side](pin.x, pin.y, width, height);
        if (obstacles.some((other) => overlaps(box, other))) continue;
        (inside(box) ? fits : spills).push({ side, short, box });
      }
    }
    const callouts = [];
    for (const [width, short] of widths) {
      for (const offset of CALLOUTS) {
        const box = calloutBox(pin.x, pin.y, width, height, offset);
        if (!inside(box) || obstacles.some((other) => overlaps(box, other))) continue;
        callouts.push({ side: 'callout', short, box, ...offset });
      }
    }
    return [...fits, ...callouts, ...spills];
  });

  let best = null;
  let steps = 0;
  const picks = [];
  const search = (index, boxes, hidden, cost) => {
    if (steps++ > MAX_STEPS) return;
    if (best && (hidden > best.hidden || (hidden === best.hidden && cost >= best.cost))) return;
    if (index === lists.length) {
      best = { hidden, cost, picks: [...picks] };
      return;
    }
    const choices = lists[index];
    for (let i = 0; i < choices.length; i++) {
      if (boxes.some((other) => overlaps(choices[i].box, other))) continue;
      picks.push(choices[i]);
      search(index + 1, [...boxes, choices[i].box], hidden, cost + i);
      picks.pop();
    }
    picks.push(null);
    search(index + 1, boxes, hidden + 1, cost + choices.length);
    picks.pop();
  };
  search(0, [], 0, 0);
  return best;
}

/**
 * pins: [{ id, x, y, widths, shortWidths?, preferred, rank }]
 *   (x, y): mũi ghim trên màn hình; widths/shortWidths: { normal, compact } từ pinLabelWidths;
 *   preferred: phía ưu tiên (labelSide trong dữ liệu); rank nhỏ được xếp trước.
 * extras: [{ id, box }] — nhãn nền (tên đảo, bến...) ưu tiên thấp, bị ẩn nếu chạm nhãn hoặc ghim.
 * Trả về { [pinId]: { side, dx, short, size }, [extraId]: 'shown' | 'hidden' }.
 *   side: một khóa của SIDES, 'callout' (kèm ox, oy) hoặc 'hidden'; dx: độ dời ngang của ghim; short: dùng tên ngắn;
 *   size: 'normal' | 'compact' (cùng một cỡ cho mọi nhãn, để bản đồ đều mắt).
 */
export function layoutLabels(pins, extras, width, height) {
  const screen = { l: EDGE, t: EDGE, r: width - EDGE, b: height - EDGE };
  const inside = (box) => box.l >= screen.l && box.r <= screen.r && box.t >= screen.t && box.b <= screen.b;
  const ordered = [...pins].sort((a, b) => a.rank - b.rank);

  // Bước 1: tách các ghim chồng nhau. Ghim quan trọng hơn giữ nguyên chỗ, ghim sau dời ngang.
  const placedPins = [];
  const shifted = [];
  for (const pin of ordered) {
    let dx = 0;
    if (placedPins.some((box) => overlaps(pinBox(pin.x, pin.y), box))) {
      dx = SPREAD_STEPS.find((step) => !placedPins.some((box) => overlaps(pinBox(pin.x + step, pin.y), box))) ?? 0;
    }
    placedPins.push(pinBox(pin.x + dx, pin.y));
    shifted.push({ ...pin, x: pin.x + dx, dx });
  }
  const options = shifted.map((pin) => ({ pin, inside, obstacles: placedPins }));

  // Bước 2–3: cỡ thường trước; còn nhãn ẩn thì thử cỡ gọn và giữ cách ít nhãn ẩn hơn.
  let size = 'normal';
  let best = solve(options, size);
  if (best && best.hidden > 0) {
    const compact = solve(options, 'compact');
    if (compact && compact.hidden < best.hidden) {
      best = compact;
      size = 'compact';
    }
  }

  const result = {};
  const taken = [...placedPins];
  shifted.forEach((pin, i) => {
    const pick = best?.picks[i];
    if (pick) taken.push(pick.box);
    result[pin.id] = {
      side: pick ? pick.side : 'hidden',
      dx: pin.dx,
      short: pick ? pick.short : false,
      size,
      ...(pick?.side === 'callout' ? { ox: pick.ox, oy: pick.oy } : {}),
    };
  });

  for (const extra of extras) {
    const hit = taken.some((other) => overlaps(extra.box, other));
    result[extra.id] = hit ? 'hidden' : 'shown';
    if (!hit) taken.push(extra.box);
  }
  return result;
}
