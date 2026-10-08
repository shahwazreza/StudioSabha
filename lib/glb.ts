// Builds a binary glTF (.glb) of a stretched canvas: a box `widthM` x
// `heightM` x `depthM` metres with the artwork on the front face and plain
// off-white edges/back. The JPEG/PNG is embedded, so the file is
// self-contained (needed by Android's Scene Viewer and iPhone's AR Quick Look).
// Front faces +Z, so AR "wall" placement hangs it face-out.

type Face = { normal: [number, number, number]; corners: [number, number, number][] };

export function buildCanvasGlb(opts: {
  widthM: number;
  heightM: number;
  depthM?: number;
  image: Uint8Array;
  mimeType: "image/jpeg" | "image/png";
}): Uint8Array {
  const { widthM: w, heightM: h, image, mimeType } = opts;
  const d = opts.depthM ?? 0.025;
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;

  // Corners are listed counter-clockwise as seen from outside the face.
  const front: Face = { normal: [0, 0, 1], corners: [[x0, y0, d], [x1, y0, d], [x1, y1, d], [x0, y1, d]] };
  const sides: Face[] = [
    { normal: [0, 0, -1], corners: [[x1, y0, 0], [x0, y0, 0], [x0, y1, 0], [x1, y1, 0]] }, // back
    { normal: [-1, 0, 0], corners: [[x0, y0, 0], [x0, y0, d], [x0, y1, d], [x0, y1, 0]] }, // left
    { normal: [1, 0, 0], corners: [[x1, y0, d], [x1, y0, 0], [x1, y1, 0], [x1, y1, d]] }, // right
    { normal: [0, 1, 0], corners: [[x0, y1, d], [x1, y1, d], [x1, y1, 0], [x0, y1, 0]] }, // top
    { normal: [0, -1, 0], corners: [[x0, y0, 0], [x1, y0, 0], [x1, y0, d], [x0, y0, d]] }, // bottom
  ];

  const flat = (faces: Face[]) => ({
    positions: new Float32Array(faces.flatMap((f) => f.corners.flat())),
    normals: new Float32Array(faces.flatMap((f) => f.corners.flatMap(() => f.normal))),
    indices: new Uint16Array(faces.flatMap((_, i) => [0, 1, 2, 0, 2, 3].map((n) => n + i * 4))),
  });
  const frontData = flat([front]);
  // glTF texture coordinates start at the image's top-left.
  const frontUvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  const sideData = flat(sides);

  // Pack every array into one binary buffer, each part 4-byte aligned.
  const parts: Uint8Array[] = [];
  const bufferViews: object[] = [];
  let offset = 0;
  const addView = (bytes: Uint8Array, target?: number) => {
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    parts.push(bytes);
    const padding = (4 - (bytes.byteLength % 4)) % 4;
    if (padding) parts.push(new Uint8Array(padding));
    offset += bytes.byteLength + padding;
    return bufferViews.length - 1;
  };
  const asBytes = (a: Float32Array | Uint16Array) => new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const ARRAY_BUFFER = 34962, ELEMENT_ARRAY_BUFFER = 34963;

  const accessors: object[] = [];
  const addAccessor = (array: Float32Array | Uint16Array, type: "VEC3" | "VEC2" | "SCALAR", target: number, withBounds = false) => {
    const view = addView(asBytes(array), target);
    const size = type === "VEC3" ? 3 : type === "VEC2" ? 2 : 1;
    const accessor: Record<string, unknown> = {
      bufferView: view,
      componentType: array instanceof Float32Array ? 5126 : 5123,
      count: array.length / size,
      type,
    };
    if (withBounds) {
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < array.length; i += 3) for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], array[i + k]);
        max[k] = Math.max(max[k], array[i + k]);
      }
      accessor.min = min;
      accessor.max = max;
    }
    accessors.push(accessor);
    return accessors.length - 1;
  };

  const frontPos = addAccessor(frontData.positions, "VEC3", ARRAY_BUFFER, true);
  const frontNrm = addAccessor(frontData.normals, "VEC3", ARRAY_BUFFER);
  const frontUv = addAccessor(frontUvs, "VEC2", ARRAY_BUFFER);
  const frontIdx = addAccessor(frontData.indices, "SCALAR", ELEMENT_ARRAY_BUFFER);
  const sidePos = addAccessor(sideData.positions, "VEC3", ARRAY_BUFFER, true);
  const sideNrm = addAccessor(sideData.normals, "VEC3", ARRAY_BUFFER);
  const sideIdx = addAccessor(sideData.indices, "SCALAR", ELEMENT_ARRAY_BUFFER);
  const imageView = addView(image);

  const json = {
    asset: { version: "2.0", generator: "StudioSabha" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "Painting" }],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: frontPos, NORMAL: frontNrm, TEXCOORD_0: frontUv }, indices: frontIdx, material: 0 },
          { attributes: { POSITION: sidePos, NORMAL: sideNrm }, indices: sideIdx, material: 1 },
        ],
      },
    ],
    materials: [
      { name: "Artwork", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.85 } },
      { name: "Canvas edge", pbrMetallicRoughness: { baseColorFactor: [0.93, 0.92, 0.9, 1], metallicFactor: 0, roughnessFactor: 1 } },
    ],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: imageView, mimeType }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: offset }],
  };

  // GLB container: header, JSON chunk (space-padded), BIN chunk (zero-padded).
  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = (4 - (jsonBytes.byteLength % 4)) % 4;
  if (jsonPad) {
    const padded = new Uint8Array(jsonBytes.byteLength + jsonPad).fill(0x20);
    padded.set(jsonBytes);
    jsonBytes = padded;
  }
  const total = 12 + 8 + jsonBytes.byteLength + 8 + offset;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true); // "glTF"
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonBytes.byteLength, true);
  view.setUint32(16, 0x4e4f534a, true); // "JSON"
  out.set(jsonBytes, 20);
  let p = 20 + jsonBytes.byteLength;
  view.setUint32(p, offset, true);
  view.setUint32(p + 4, 0x004e4942, true); // "BIN"
  p += 8;
  for (const part of parts) {
    out.set(part, p);
    p += part.byteLength;
  }
  return out;
}
