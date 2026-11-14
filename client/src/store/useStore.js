import { create } from 'zustand';
import { LIGHTHOUSE_WORLD, TOWER, getSpiralPose } from '../world/lighthouse/layout';

const QUALITY_LEVELS = ['low', 'medium', 'high'];
const QUALITY_KEY = 'eduverse-quality';

function readSavedQuality() {
  try {
    const saved = localStorage.getItem(QUALITY_KEY);
    return QUALITY_LEVELS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function guessQuality() {
  try {
    return window.matchMedia('(pointer: coarse)').matches ? 'medium' : 'high';
  } catch {
    return 'high';
  }
}

const savedQuality = readSavedQuality();

export const useStore = create((set) => ({
  // Mức chất lượng hình ảnh: 'low' | 'medium' | 'high'.
  // Khi người dùng chưa tự chọn (qualityAuto), ứng dụng tự hạ mức nếu máy chạy chậm.
  quality: savedQuality || guessQuality(),
  qualityAuto: !savedQuality,
  setQuality: (quality) => {
    try {
      localStorage.setItem(QUALITY_KEY, quality);
    } catch {
      // Không lưu được thì vẫn áp dụng cho phiên này.
    }
    set({ quality, qualityAuto: false });
  },
  lowerQuality: () =>
    set((state) => {
      const index = QUALITY_LEVELS.indexOf(state.quality);
      return state.qualityAuto && index > 0 ? { quality: QUALITY_LEVELS[index - 1] } : {};
    }),

  worldScope: 'island',
  campusTour: false,
  lighthouseLevel: 'ground', // 'ground' | 'spiral' | 'balcony'
  spiralProgress: 0, // 0.0 (chân tháp) -> 1.0 (ban công đỉnh tháp 15m)
  autoClimb: null, // null | 'up' | 'down'
  activeHotspot: null,
  visitedHotspots: [],
  playerTeleport: null,

  setWorldScope: (scope) =>
    set({
      worldScope: scope,
      campusTour: false,
      lighthouseLevel: 'ground',
      spiralProgress: 0,
      autoClimb: null,
      activeHotspot: null,
      cameraMode: scope === 'island' ? 'orbit' : 'fps',
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

  setSpiralState: (patch) => set((state) => ({ ...state, ...patch })),

  climbLighthouse: (targetLevel) =>
    set((state) => {
      const goingUp = targetLevel
        ? targetLevel === 'balcony'
        : state.lighthouseLevel === 'ground' ||
          (state.lighthouseLevel === 'spiral' && state.autoClimb === 'down');
      const startT =
        state.lighthouseLevel === 'spiral' ? state.spiralProgress : goingUp ? 0.0 : 1.0;
      const pose = getSpiralPose(startT);
      return {
        lighthouseLevel: 'spiral',
        spiralProgress: startT,
        autoClimb: goingUp ? 'up' : 'down',
        cameraMode: 'fps',
        playerTeleport: {
          position: [pose.x, pose.y, pose.z],
          yaw: goingUp ? pose.yawUp : pose.yawUp + Math.PI,
          level: 'spiral',
          nonce: Date.now(),
        },
      };
    }),

  finishSpiralClimb: (finalLevel) =>
    set(() => {
      if (finalLevel === 'balcony') {
        const topPose = getSpiralPose(1.0);
        return {
          lighthouseLevel: 'balcony',
          spiralProgress: 1.0,
          autoClimb: null,
          playerTeleport: {
            position: [TOWER.x, TOWER.balconyY, TOWER.z + 2.05],
            yaw: topPose.yawUp,
            level: 'balcony',
            nonce: Date.now(),
          },
        };
      }
      return {
        lighthouseLevel: 'ground',
        spiralProgress: 0.0,
        autoClimb: null,
        playerTeleport: {
          position: [TOWER.x + 1.8, TOWER.rotundaFloor, TOWER.z + 2.8],
          yaw: 0,
          level: 'ground',
          nonce: Date.now(),
        },
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

  // Minimap Visibility
  minimapOpen: true,
  toggleMinimap: () => set((state) => ({ minimapOpen: !state.minimapOpen })),

  // Player Position in World Space
  playerPosition: [4.0, -10.0, 1.7],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  // Mobile Virtual Joystick Input
  joystickInput: { moveX: 0, moveY: 0, isJumping: false },
  setJoystickMove: (moveX, moveY) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, moveX, moveY } })),
  setJoystickJump: (isJumping) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, isJumping } })),
}));
