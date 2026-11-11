// This anchor comes from the existing project survey notes, pending field verification.
export const SCHOOL_ANCHOR = {
  longitude: 107.9043412,
  latitude: 21.3712629,
  headingDegrees: 0,
  name: 'Phân hiệu Vĩnh Trung',
};

// Two legacy ground meshes have no UVs but share textured materials with buildings.
// Give only those primitives an untextured copy so Cesium can compile their shaders.
export function prepareCampusMaterials(gltf) {
  const backdropNames = new Set([
    'ENV_MainRoad_Surface', 'ENV_OuterGround_Base', 'ENV_WindingStream',
    'ENV_BackgroundHill', 'ENV_WestFoliageSlope',
  ]);
  for (const node of gltf.nodes || []) {
    if (backdropNames.has(node.name)) delete node.mesh;
  }
  const replacements = new Map();
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      if (primitive.attributes.TEXCOORD_0 !== undefined || primitive.material === undefined) continue;
      const index = primitive.material;
      if (!replacements.has(index)) {
        const material = structuredClone(gltf.materials[index]);
        delete material.normalTexture;
        delete material.occlusionTexture;
        delete material.emissiveTexture;
        if (material.pbrMetallicRoughness) {
          delete material.pbrMetallicRoughness.baseColorTexture;
          delete material.pbrMetallicRoughness.metallicRoughnessTexture;
        }
        replacements.set(index, gltf.materials.length);
        gltf.materials.push(material);
      }
      primitive.material = replacements.get(index);
    }
  }
}

export function sampleElevation(grid, values, longitude, latitude) {
  if (longitude < grid.west || longitude > grid.east || latitude < grid.south || latitude > grid.north) return 0;
  const x = (longitude - grid.west) / (grid.east - grid.west) * (grid.width - 1);
  const y = (grid.north - latitude) / (grid.north - grid.south) * (grid.height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, grid.width - 1);
  const y1 = Math.min(y0 + 1, grid.height - 1);
  const top = values[y0 * grid.width + x0] * (1 - (x - x0)) + values[y0 * grid.width + x1] * (x - x0);
  const bottom = values[y1 * grid.width + x0] * (1 - (x - x0)) + values[y1 * grid.width + x1] * (x - x0);
  return top * (1 - (y - y0)) + bottom * (y - y0);
}
