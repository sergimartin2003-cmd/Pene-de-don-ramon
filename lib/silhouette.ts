/**
 * Reconstrucción de la silueta de una prenda a partir de una foto.
 *
 * Todo ocurre en el navegador, sobre un canvas: se estima el color del fondo
 * a partir del borde de la imagen, se separa la prenda, se queda con la mancha
 * más grande y se traza su contorno. Ese contorno es lo que después se extruye
 * para obtener el modelo 3D de la ficha de producto.
 *
 * Si la foto tiene un fondo complejo y no se puede recortar con garantías, se
 * devuelve un contorno rectangular redondeado: la pieza se sigue viendo en 3D,
 * simplemente con la forma del propio encuadre.
 */

export type Point = [number, number];

export type Silhouette = {
  /** Contorno normalizado a [-0.5, 0.5] en X y en Y (Y hacia arriba). */
  contour: Point[];
  /** Ancho / alto de la imagen original. */
  aspect: number;
  /** Color medio de la prenda, para las paredes del modelo. */
  averageColor: string;
  /** true si se ha podido recortar el fondo; false si se usó el encuadre. */
  cropped: boolean;
};

const WORK_SIZE = 320; // resolución de trabajo: suficiente y rápida

export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se ha podido cargar la imagen: ${url}`));
    image.src = url;
  });
}

function colorDistance(
  data: Uint8ClampedArray,
  index: number,
  r: number,
  g: number,
  b: number,
): number {
  const dr = data[index] - r;
  const dg = data[index + 1] - g;
  const db = data[index + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Color de fondo estimado como la mediana del marco exterior de la foto. */
function estimateBackground(data: Uint8ClampedArray, w: number, h: number) {
  const reds: number[] = [];
  const greens: number[] = [];
  const blues: number[] = [];
  const band = Math.max(2, Math.round(Math.min(w, h) * 0.03));

  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    reds.push(data[i]);
    greens.push(data[i + 1]);
    blues.push(data[i + 2]);
  };

  for (let x = 0; x < w; x += 2) {
    for (let y = 0; y < band; y += 1) {
      sample(x, y);
      sample(x, h - 1 - y);
    }
  }
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < band; x += 1) {
      sample(x, y);
      sample(w - 1 - x, y);
    }
  }

  const median = (values: number[]) => {
    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)] ?? 255;
  };

  return { r: median(reds), g: median(greens), b: median(blues) };
}

/** Se queda con la mancha conectada más grande y descarta el ruido suelto. */
function largestBlob(mask: Uint8Array, w: number, h: number): Uint8Array {
  const labels = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let bestLabel = -1;
  let bestSize = 0;
  let label = 0;

  for (let start = 0; start < mask.length; start += 1) {
    if (mask[start] === 0 || labels[start] !== -1) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = label;
    let size = 0;

    while (head < tail) {
      const current = queue[head++];
      size += 1;
      const x = current % w;
      const y = (current / w) | 0;

      // Vecindad de 4: suficiente y evita unir manchas por una esquina.
      if (x > 0) { const n = current - 1; if (mask[n] && labels[n] === -1) { labels[n] = label; queue[tail++] = n; } }
      if (x < w - 1) { const n = current + 1; if (mask[n] && labels[n] === -1) { labels[n] = label; queue[tail++] = n; } }
      if (y > 0) { const n = current - w; if (mask[n] && labels[n] === -1) { labels[n] = label; queue[tail++] = n; } }
      if (y < h - 1) { const n = current + w; if (mask[n] && labels[n] === -1) { labels[n] = label; queue[tail++] = n; } }
    }

    if (size > bestSize) {
      bestSize = size;
      bestLabel = label;
    }
    label += 1;
  }

  const out = new Uint8Array(w * h);
  if (bestLabel === -1) return out;
  for (let i = 0; i < out.length; i += 1) out[i] = labels[i] === bestLabel ? 1 : 0;
  return out;
}

/** Cierre morfológico: tapa los agujeros de un píxel y suaviza el borde. */
function close(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const dilate = (src: Uint8Array) => {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let on = 0;
        for (let dy = -radius; dy <= radius && !on; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (src[ny * w + nx]) { on = 1; break; }
          }
        }
        dst[y * w + x] = on;
      }
    }
    return dst;
  };

  const erode = (src: Uint8Array) => {
    const dst = new Uint8Array(src.length);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let on = 1;
        for (let dy = -radius; dy <= radius && on; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || !src[ny * w + nx]) { on = 0; break; }
          }
        }
        dst[y * w + x] = on;
      }
    }
    return dst;
  };

  return erode(dilate(mask));
}

/** Encoge la máscara un píxel: deja fuera el borde difuminado de la foto. */
function shrink(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const edge =
        x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w];
      out[i] = edge ? 0 : 1;
    }
  }
  return out;
}

/** Trazado de contorno por vecindad de Moore, con criterio de parada de Jacob. */
function traceContour(mask: Uint8Array, w: number, h: number): Point[] {
  let startIndex = -1;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) { startIndex = i; break; }
  }
  if (startIndex === -1) return [];

  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x];

  // Vecinos en sentido horario empezando por el oeste.
  const NEIGHBOURS: Point[] = [
    [-1, 0], [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1], [-1, 1],
  ];

  const start: Point = [startIndex % w, (startIndex / w) | 0];
  const contour: Point[] = [start];

  let current = start;
  let backtrack = 0; // veníamos del oeste
  const limit = w * h * 4;

  for (let step = 0; step < limit; step += 1) {
    let found = false;
    for (let k = 1; k <= 8; k += 1) {
      const dir = (backtrack + k) % 8;
      const [dx, dy] = NEIGHBOURS[dir];
      const nx = current[0] + dx;
      const ny = current[1] + dy;
      if (at(nx, ny)) {
        // El nuevo "de dónde venimos" es el vecino opuesto al avance.
        backtrack = (dir + 5) % 8;
        current = [nx, ny];
        contour.push(current);
        found = true;
        break;
      }
    }
    if (!found) break;
    if (current[0] === start[0] && current[1] === start[1]) break;
  }

  return contour;
}

/** Ramer–Douglas–Peucker: menos puntos, misma forma. */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;

  const distanceToSegment = (p: Point, a: Point, b: Point) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const distance = distanceToSegment(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i] === 1);
}

/** Contorno de reserva: el propio encuadre con las esquinas redondeadas. */
function framedContour(aspect: number): Point[] {
  const halfW = aspect >= 1 ? 0.5 : 0.5 * aspect;
  const halfH = aspect >= 1 ? 0.5 / aspect : 0.5;
  const radius = Math.min(halfW, halfH) * 0.16;
  const points: Point[] = [];

  const corners: [number, number, number][] = [
    [halfW - radius, halfH - radius, 0],
    [-halfW + radius, halfH - radius, Math.PI / 2],
    [-halfW + radius, -halfH + radius, Math.PI],
    [halfW - radius, -halfH + radius, (3 * Math.PI) / 2],
  ];

  for (const [cx, cy, base] of corners) {
    for (let i = 0; i <= 8; i += 1) {
      const angle = base + (i / 8) * (Math.PI / 2);
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
  }

  return points;
}

export async function extractSilhouette(
  url: string,
  tolerance = 42,
): Promise<Silhouette> {
  const image = await loadImage(url);
  const naturalW = image.naturalWidth || 1000;
  const naturalH = image.naturalHeight || 1250;
  const aspect = naturalW / naturalH;

  const w = aspect >= 1 ? WORK_SIZE : Math.max(32, Math.round(WORK_SIZE * aspect));
  const h = aspect >= 1 ? Math.max(32, Math.round(WORK_SIZE / aspect)) : WORK_SIZE;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { contour: framedContour(aspect), aspect, averageColor: "#8c8880", cropped: false };
  }

  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const background = estimateBackground(data, w, h);
  const mask = new Uint8Array(w * h);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    // Un píxel transparente es fondo, venga de donde venga.
    const opaque = data[p + 3] > 24;
    const isObject =
      opaque && colorDistance(data, p, background.r, background.g, background.b) > tolerance;
    mask[i] = isObject ? 1 : 0;
    if (isObject) {
      sumR += data[p];
      sumG += data[p + 1];
      sumB += data[p + 2];
      count += 1;
    }
  }

  const coverage = count / mask.length;
  const averageColor =
    count > 0
      ? `#${[sumR / count, sumG / count, sumB / count]
          .map((v) => Math.round(v).toString(16).padStart(2, "0"))
          .join("")}`
      : "#8c8880";

  // Ni casi nada ni casi todo: en ambos casos el recorte no es fiable.
  if (coverage < 0.02 || coverage > 0.92) {
    return { contour: framedContour(aspect), aspect, averageColor, cropped: false };
  }

  const blob = shrink(largestBlob(close(mask, w, h, 2), w, h), w, h);
  const traced = traceContour(blob, w, h);
  if (traced.length < 24) {
    return { contour: framedContour(aspect), aspect, averageColor, cropped: false };
  }

  const simplified = simplify(traced, 1.15);
  if (simplified.length < 12) {
    return { contour: framedContour(aspect), aspect, averageColor, cropped: false };
  }

  // A coordenadas de modelo: centrado en el origen y con Y hacia arriba.
  const scale = 1 / Math.max(w, h);
  const contour: Point[] = simplified.map(([x, y]) => [
    (x - w / 2) * scale,
    -(y - h / 2) * scale,
  ]);

  return { contour, aspect, averageColor, cropped: true };
}
