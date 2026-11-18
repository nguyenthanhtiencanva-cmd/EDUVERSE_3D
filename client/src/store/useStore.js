import { create } from 'zustand';
import { LIGHTHOUSE_WORLD, stairEntryAt } from '../world/lighthouse/layout';
import { nearbyLighthouseStop, readTourProgress, saveTourProgress } from '../world/lighthouse/tour';
import { VAN_GIA_SPAWN, nearbyVanGiaStop, readVanGiaProgress, saveVanGiaProgress } from '../world/vangia/layout';

const QUALITY_LEVELS = ['low', 'medium', 'high'];
const QUALITY_KEY = 'eduverse-quality';
const NEUTRAL_JOYSTICK = { moveX: 0, moveY: 0, isJumping: false, isRunning: false };

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
  spiralDirection: 1,
  visitedHotspots: readTourProgress(),
  vanGiaVisited: readVanGiaProgress(),
  playerTeleport: null,

  setWorldScope: (scope) =>
    set({
      worldScope: scope,
      campusTour: false,
      lighthouseLevel: 'ground',
      spiralProgress: 0,
      spiralDirection: 1,
      cameraMode: scope === 'island' ? 'orbit' : 'fps',
      activeView:
        scope === 'island'
          ? 'island_overview'
          : scope === 'lighthouse'
          ? 'lh_overview'
          : scope === 'vangia'
          ? 'vg_overview'
          : 'aerial',
      activePOI: null,
      // Đặt sẵn vị trí người chơi ở điểm xuất hiện, để thẻ tham quan không đọc vị trí của cảnh trước trong lúc tải.
      ...(scope === 'vangia' ? { playerPosition: [VAN_GIA_SPAWN.position[0], VAN_GIA_SPAWN.position[1] + 1.4, VAN_GIA_SPAWN.position[2]] } : {}),
      playerTeleport:
        scope === 'lighthouse'
          ? { ...LIGHTHOUSE_WORLD.spawn, nonce: Date.now() }
          : scope === 'vangia'
          ? { ...VAN_GIA_SPAWN, nonce: Date.now() }
          : scope === 'campus'
          ? { position: [1.5, 0, 6], yaw: Math.PI, level: 'ground', nonce: Date.now() }
          : null,
      joystickInput: NEUTRAL_JOYSTICK,
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
      joystickInput: NEUTRAL_JOYSTICK,
    }),

  setSpiralState: (patch) => set((state) => ({ ...state, ...patch })),

  enterLighthouseStairs: () =>
    set((state) => {
      if (state.worldScope !== 'lighthouse' || state.cameraMode !== 'fps') return {};
      const [x, y, z] = state.playerPosition;
      const entry = stairEntryAt({ x, y: y - 1.4, z }, state.lighthouseLevel);
      if (!entry) return {};
      const { pose, progress, yaw } = entry;
      return {
        lighthouseLevel: 'spiral',
        spiralProgress: progress,
        spiralDirection: progress === 1 ? -1 : 1,
        playerTeleport: {
          position: [pose.x, pose.y, pose.z],
          yaw,
          level: 'spiral',
          nonce: Date.now(),
        },
      };
    }),

  finishSpiralClimb: (finalLevel) => set({
    lighthouseLevel: finalLevel,
    spiralProgress: finalLevel === 'balcony' ? 1 : 0,
  }),

  // The existing "fps" mode is controlled by the third-person character.
  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Preset Views in Orbit Mode
  activeView: 'island_overview',
  // viewNonce tăng mỗi lần chọn góc nhìn, để chọn lại đúng góc đang chọn vẫn đưa camera về.
  viewNonce: 0,
  setActiveView: (view) =>
    set((state) => ({ activeView: view, cameraMode: 'orbit', activePOI: null, viewNonce: state.viewNonce + 1 })),

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
  setPlayerPosition: (playerPosition, landedFromTeleport = false) =>
    set((state) => {
      const patch = landedFromTeleport ? { playerPosition, playerTeleport: null } : { playerPosition };
      if (state.worldScope === 'vangia') {
        const stop = nearbyVanGiaStop(playerPosition);
        if (!stop || state.vanGiaVisited.includes(stop.id)) return patch;
        const vanGiaVisited = [...state.vanGiaVisited, stop.id];
        saveVanGiaProgress(vanGiaVisited);
        return { ...patch, vanGiaVisited };
      }
      if (state.worldScope !== 'lighthouse') return patch;
      const stop = nearbyLighthouseStop({ ...state, ...patch });
      if (!stop || state.visitedHotspots.includes(stop.id)) return patch;
      const visitedHotspots = [...state.visitedHotspots, stop.id];
      saveTourProgress(visitedHotspots);
      return { ...patch, visitedHotspots };
    }),

  // Mobile Virtual Joystick Input
  joystickInput: NEUTRAL_JOYSTICK,
  setJoystickMove: (moveX, moveY) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, moveX, moveY } })),
  setJoystickJump: (isJumping) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, isJumping } })),
  setJoystickRun: (isRunning) =>
    set((state) => ({ joystickInput: { ...state.joystickInput, isRunning } })),
}));
