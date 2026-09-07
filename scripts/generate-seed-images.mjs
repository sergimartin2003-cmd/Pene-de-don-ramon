import { promises as fs } from "node:fs";
import path from "node:path";

import { SHOES } from "./shoe-paths.mjs";

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

function studioShot({ shoe, color, view, sole = "#F1ECE2", backdrop = "#EDE7DB", seed = 7 }) {
  const s = SHOES[shoe];
  const pale = luminance(color) > 0.6;
  const light = shade(color, pale ? -14 : 38);
  const dark = shade(color, pale ? -50 : -30);
  const seamColor = pale ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.24)";
  const mirrored = view === "back";
  const viewBox = view === "detail" ? s.detail : "0 0 1200 1200";

  // Sufijo único por fichero: evita que dos SVG en la misma página compartan
  // los identificadores de sus degradados y se pisen los colores.
  const uid = `${shoe}-${color.slice(1)}-${view}`;
  const ref = (name) => `${name}-${uid}`;

  const outline = (d, stroke = dark) =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="0.55" stroke-width="2.6" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="1200" height="1200" role="img" aria-label="${s.label}">
  <defs>
    <radialGradient id="${ref("bg")}" cx="50%" cy="38%" r="78%">
      <stop offset="0%" stop-color="${shade(backdrop, 14)}"/>
      <stop offset="100%" stop-color="${shade(backdrop, -20)}"/>
    </radialGradient>
    <linearGradient id="${ref("upper")}" x1="14%" y1="0%" x2="86%" y2="100%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="46%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="${ref("mid")}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${shade(sole, -2)}"/>
      <stop offset="100%" stop-color="${shade(sole, -34)}"/>
    </linearGradient>
    <radialGradient id="${ref("fold")}" cx="32%" cy="22%" r="74%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="58%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.22"/>
    </radialGradient>
    <filter id="${ref("grain")}">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="${ref("drop")}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="13" flood-color="#3a3128" flood-opacity="0.10"/>
    </filter>
    <filter id="${ref("weave")}">
      <feTurbulence type="fractalNoise" baseFrequency="0.55 0.72" numOctaves="2" seed="${seed + 2}" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.11"/></feComponentTransfer>
    </filter>
    <clipPath id="${ref("body")}"><path d="${s.path}"/></clipPath>
  </defs>

  <rect x="-400" y="-400" width="2000" height="2000" fill="url(#${ref("bg")})"/>
  <ellipse cx="600" cy="890" rx="440" ry="26" fill="#3a3128" opacity="0.07"/>

  <g filter="url(#${ref("drop")})" ${mirrored ? 'transform="translate(1200,0) scale(-1,1)"' : ""}>
    ${s.sole ? `<path d="${s.sole}" fill="${shade(sole, -76)}"/>${outline(s.sole, shade(sole, -110))}` : ""}
    ${s.midsole ? `<path d="${s.midsole}" fill="url(#${ref("mid")})"/>${outline(s.midsole, shade(sole, -80))}` : ""}

    <path d="${s.path}" fill="url(#${ref("upper")})"/>
    <g clip-path="url(#${ref("body")})">
      <rect x="0" y="0" width="1200" height="1200" fill="url(#${ref("fold")})"/>
      <rect x="0" y="0" width="1200" height="1200" filter="url(#${ref("weave")})" opacity="0.6"/>
      ${(s.panels ?? [])
        .map((d) => `<path d="${d}" fill="${dark}" fill-opacity="0.30"/>${outline(d)}`)
        .join("\n      ")}
    </g>
    ${outline(s.path)}

    ${s.opening ? `<path d="${s.opening}" fill="none" stroke="${shade(dark, -18)}" stroke-opacity="0.55" stroke-width="14" stroke-linecap="round"/>` : ""}

    <g fill="none" stroke="${seamColor}" stroke-width="2.4" stroke-dasharray="8 7" stroke-linecap="round">
      ${(s.seams ?? []).map((d) => `<path d="${d}"/>`).join("\n      ")}
    </g>

    ${(s.eyelets ?? [])
      .map(
        ([cx, cy]) =>
          `<circle cx="${cx}" cy="${cy}" r="9" fill="${shade(dark, -22)}" fill-opacity="0.75"/>` +
          `<circle cx="${cx}" cy="${cy}" r="4" fill="${shade(sole, -10)}"/>`,
      )
      .join("\n    ")}
  </g>

  <rect x="-400" y="-400" width="2000" height="2000" filter="url(#${ref("grain")})" opacity="0.05" style="mix-blend-mode:multiply"/>
