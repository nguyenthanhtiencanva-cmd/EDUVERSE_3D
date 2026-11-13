import React, { useEffect, useRef, useState } from 'react';
import {
  ArcGisMapServerImageryProvider, BoundingSphere, Cartesian2, Cartesian3, Color, Credit,
  CustomHeightmapTerrainProvider, GeographicTilingScheme, HeadingPitchRange, HeadingPitchRoll,
  HeightReference, ImageryLayer, Ion, LabelStyle, Math as CesiumMath, Model, Rectangle, ScreenSpaceEventType,
  SingleTileImageryProvider, Transforms, Viewer,
} from 'cesium';
import { ChevronRight, Compass, Footprints, Layers3, List, MapPin, Mountain, X } from 'lucide-react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './geographic.css';
import { useStore } from '../store/useStore';
import { prepareCampusMaterials, sampleElevation, SCHOOL_ANCHOR } from './geography';

Ion.defaultAccessToken = '';
const ISLAND_CENTER = Cartesian3.fromDegrees(107.922, 21.366);
const PREVIEW_STOPS = ['Bến Vạn Gia', SCHOOL_ANCHOR.name, 'Bến Hèn', 'Bãi Đầu Đông', 'Hải đăng Vĩnh Thực'];
let previousView;

function createTerrain(grid, values) {
  const tileSize = 65;
  const tilingScheme = new GeographicTilingScheme();
  return new CustomHeightmapTerrainProvider({
    width: tileSize, height: tileSize, tilingScheme, credit: new Credit(grid.attribution),
    callback(x, y, level) {
      const rectangle = tilingScheme.tileXYToRectangle(x, y, level);
      const result = new Float32Array(tileSize * tileSize);
      for (let row = 0; row < tileSize; row++) {
        const latitude = CesiumMath.toDegrees(rectangle.north - rectangle.height * row / (tileSize - 1));
        for (let column = 0; column < tileSize; column++) {
          const longitude = CesiumMath.toDegrees(rectangle.west + rectangle.width * column / (tileSize - 1));
          result[row * tileSize + column] = sampleElevation(grid, values, longitude, latitude);
        }
      }
      return result;
    },
  });
}

function moveCameraToSchool(view, duration) {
  const camera = view.viewer.camera;
  camera.cancelFlight();
  view.focusingSchool = duration > 0;
  const finish = () => { view.focusingSchool = false; };
  camera.flyToBoundingSphere(new BoundingSphere(view.schoolPosition, 85), {
    offset: new HeadingPitchRange(0.1, CesiumMath.toRadians(-43), 285),
    duration,
    complete: finish,
    cancel: finish,
  });
}

