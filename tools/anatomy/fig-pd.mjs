// Ensayo de descargas parciales: banco isométrico.
// Fuente resonante y pasatapas · cable con sus dos terminaciones · Ck,
// impedancia de medida y detector de DP.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as T from "./kit/tube.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const VOLT = process.argv.find((a) => a.startsWith("--volt="))?.slice(7) ?? "133 kV";

const WIDTH = 660;
const HEIGHT = 360;

/* ---------- plano del banco ---------- */
const FLOOR = { x: -156, y: -66, w: 312, d: 138, r: 10 };
const FLOOR_H = 7;

const CAB = { x: -130, y: -34, w: 62, d: 52, r: 4 };     // fuente resonante
const CAB_H = 52;
const CAB_TOP = CAB_H + 4;
const BUSH = [-99, -8];                                 // pasatapas sobre la fuente
const BUSH_TOP = 104;

const CABLE_Y = 14;                                       // eje del cable
const CABLE_Z = 46;
const CABLE_R = 7;
const CABLE_X0 = -62;
const CABLE_X1 = 72;
const POSTS = [-44, 56];                                  // aisladores soporte

const CK = [110, -36];                                    // condensador de acoplo
const CK_Z0 = 8;
const CK_Z1 = 78;
const CK_R = 13;

const IMP = { x: 92, y: -10, w: 26, d: 18, r: 2 };       // impedancia de medida
const IMP_H = 11;

const DET = { x: 46, y: 32, w: 58, d: 32, r: 3 };         // detector de DP
const DET_H = 21;

const BAR_Y = 56;                                         // barra de tierra

const P = k.fitProjection(
  [
    ...k.boxCorners(FLOOR, -FLOOR_H, 0),
    [BUSH[0], BUSH[1], BUSH_TOP + 8],
    [CK[0], CK[1], CK_Z1 + 14],
    [CABLE_X1 + 24, CABLE_Y, CABLE_Z],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const W = (from, to, style) => k.wireSvg(at(from), at(to), style);
const depth = (p) => k.depthOf(p, P);

/* Cada grupo se guarda con su profundidad y se pinta de atrás hacia delante. */
const items = [];
const put = (anchor, svg) => items.push({ d: depth(anchor), svg });

/* ---------- suelo del banco ---------- */
function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FLOOR, -FLOOR_H, FLOOR_H, P)}"/>`];
  out.push(S(k.slabOf(FLOOR, -FLOOR_H, FLOOR_H, P, 10, 1.4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(FLOOR, 6), 0, P, 10), { tone: "faint" }));
  const screws = k.corners(FLOOR, 12);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // regla en el borde delantero
  const strip = { x: FLOOR.x + 16, y: FLOOR.y + FLOOR.d - 13, w: FLOOR.w - 32, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 5, strip.x + strip.w - 5, 5, 5, strip.y + 0.9, 0.7, [2, 3.8], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2.4, strip.y + 3.5, 0.7]), at([strip.x + strip.w - 2.4, strip.y + 3.5, 0.7])], { size: 0.45 }));
  return out.join("");
}

/* ---------- placa de características ---------- */
function plate(plan, z, lines = 3) {
  const out = [S(k.slabOf(plan, z, 0.6, P, 2), { tone: "lo", crease: "none" })];
  for (let i = 0; i < lines; i++) {
    const y = plan.y + (plan.d * (i + 1)) / (lines + 1);
    out.push(L(k.lineOnTop([plan.x + 1.6, y], [plan.x + plan.w - (i === lines - 1 ? 6 : 1.6), y], z + 0.6, P), { tone: "faint", free: true }));
  }
  return out.join("");
}