</svg>`;
}

const SHOTS = [
  { file: "onix-1.svg", shoe: "court", color: "#16161A", view: "side", sole: "#D4CBBA" },
  { file: "onix-2.svg", shoe: "court", color: "#16161A", view: "back", sole: "#D4CBBA" },
  { file: "onix-3.svg", shoe: "court", color: "#16161A", view: "detail", sole: "#D4CBBA" },

  { file: "hueso-1.svg", shoe: "court", color: "#E8E1D3", view: "side", sole: "#E6DECD", backdrop: "#BEB4A2" },
  { file: "hueso-2.svg", shoe: "court", color: "#E8E1D3", view: "back", sole: "#E6DECD", backdrop: "#BEB4A2" },
  { file: "hueso-3.svg", shoe: "court", color: "#E8E1D3", view: "detail", sole: "#E6DECD", backdrop: "#BEB4A2" },

  { file: "bruma-1.svg", shoe: "runner", color: "#8C8880", view: "side", sole: "#D6CDBC" },
  { file: "bruma-2.svg", shoe: "runner", color: "#8C8880", view: "back", sole: "#D6CDBC" },
  { file: "bruma-3.svg", shoe: "runner", color: "#8C8880", view: "detail", sole: "#D6CDBC" },

  { file: "brasa-1.svg", shoe: "runner", color: "#B4441F", view: "side", sole: "#D2C9B8" },
  { file: "brasa-2.svg", shoe: "runner", color: "#B4441F", view: "back", sole: "#D2C9B8" },
  { file: "brasa-3.svg", shoe: "runner", color: "#B4441F", view: "detail", sole: "#D2C9B8" },

  { file: "sombra-1.svg", shoe: "skate", color: "#4A4E3D", view: "side", sole: "#D2C9B7" },
  { file: "sombra-2.svg", shoe: "skate", color: "#4A4E3D", view: "back", sole: "#D2C9B7" },
  { file: "sombra-3.svg", shoe: "skate", color: "#4A4E3D", view: "detail", sole: "#D2C9B7" },

  { file: "duna-1.svg", shoe: "skate", color: "#B9A88C", view: "side", sole: "#EFE8DA", backdrop: "#CCC1AD" },
  { file: "duna-2.svg", shoe: "skate", color: "#B9A88C", view: "back", sole: "#EFE8DA", backdrop: "#CCC1AD" },

  { file: "taller-1.svg", shoe: "high", color: "#232B33", view: "side", sole: "#D5CCBB" },
  { file: "taller-2.svg", shoe: "high", color: "#232B33", view: "back", sole: "#D5CCBB" },
  { file: "taller-3.svg", shoe: "high", color: "#232B33", view: "detail", sole: "#D5CCBB" },

  { file: "sello-1.svg", shoe: "laces", color: "#16161A", view: "side" },
  { file: "sello-2.svg", shoe: "laces", color: "#16161A", view: "back" },
];

await fs.mkdir(OUT_DIR, { recursive: true });
for (const shot of SHOTS) {
  await fs.writeFile(path.join(OUT_DIR, shot.file), studioShot(shot), "utf8");
}
console.log(`Generadas ${SHOTS.length} imágenes en public/uploads/seed`);
