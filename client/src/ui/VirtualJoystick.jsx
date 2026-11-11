import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ArrowUp } from 'lucide-react';

export function VirtualJoystick() {
  const cameraMode = useStore((state) => state.cameraMode);
  const setJoystickMove = useStore((state) => state.setJoystickMove);
  const setJoystickLook = useStore((state) => state.setJoystickLook);
  const setJoystickJump = useStore((state) => state.setJoystickJump);

  const [activeTouchId, setActiveTouchId] = useState(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef(null);

  const lookTouchId = useRef(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  if (cameraMode !== 'fps') return null;

  // Handle Movement Joystick (Left)
  const handleMoveStart = (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    setActiveTouchId(touch.identifier);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleMoveChange = (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        updateKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleMoveEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        setActiveTouchId(null);
        setKnobPos({ x: 0, y: 0 });
        setJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX, clientY) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    // Normalize -1 to 1: moveX is right/left, moveY is forward/back (-dy)
    setJoystickMove(dx / maxRadius, -dy / maxRadius);
  };

  // Handle Look Swipe (Right screen half)
  const handleLookStart = (e) => {
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    // Only accept touches on the right half
    if (touch.clientX > window.innerWidth / 2) {
      lookTouchId.current = touch.identifier;
      lastLookPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookMove = (e) => {
    if (lookTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const deltaX = touch.clientX - lastLookPos.current.x;
        const deltaY = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        setJoystickLook(deltaX * 0.12, deltaY * 0.12);
        break;
      }
    }
  };

  const handleLookEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        setJoystickLook(0, 0);
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 select-none"
      onTouchStart={handleLookStart}
      onTouchMove={handleLookMove}
      onTouchEnd={handleLookEnd}
    >
      {/* Left Virtual Joystick for Movement */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={baseRef}
          onTouchStart={handleMoveStart}
          onTouchMove={handleMoveChange}
          onTouchEnd={handleMoveEnd}
          className="relative w-32 h-32 rounded-full bg-slate-950/60 border-2 border-amber-400/40 backdrop-blur-md flex items-center justify-center shadow-2xl"
        >
          {/* Inner Knob */}
          <div
            className="w-14 h-14 rounded-full bg-amber-500/80 border-2 border-white shadow-lg transition-transform"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Right Jump Button for Mobile */}
      <div className="absolute bottom-8 right-6 pointer-events-auto flex flex-col items-center gap-3">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            setJoystickJump(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setJoystickJump(false);
          }}
          className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-2xl border-2 border-white active:scale-95 transition"
        >
          <ArrowUp className="w-8 h-8" />
        </button>
        <span className="text-[11px] font-semibold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-white/10">
          NHẢY
        </span>
      </div>
    </div>
  );
}