/* ---------- fuente resonante ---------- */
function cabinet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CAB, 2), 0, 1, P)}" style="filter:blur(5px)"/>`];
  for (const [x, y] of k.corners(CAB, 9)) out.push(S(k.cylinder(x, y, 4.4, 0, 4, P, 20), { tone: "lo" }));
  out.push(S(k.slabOf(CAB, 4, CAB_H - 4, P, 5, 1.2), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(CAB, -1.4), CAB_H, 4, P, 5, 0.8), { tone: "mid" }));
  // juntas de los paneles laterales
  out.push(L(k.sideSeam(CAB, 20, P, 5), { tone: "faint" }));
  out.push(L(k.sideSeam(CAB, 38, P, 5), { tone: "faint" }));
  // rejillas de ventilación en la cara +x (ranuras cerradas)
  const vx = CAB.x + CAB.w;
  for (let i = 0; i < 6; i++) {
    const z = 12 + i * 5;
    out.push(L(k.segment([vx, CAB.y + 8, z], [vx, CAB.y + 20, z], P), { tone: "faint" }));
  }
  // panel de control en la cara +y
  const face = CAB.y + CAB.d;
  const panel = { x: CAB.x + 7, y: face - 0.4, w: 46, d: 2.2, r: 1 };
  out.push(S(k.slabOf(panel, 24, 20, P, 3, 0.4), { tone: "hi" }));
  // visor con la tensión de ensayo
  const win = { x: panel.x + 4, y: face + 1.5, w: 24, d: 0.5, r: 0.6 };
  out.push(S(k.slabOf(win, 32, 9, P, 2), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.sideMatrix([win.x + win.w / 2, win.y + 0.5], 36.6, P, "right"), VOLT, { size: 5, tone: "hi", anchor: "middle" }));
  // mandos y pilotos
  const F = (x, z) => G.frameAlong([x, face + 1.8, z], [0, 1, 0]);
  out.push(S(G.solidOf([[0, 3.4], [1.6, 3.9], [3.4, 3.6]], F(panel.x + 36, 36), P), { tone: "mid" }));
  out.push(L(G.ribsOf(F(panel.x + 36, 36), 0.4, 3.2, 3.8, 20, P), { tone: "lo" }));
  out.push(S(G.solidOf([[0, 2.2], [2.4, 2.4]], F(panel.x + 36, 28), P), { tone: "mid" }));
  out.push(D([at([panel.x + 7, face + 2.4, 28]), at([panel.x + 13, face + 2.4, 28])], { size: 0.7, tone: "hi" }));
  // asas y placa
  for (const x of [CAB.x + 12, CAB.x + CAB.w - 12]) {
    out.push(S(k.slabOf({ x: x - 5, y: CAB.y - 2.6, w: 10, d: 3, r: 1.2 }, 40, 3.4, P, 2), { tone: "mid" }));
  }
  out.push(plate({ x: CAB.x + 8, y: CAB.y + 10, w: 20, d: 11, r: 1 }, CAB_TOP));
  out.push(D(k.corners({ x: CAB.x + 8, y: CAB.y + 10, w: 20, d: 11, r: 1 }, 1.6).map((c) => at([c[0], c[1], CAB_TOP + 0.6])), { size: 0.4, tone: "lo" }));
  return out.join("");
}

/* ---------- pasatapas de alta tensión ---------- */
function bushing() {
  const [x, y] = BUSH;
  const F = G.frameAlong([x, y, CAB_TOP], [0, 0, 1]);
  const out = [];
  out.push(S(G.solidOf([[0, 11], [3, 11], [4, 8.5]], F, P), { tone: "mid" }));        // brida
  out.push(D(G.dotsOf(F, 1.5, 9.6, 8, P), { size: 0.45, tone: "lo" }));
  out.push(S(G.solidOf([[4, 5.2], [44, 5.2]], F, P, { rims: "none" }), { tone: "hi" })); // núcleo
  const sheds = [[8, 13], [16, 12], [24, 11], [32, 10], [39, 8.6]];
  for (const [s, r] of sheds) {
    out.push(S(G.solidOf([[s, 5.4], [s + 1, r], [s + 3.2, r - 0.6], [s + 3.6, 5.4]], F, P), { tone: "hi" }));
    out.push(L(G.arcOf(F, s + 1.1, r - 0.15, P, { slope: 0 }), { tone: "faint" }));
  }
  out.push(S(G.ringBand(44, 46.5, 7, 12, F, P), { tone: "mid" }));                     // anillo de guarda
  out.push(S(G.solidOf([[46.5, 4], [50, 4]], F, P), { tone: "hi" }));
  out.push(S(G.sphereOf([x, y, CAB_TOP + 53], 4.4, P), { tone: "hi", lit: true }));    // borne
  return out.join("");
}

