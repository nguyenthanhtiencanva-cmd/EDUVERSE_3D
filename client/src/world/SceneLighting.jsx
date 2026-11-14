import React from 'react';
import { Sky } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { GEO_MAP_ENABLED } from './geo';

export function SceneLighting() {
  const timeOfDay = useStore((state) => state.timeOfDay);
  const worldScope = useStore((state) => state.worldScope);
  const isIsland = worldScope === 'island';
  const quality = useStore((state) => state.quality);
  const shadowMapSize = quality === 'high' ? 2048 : 1024;

  const configs = {
    day: {
      sunColor: '#FFFDF5',
      sunIntensity: 3.0,
      sunPos: [45, 55, 35],
      skyColor: '#BAE6FD',
      groundColor: '#CBD5E1',
      ambientIntensity: 0.78,
      fogColor: '#E0F2FE',
      fogNear: isIsland ? 120 : 75,
      fogFar: isIsland ? 520 : 380,
    },
    sunset: {
      sunColor: '#F59E0B',
      sunIntensity: 3.2,
      sunPos: [50, 20, 25],
      skyColor: '#FB923C',
      groundColor: '#78350F',
      ambientIntensity: 0.55,
      fogColor: '#F97316',
      fogNear: isIsland ? 95 : 50,
      fogFar: isIsland ? 420 : 300,
    },
    night: {
      sunColor: '#60A5FA',
      sunIntensity: 0.5,
      sunPos: [30, 45, 30],
      skyColor: '#1E293B',
      groundColor: '#0F172A',
      ambientIntensity: 0.38,
      fogColor: '#0F172A',
      fogNear: isIsland ? 85 : 40,
      fogFar: isIsland ? 380 : 250,
    },
  };

  const current = { ...(configs[timeOfDay] || configs.day) };
  // Bản đồ đảo dữ liệu thật rộng hơn sa bàn cũ nhiều lần, nên sương mù phải lùi ra xa.
  const geoIsland = isIsland && GEO_MAP_ENABLED;
  if (geoIsland) {
    current.fogNear = 380;
    current.fogFar = 1500;
  }
  const shadowExtent = isIsland ? 72 : 55;

  return (
    <>
      <color attach="background" args={[current.fogColor]} />
      <fog attach="fog" args={[current.fogColor, current.fogNear, current.fogFar]} />

      {/* Realistic Atmospheric Sky Dome */}
      {timeOfDay !== 'night' && (
        <Sky
          distance={4500}
          sunPosition={current.sunPos}
          inclination={timeOfDay === 'sunset' ? 0.49 : 0.62}
          azimuth={0.25}
          turbidity={timeOfDay === 'sunset' ? 8 : 3.5}
          rayleigh={timeOfDay === 'sunset' ? 2.5 : 0.85}
        />
      )}

      {/* Hemisphere Ambient Sky Fill */}
      <hemisphereLight
        args={[current.skyColor, current.groundColor, current.ambientIntensity]}
      />

      {/* Primary Directional Sunlight with Shadows */}
      <directionalLight
        key={shadowMapSize}
        position={current.sunPos}
        intensity={current.sunIntensity}
        color={current.sunColor}
        castShadow={quality !== 'low'}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={280}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-bias={-0.0005}
      />

      {/* Nighttime glowing lanterns / lighthouse beacon */}
      {timeOfDay === 'night' && !isIsland && (
        <>
          <pointLight position={[8.0, 2.5, -23.0]} color="#FBBF24" intensity={4} distance={20} />
          <pointLight position={[1.0, 3.5, 17.0]} color="#FBBF24" intensity={5} distance={25} />
          <pointLight position={[14.0, 3.8, 0.0]} color="#FDE047" intensity={3} distance={18} />
        </>
      )}
      {timeOfDay === 'night' && isIsland && !geoIsland && (
        <>
          <pointLight position={[57.0, 18.0, -21.5]} color="#FDE047" intensity={10} distance={45} />
          <pointLight position={[-18.0, 5.0, 7.0]} color="#FBBF24" intensity={5} distance={25} />
          <pointLight position={[35.0, 5.0, -9.5]} color="#FBBF24" intensity={5} distance={25} />
        </>
      )}
    </>
  );
}
