// Génère le logo Pépito Services en SVG vectoriel.
// Clôture en perspective + « PEPITO » (Anton) + lisses ≡ + filet + « services » (DM Serif Italic).
const fs = require('fs');
const opentype = require('opentype.js');

const anton = opentype.parse(fs.readFileSync('Anton.ttf').buffer);
const dm = opentype.parse(fs.readFileSync('DMSerif-Italic.ttf').buffer);

// Texte → paths, normalisé à une largeur cible, ancré (x, baselineY)
function textPath(font, str, targetWidth, x, baselineY) {
  const size = 1000;
  const p = font.getPath(str, 0, 0, size);
  const bb = p.getBoundingBox();
  const s = targetWidth / (bb.x2 - bb.x1);
  const d = p.toPathData(2);
  return `<path transform="translate(${x - bb.x1 * s},${baselineY - bb.y2 * s - (size - (bb.y2 - bb.y1)) * s}) scale(${s})" d="${d}"/>`;
}

const G = '#284028';      // vert foncé du logo
const G2 = '#34502f';     // face éclairée
const GD = '#182418';     // ombre
const GRID = '#d9dccf';   // grille blueprint

/* ── Clôture en perspective : les piquets convergent vers un point de fuite à gauche ──
   near = bord droit (haut), far = bord gauche (bas). */
function lerp(a, b, t) { return a + (b - a) * t; }

const fence = [];
const X0 = 8, X1 = 150;           // emprise horizontale de la clôture
const nearTop = 120, nearBot = 432;   // hauteur du montant proche (droite)
const farTop = 205, farBot = 320;     // hauteur du montant lointain (gauche)
const n = 13;                        // nb de piquets
const posts = [];

for (let i = 0; i <= n; i++) {
  const t = i / n;
  // espacement perspectiviste : t^1.6 tasse vers la gauche
  const tt = Math.pow(t, 1.55);
  const x = lerp(X0, X1, tt);
  const top = lerp(farTop, nearTop, tt);
  const bot = lerp(farBot, nearBot, tt);
  const w = lerp(4, 9, tt);          // épaisseur du piquet
  posts.push({ x, top, bot, w, t });
}
// rails haut/bas (quads convergents)
const railAt = (ratio) => posts.map((p) => [p.x + p.w / 2, lerp(p.top, p.bot, ratio)]);
const railPath = (rA, rB) => {
  const a = railAt(rA), b = railAt(rB);
  return `M${a[0][0]},${a[0][1]} ` + a.slice(1).map((p) => `L${p[0]},${p[1]}`).join(' ')
    + ' ' + b.slice().reverse().map((p) => `L${p[0]},${p[1]}`).join(' ') + ' Z';
};
fence.push(`<path fill="${G}" d="${railPath(0.16, 0.24)}"/>`);
fence.push(`<path fill="${G}" d="${railPath(0.74, 0.82)}"/>`);
// piquets : face avant + chapeau pointu
for (const p of posts) {
  fence.push(`<path fill="${G2}" d="M${p.x},${p.bot} V${p.top + p.w * 0.9} h${p.w} V${p.bot} Z"/>`);
  fence.push(`<path fill="${G}" d="M${p.x},${p.top + p.w * 0.9} L${p.x + p.w / 2},${p.top} L${p.x + p.w},${p.top + p.w * 0.9} Z"/>`);
}
// pilier plein au premier plan (droite) : face avant + côté + chapeau
const mp = posts[n];
const px = mp.x + 6, pw = 26, pTop = mp.top - 26, pBot = mp.bot + 8;
fence.push(`<path fill="${G2}" d="M${px},${pBot} V${pTop} h${pw} V${pBot} Z"/>`);
fence.push(`<path fill="${GD}" d="M${px + pw},${pBot} V${pTop} l7,-9 V${pBot - 9} Z"/>`);
fence.push(`<path fill="${G}" d="M${px - 3},${pTop} h${pw + 11} l7,-9 h-${pw + 11} Z"/>`);

/* ── Grille de fuite d'arrière-plan (subtile) ── */
const grid = [];
const vpx = 1180, vpy = 500; // point de fuite bas-droite
for (const gy of [320, 355, 395, 440, 490]) {
  grid.push(`<line x1="0" y1="${gy}" x2="1024" y2="${lerp(gy, vpy, 0.35)}" stroke="${GRID}" stroke-width="1"/>`);
}
for (let i = 0; i <= 14; i++) {
  const x = i * 80 + 30;
  grid.push(`<line x1="${x}" y1="500" x2="${lerp(x, 620, 0.6)}" y2="300" stroke="${GRID}" stroke-width="1"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" role="img" aria-label="Pépito Services">
<title>Pépito Services — clôtures, portails, terrassement</title>
<g opacity=".55">${grid.join('')}</g>
<g>${fence.join('')}</g>
<g fill="${G}">${textPath(anton, 'PEPITO', 610, 200, 305)}</g>
<g fill="${G}">
  <rect x="830" y="215" width="72" height="13"/>
  <rect x="830" y="244" width="72" height="13"/>
  <rect x="830" y="273" width="72" height="13"/>
</g>
<rect x="200" y="352" width="405" height="5" fill="${G}"/>
<g fill="${G}">${textPath(dm, 'services', 262, 600, 436)}</g>
</svg>`;

fs.writeFileSync('pepito-logo.svg', svg);
console.log('OK', svg.length, 'octets');

// Variante « mark » : la clôture seule, format carré (favicon, footer, tampon)
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500" role="img" aria-label="Clôture Pépito Services">
<g>${fence.join('')}</g>
</svg>`;
fs.writeFileSync('pepito-mark.svg', mark);
console.log('mark OK', mark.length);