/* ---------- aislador soporte ---------- */
function post(x) {
  const F = G.frameAlong([x, CABLE_Y, 0], [0, 0, 1]);
  const top = CABLE_Z - CABLE_R - 4;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 10, y: CABLE_Y - 10, w: 20, d: 20, r: 10 }, 0, 1, P)}" style="filter:blur(4px)"/>`];
  out.push(S(G.solidOf([[0, 11], [2.6, 11], [3.2, 8]], F, P), { tone: "lo" }));
  out.push(D(G.dotsOf(F, 1.3, 9.2, 6, P), { size: 0.42, tone: "lo" }));
  out.push(S(G.solidOf([[3.2, 4.6], [top, 4.6]], F, P, { rims: "none" }), { tone: "mid" }));
  const n = Math.max(2, Math.floor((top - 10) / 9));
  for (let i = 0; i < n; i++) {
    const s = 8 + i * 9;
    out.push(S(G.solidOf([[s, 4.8], [s + 0.9, 9.4], [s + 2.6, 8.8], [s + 3, 4.8]], F, P), { tone: "mid" }));
  }
  // abrazadera que sujeta el cable
  out.push(S(k.slabOf({ x: x - 7, y: CABLE_Y - 8, w: 14, d: 16, r: 2 }, top, 4, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([x - 4.5, CABLE_Y - 5.5, top + 4]), at([x + 4.5, CABLE_Y - 5.5, top + 4]), at([x - 4.5, CABLE_Y + 5.5, top + 4]), at([x + 4.5, CABLE_Y + 5.5, top + 4])], { size: 0.45, tone: "lo" }));
  return out.join("");
}

/* ---------- cable en ensayo ---------- */
function cable() {
  const F = G.frameAlong([CABLE_X0, CABLE_Y, CABLE_Z], [1, 0, 0]);
  const len = CABLE_X1 - CABLE_X0;
  const out = [];
  out.push(S(G.solidOf([[0, CABLE_R], [len, CABLE_R]], F, P, { rims: "ends" }), { tone: "hi", lit: true }));
  // bandas de marcado cada tramo
  for (let i = 1; i <= 5; i++) out.push(L(G.arcOf(F, (len * i) / 6, CABLE_R, P, { slope: 0 }), { tone: "faint" }));
  // banda semiconductora: un anillo marcado en el centro
  out.push(S(G.ringBand(len / 2 - 3, len / 2 + 3, CABLE_R - 0.4, CABLE_R + 0.5, F, P), { tone: "mid" }));
  out.push(L(G.ribsOf(F, len / 2 - 2.4, len / 2 + 2.4, CABLE_R + 0.5, 22, P), { tone: "lo" }));
  return out.join("");
}

