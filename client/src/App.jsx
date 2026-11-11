import React, { lazy, Suspense } from 'react';
import { useStore } from './store/useStore';

const GeographicIsland = lazy(() => import('./world/GeographicIsland'));
const LegacyWorld = lazy(() => import('./LegacyWorld'));

class WorldErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="map-message" role="alert">
      <p>Chưa mở được cảnh 3D. Hãy kiểm tra kết nối và bật WebGL trong trình duyệt.</p>
      <button onClick={() => window.location.reload()}>Tải lại ứng dụng</button>
    </div>;
    return this.props.children;
  }
}

export default function App() {
  const worldScope = useStore((state) => state.worldScope);
  return <main className="relative w-full h-full overflow-hidden bg-slate-950">
    <WorldErrorBoundary key={worldScope}>
      <Suspense fallback={<div className="map-message" role="status">Đang mở không gian Vĩnh Thực…</div>}>
        {worldScope === 'geographic' ? <GeographicIsland /> : <LegacyWorld />}
      </Suspense>
    </WorldErrorBoundary>
  </main>;
}
