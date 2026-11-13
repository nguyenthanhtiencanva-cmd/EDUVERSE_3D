import React, { lazy, Suspense } from 'react';
import { useStore } from './store/useStore';

const LegacyWorld = lazy(() => import('./LegacyWorld'));

class SceneErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
        <div>
          <p role="alert">Chưa mở được cảnh 3D.</p>
          <button className="mt-3 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={() => useStore.getState().setWorldScope('island')}>
            Tải lại sa bàn
          </button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const worldScope = useStore((state) => state.worldScope);
  return <main className="relative h-full w-full overflow-hidden bg-slate-950">
    <SceneErrorBoundary key={worldScope} scope={worldScope}>
      <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white" role="status">
        Đang mở không gian Vĩnh Thực…
      </div>}>
        <LegacyWorld />
      </Suspense>
    </SceneErrorBoundary>
  </main>;
}
