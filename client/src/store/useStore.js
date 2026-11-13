import { create } from 'zustand';

export const useStore = create((set) => ({
  worldScope: 'geographic',
  campusTour: false,
  setWorldScope: (scope) =>
    set({
      worldScope: scope,
      campusTour: false,
      cameraMode: 'orbit',
      activeView: scope === 'island' ? 'island_overview' : 'aerial',
      activePOI: null,
      joystickInput: { moveX: 0, moveY: 0, isJumping: false },
    }),
  startCampusTour: () => set({
    worldScope: 'campus',
    campusTour: true,
    cameraMode: 'fps',
    activeView: 'aerial',
    activePOI: null,
    playerPosition: [1.5, 1.4, 6],
    joystickInput: { moveX: 0, moveY: 0, isJumping: false },
  }),

  // The existing "fps" mode is controlled by the third-person character.
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
  joystickInput: { moveX: 0, moveY: 0, isJumping: false },
  setJoystickMove: (moveX, moveY) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, moveX, moveY } })),
  setJoystickJump: (isJumping) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, isJumping } })),
}));
