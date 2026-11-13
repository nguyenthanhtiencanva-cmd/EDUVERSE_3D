import { create } from 'zustand';
import { LIGHTHOUSE_WORLD, TOWER, teleportFor, HOTSPOTS } from '../world/lighthouse/layout';

export const useStore = create((set) => ({
  worldScope: 'island',
  campusTour: false,
  lighthouseLevel: 'ground',
  activeHotspot: null,
  visitedHotspots: [],
  playerTeleport: null,

  setWorldScope: (scope) =>
    set({
      worldScope: scope,
      campusTour: false,
      lighthouseLevel: 'ground',
      activeHotspot: scope === 'lighthouse' ? HOTSPOTS[0] : null,
      cameraMode: scope === 'lighthouse' ? 'fps' : 'orbit',
      activeView:
        scope === 'island'
          ? 'island_overview'
          : scope === 'lighthouse'
          ? 'lh_overview'
          : 'aerial',
      activePOI: null,
      playerTeleport:
        scope === 'lighthouse'
          ? { ...LIGHTHOUSE_WORLD.spawn, nonce: Date.now() }
          : scope === 'campus'
          ? { position: [1.5, 0, 6], yaw: Math.PI, level: 'ground', nonce: Date.now() }
          : null,
      joystickInput: { moveX: 0, moveY: 0, isJumping: false },
    }),

  startCampusTour: () =>
    set({
      worldScope: 'campus',
      campusTour: true,
      cameraMode: 'fps',
      activeView: 'aerial',
      activePOI: null,
      playerPosition: [1.5, 1.4, 6],
      playerTeleport: { position: [1.5, 0, 6], yaw: Math.PI, level: 'ground', nonce: Date.now() },
      joystickInput: { moveX: 0, moveY: 0, isJumping: false },
    }),

  setActiveHotspot: (hotspot) =>
    set((state) => ({
      activeHotspot: hotspot,
      visitedHotspots:
        hotspot && !state.visitedHotspots.includes(hotspot.id)
          ? [...state.visitedHotspots, hotspot.id]
          : state.visitedHotspots,
    })),

  climbLighthouse: (targetLevel) =>
    set((state) => {
      const nextLevel = targetLevel || (state.lighthouseLevel === 'ground' ? 'balcony' : 'ground');
      const tp =
        nextLevel === 'balcony'
          ? {
              position: [TOWER.x, TOWER.balconyY, TOWER.z + 2.05],
              yaw: 0,
              level: 'balcony',
              nonce: Date.now(),
            }
          : {
              position: [TOWER.x, TOWER.rotundaFloor, TOWER.z + 3.4],
              yaw: 0,
              level: 'ground',
              nonce: Date.now(),
            };
      const lanternSpot = HOTSPOTS.find((h) => h.id === 'lantern');
      return {
        lighthouseLevel: nextLevel,
        cameraMode: 'fps',
        playerTeleport: tp,
        activeHotspot: nextLevel === 'balcony' ? lanternSpot : null,
        visitedHotspots:
          nextLevel === 'balcony' && lanternSpot && !state.visitedHotspots.includes('lantern')
            ? [...state.visitedHotspots, 'lantern']
            : state.visitedHotspots,
      };
    }),

  teleportToHotspot: (hotspot) =>
    set((state) => {
      const tp = teleportFor(hotspot);
      return {
        lighthouseLevel: tp.level,
        cameraMode: 'fps',
        playerTeleport: { ...tp, nonce: Date.now() },
        activeHotspot: hotspot,
        visitedHotspots: !state.visitedHotspots.includes(hotspot.id)
          ? [...state.visitedHotspots, hotspot.id]
          : state.visitedHotspots,
      };
    }),

  clearPlayerTeleport: () => set({ playerTeleport: null }),

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
