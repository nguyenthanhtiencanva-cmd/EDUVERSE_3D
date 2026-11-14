import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { campusCanWalk, campusGroundAt } from './campusCollision';

// Bật bằng cách thêm ?stats vào địa chỉ trang. Hiện FPS, số lệnh vẽ và số tam giác của khung hình.
export const STATS_ENABLED =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats');

// Cho phép thử va chạm từ bảng điều khiển của trình duyệt khi bật ?stats.
if (STATS_ENABLED) window.__eduverseCollision = { campusCanWalk, campusGroundAt };

export function PerfProbe() {
  const gl = useThree((state) => state.gl);
  const sample = useRef({ frames: 0, time: 0 }).current;

  useFrame((_, delta) => {
    sample.frames += 1;
    sample.time += delta;
    if (sample.time < 0.5) return;
    const stats = {
      fps: Math.round(sample.frames / sample.time),
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    };
    sample.frames = 0;
    sample.time = 0;
    window.__eduverseStats = stats;
    const node = document.getElementById('perf-overlay');
    if (node) node.textContent = `${stats.fps} FPS · ${stats.calls} lệnh vẽ · ${stats.triangles.toLocaleString('vi-VN')} tam giác`;
  });
  return null;
}
