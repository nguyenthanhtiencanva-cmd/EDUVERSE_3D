import { create } from 'zustand';

// Trạng thái của chế độ lái xe máy trên bản đồ đảo.
// Ga và phanh đổi liên tục nên nằm trong `rideInput` (không gây vẽ lại giao diện);
// những thứ giao diện cần hiển thị thì nằm trong store.
export const rideInput = { throttle: false, brake: false, uTurn: false };

export const useRideStore = create((set) => ({
  riding: false,
  steer: 0, // Hướng đã chọn cho ngã rẽ kế tiếp: -1 trái, 0 thẳng, 1 phải
  junction: null, // Ngã rẽ sắp tới: { left, straight, right } hoặc { deadEnd: true }
  speedKmh: 0,
  visited: [],

  startRide: () => {
    rideInput.throttle = false;
    rideInput.brake = false;
    rideInput.uTurn = false;
    set({ riding: true, steer: 0, junction: null, speedKmh: 0 });
  },
  stopRide: () => set({ riding: false, steer: 0, junction: null, speedKmh: 0 }),
  setSteer: (steer) => set((state) => ({ steer: state.steer === steer ? 0 : steer })),
  clearSteer: () => set({ steer: 0 }),
  setJunction: (junction) => set({ junction }),
  setSpeedKmh: (speedKmh) => set({ speedKmh }),
  markVisited: (poiId) => set((state) => (state.visited.includes(poiId) ? {} : { visited: [...state.visited, poiId] })),
}));
