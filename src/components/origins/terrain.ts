import { Mesh, Raycaster, Vector3, type Object3D } from "three";

export const terrainConfig = {
  models: {
    desktop: "/maps/lebanon_terrain_desktop.glb",
    mobile: "/maps/lebanon_terrain_mobile.glb",
  },
  mobileQuery: "(max-width: 767px), (orientation: portrait)",
  orientation: { flipX: false, flipY: false },
  raster: { crs: "EPSG:32636", xmin: 692729.556524, xmax: 840029.556524, ymin: 3655620.861511, ymax: 3848070.861511 },
} as const;

export function findTerrain(scene: Object3D): Mesh {
  let terrain: Mesh | undefined;
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name.startsWith("terrain_material"))) terrain = object;
  });
  if (!terrain) throw new Error("Lebanon terrain material was not found in the model.");
  return terrain;
}

/** Raster north maps to -Z in these Blender GLBs (local X/Z plane, Y elevation).
 * Bounds come only from the terrain geometry, never the separate slab or scene.
 * Cast in world space along the transformed local elevation axis, so retained
 * export transforms, non-uniform scales and parent transforms are respected.
 */
export function placeOrigin(
  terrain: Mesh,
  point: { mapX: number; mapY: number },
  orientation: { flipX: boolean; flipY: boolean } = terrainConfig.orientation,
) {
  const { mapX, mapY } = point;
  if (![mapX, mapY].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new Error("Origin lies outside the normalized raster extent.");
  }
  terrain.updateWorldMatrix(true, false);
  terrain.geometry.computeBoundingBox();
  const bounds = terrain.geometry.boundingBox!;
  const size = bounds.getSize(new Vector3());
  const u = orientation.flipX ? 1 - mapX : mapX;
  const v = orientation.flipY ? 1 - mapY : mapY;
  const above = new Vector3(bounds.min.x + u * size.x, bounds.max.y + size.length(), bounds.max.z - v * size.z);
  const direction = new Vector3(0, -1, 0).transformDirection(terrain.matrixWorld);
  const ray = new Raycaster(terrain.localToWorld(above), direction);
  const hit = ray.intersectObject(terrain, false)[0];
  if (!hit) throw new Error(`No terrain surface at ${mapX}, ${mapY}.`);
  const local = terrain.worldToLocal(hit.point.clone());
  const world = terrain.localToWorld(local.clone().add(new Vector3(0, size.length() * 0.002, 0)));
  return { local, world, surface: hit.point };
}
