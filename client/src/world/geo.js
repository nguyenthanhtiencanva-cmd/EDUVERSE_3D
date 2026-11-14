// Hệ tọa độ của bản đồ đảo dựng từ dữ liệu thật. 1 đơn vị cảnh = 100 m theo phương ngang.
// Trục +x là hướng Đông, trục -z là hướng Bắc.
export const GEO_EXTENT = { west: 107.76, south: 21.26, east: 108.12, north: 21.48 };
export const GEO_ORIGIN = { longitude: 107.93, latitude: 21.385 };

const UNITS_PER_KM = 10;
const KM_PER_DEGREE_LATITUDE = 110.574;
const KM_PER_DEGREE_LONGITUDE = 111.32 * Math.cos((GEO_ORIGIN.latitude * Math.PI) / 180);

export const METERS_PER_UNIT = 1000 / UNITS_PER_KM;

export function lonLatToWorld(longitude, latitude) {
  return [
    (longitude - GEO_ORIGIN.longitude) * KM_PER_DEGREE_LONGITUDE * UNITS_PER_KM,
    -(latitude - GEO_ORIGIN.latitude) * KM_PER_DEGREE_LATITUDE * UNITS_PER_KM,
  ];
}

const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);

// Bản thử: mở bằng ?map=new. Thêm &exag=2 để đổi độ phóng đại chiều đứng (mặc định 3).
export const GEO_MAP_ENABLED = params.get('map') === 'new';
export const VERTICAL_EXAGGERATION = Math.min(Math.max(Number(params.get('exag')) || 3, 1), 6);
