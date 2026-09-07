import { promises as fs } from "node:fs";
import path from "node:path";

import { GARMENTS } from "./garment-paths.mjs";

/**
 * Genera los "studio shots" del catálogo de ejemplo como SVG.
 * Se sustituyen por fotos reales subiéndolas desde /admin.
 */

const OUT_DIR = path.join(process.cwd(), "public", "uploads", "seed");

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

function studioShot({ garment, color, view, backdrop = "#EDE7DB", seed = 7 }) {
  const g = GARMENTS[garment];
  const light = shade(color, luminance(color) > 0.6 ? -14 : 36);
  const dark = shade(color, luminance(color) > 0.6 ? -48 : -28);
  const seamColor = luminance(color) > 0.55 ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)";
  const mirrored = view === "back";
  const detail = view === "detail";
  const viewBox = detail ? g.detail : "0 0 1000 1250";

  // Sufijo único por fichero: evita que dos SVG en la misma página compartan
  // los identificadores de sus degradados y se pisen los colores.
  const uid = `${garment}-${color.slice(1)}-${view}`;
  const ref = (name) => `${name}-${uid}`;

  const piece = (d, fill, opacity = 1) =>
    `<path d="${d}" fill="${fill}" fill-opacity="${opacity}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="1000" height="1250" role="img" aria-label="${g.label}">
  <defs>
    <radialGradient id="${ref("bg")}" cx="50%" cy="36%" r="80%">
      <stop offset="0%" stop-color="${shade(backdrop, 14)}"/>
      <stop offset="100%" stop-color="${shade(backdrop, -20)}"/>
    </radialGradient>
    <linearGradient id="${ref("cloth")}" x1="16%" y1="0%" x2="88%" y2="100%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="44%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <radialGradient id="${ref("fold")}" cx="33%" cy="24%" r="72%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="58%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.20"/>
    </radialGradient>
    <filter id="${ref("grain")}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="${ref("drop")}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#3a3128" flood-opacity="0.10"/>
    </filter>
    <filter id="${ref("weave")}">
      <feTurbulence type="fractalNoise" baseFrequency="0.5 0.72" numOctaves="2" seed="${seed + 2}" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.12"/></feComponentTransfer>
    </filter>
    <clipPath id="${ref("body")}"><path d="${g.path}"/></clipPath>
  </defs>

  <rect x="-400" y="-400" width="1800" height="2050" fill="url(#${ref("bg")})"/>
  <ellipse cx="500" cy="1120" rx="248" ry="30" fill="#3a3128" opacity="0.07"/>

  <g filter="url(#${ref("drop")})" ${mirrored ? 'transform="translate(1000,0) scale(-1,1)"' : ""}>
    ${(g.under ?? []).map((d) => piece(d, dark)).join("\n    ")}

    <path d="${g.path}" fill="url(#${ref("cloth")})"/>
    <g clip-path="url(#${ref("body")})">
      <rect x="0" y="0" width="1000" height="1250" fill="url(#${ref("fold")})"/>
      <rect x="0" y="0" width="1000" height="1250" filter="url(#${ref("weave")})" opacity="0.6"/>
    </g>
    <path d="${g.path}" fill="none" stroke="${dark}" stroke-opacity="0.6" stroke-width="2.5" stroke-linejoin="round"/>

    ${(g.parts ?? []).map((d) => `<path d="${d}" fill="url(#${ref("cloth")})"/><path d="${d}" fill="${dark}" fill-opacity="0.28"/><path d="${d}" fill="none" stroke="${dark}" stroke-opacity="0.6" stroke-width="2.5" stroke-linejoin="round"/>`).join("\n    ")}

    ${(g.over ?? []).map((d) => `${piece(d, dark, 0.14)}<path d="${d}" fill="none" stroke="${dark}" stroke-opacity="0.5" stroke-width="2.5"/>`).join("\n    ")}

    <g fill="none" stroke="${seamColor}" stroke-width="2.4" stroke-dasharray="8 7" stroke-linecap="round">
      ${(g.seams ?? []).map((d) => `<path d="${d}"/>`).join("\n      ")}
    </g>
  </g>

  <rect x="-400" y="-400" width="1800" height="2050" filter="url(#${ref("grain")})" opacity="0.05" style="mix-blend-mode:multiply"/>
</svg>`;
}

const SHOTS = [
  { file: "onix-1.svg", garment: "tee", color: "#16161A", view: "front" },
  { file: "onix-2.svg", garment: "tee", color: "#16161A", view: "back" },
  { file: "onix-3.svg", garment: "tee", color: "#16161A", view: "detail" },

  { file: "hueso-1.svg", garment: "tee", color: "#E8E1D3", view: "front", backdrop: "#C2B9A8" },
  { file: "hueso-2.svg", garment: "tee", color: "#E8E1D3", view: "back", backdrop: "#C2B9A8" },
  { file: "hueso-3.svg", garment: "tee", color: "#E8E1D3", view: "detail", backdrop: "#C2B9A8" },

  { file: "bruma-1.svg", garment: "hoodie", color: "#8C8880", view: "front" },
  { file: "bruma-2.svg", garment: "hoodie", color: "#8C8880", view: "back" },
  { file: "bruma-3.svg", garment: "hoodie", color: "#8C8880", view: "detail" },

  { file: "brasa-1.svg", garment: "hoodie", color: "#B4441F", view: "front" },
  { file: "brasa-2.svg", garment: "hoodie", color: "#B4441F", view: "back" },
  { file: "brasa-3.svg", garment: "hoodie", color: "#B4441F", view: "detail" },

  { file: "sombra-1.svg", garment: "pants", color: "#4A4E3D", view: "front" },
  { file: "sombra-2.svg", garment: "pants", color: "#4A4E3D", view: "back" },
  { file: "sombra-3.svg", garment: "pants", color: "#4A4E3D", view: "detail" },

  { file: "duna-1.svg", garment: "pants", color: "#B9A88C", view: "front", backdrop: "#DCD3C2" },
  { file: "duna-2.svg", garment: "pants", color: "#B9A88C", view: "back", backdrop: "#DCD3C2" },

  { file: "taller-1.svg", garment: "jacket", color: "#232B33", view: "front" },
  { file: "taller-2.svg", garment: "jacket", color: "#232B33", view: "back" },
  { file: "taller-3.svg", garment: "jacket", color: "#232B33", view: "detail" },

  { file: "sello-1.svg", garment: "cap", color: "#16161A", view: "front" },
  { file: "sello-2.svg", garment: "cap", color: "#16161A", view: "back" },
];

await fs.mkdir(OUT_DIR, { recursive: true });
for (const shot of SHOTS) {
  await fs.writeFile(path.join(OUT_DIR, shot.file), studioShot(shot), "utf8");
}
console.log(`Generadas ${SHOTS.length} imágenes en public/uploads/seed`);