/* ---------- terminación de ensayo ---------- */
function termination(x, dir) {
  const F = G.frameAlong([x, CABLE_Y, CABLE_Z], [dir, 0, 0]);
  const out = [];
  // cuerpo: base de la terminación sobre el cable
  out.push(S(G.solidOf([[0, CABLE_R + 0.4], [3, 10.4], [7, 10.4]], F, P, { rims: "none" }), { tone: "hi", lit: true }));
  // tres faldones separados
  for (const s of [7.5, 14.5, 21.5]) {
    out.push(S(G.solidOf([[s, 7.4], [s + 1.2, 12.8], [s + 3, 12.2], [s + 4, 7.4]], F, P), { tone: "hi", lit: true }));
  }
  out.push(S(G.solidOf([[11.5, 7.4], [14.5, 7.4]], F, P, { rims: "none" }), { tone: "hi", lit: true }));
  out.push(S(G.solidOf([[18.5, 7.4], [21.5, 7.4]], F, P, { rims: "none" }), { tone: "hi", lit: true }));
  // cuello y borne de pala, donde aterriza el conductor
  out.push(S(G.solidOf([[25.5, 6.6], [28, 4.2]], F, P), { tone: "mid" }));
  out.push(S(G.solidOf([[28, 2.6], [33, 2.6]], F, P, { rims: "none" }), { tone: "mid" }));
  const lug = { x: dir > 0 ? x + 33 : x - 39, y: CABLE_Y - 5, w: 6, d: 10, r: 1.5 };
  out.push(S(k.slabOf(lug, CABLE_Z - 1.4, 2.8, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.ring(lug.x + 3, CABLE_Y, 1.8, CABLE_Z + 1.4, P, 14), { tone: "lo" }));
  out.push(D([at([lug.x + 3, CABLE_Y, CABLE_Z + 1.4])], { size: 0.5, tone: "lo" }));
  return out.join("");
}

/* ---------- condensador de acoplo Ck ---------- */
function ck() {
  const [x, y] = CK;
  const F = G.frameAlong([x, y, 0], [0, 0, 1]);
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 17, y: y - 17, w: 34, d: 34, r: 17 }, 0, 1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(G.solidOf([[0, 17], [CK_Z0 - 2, 17], [CK_Z0, 14]], F, P), { tone: "lo" }));
  out.push(D(G.dotsOf(F, 3, 14.6, 8, P), { size: 0.45, tone: "lo" }));
  const unit = (CK_Z1 - CK_Z0) / 3;
  for (let i = 0; i < 3; i++) {
    const s0 = CK_Z0 + i * unit;
    out.push(S(G.solidOf([[s0, CK_R], [s0 + unit - 1.6, CK_R]], F, P, { rims: "none" }), { tone: "hi" }));
    out.push(S(G.ringBand(s0 + unit - 1.6, s0 + unit, CK_R - 1, CK_R + 1.6, F, P), { tone: "mid" }));
    out.push(L(G.ribsOf(F, s0 + 2, s0 + unit - 3.6, CK_R, 16, P), { tone: "faint" }));
  }
  out.push(S(G.ringBand(CK_Z1, CK_Z1 + 2.4, 6, 11, F, P), { tone: "mid" }));
  out.push(S(G.solidOf([[CK_Z1 + 2.4, 4], [CK_Z1 + 6, 4]], F, P), { tone: "hi" }));
  out.push(S(G.sphereOf([x, y, CK_Z1 + 10], 4.2, P), { tone: "hi" }));
  return out.join("");
}

/* ---------- impedancia de medida ---------- */
function impedance() {
  const out = [];
  for (const [x, y] of k.corners(IMP, 4)) out.push(S(k.cylinder(x, y, 2, 0, 2, P, 14), { tone: "lo" }));
  out.push(S(k.slabOf(IMP, 2, IMP_H - 2, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(IMP, 2.6), IMP_H, P, 3), { tone: "faint" }));
  out.push(D(k.corners(IMP, 3.4).map((c) => at([c[0], c[1], IMP_H])), { size: 0.42, tone: "lo" }));
  // conector coaxial en la cara +y
  const F = G.frameAlong([IMP.x + IMP.w / 2, IMP.y + IMP.d, 6], [0, 1, 0]);
  out.push(S(G.solidOf([[0, 2.6], [2.4, 2.6], [3, 2]], F, P), { tone: "mid" }));
  return out.join("");
}

