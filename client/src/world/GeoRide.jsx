import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { rideInput, useRideStore } from '../store/useRideStore';
import { ISLAND_POI_LIST } from '../education/poiData';
import PLACES from '../education/island-places.json';
import { lonLatToWorld } from './geo';
import { ROAD_NODES, chooseNext, edgeLength, nearestRoadNode, nextJunction } from './roadGraph';
import { RideVehicle } from './RideVehicle';

const START_PLACE_ID = 'island-cang-van-gia';

// 1 đơn vị cảnh = 100 m. Xe chạy nhanh hơn thật khoảng 9 lần để mỗi chặng chỉ mất một hai phút;
// đồng hồ tốc độ vẫn hiện con số quen thuộc của xe máy.
const MAX_SPEED = 1.0;
const DISPLAY_MAX_KMH = 45;
const ACCELERATION = 0.9;
const BRAKING = 2.2;
const COASTING = 0.35;
const LOOK_AHEAD = 7; // Báo trước ngã rẽ trong vòng 700 m
const ARRIVE_DISTANCE = 4; // Tới nơi khi cách địa danh dưới 400 m
const LEAVE_DISTANCE = 6;
const CAMERA_BACK = 15;
const CAMERA_UP = 7.5;

const PLACE_POINTS = PLACES.map((place) => {
  const [x, z] = lonLatToWorld(place.longitude, place.latitude);
  return { poiId: place.poiId, x, z };
});

const KEY_ACTIONS = {
  KeyW: 'throttle', ArrowUp: 'throttle',
  KeyS: 'brake', ArrowDown: 'brake',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'uTurn', KeyR: 'uTurn',
};

