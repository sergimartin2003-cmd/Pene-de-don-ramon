import * as THREE from "three";

import type { Point } from "./silhouette";

/**
 * Convierte el contorno de una zapatilla en un cuerpo 3D con volumen.
 *
 * La foto se proyecta sobre la cara frontal y, si hay una segunda foto, sobre
 * la trasera; el canto se resuelve con el color medio del modelo y un mapa
 * de normales de material. Se separan los triángulos por la dirección de su
 * normal para poder darle un material distinto a cada cara.
 */

export type ShoeGeometry = {
  geometry: THREE.ExtrudeGeometry;
  /** Semiancho y semialto del encuadre de la foto en coordenadas del modelo. */
  frame: { halfW: number; halfH: number };
  /** Escala que lleva el modelo a ocupar una unidad, sea cual sea el encuadre. */
  fit: number;
};

const MATERIAL_FRONT = 0;
const MATERIAL_BACK = 1;
const MATERIAL_SIDE = 2;

export function frameFor(aspect: number) {
  return {
    halfW: aspect >= 1 ? 0.5 : 0.5 * aspect,
    halfH: aspect >= 1 ? 0.5 / aspect : 0.5,
  };
}

export function buildShoeGeometry(
  contour: Point[],
  aspect: number,
  depth: number,
): ShoeGeometry {
  const frame = frameFor(aspect);
  const shape = new THREE.Shape(contour.map(([x, y]) => new THREE.Vector2(x, y)));

  const uvGenerator: THREE.UVGenerator = {
    generateTopUV(_geometry, vertices, indexA, indexB, indexC) {
      return [indexA, indexB, indexC].map((index) => {
        const x = vertices[index * 3];
        const y = vertices[index * 3 + 1];
        return new THREE.Vector2(
          (x + frame.halfW) / (2 * frame.halfW),
          (y + frame.halfH) / (2 * frame.halfH),
        );
      });
    },
    generateSideWallUV(_geometry, vertices, indexA, indexB, indexC, indexD) {
      // El canto sólo necesita una UV coherente para el mapa de material.
      return [indexA, indexB, indexC, indexD].map((index) => {
        const x = vertices[index * 3];
        const y = vertices[index * 3 + 1];
        const z = vertices[index * 3 + 2];
        return new THREE.Vector2((x + y) * 4, z * 4);
      });
    },
  };

  const bevelSize = Math.min(0.014, depth * 0.3);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 14,
    bevelEnabled: true,
    bevelThickness: depth * 0.42,
    bevelSize,
    // El bisel se mete hacia dentro: si sobresaliera del contorno, sus vértices
    // leerían la textura fuera de la zapatilla y dibujarían un halo de fondo.
    bevelOffset: -bevelSize,
    bevelSegments: 4,
    UVGenerator: uvGenerator,
  });

  geometry.computeVertexNormals();
  assignFaceMaterials(geometry);

  // Las UV ya están calculadas con las coordenadas del encuadre, así que a
  // partir de aquí se puede recentrar la malla sin descuadrar la foto.
  geometry.computeBoundingBox();
  const box = geometry.boundingBox as THREE.Box3;
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);

  const size = box.getSize(new THREE.Vector3());
  const fit = 1 / Math.max(size.x, size.y, 0.001);

  return { geometry, frame, fit };
}

/**
 * ExtrudeGeometry agrupa las dos tapas en un mismo material. Aquí se recorren
 * los triángulos y se separan por la Z de su normal: frente, dorso y canto.
 */
function assignFaceMaterials(geometry: THREE.ExtrudeGeometry): void {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const triangles = position.count / 3;

  geometry.clearGroups();

  let runStart = 0;
  let runMaterial = -1;

  const materialAt = (triangle: number) => {
    // Media de la normal de los tres vértices: evita decidir con una normal suelta.
    let nz = 0;
    for (let v = 0; v < 3; v += 1) nz += normal.getZ(triangle * 3 + v);
    nz /= 3;
    // Sólo las tapas planas llevan la foto. El bisel, aunque mire casi de
    // frente, se genera como pared lateral y sus UV están fuera de la imagen:
    // si se texturizara, dibujaría un halo con el borde de la foto.
    if (nz > 0.9) return MATERIAL_FRONT;
    if (nz < -0.9) return MATERIAL_BACK;
    return MATERIAL_SIDE;
  };

  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const material = materialAt(triangle);
    if (material !== runMaterial) {
      if (runMaterial !== -1) {
        geometry.addGroup(runStart * 3, (triangle - runStart) * 3, runMaterial);
      }
      runStart = triangle;
      runMaterial = material;
    }
  }

  if (runMaterial !== -1) {
    geometry.addGroup(runStart * 3, (triangles - runStart) * 3, runMaterial);
  }
}

/** Mapa de normales de material generado en un canvas: no descarga nada. */
export function createMaterialNormalMap(size = 256): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const image = ctx.createImageData(size, size);
  const height = (x: number, y: number) => {
    const weave = Math.sin(x * 0.85) * Math.cos(y * 0.85) * 0.5;
    const thread = Math.sin((x + y) * 0.28) * 0.22;
    const grain = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    return weave + thread + grain * 0.16;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Gradiente por diferencias finitas -> vector normal en espacio tangente.
      const dx = height(x + 1, y) - height(x - 1, y);
      const dy = height(x, y + 1) - height(x, y - 1);
      const length = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((-dx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = (1 / length) * 255;
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

export const SHOE_MATERIAL_ORDER = {
  front: MATERIAL_FRONT,
  back: MATERIAL_BACK,
  side: MATERIAL_SIDE,
} as const;
