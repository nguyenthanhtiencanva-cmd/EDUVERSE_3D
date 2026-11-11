import { create } from 'zustand';

export const useStore = create((set) => ({
  // World Scope: 'island' (Sa bàn Toàn đảo Vĩnh Thực) or 'campus' (Phân hiệu Vĩnh Trung 1:1)
  worldScope: 'island',
  setWorldScope: (scope) =>
    set({
      worldScope: scope,
      cameraMode: 'orbit',
      activeView: scope === 'island' ? 'island_overview' : 'aerial',
      activePOI: null,
    }),

  // Camera Mode: 'orbit' (Flycam Orbit) or 'fps' (First-person walking)
  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Preset Views in Orbit Mode
  activeView: 'island_overview',
  setActiveView: (view) => set({ activeView: view, cameraMode: 'orbit', activePOI: null }),

  // Selected Point of Interest (POI)
  activePOI: null,
  setActivePOI: (poi) => set({ activePOI: poi }),

  // Time of Day Lighting: 'day', 'sunset', 'night'
  timeOfDay: 'day',
  setTimeOfDay: (time) => set({ timeOfDay: time }),

  // Audio / Sound Effects
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  // Minimap Visibility
  minimapOpen: true,
  toggleMinimap: () => set((state) => ({ minimapOpen: !state.minimapOpen })),

  // Player Position in World Space (for Minimap & POI distances)
  playerPosition: [4.0, -10.0, 1.7],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  // Mobile Virtual Joystick Input
  joystickInput: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, isJumping: false },
  setJoystickMove: (moveX, moveY) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, moveX, moveY } })),
  setJoystickLook: (lookX, lookY) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, lookX, lookY } })),
  setJoystickJump: (isJumping) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, isJumping } })),
}));
