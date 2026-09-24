import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BoxGeometry, BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { origins } from "../src/data/lebanon-origins.ts";
import { findTerrain, placeOrigin } from "../src/components/origins/terrain.ts";

// Read actual exported vertex/index buffers, without loading textures or a browser.
function readTerrain(variant) {
  const data = readFileSync(`public/maps/lebanon_terrain_${variant}.glb`);
  const jsonLength = data.readUInt32LE(12);
  const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
  const binary = data.subarray(28 + jsonLength);
  const node = gltf.nodes.find((node) => node.name.startsWith("Lebanon_"));
  const primitive = gltf.meshes[node.mesh].primitives[0];
  function attribute(index) {
    const accessor = gltf.accessors[index];
    const view = gltf.bufferViews[accessor.bufferView];
    const components = accessor.type === "VEC3" ? 3 : 1;
    const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[accessor.componentType];
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const bytes = binary.slice(start, start + accessor.count * components * Type.BYTES_PER_ELEMENT);
    return new BufferAttribute(new Type(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)), components);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", attribute(primitive.attributes.POSITION));
  geometry.setIndex(attribute(primitive.indices));
  const material = new MeshBasicMaterial({ side: 2 });
  material.name = gltf.materials[primitive.material].name;
  const terrain = new Mesh(geometry, material);
  terrain.name = node.name;
  return terrain;
}

for (const variant of ["desktop", "mobile"]) {
  test(`${variant}: all five real raster coordinates hit the terrain, with north and east preserved`, () => {
    const terrain = readTerrain(variant);
    const group = new Group();
    group.add(new Mesh(new BoxGeometry(20, 1, 20)), terrain);
    assert.equal(findTerrain(group), terrain, "the slab must never be chosen as terrain");
    const points = Object.fromEntries(origins.map((origin) => [origin.id, placeOrigin(terrain, origin)]));
    for (const point of Object.values(points)) {
      assert.ok(point.local.y >= -0.01 && point.local.y < 1);
      assert.ok(point.world.distanceTo(point.surface) > 0, "offset above surface");
    }
    assert.ok(points.douma.local.z < points["deir-mimas"].local.z, "north is negative Z after Blender export");
    assert.ok(points.rashaya.local.x > points.aabra.local.x, "Rashaya is east of coastal Aabra");
    const before = placeOrigin(terrain, origins[0]);
    group.position.set(13, 7, -4);
    group.rotation.set(0.2, 0.8, -0.1);
    group.scale.set(1.2, 0.8, 1.4);
    group.updateMatrixWorld(true);
    const after = placeOrigin(terrain, origins[0]);
    assert.ok(after.local.distanceTo(before.local) < 1e-5, "parent transforms do not change geography");
    assert.ok(after.surface.distanceTo(terrain.localToWorld(before.local.clone())) < 1e-5);
  });
}

test("global flips reverse mapping; missing surface hits fail explicitly", () => {
  const terrain = new Mesh(new BoxGeometry(8, 0.5, 10), new MeshBasicMaterial());
  const point = { mapX: 0.2, mapY: 0.7 };
  const normal = placeOrigin(terrain, point);
  const flipped = placeOrigin(terrain, point, { flipX: true, flipY: true });
  assert.ok(Math.abs(normal.local.x + flipped.local.x) < 1e-5);
  assert.ok(Math.abs(normal.local.z + flipped.local.z) < 1e-5);
  assert.throws(() => placeOrigin(terrain, { mapX: 3, mapY: 2 }), /outside|surface/);
  assert.ok(normal.world.clone().sub(normal.surface).dot(new Vector3(0, 1, 0)) > 0);
});