// Xe máy tự lái trên mạng đường của đảo: người chơi giữ ga, chọn hướng trước mỗi ngã rẽ,
// và thẻ thông tin mở khi xe tới gần một địa danh.
export function GeoRide() {
  const group = useRef(null);
  const { camera } = useThree();
  const scratch = useMemo(() => ({ position: new THREE.Vector3(), desired: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  const ride = useRef(null);
  if (!ride.current) {
    const startPlace = PLACE_POINTS.find((place) => place.poiId === START_PLACE_ID) || PLACE_POINTS[0];
    const from = nearestRoadNode(startPlace.x, startPlace.z);
    const to = ROAD_NODES[from].neighbors[0] ?? from;
    const a = ROAD_NODES[from];
    const b = ROAD_NODES[to];
    ride.current = {
      from, to, travelled: 0, speed: 0,
      yaw: Math.atan2(b.x - a.x, b.z - a.z),
      cameraYaw: Math.atan2(b.x - a.x, b.z - a.z),
      snapCamera: true,
      currentPlace: startPlace.poiId,
      timer: 0,
    };
  }

  useEffect(() => {
    useRideStore.getState().markVisited(START_PLACE_ID);
    const act = (event, pressed) => {
      const action = KEY_ACTIONS[event.code];
      if (!action || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      if (action === 'throttle' || action === 'brake') rideInput[action] = pressed;
      else if (pressed && !event.repeat) {
        if (action === 'uTurn') rideInput.uTurn = true;
        else useRideStore.getState().setSteer(action === 'left' ? -1 : 1);
      }
    };
    const down = (event) => act(event, true);
    const up = (event) => act(event, false);
    const release = () => {
      rideInput.throttle = false;
      rideInput.brake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
      release();
    };
  }, []);

  useFrame((_, elapsed) => {
    const state = ride.current;
    const store = useRideStore.getState();
    const dt = Math.min(elapsed, 0.05);

    if (rideInput.uTurn) {
      rideInput.uTurn = false;
      const length = edgeLength(state.from, state.to);
      [state.from, state.to] = [state.to, state.from];
      state.travelled = length - state.travelled;
      state.speed = 0;
      store.clearSteer();
    }

    // Tốc độ
    if (rideInput.brake) state.speed = Math.max(0, state.speed - BRAKING * dt);
    else if (rideInput.throttle) state.speed = Math.min(MAX_SPEED, state.speed + ACCELERATION * dt);
    else state.speed = Math.max(0, state.speed - COASTING * dt);

    // Tiến dọc theo các cạnh của mạng đường
    state.travelled += state.speed * dt;
    let length = edgeLength(state.from, state.to);
    while (state.travelled >= length && length > 0) {
      const isJunction = ROAD_NODES[state.to].neighbors.length > 2;
      const next = chooseNext(state.from, state.to, isJunction ? store.steer : 0);
      if (next === null) {
        state.travelled = length; // Đường cụt: dừng ở cuối đường
        state.speed = 0;
        break;
      }
      state.travelled -= length;
      state.from = state.to;
      state.to = next;
      length = edgeLength(state.from, state.to);
      if (isJunction && store.steer !== 0) store.clearSteer();
    }

    const a = ROAD_NODES[state.from];
    const b = ROAD_NODES[state.to];
    const t = length > 0 ? state.travelled / length : 0;
    const position = scratch.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

    // Hướng xe và camera xoay mượt theo hướng đường
    const targetYaw = Math.atan2(b.x - a.x, b.z - a.z);
    const turn = (current, rate) => current + Math.atan2(Math.sin(targetYaw - current), Math.cos(targetYaw - current)) * (1 - Math.exp(-rate * dt));
    state.yaw = turn(state.yaw, 10);
    state.cameraYaw = turn(state.cameraYaw, 2.2);

    if (group.current) {
      group.current.position.copy(position);
      group.current.rotation.y = state.yaw;
    }

    scratch.desired.set(
      position.x - Math.sin(state.cameraYaw) * CAMERA_BACK,
      position.y + CAMERA_UP,
      position.z - Math.cos(state.cameraYaw) * CAMERA_BACK,
    );
    if (state.snapCamera) camera.position.copy(scratch.desired);
    else camera.position.lerp(scratch.desired, 1 - Math.exp(-4 * dt));
    state.snapCamera = false;
    camera.lookAt(scratch.look.set(position.x, position.y + 1, position.z));

    // Vài lần mỗi giây: cập nhật đồng hồ, ngã rẽ sắp tới và kiểm tra đã tới địa danh nào chưa
    state.timer += dt;
    if (state.timer < 0.2) return;
    state.timer = 0;

    const speedKmh = Math.round((state.speed / MAX_SPEED) * DISPLAY_MAX_KMH);
    if (speedKmh !== store.speedKmh) store.setSpeedKmh(speedKmh);

    const junction = nextJunction(state.from, state.to, state.travelled, LOOK_AHEAD);
    const summary = junction ? (junction.deadEnd ? 'end' : `${junction.left}${junction.straight}${junction.right}`) : '';
    if (summary !== state.junctionSummary) {
      state.junctionSummary = summary;
      store.setJunction(junction ? { left: junction.left, straight: junction.straight, right: junction.right, deadEnd: !!junction.deadEnd } : null);
    }

    let nearest = null;
    let nearestDistance = Infinity;
    for (const place of PLACE_POINTS) {
      const distance = Math.hypot(place.x - position.x, place.z - position.z);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = place;
      }
    }
    if (nearest && nearestDistance < ARRIVE_DISTANCE && state.currentPlace !== nearest.poiId) {
      state.currentPlace = nearest.poiId;
      state.speed = 0;
      rideInput.throttle = false;
      store.markVisited(nearest.poiId);
      useStore.getState().setActivePOI(ISLAND_POI_LIST.find((poi) => poi.id === nearest.poiId) || null);
    } else if (state.currentPlace && nearestDistance > LEAVE_DISTANCE) {
      state.currentPlace = null;
    }
  });

  return (
    <group ref={group} name="GeoRide">
      <Suspense fallback={null}>
        <RideVehicle />
      </Suspense>
    </group>
  );
}
