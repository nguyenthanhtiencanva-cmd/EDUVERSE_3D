import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStore } from '../store/useStore';

export function VirtualJoystick() {
  const cameraMode = useStore((state) => state.cameraMode);
  const base = useRef(null);
  const activePointer = useRef(null);
  const [knob, setKnob] = useState([0, 0]);

  function resetMove() {
    activePointer.current = null;
    setKnob([0, 0]);
    useStore.getState().setJoystickMove(0, 0);
  }

  useEffect(() => {
    if (cameraMode !== 'fps') return;
    function resetInput() {
      resetMove();
      useStore.getState().setJoystickJump(false);
    }
    window.addEventListener('blur', resetInput);
    return () => {
      window.removeEventListener('blur', resetInput);
      resetInput();
    };
  }, [cameraMode]);

  function move(event) {
    if (event.pointerId !== activePointer.current) return;
    const bounds = base.current.getBoundingClientRect();
    const radius = bounds.width * 0.36;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const scale = Math.min(1, radius / (Math.hypot(dx, dy) || 1));
    setKnob([dx * scale, dy * scale]);
    useStore.getState().setJoystickMove(dx * scale / radius, -dy * scale / radius);
  }

  function finishMove(event) {
    if (event.pointerId === activePointer.current) resetMove();
  }

  if (cameraMode !== 'fps') return null;
  return <div className="tour-touch-controls pointer-events-none fixed inset-0 z-30 select-none">
    <div ref={base} aria-label="Joystick di chuyển"
      className="pointer-events-auto absolute bottom-6 left-5 grid h-28 w-28 touch-none place-items-center rounded-full border-2 border-white/40 bg-slate-950/60 shadow-xl"
      onPointerDown={(event) => {
        if (activePointer.current !== null) return;
        activePointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move} onPointerUp={finishMove} onPointerCancel={finishMove} onLostPointerCapture={finishMove}>
      <div className="pointer-events-none h-11 w-11 rounded-full border-2 border-white bg-amber-400 shadow-lg"
        style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
    </div>
    <button aria-label="Nhảy"
      className="pointer-events-auto absolute bottom-7 right-5 grid h-14 w-14 touch-none place-items-center rounded-full border border-white bg-amber-400 text-slate-950 shadow-xl"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        useStore.getState().setJoystickJump(true);
      }}
      onPointerUp={() => useStore.getState().setJoystickJump(false)}
      onPointerCancel={() => useStore.getState().setJoystickJump(false)}
      onLostPointerCapture={() => useStore.getState().setJoystickJump(false)}>
      <ArrowUp size={23} />
    </button>
  </div>;
}
