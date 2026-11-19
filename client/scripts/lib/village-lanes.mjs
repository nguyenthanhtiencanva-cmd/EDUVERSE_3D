/**
 * Đường xóm thầy chỉ ra mà OpenStreetMap chỉ ghi là đường mòn, hoặc chưa vẽ tới nơi.
 * `roads:build` gọi applyVillageLanes trước khi ghi island-roads.json; `houses:build` dùng VILLAGE_LANES
 * để đặt xóm dọc các đường này.
 */
export const VILLAGE_LANES = [
  {
    id: 'ben-hen',
    name: 'Đường ra Bãi Bến Hèn',
    source:
      'Thầy chỉ đường ra Bến Hèn ngày 19/11/2026 (đường bê tông, nhà hai bên). Lấy đường mòn OpenStreetMap đi qua điểm `via`, nâng thành đường xóm và nối thẳng xuống mép bãi.',
    via: [107.923, 21.368],
    to: [107.923, 21.3631], // Mép bãi cát, cách ghim Bãi Bến Hèn khoảng 50 m về phía Bắc
    village: { center: [107.9231, 21.3665], radius: 450 },
  },
];

const KM_PER_DEGREE_LATITUDE = 110.574;
const KM_PER_DEGREE_LONGITUDE = 111.32 * Math.cos((21.385 * Math.PI) / 180);
const meters = ([lonA, latA], [lonB, latB]) =>
  1000 * Math.hypot((lonB - lonA) * KM_PER_DEGREE_LONGITUDE, (latB - latA) * KM_PER_DEGREE_LATITUDE);

/**
 * Chuyển đường mòn đi qua `via` sang nhóm đường phụ và kéo dài tới `to`, chèn điểm mỗi 30 m.
 * Chạy lại trên dữ liệu đã chuyển thì không đổi gì (không còn đường mòn qua `via`).
 * @param {{minorRoads: number[][][], tracks: number[][][]}} data mỗi điểm là [kinh độ, vĩ độ, cao độ]
 * @param {(lon: number, lat: number) => number} heightAt cao độ địa hình (m)
 */
export function applyVillageLanes(data, heightAt) {
  const applied = [];
  for (const lane of VILLAGE_LANES) {
    const index = data.tracks.findIndex((line) => line.some((point) => meters(point, lane.via) < 40));
    if (index < 0) continue;
    let line = data.tracks.splice(index, 1)[0];
    if (meters(line[0], lane.to) < meters(line[line.length - 1], lane.to)) line = [...line].reverse();
    const end = line[line.length - 1];
    const pieces = Math.ceil(meters(end, lane.to) / 30);
    for (let piece = 1; piece <= pieces; piece++) {
      const t = piece / pieces;
      const lon = end[0] + (lane.to[0] - end[0]) * t;
      const lat = end[1] + (lane.to[1] - end[1]) * t;
      line.push([Number(lon.toFixed(5)), Number(lat.toFixed(5)), Number(heightAt(lon, lat).toFixed(1))]);
    }
    data.minorRoads.push(line);
    applied.push(lane.id);
  }
  return applied;
}
