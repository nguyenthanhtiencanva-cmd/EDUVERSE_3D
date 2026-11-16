import { useGLTF } from '@react-three/drei';
import campus from '../assets/models/school_campus.glb?url';
import island from '../assets/models/vinh_thuc_island.glb?url';
import lighthouse from '../assets/models/hai_dang.glb?url';
import lighthouseLandscape from '../assets/models/lighthouse_landscape.glb?url';
import tourist from '../assets/models/tourist.glb?url';
import student from '../assets/models/student.glb?url';
import terrain from '../assets/models/vinh_thuc_terrain.glb?url';
import vanGia from '../assets/models/cang_van_gia.glb?url';

// Bản nén sinh từ assets/web-models/ bằng `npm run models:compress`.
export const MODEL_URLS = { campus, island, lighthouse, lighthouseLandscape, tourist, student, terrain, vanGia };

const SCENE_MODELS = {
  island: [island, lighthouse],
  campus: [campus, tourist],
  lighthouse: [lighthouseLandscape, tourist],
  vangia: [vanGia, tourist],
};

// Tải trước mô hình của một cảnh, gọi khi người dùng sắp chuyển sang cảnh đó.
export function preloadScene(scope) {
  SCENE_MODELS[scope]?.forEach((url) => useGLTF.preload(url));
}
