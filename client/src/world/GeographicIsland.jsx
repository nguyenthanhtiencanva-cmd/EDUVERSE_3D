import React, { useEffect, useRef, useState } from 'react';
import {
  ArcGisMapServerImageryProvider, Cartesian2, Cartesian3, Cartographic, Color,
  Credit, CustomHeightmapTerrainProvider, GeographicTilingScheme, HeadingPitchRange,
  HeadingPitchRoll, HeightReference, Ion, LabelStyle, Math as CesiumMath,
  Matrix4, Model, Rectangle, ScreenSpaceEventType, Transforms, Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './geographic.css';
import { useStore } from '../store/useStore';
import { prepareCampusMaterials, sampleElevation, SCHOOL_ANCHOR } from './geography';

Ion.defaultAccessToken = '';
let savedCamera;

export default function GeographicIsland() {
  const container = useRef(null);
  const scene = useRef(null);
  const model = useRef(null);
  const modelLoading = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Đang mở địa hình Vĩnh Thực…');
  const [error, setError] = useState('');
  const [imageryError, setImageryError] = useState(false);
  const [schoolStatus, setSchoolStatus] = useState('');
  const [coordinate, setCoordinate] = useState(null);
  const setWorldScope = useStore((state) => state.setWorldScope);

  useEffect(() => {
    const abort = new AbortController();
    let viewer;
    let removeImageryError;
    let removeRenderError;
    setError('');
    setImageryError(false);
    setStatus('Đang mở địa hình Vĩnh Thực…');
    async function start() {
      try {
        const responses = await Promise.all([
          fetch('/terrain/vinh-thuc.json', { signal: abort.signal }),
          fetch('/terrain/vinh-thuc.f32', { signal: abort.signal }),
        ]);
        if (responses.some((response) => !response.ok)) throw new Error('Không tải được dữ liệu cao độ.');
        const [grid, buffer] = await Promise.all([responses[0].json(), responses[1].arrayBuffer()]);
        if (abort.signal.aborted) return;
        if (buffer.byteLength !== grid.width * grid.height * 4) throw new Error('Tệp cao độ chưa đầy đủ.');
        const values = new Float32Array(buffer);
        const tilingScheme = new GeographicTilingScheme();
        const terrainProvider = new CustomHeightmapTerrainProvider({
          width: 65, height: 65, tilingScheme,
          credit: new Credit(grid.attribution),
          callback(x, y, level) {
            const rectangle = tilingScheme.tileXYToRectangle(x, y, level);
            const result = new Float32Array(65 * 65);
            for (let row = 0; row < 65; row++) {
              const latitude = CesiumMath.toDegrees(rectangle.north - rectangle.height * row / 64);
              for (let column = 0; column < 65; column++) {
                const longitude = CesiumMath.toDegrees(rectangle.west + rectangle.width * column / 64);
                result[row * 65 + column] = sampleElevation(grid, values, longitude, latitude);
              }
            }
            return result;
          },
        });
        viewer = new Viewer(container.current, {
          terrainProvider, baseLayer: false, baseLayerPicker: false,
          animation: false, timeline: false, geocoder: false, homeButton: false,
          sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
          infoBox: false, selectionIndicator: false, requestRenderMode: true, showRenderLoopErrors: false,
          maximumRenderTimeChange: Infinity,
        });
        viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);
        viewer.scene.globe.baseColor = Color.fromCssColorString('#507368');
        viewer.scene.globe.maximumScreenSpaceError = 2;
        viewer.scene.globe.cartographicLimitRectangle = Rectangle.fromDegrees(grid.west, grid.south, grid.east, grid.north);
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 25;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 60000;
        viewer.scene.verticalExaggeration = 1;
        scene.current = { viewer, grid, values };
        removeRenderError = viewer.scene.renderError.addEventListener(() => {
          setError('Trình duyệt bị gián đoạn khi vẽ bản đồ. Hãy thử mở lại cảnh.');
        });
        if (savedCamera) viewer.camera.setView(savedCamera);
        else viewer.camera.setView({ destination: Rectangle.fromDegrees(107.79, 21.29, 108.06, 21.44) });

        const anchor = SCHOOL_ANCHOR;
        const schoolElevation = sampleElevation(grid, values, anchor.longitude, anchor.latitude);
        const schoolPin = viewer.entities.add({
          name: anchor.name,
          position: Cartesian3.fromDegrees(anchor.longitude, anchor.latitude, schoolElevation + 10),
          point: { pixelSize: 11, color: Color.fromCssColorString('#fbbf24'), outlineColor: Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Infinity },
          label: {
            text: anchor.name, font: '14px sans-serif', pixelOffset: new Cartesian2(0, -25),
            fillColor: Color.WHITE, style: LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 4, outlineColor: Color.fromCssColorString('#0f172a'),
            disableDepthTestDistance: Infinity,
          },
        });
        viewer.screenSpaceEventHandler.setInputAction((event) => {
          const picked = viewer.scene.pick(event.position);
          if (picked?.id === schoolPin) focusSchool();
          const ray = viewer.camera.getPickRay(event.position);
          const position = viewer.scene.globe.pick(ray, viewer.scene);
          if (!position) return;
          const cartographic = Cartographic.fromCartesian(position);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          setCoordinate({ longitude, latitude, elevation: sampleElevation(grid, values, longitude, latitude) });
        }, ScreenSpaceEventType.LEFT_CLICK);
        setStatus('');
        try {
          const imagery = await ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            { enablePickFeatures: false },
          );
          if (abort.signal.aborted) return;
          removeImageryError = imagery.errorEvent.addEventListener(() => setImageryError(true));
          viewer.imageryLayers.addImageryProvider(imagery);
          viewer.scene.requestRender();
        } catch {
          if (!abort.signal.aborted) setImageryError(true);
        }
      } catch (cause) {
        if (!abort.signal.aborted) { setError(cause.message); setStatus(''); }
      }
    }
    start();
    return () => {
      abort.abort();
      removeImageryError?.();
      removeRenderError?.();
      if (viewer && !viewer.isDestroyed()) {
        savedCamera = {
          destination: Cartesian3.clone(viewer.camera.positionWC),
          orientation: { heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll },
        };
        viewer.destroy();
      }
      scene.current = null;
      model.current = null;
      modelLoading.current = false;
    };
  }, [attempt]);

  function overview(tilted) {
    const current = scene.current;
    if (!current) return;
    current.viewer.camera.lookAtTransform(Transforms.eastNorthUpToFixedFrame(
      Cartesian3.fromDegrees(107.925, 21.365)),
    new HeadingPitchRange(0, CesiumMath.toRadians(tilted ? -40 : -90), tilted ? 29000 : 33000));
    // Release the orbit reference so subsequent map navigation uses world coordinates.
    current.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    current.viewer.scene.requestRender();
  }

  async function focusSchool() {
    const current = scene.current;
    if (!current) return;
    const { viewer, grid, values } = current;
    const anchor = SCHOOL_ANCHOR;
    const elevation = sampleElevation(grid, values, anchor.longitude, anchor.latitude);
    const position = Cartesian3.fromDegrees(anchor.longitude, anchor.latitude, elevation);
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(anchor.longitude, anchor.latitude - 0.002, elevation + 200),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-40), roll: 0 }, duration: 1.5,
    });
    if (model.current || modelLoading.current) return;
    modelLoading.current = true;
    setSchoolStatus('Đang tải mô hình trường…');
    try {
      const campus = await Model.fromGltfAsync({
        url: '/models/school_campus.glb',
        gltfCallback: prepareCampusMaterials,
        modelMatrix: Transforms.headingPitchRollToFixedFrame(position, new HeadingPitchRoll(CesiumMath.toRadians(anchor.headingDegrees), 0, 0)),
        scale: 1, heightReference: HeightReference.NONE,
      });
      if (scene.current !== current || viewer.isDestroyed()) { campus.destroy(); return; }
      viewer.scene.primitives.add(campus);
      model.current = campus;
      campus.readyEvent.addEventListener(() => {
        if (scene.current === current) setSchoolStatus('Mô hình trường tỷ lệ 1 m/đơn vị. Hướng và vị trí đang chờ đo đạc đối chiếu.');
      });
      viewer.scene.requestRender();
    } catch {
      if (scene.current === current) setSchoolStatus('Chưa tải được mô hình. Bấm “Đến trường” để thử lại.');
    } finally {
      if (scene.current === current) modelLoading.current = false;
    }
  }

  return <section className="geographic-island" aria-label="Bản đồ địa hình đảo Vĩnh Thực">
    <div ref={container} className="geographic-canvas" />
    <header className="geographic-header">
      <div><span className="map-brand">EDUVERSE 3D</span><h1>Đảo Vĩnh Thực</h1></div>
      <nav aria-label="Không gian tham quan">
        <button onClick={() => setWorldScope('island')}>Sa bàn minh họa</button>
        <button className="map-primary" onClick={() => setWorldScope('campus')}>Vào sân trường</button>
      </nav>
    </header>
    <aside className="geographic-info">
      <strong>Địa hình theo tọa độ thực</strong>
      <p>Copernicus GLO-30 · Lưới khoảng 30 m · Cao độ 1×</p>
      <p className="map-muted">Vị trí trường theo hồ sơ dự án, chờ kiểm chứng thực địa.</p>
      {schoolStatus && <p role="status">{schoolStatus}</p>}
      <details><summary>Nguồn dữ liệu và độ chính xác</summary>
        <p>Ảnh vệ tinh Esri World Imagery được tải trực tuyến. Địa hình là bề mặt Copernicus, có ảnh hưởng của cây và công trình.</p>
        <p>Tọa độ WGS84. Cao độ nguồn EGM2008 được dùng làm độ nổi trên nền địa cầu, đang chờ hiệu chỉnh geoid và số đo địa phương.</p>
        <a href="https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM" target="_blank" rel="noreferrer">Thông tin nguồn Copernicus</a>
      </details>
    </aside>
    {status && <div className="map-message" role="status">{status}</div>}
    {error && <div className="map-message" role="alert"><p>{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button></div>}
    {imageryError && <div className="map-imagery-warning" role="status">Một phần ảnh vệ tinh chưa tải được. <button onClick={() => setAttempt((value) => value + 1)}>Tải lại ảnh</button></div>}
    <div className="geographic-toolbar">
      <div className="map-actions">
        <button onClick={() => overview(false)}>Toàn đảo</button>
        <button onClick={() => overview(true)}>Nghiêng 3D</button>
        <button className="map-primary" onClick={focusSchool}>Đến trường</button>
      </div>
      <p className="map-coordinate" aria-live="polite">{coordinate
        ? `${coordinate.latitude.toFixed(5)}° B · ${coordinate.longitude.toFixed(5)}° Đ · Cao độ bề mặt ${coordinate.elevation.toFixed(1)} m`
        : 'Bấm lên đảo để xem tọa độ · Kéo để di chuyển · Cuộn để phóng gần'}</p>
    </div>
  </section>;
}