/* ---------- detector de descargas parciales ---------- */
function detector() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(DET, 2), 0, 1, P)}" style="filter:blur(5px)"/>`];
  for (const [x, y] of k.corners(DET, 6)) out.push(S(k.cylinder(x, y, 3, 0, 3, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(DET, 3, DET_H - 3, P, 4, 0.9), { tone: "mid" }));
  out.push(L(k.sideSeam(DET, 9, P, 4), { tone: "faint" }));
  const face = DET.y + DET.d;
  // pantalla con el patrón φ-q-n
  const screen = { x: DET.x + 5, y: face - 0.4, w: 30, d: 1.6, r: 0.8 };
  out.push(S(k.slabOf(screen, 5, 12, P, 2, 0.3), { tone: "hi" }));
  const win = { x: screen.x + 1.6, y: face + 1.1, w: 26.8, d: 0.4, r: 0.4 };
  out.push(S(k.slabOf(win, 6.4, 9.2, P, 2), { tone: "lo", crease: "none" }));
  const dots = [];
  for (let i = 0; i < 34; i++) {
    const t = i / 33;
    const lobe = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const u = win.x + 1.4 + t * (win.w - 2.8);
    const amp = Math.sin(lobe * Math.PI) ** 1.6;
    const z = 11 + (t < 0.5 ? amp * 3.2 : -amp * 3.2) + (i % 3 - 1) * 0.35;
    dots.push(at([u, win.y + 0.4, z]));
  }
  out.push(D(dots, { size: 0.5, tone: "hi" }));
  out.push(L(k.segment([win.x, win.y + 0.4, 11], [win.x + win.w, win.y + 0.4, 11], P), { tone: "faint" }));
  // mandos, conector y placa
  const F = (x, z) => G.frameAlong([x, face + 1.4, z], [0, 1, 0]);
  out.push(S(G.solidOf([[0, 3], [1.4, 3.4], [3, 3.1]], F(DET.x + 44, 12), P), { tone: "mid" }));
  out.push(L(G.ribsOf(F(DET.x + 44, 12), 0.4, 2.8, 3.3, 18, P), { tone: "lo" }));
  out.push(S(G.solidOf([[0, 2.4], [2.6, 2.4], [3.2, 1.8]], F(DET.x + 44, 5), P), { tone: "mid" }));
  out.push(plate({ x: DET.x + 6, y: DET.y + 5, w: 18, d: 10, r: 1 }, DET_H));
  out.push(S(k.slabOf({ x: DET.x + 32, y: DET.y + 6, w: 18, d: 12, r: 1.5 }, DET_H, 1.6, P, 3, 0.3), { tone: "mid" }));
  out.push(D([at([DET.x + 36, DET.y + 12, DET_H + 1.6]), at([DET.x + 46, DET.y + 12, DET_H + 1.6])], { size: 0.5, tone: "lo" }));
  return out.join("");
}

/* ---------- barra de tierra ---------- */
function earthBar() {
  const bar = { x: FLOOR.x + 20, y: BAR_Y, w: FLOOR.w - 40, d: 5, r: 1 };
  const out = [S(k.slabOf(bar, 0, 2.4, P, 2, 0.3), { tone: "lo" })];
  for (let i = 0; i <= 6; i++) {
    const x = bar.x + 8 + (i * (bar.w - 16)) / 6;
    out.push(L(k.ring(x, bar.y + 2.5, 1.5, 2.4, P, 12), { tone: "faint" }));
    out.push(D([at([x, bar.y + 2.5, 2.4])], { size: 0.4, tone: "lo" }));
  }
  return out.join("");
}

/* ---------- conductores ---------- */
const leads = [];
function lead(points, radius, tone = "hi") {
  for (const piece of T.tubePieces(points, radius, P, { spacing: 2 })) {
    leads.push({ d: depth(piece.mid), svg: T.tubeSvg(piece, { tone }) });
  }
}

