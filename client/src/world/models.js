import { useGLTF } from '@react-three/drei';
import campus from '../assets/models/school_campus.glb?url';
import island from '../assets/models/vinh_thuc_island.glb?url';
import lighthouse from '../assets/models/hai_dang.glb?url';
import lighthouseLandscape from '../assets/models/lighthouse_landscape.glb?url';
import tourist from '../assets/models/tourist.glb?url';
import student from '../assets/models/student.glb?url';
import terrain from '../assets/models/vinh_thuc_terrain.glb?url';
import vanGia from '../assets/models/cang_van_gia.glb?url';
import vanGiaDong from '../assets/models/cang_van_gia_dong.glb?url';
// Người dân Cảng Vạn Gia dựng bằng Meshy (scripts/generate-port-people-meshy.mjs)
import portNguDan from '../assets/models/port_ngu_dan.glb?url';
import portBanHang from '../assets/models/port_ban_hang.glb?url';
import portNhanVienBen from '../assets/models/port_nhan_vien_ben.glb?url';
import portKhachDuLich from '../assets/models/port_khach_du_lich.glb?url';
// Học sinh Phân hiệu Vĩnh Trung dựng bằng Blender + MPFB2 (assets/characters/generate_students_mpfb.py)
import studentPrimaryBoy from '../assets/models/student_primary_boy.glb?url';
import studentPrimaryGirl from '../assets/models/student_primary_girl.glb?url';
import studentMidBoy from '../assets/models/student_mid_boy.glb?url';
import studentMidGirl from '../assets/models/student_mid_girl.glb?url';

// Bản nén sinh từ assets/web-models/ bằng `npm run models:compress`.
export const MODEL_URLS = { campus, island, lighthouse, lighthouseLandscape, tourist, student, terrain, vanGia, vanGiaDong,
  portNguDan, portBanHang, portNhanVienBen, portKhachDuLich,
  studentPrimaryBoy, studentPrimaryGirl, studentMidBoy, studentMidGirl };

const SCENE_MODELS = {
  island: [island, lighthouse],
  campus: [campus, tourist, studentPrimaryBoy, studentPrimaryGirl, studentMidBoy, studentMidGirl],
  lighthouse: [lighthouseLandscape, tourist],
  vangia: [vanGia, vanGiaDong, tourist, portNguDan, portBanHang, portNhanVienBen, portKhachDuLich],
};

// Tải trước mô hình của một cảnh, gọi khi người dùng sắp chuyển sang cảnh đó.
export function preloadScene(scope) {
  SCENE_MODELS[scope]?.forEach((url) => useGLTF.preload(url));
}
