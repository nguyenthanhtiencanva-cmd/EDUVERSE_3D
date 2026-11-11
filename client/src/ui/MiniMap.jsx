import React from 'react';
import { useStore } from '../store/useStore';
import { POI_LIST, ISLAND_POI_LIST } from '../education/poiData';
import { Compass, Minimize2 } from 'lucide-react';

export function MiniMap() {
  const minimapOpen = useStore((state) => state.minimapOpen);
  const toggleMinimap = useStore((state) => state.toggleMinimap);
  const playerPosition = useStore((state) => state.playerPosition);
  const cameraMode = useStore((state) => state.cameraMode);
  const worldScope = useStore((state) => state.worldScope);
  const setActivePOI = useStore((state) => state.setActivePOI);

  const isIsland = worldScope === 'island';

  // Campus 1:1 Map Coordinate Transform
  const toMapX = (x) => ((x + 48) / 100) * 100;
  const toMapY = (z) => ((z + 38) / 84) * 100;

  // Island Calibrated Map Transform (X: -72..+72 -> span 144, Z: -20..+20 -> span 40)
  const toIslandX = (x) => ((x + 72) / 144) * 100;
  const toIslandY = (z) => ((z + 20) / 40) * 100;

  if (!minimapOpen) {
    return (
      <button
        onClick={toggleMinimap}
        className="glass-panel p-2.5 rounded-full text-amber-400 hover:text-white transition shadow-lg cursor-pointer"
        title="Mở bản đồ radar 2D"
      >
        <Compass className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="glass-panel p-2.5 rounded-2xl shadow-2xl border border-white/20 w-56 sm:w-68 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>{isIsland ? 'SA BÀN ĐẢO VĨNH THỰC' : 'PHÂN HIỆU VĨNH TRUNG (1:1)'}</span>
        </div>
        <button
          onClick={toggleMinimap}
          className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isIsland ? (
        <div className="relative w-full aspect-[144/50] bg-sky-950/90 rounded-xl overflow-hidden border border-cyan-500/30">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Mainland Mui Ngoc (North across channel from Van Gia) */}
            <ellipse cx="60" cy="8" rx="10" ry="7" fill="#15803d" stroke="#fde047" strokeWidth="0.6" opacity="0.85" />
            <text x="60" y="10" fontSize="2.8" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              MŨI NGỌC
            </text>
            {/* North-South Sea Route from Mui Ngoc to Ben Tau Van Gia */}
            <line x1="61" y1="15" x2="62" y2="28" stroke="#e0f2fe" strokeWidth="0.8" strokeDasharray="2,2" />

            {/* Calibrated Island Silhouette from Satellite Map */}
            {/* West tip -> North coast -> Van Gia bay -> Dau Tan peak -> Crescent Dau Dong -> South Ben Hen beach -> SW hook */}
            <path
              d="M 6,52 
                 C 14,46 24,47 32,48 
                 C 40,49 50,47 57,40 
                 C 61,28 66,28 70,36 
                 C 78,34 85,24 95,21 
                 C 97,25 93,36 86,46 
                 C 80,56 72,62 58,62 
                 C 48,60 38,62 30,65 
                 C 20,68 12,74 7,72 
                 C 5,68 8,62 14,60 
                 Z"
              fill="#16a34a"
              stroke="#fde68a"
              strokeWidth="1.2"
              opacity="0.9"
            />

            {/* Long Bến Hèn Barrier Sandbar along southern edge */}
            <path
              d="M 12,73 C 20,69 32,65 44,61"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1.4"
            />

            {/* Trans-Island Main Road */}
            <path
              d="M 7,52 L 32,48 L 52,48 L 70,44 L 94,22"
              fill="none"
              stroke="#facc15"
              strokeWidth="1.0"
              strokeDasharray="2,1"
            />
            {/* North Branch to Ben Tau Van Gia */}
            <line x1="58" y1="48" x2="62" y2="29" stroke="#facc15" strokeWidth="1.0" strokeDasharray="1.5,1" />

            {/* Island POI Markers */}
            {ISLAND_POI_LIST.map((poi) => {
              const cx = toIslandX(poi.position[0]);
              const cy = toIslandY(poi.position[2]);
              return (
                <g
                  key={poi.id}
                  className="cursor-pointer"
                  onClick={() => setActivePOI(poi)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={poi.hasDetailed3D ? '3.5' : poi.isSchoolCampus ? '2.8' : '2.3'}
                    fill={poi.isSchoolCampus ? '#f59e0b' : '#06b6d4'}
                    stroke="#ffffff"
                    strokeWidth="0.9"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="relative w-full aspect-[100/84] bg-slate-950/85 rounded-xl overflow-hidden border border-slate-700">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Courtyard Concrete Polygon */}
            <polygon
              points="52.6,93 62.8,92 66.8,84 66.8,5.5 16,5.5 16,43 28.5,43 28.5,71 33.5,74 46.2,75"
              fill="#334155"
              opacity="0.65"
            />

            {/* 2 Narrow West Planters */}
            <rect x="31" y="17" width="2.4" height="9" fill="#15803d" rx="0.5" />
            <rect x="31" y="31" width="2.4" height="11" fill="#15803d" rx="0.5" />

            {/* 2 Horizontal Grass Plots (Chuẩn Google Maps) */}
            <rect x="35" y="45" width="11.5" height="5.5" fill="#16a34a" opacity="0.85" rx="0.8" />
            <rect x="35.3" y="56.5" width="10.8" height="11.4" fill="#16a34a" opacity="0.85" rx="0.8" />

            {/* Building A (East Wing 3F - 52m) */}
            <rect x="62.2" y="21.5" width="8.6" height="62" fill="#d97706" rx="1" />
            <text x="66.5" y="53" fontSize="3.2" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              TÒA A
            </text>

            {/* Building B (North Wing 2F + Ceremony Stage) */}
            <rect x="34.6" y="5.4" width="31.6" height="9.8" fill="#ea580c" rx="1" />
            <rect x="44.7" y="15.2" width="9.4" height="6.5" fill="#dc2626" rx="0.8" />
            <text x="50.4" y="11.5" fontSize="3.2" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              TÒA B (LỄ ĐÀI)
            </text>

            {/* Building C2 (West Annex 2F) */}
            <rect x="15.9" y="11.6" width="8.2" height="31" fill="#9f1239" rx="1" />
            <text x="20" y="28" fontSize="2.4" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              TÒA C2
            </text>

            {/* Building C1 (Gymnasium - East-West Horizontal) & Bike Shed C3 */}
            <rect x="3.5" y="42.8" width="25" height="16.9" fill="#be123c" rx="1" />
            <text x="16" y="52.5" fontSize="3" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              NHÀ ĐA NĂNG
            </text>
            <rect x="11.5" y="64" width="15.5" height="6" fill="#0d9488" rx="0.8" />

            {/* Building D (Admin 3F - South Facing) & East Circular Garden */}
            <rect x="74.7" y="9" width="17.5" height="12" fill="#ca8a04" rx="1" />
            <text x="83.5" y="16" fontSize="2.8" fill="#ffffff" textAnchor="middle" fontWeight="bold">
              HIỆU BỘ
            </text>
            <rect x="74" y="51" width="19.5" height="32" fill="#15803d" opacity="0.65" rx="1" />
            <circle cx="83.8" cy="69" r="5" fill="none" stroke="#e2e8f0" strokeWidth="1" />

            {/* Main Gate & Guardhouse */}
            <rect x="52.5" y="91.5" width="8" height="3.5" fill="#0284c7" rx="0.8" />
            <rect x="59.4" y="86.5" width="3.6" height="4.2" fill="#b45309" rx="0.6" />
            <text x="56.5" y="98" fontSize="2.6" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
              CỔNG TRƯỜNG
            </text>

            {/* POI Markers */}
            {POI_LIST.map((poi) => {
              const cx = toMapX(poi.position[0]);
              const cy = toMapY(poi.position[2]);
              return (
                <circle
                  key={poi.id}
                  cx={cx}
                  cy={cy}
                  r="2.4"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  className="cursor-pointer hover:r-3.5 transition"
                  onClick={() => setActivePOI(poi)}
                />
              );
            })}

            {/* Live Player Position Indicator (Walk Mode) */}
            {cameraMode === 'fps' && (
              <circle
                cx={toMapX(playerPosition[0])}
                cy={toMapY(playerPosition[2])}
                r="2.8"
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="1"
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