export default function GeographicIsland() {
  const container = useRef(null);
  const scene = useRef(null);
  const selected = useRef(previousView?.selected ?? false);
  const satelliteEnabled = useRef(previousView?.satellite ?? false);
  const [schoolOpen, setSchoolOpen] = useState(selected.current);
  const [listOpen, setListOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [schoolStatus, setSchoolStatus] = useState('');
  const [satellite, setSatellite] = useState(satelliteEnabled.current);
  const [satelliteStatus, setSatelliteStatus] = useState('');
  const startCampusTour = useStore((state) => state.startCampusTour);
  const setWorldScope = useStore((state) => state.setWorldScope);

  function showSchool(open) {
    selected.current = open;
    setSchoolOpen(open);
    const view = scene.current;
    if (!view) return;
    view.pin.point.color = Color.fromCssColorString(open ? '#6ee7b7' : '#fbbf24');
    view.pin.label.backgroundColor = Color.fromCssColorString(open ? '#155e55' : '#162c45');
    if (view.school) view.school.show = open;
    view.viewer.scene.requestRender();
  }

  async function loadSchool(view) {
    if (view.school || view.loadingSchool) return;
    view.loadingSchool = true;
    setSchoolStatus('Đang tải mô hình trường…');
    try {
      const model = await Model.fromGltfAsync({
        url: '/models/school_campus.glb',
        gltfCallback: prepareCampusMaterials,
        modelMatrix: Transforms.headingPitchRollToFixedFrame(
          view.schoolPosition, new HeadingPitchRoll(CesiumMath.toRadians(SCHOOL_ANCHOR.headingDegrees), 0, 0),
        ),
        scale: 1, heightReference: HeightReference.NONE,
      });
      if (view !== scene.current) { model.destroy(); return; }
      model.show = selected.current;
      view.school = view.viewer.scene.primitives.add(model);
      model.readyEvent.addEventListener(() => setSchoolStatus(''));
      view.viewer.scene.requestRender();
    } catch {
      if (view === scene.current) setSchoolStatus('Mô hình xem trước chưa tải được.');
    } finally {
      view.loadingSchool = false;
    }
  }

  function focusSchool() {
    const view = scene.current;
    if (!view) return;
    setListOpen(false);
    showSchool(true);
    moveCameraToSchool(view, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.45);
    loadSchool(view);
  }

  useEffect(() => {
    const abort = new AbortController();
    let viewer;
    let removeRenderError;
    setReady(false);
    setError('');
    setSchoolStatus('');

    async function openMap() {
      try {
        const [metadata, data] = await Promise.all([
          fetch('/terrain/vinh-thuc.json', { signal: abort.signal }),
          fetch('/terrain/vinh-thuc.f32', { signal: abort.signal }),
        ]);
        if (!metadata.ok || !data.ok) throw new Error('Chưa tải được dữ liệu địa hình.');
        const [grid, buffer] = await Promise.all([metadata.json(), data.arrayBuffer()]);
        if (buffer.byteLength !== grid.width * grid.height * 4) throw new Error('Tệp cao độ chưa đầy đủ.');
        const rectangle = Rectangle.fromDegrees(grid.west, grid.south, grid.east, grid.north);
        const style = await SingleTileImageryProvider.fromUrl('/terrain/vinh-thuc-style.png', { rectangle });
        if (abort.signal.aborted) return;
        const values = new Float32Array(buffer);
        const background = Color.fromCssColorString('#b6dce2');
        viewer = new Viewer(container.current, {
          terrainProvider: createTerrain(grid, values), baseLayer: false, baseLayerPicker: false,
          animation: false, timeline: false, geocoder: false, homeButton: false,
          sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
          infoBox: false, selectionIndicator: false, requestRenderMode: true, showRenderLoopErrors: false,
          maximumRenderTimeChange: Infinity, skyBox: false, skyAtmosphere: false,
        });
        viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.4);
        viewer.scene.backgroundColor = background;
        viewer.scene.globe.baseColor = background;
        viewer.scene.globe.showGroundAtmosphere = false;
        viewer.scene.globe.maximumScreenSpaceError = 2;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 24;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 60000;
        viewer.imageryLayers.addImageryProvider(style);
        const { longitude, latitude, name } = SCHOOL_ANCHOR;
        const elevation = sampleElevation(grid, values, longitude, latitude);
        const schoolPosition = Cartesian3.fromDegrees(longitude, latitude, elevation);
        const pin = viewer.entities.add({
          id: 'vinh-trung',
          position: Cartesian3.fromDegrees(longitude, latitude, elevation + 22),
          point: { pixelSize: 11, outlineWidth: 2, outlineColor: Color.WHITE, disableDepthTestDistance: Infinity },
          label: {
            text: name, font: '600 14px sans-serif', pixelOffset: new Cartesian2(0, -24),
            showBackground: true, backgroundPadding: new Cartesian2(10, 7), fillColor: Color.WHITE,
            disableDepthTestDistance: Infinity,
          },
        });
        viewer.entities.add({
          position: Cartesian3.fromDegrees(107.955, 21.335, 3),
          label: {
            text: 'ĐẢO VĨNH THỰC', font: 'italic 600 16px sans-serif', fillColor: Color.WHITE,
            outlineColor: Color.fromCssColorString('#205d72'), outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE, disableDepthTestDistance: Infinity,
          },
        });
        const view = { viewer, schoolPosition, pin, rectangle };
        scene.current = view;
        showSchool(selected.current);
        viewer.resize();
        if (previousView?.camera) viewer.camera.setView(previousView.camera);
        else viewer.camera.setView({ destination: Rectangle.fromDegrees(107.801, 21.309, 108.049, 21.428) });
        if (selected.current) loadSchool(view);

        viewer.screenSpaceEventHandler.setInputAction((event) => {
          if (viewer.scene.pick(event.position)?.id === pin) focusSchool();
        }, ScreenSpaceEventType.LEFT_CLICK);
        removeRenderError = viewer.scene.renderError.addEventListener(() => {
          setError('Bản đồ bị gián đoạn khi hiển thị.');
        });
        setReady(true);
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause.message || 'Chưa mở được bản đồ địa hình.');
      }
    }

    openMap();
    return () => {
      abort.abort();
      removeRenderError?.();
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.cancelFlight();
        previousView = {
          selected: selected.current,
          satellite: satelliteEnabled.current,
          camera: {
            destination: Cartesian3.clone(viewer.camera.positionWC),
            orientation: {
              direction: Cartesian3.clone(viewer.camera.directionWC),
              up: Cartesian3.clone(viewer.camera.upWC),
            },
          },
        };
        viewer.destroy();
      }
      scene.current = null;
    };
  }, [retry]);

  useEffect(() => {
    satelliteEnabled.current = satellite;
    const view = scene.current;
    if (!ready || !view) return;
    if (view.satelliteLayer) {
      view.satelliteLayer.show = satellite;
      view.viewer.scene.requestRender();
      return;
    }
    if (!satellite) return;
    let canceled = false;
    setSatelliteStatus('Đang tải ảnh vệ tinh…');
    ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      { enablePickFeatures: false },
    ).then((provider) => {
      if (canceled || view !== scene.current) return;
      view.satelliteLayer = view.viewer.imageryLayers.add(new ImageryLayer(provider, { rectangle: view.rectangle }));
      setSatelliteStatus('');
      view.viewer.scene.requestRender();
    }).catch(() => {
      if (!canceled) {
        setSatellite(false);
        setSatelliteStatus('Ảnh vệ tinh tạm thời chưa tải được.');
      }
    });
    return () => { canceled = true; };
  }, [ready, satellite]);

  function overview(tilted) {
    const view = scene.current;
    if (!view) return;
    showSchool(false);
    setListOpen(false);
    const options = { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.1 };
    if (tilted) {
      view.viewer.camera.flyToBoundingSphere(new BoundingSphere(ISLAND_CENTER, 9500), {
        ...options, offset: new HeadingPitchRange(0, CesiumMath.toRadians(-43), 28500),
      });
    } else {
      view.viewer.camera.flyTo({ ...options, destination: Rectangle.fromDegrees(107.801, 21.309, 108.049, 21.428) });
    }
  }

  return <section className="geographic-island" aria-label="Bản đồ địa hình đảo Vĩnh Thực">
    <div ref={container} className="geographic-canvas" />
    <header className="map-header">
      <div className="map-title">
        <div className="map-title-icon"><MapPin size={20} /></div>
        <div><span>EDUVERSE 3D</span><h1>Đảo Vĩnh Thực</h1></div>
      </div>
      <nav className="map-layer-controls" aria-label="Lớp bản đồ">
        <button aria-pressed={satellite} disabled={!ready} onClick={() => {
          setSatelliteStatus('');
          setSatellite((value) => !value);
        }}><Layers3 size={16} /> Ảnh vệ tinh</button>
        <button onClick={() => setWorldScope('island')}>Sa bàn</button>
      </nav>
    </header>

    {satelliteStatus && <p className="map-layer-status" role="status">{satelliteStatus}</p>}
    {!ready && !error && <div className="map-message" role="status">Đang mở địa hình Vĩnh Thực…</div>}
    {error && <div className="map-message" role="alert">
      <p>{error}</p>
      <button onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
      <button onClick={() => setWorldScope('island')}>Mở sa bàn</button>
    </div>}

    {listOpen && <aside className="map-stops" aria-label="Danh sách chặng">
      <div className="map-panel-heading"><h2>Các chặng</h2><button aria-label="Đóng danh sách chặng" onClick={() => setListOpen(false)}><X size={18} /></button></div>
      {PREVIEW_STOPS.map((name) => name === SCHOOL_ANCHOR.name
        ? <button key={name} className="map-stop map-stop-ready" onClick={focusSchool}><MapPin size={17} /><span>{name}</span><ChevronRight size={17} /></button>
        : <div className="map-stop" key={name}><MapPin size={17} /><span>{name}</span><small>Chưa mở</small></div>)}
    </aside>}

    {schoolOpen && <aside className="map-school" aria-label={SCHOOL_ANCHOR.name}>
      <div className="map-school-image">
        <img src="/images/preview_aerial_overview.png" alt="Mô hình khuôn viên Phân hiệu Vĩnh Trung" />
        <button aria-label="Đóng thông tin trường" onClick={() => showSchool(false)}><X size={18} /></button>
      </div>
      <div className="map-school-body">
        <h2>{SCHOOL_ANCHOR.name}</h2>
        <p>Trường TH&THCS Vĩnh Thực</p>
        <p className="map-school-note">Vị trí đặt mô hình đang chờ đối chiếu thực địa.</p>
        {schoolStatus && <p role="status" className="map-school-note">{schoolStatus}</p>}
        <button className="map-primary" onClick={() => {
          const view = scene.current;
          if (view?.focusingSchool) moveCameraToSchool(view, 0);
          startCampusTour();
        }}><Footprints size={17} /> Bắt đầu đi bộ <ChevronRight size={17} /></button>
      </div>
    </aside>}

    <div className="map-bottom">
      <div className="map-tools" aria-label="Điều khiển bản đồ">
        <button disabled={!ready} onClick={() => overview(false)}><Compass size={17} /> Toàn đảo</button>
        <button disabled={!ready} onClick={() => overview(true)}><Mountain size={17} /> Góc nghiêng</button>
        <button disabled={!ready} aria-expanded={listOpen} onClick={() => {
          const next = !listOpen;
          if (next) showSchool(false);
          setListOpen(next);
        }}><List size={17} /> Các chặng</button>
      </div>
    </div>
  </section>;
}