/* fuente → terminación izquierda */
lead(
  [
    [BUSH[0], BUSH[1], CAB_TOP + 53],
    [BUSH[0] - 1, BUSH[1] + 4, CAB_TOP + 46],
    [BUSH[0] - 3, BUSH[1] + 14, 70],
    [CABLE_X0 - 36, CABLE_Y, CABLE_Z + 1.4],
  ],
  2.4,
);
/* terminación derecha → Ck */
lead(
  [
    [CABLE_X1 + 36, CABLE_Y, CABLE_Z + 1.4],
    [CABLE_X1 + 42, CABLE_Y - 6, CABLE_Z + 14],
    [CK[0] + 2, CK[1] + 14, CK_Z1 + 6],
    [CK[0], CK[1], CK_Z1 + 10],
  ],
  2.4,
);
/* impedancia → detector (coaxial por el suelo) */
lead(
  [
    [IMP.x + IMP.w / 2, IMP.y + IMP.d + 3, 6],
    [IMP.x + IMP.w / 2 - 4, IMP.y + IMP.d + 16, 3],
    [DET.x + 46, DET.y - 10, 3],
    [DET.x + 46, DET.y + 2, 6],
  ],
  1.6,
  "mid",
);

/* ---------- composición ---------- */
put([CK[0], CK[1], 0], ck());
put([CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 0], cabinet());
put([BUSH[0], BUSH[1], 0], bushing());
put([IMP.x + IMP.w / 2, IMP.y + IMP.d / 2, 0], impedance());
for (const x of POSTS) put([x, CABLE_Y, 0], post(x));
put([CABLE_X0, CABLE_Y, 0], termination(CABLE_X0, -1));
put([CABLE_X1, CABLE_Y, 0], termination(CABLE_X1, 1));
put([0, CABLE_Y, 0], cable());
put([DET.x + DET.w / 2, DET.y + DET.d / 2, 0], detector());
put([0, BAR_Y, 0], earthBar());

/* trenzas de tierra: cable corto desde cada base hasta la barra */
for (const [bx, by, bz, tx] of [
  [CAB.x + CAB.w - 12, CAB.y + CAB.d - 4, 5, CAB.x + CAB.w - 4],
  [POSTS[0], CABLE_Y + 10, 3, POSTS[0] + 10],
  [CK[0] - 13, CK[1] + 11, 5, CK[0] - 10],
  [DET.x + 6, DET.y + 1, 5, DET.x + 2],
]) {
  lead(
    [
      [bx, by, bz],
      [bx + (tx - bx) * 0.4, by + (BAR_Y - by) * 0.45, 2.6],
      [tx, BAR_Y - 1.5, 2.4],
    ],
    1.3,
    "mid",
  );
}
items.push(...leads);

const body = [floor(), ...items.sort((a, b) => a.d - b.d).map((i) => i.svg)];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Banco de ensayo de descargas parciales. A la izquierda la fuente resonante con su pasatapas; en el centro el cable en ensayo sobre dos aisladores soporte, con una terminación en cada extremo; a la derecha el condensador de acoplo, la impedancia de medida y el detector de descargas parciales, cuya pantalla muestra el patrón de los pulsos. Todas las bases están unidas a la barra de tierra.",
  body,
});

const html = k.pageHtml({
  title: "Ensayo de descargas parciales",
  theme,
  width: 760,
  body: k.plateHtml({
    fig: "Fig 1",
    title: "Descargas parciales",
    hint: "Banco completo",
    readout: VOLT,
    keys: [{ mark: "lit", label: "Objeto en ensayo: el cable y sus terminaciones" }],
    caption: "Fuente resonante y pasatapas (izquierda) · cable con sus dos terminaciones sobre aisladores (centro) · condensador de acoplo, impedancia de medida y detector de DP (derecha).",
    body: `<div class="iso-stage">${svg}</div>`,
  }),
  script: "",
});

writeFileSync(join(HERE, theme === "light" ? "pd-light.html" : "pd.html"), html);
console.log("escrito", theme === "light" ? "pd-light.html" : "pd.html");
