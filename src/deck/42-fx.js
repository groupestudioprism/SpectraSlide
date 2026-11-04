/* ---------- Effets : ombres, lueur, reflet, flou, inclinaison 3D, ajustements ; effets de texte (WordArt) ; dégradés et motifs ----------
   Élément : fx {sh:{x,y,b,c,o}, gl:{b,c,o}, rf, bl, sf, rx, ry, fh, fv, br, ct, sa, hu} · fond de forme : g2, g3, ga, gt('lin'|'rad'|'con'), pat, pc, ps, po · contour : sd ('dash'|'dot')
   Texte (st) : tg [c1, c2, angle], to {w, c, f}, tl {b, c}, tsd {x, y, b, c, o}, t3 {n, c}, sc, tt, ws */
const isCol = c => typeof c === 'string' && (/^t:[a-z0-9]+$/.test(c) || /^#[0-9a-f]{3,8}$/i.test(c));
const numIn = (v, a, b, d = 0) => { v = +v; return isFinite(v) ? clamp(v, a, b) : d; };
const withOp = (c, o) => { const col = cssCol(c); return o == null || o >= 1 ? col : `color-mix(in srgb,${col} ${Math.round(o * 100)}%,transparent)`; };
/* motifs : [nom, largeur, hauteur, dessin(couleur)] */
const PATS = {
  dots:['Points', 20, 20, c => `<circle cx="10" cy="10" r="2.4" fill="${c}"/>`], dots2:['Grosse trame', 28, 28, c => `<circle cx="7" cy="7" r="4.5" fill="${c}"/><circle cx="21" cy="21" r="4.5" fill="${c}"/>`],
  diag:['Rayures', 16, 16, c => `<path d="M-2 2L2 -2M0 16L16 0M14 18L18 14" stroke="${c}" stroke-width="3"/>`], hlines:['Lignes', 14, 14, c => `<rect width="14" height="3" fill="${c}"/>`], vlines:['Barres', 14, 14, c => `<rect width="3" height="14" fill="${c}"/>`],
  grid:['Quadrillage', 24, 24, c => `<path d="M24 0V24H0" fill="none" stroke="${c}" stroke-width="1.6"/>`], check:['Damier', 32, 32, c => `<rect width="16" height="16" fill="${c}"/><rect x="16" y="16" width="16" height="16" fill="${c}"/>`],
  zig:['Zigzag', 24, 20, c => `<path d="M0 14L6 6L12 14L18 6L24 14" fill="none" stroke="${c}" stroke-width="2.4"/>`], wave:['Vagues', 32, 24, c => `<path d="M0 12C8 0 8 0 16 12S24 24 32 12" fill="none" stroke="${c}" stroke-width="2.4"/>`],
  cross:['Croix', 22, 22, c => `<path d="M11 6V16M6 11H16" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`], tri:['Triangles', 24, 24, c => `<path d="M12 4L20 20H4Z" fill="${c}"/>`],
  brick:['Briques', 40, 20, c => `<path d="M0 0H40M0 10H40M0 20H40M10 0V10M30 0V10M20 10V20" fill="none" stroke="${c}" stroke-width="1.6"/>`], scale:['Écailles', 24, 16, c => `<path d="M0 16A12 12 0 0 1 24 16M-12 8A12 12 0 0 1 12 8M12 8A12 12 0 0 1 36 8" fill="none" stroke="${c}" stroke-width="1.8"/>`],
  conf:['Confettis', 40, 40, c => `<rect x="6" y="8" width="8" height="3" rx="1.5" fill="${c}" transform="rotate(30 10 9)"/><circle cx="28" cy="10" r="2.5" fill="${c}"/><rect x="26" y="28" width="9" height="3" rx="1.5" fill="${c}" transform="rotate(-40 30 29)"/><circle cx="10" cy="30" r="2" fill="${c}"/>`],
};
const PAT_ORDER = Object.keys(PATS);
function patTile(k, col, op = .3, sc = 1){
  const p = PATS[k]; if (!p) return null; const w = Math.round(p[1] * sc), h = Math.round(p[2] * sc);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${p[1]} ${p[2]}" opacity="${op}">${p[3](col)}</svg>`;
  return {w, h, url:`url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`};
}
/* dégradés : 2 ou 3 couleurs, linéaire, radial ou conique */
function gradCss(e){
  const cs = [e.fill, e.g2, e.g3].filter(Boolean).map(cssCol), a = e.ga ?? 135;
  if (e.gt === 'rad') return `radial-gradient(circle at ${numIn(e.gx, 0, 100, 50)}% ${numIn(e.gy, 0, 100, 50)}%,${cs.join(',')})`;
  if (e.gt === 'con') return `conic-gradient(from ${a}deg at 50% 50%,${[...cs, cs[0]].join(',')})`;
  return `linear-gradient(${a}deg,${cs.join(',')})`;
}
function gradDefs(id, e, sv){
  const cs = [e.fill, e.g2, e.g3].filter(Boolean).map(c => realCol(c, sv)), st = cs.map((c, i) => `<stop offset="${cs.length < 2 ? 0 : i / (cs.length - 1)}" stop-color="${c}"/>`).join('');
  if (e.gt === 'rad') return `<defs><radialGradient id="${id}" cx="${numIn(e.gx, 0, 100, 50) / 100}" cy="${numIn(e.gy, 0, 100, 50) / 100}" r=".75">${st}</radialGradient></defs>`;
  const a = (e.ga ?? 135) * Math.PI / 180, dx = Math.cos(a - Math.PI / 2) / 2, dy = Math.sin(a - Math.PI / 2) / 2;
  return `<defs><linearGradient id="${id}" x1="${.5 - dx}" y1="${.5 - dy}" x2="${.5 + dx}" y2="${.5 + dy}">${st}</linearGradient></defs>`;
}
/* motif posé sur une forme : couches CSS (formes simples) ou masque en forme de tracé */
function patLayer(e, sv){
  const t = e.pat && patTile(e.pat, realCol(e.pc || 't:ink', sv) || '#000', numIn(e.po, .05, 1, .3), numIn(e.ps, .5, 4, 1)); return t;
}
/* ---------- boîte d'un élément : position, rotation, transparence, effets ---------- */
function boxCss(e){
  let c = `left:${Math.round(e.x)}px;top:${Math.round(e.y)}px;width:${Math.round(e.w)}px;height:${Math.round(e.h)}px;`;
  const f = e.fx || {};
  let tf = e.rot ? `rotate(${+e.rot}deg)` : '';
  if (f.rx || f.ry) tf += ` perspective(1400px) rotateX(${numIn(f.rx, -70, 70)}deg) rotateY(${numIn(f.ry, -70, 70)}deg)`;
  if (f.fh) tf += ' scaleX(-1)'; if (f.fv) tf += ' scaleY(-1)';
  if (tf) c += `transform:${tf.trim()};`;
  if (e.op != null && e.op < 1) c += `opacity:${+e.op};`;
  const fl = [];
  if (e.shadow) fl.push(`drop-shadow(0 ${Math.round(e.shadow * .5)}px ${e.shadow}px rgb(10 8 30 / .28))`);
  if (f.sh) fl.push(`drop-shadow(${numIn(f.sh.x, -200, 200)}px ${numIn(f.sh.y, -200, 200)}px ${numIn(f.sh.b, 0, 200)}px ${withOp(f.sh.c || '#000000', numIn(f.sh.o, 0, 1, .35))})`);
  if (f.gl){ const b = numIn(f.gl.b, 0, 150, 20), col = withOp(f.gl.c || 't:ac', numIn(f.gl.o, 0, 1, .9)); fl.push(`drop-shadow(0 0 ${b / 2}px ${col}) drop-shadow(0 0 ${b}px ${col})`); }
  if (f.bl) fl.push(`blur(${numIn(f.bl, 0, 60)}px)`);
  if (f.br != null && f.br !== 100) fl.push(`brightness(${numIn(f.br, 0, 250, 100) / 100})`);
  if (f.ct != null && f.ct !== 100) fl.push(`contrast(${numIn(f.ct, 0, 250, 100) / 100})`);
  if (f.sa != null && f.sa !== 100) fl.push(`saturate(${numIn(f.sa, 0, 300, 100) / 100})`);
  if (f.hu) fl.push(`hue-rotate(${numIn(f.hu, -180, 180)}deg)`);
  if (fl.length) c += `filter:${fl.join(' ')};`;
  if (f.rf) c += `-webkit-box-reflect:below 6px linear-gradient(transparent ${Math.round(100 - 45 * numIn(f.rf, 0, 1, .5))}%,rgb(255 255 255 / ${numIn(f.rf, 0, 1, .5) * .6}));`;
  if (f.sf){ const s = numIn(f.sf, 0, 200), m = `linear-gradient(90deg,transparent,#000 ${s}px,#000 calc(100% - ${s}px),transparent),linear-gradient(180deg,transparent,#000 ${s}px,#000 calc(100% - ${s}px),transparent)`; c += `-webkit-mask-image:${m};mask-image:${m};-webkit-mask-composite:source-in;mask-composite:intersect;`; }
  return c;
}
/* ---------- texte : effets WordArt ---------- */
function fxTextCss(st){
  let c = '';
  if (st.tg && st.tg[0] && st.tg[1]) c += `background-image:linear-gradient(${numIn(st.tg[2], 0, 360, 90)}deg,${cssCol(st.tg[0])},${cssCol(st.tg[1])}${st.tg[3] ? ',' + cssCol(st.tg[3]) : ''});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;`;
  if (st.to){ const w = numIn(st.to.w, 0, 24, 2); c += `-webkit-text-stroke:${w}px ${cssCol(st.to.c || 't:ink')};paint-order:stroke fill;`; if (st.to.f === 0) c += '-webkit-text-fill-color:transparent;'; }
  const sd = [];
  if (st.sh) sd.push('0 2px 14px rgb(0 0 0 / .35)');
  if (st.tl){ const b = numIn(st.tl.b, 0, 80, 12), col = cssCol(st.tl.c || 't:ac'); sd.push(`0 0 ${b / 2}px ${col}`, `0 0 ${b}px ${col}`, `0 0 ${b * 2}px ${col}`); }
  if (st.tsd) sd.push(`${numIn(st.tsd.x, -60, 60)}px ${numIn(st.tsd.y, -60, 60)}px ${numIn(st.tsd.b, 0, 80)}px ${withOp(st.tsd.c || '#000000', numIn(st.tsd.o, 0, 1, .4))}`);
  if (st.t3){ const n = numIn(st.t3.n, 1, 40, 10), col = cssCol(st.t3.c || 't:ac'); for (let i = 1; i <= n; i++) sd.push(`${i}px ${i}px 0 ${col}`); }
  if (sd.length) c += `text-shadow:${sd.join(',')};`;
  if (st.sc) c += 'font-variant-caps:small-caps;'; if (st.tt === 'cap') c += 'text-transform:capitalize;'; if (st.tt === 'low') c += 'text-transform:lowercase;';
  if (st.ws) c += `word-spacing:${numIn(st.ws, -.3, 2)}em;`;
  return c;
}
/* styles WordArt : [nom, effets, aperçu] — 't:' suit le thème */
const WORDART = [
  ['Aucun', {}], ['Néon', {fc:'t:on', tl:{b:14, c:'t:ac'}}], ['Contour', {to:{w:2, c:'t:ink', f:0}}], ['Dégradé', {tg:['t:ac', 't:ac2', 90]}], ['Arc-en-ciel', {tg:['#FF4D8D', '#FFC83D', 90, '#00C2FF']}],
  ['Ombre dure', {tsd:{x:4, y:4, b:0, c:'t:ac', o:1}}], ['Extrusion', {t3:{n:12, c:'t:ac'}}], ['Rétro', {fc:'#FFFFFF', to:{w:3, c:'#16122B'}, tsd:{x:5, y:5, b:0, c:'#FF4D8D', o:1}}], ['Chrome', {tg:['#F4F7FB', '#7C8798', 180, '#DCE3EE'], to:{w:1, c:'#4B5466'}}],
  ['Or', {tg:['#FFE08A', '#B7791F', 180, '#FFD34D']}], ['Feu', {tg:['#FFE259', '#FF3D2E', 180], tl:{b:10, c:'#FF7A00'}}], ['Glace', {tg:['#FFFFFF', '#5CC8FF', 180], tl:{b:10, c:'#38BDF8'}}],
  ['Autocollant', {fc:'#16122B', to:{w:8, c:'#FFFFFF'}, tsd:{x:0, y:6, b:14, c:'#000000', o:.35}}], ['Verre', {fc:'#FFFFFF', to:{w:1.5, c:'#FFFFFF', f:0}, tsd:{x:0, y:6, b:18, c:'#000000', o:.3}}], ['Surbrillance', {fc:'#16122B', tsd:{x:0, y:0, b:0, c:'#FFD34D', o:1}, tl:{b:6, c:'#FFD34D'}}],
];
const WORDART_KEYS = ['tg', 'to', 'tl', 'tsd', 't3', 'sh'];
/* nettoyage d'un élément venant de l'extérieur : valeurs bornées, couleurs vérifiées */
function cleanFx(e){
  const ok = c => isCol(c) ? c : undefined, col = (o, k, d) => ok(o?.[k]) || d;
  if (e.fx && typeof e.fx === 'object'){
    const f = e.fx, o = {};
    if (f.sh && typeof f.sh === 'object') o.sh = {x:numIn(f.sh.x, -200, 200), y:numIn(f.sh.y, -200, 200), b:numIn(f.sh.b, 0, 200), c:col(f.sh, 'c', '#000000'), o:numIn(f.sh.o, 0, 1, .35)};
    if (f.gl && typeof f.gl === 'object') o.gl = {b:numIn(f.gl.b, 0, 150, 20), c:col(f.gl, 'c', 't:ac'), o:numIn(f.gl.o, 0, 1, .9)};
    for (const [k, a, b] of [['rf', 0, 1], ['bl', 0, 60], ['sf', 0, 200], ['rx', -70, 70], ['ry', -70, 70], ['br', 0, 250], ['ct', 0, 250], ['sa', 0, 300], ['hu', -180, 180]]) if (f[k] != null && isFinite(+f[k])) o[k] = numIn(f[k], a, b);
    if (f.fh) o.fh = 1; if (f.fv) o.fv = 1;
    if (Object.keys(o).length) e.fx = o; else delete e.fx;
  } else delete e.fx;
  if (e.gt && !['lin', 'rad', 'con'].includes(e.gt)) delete e.gt; if (e.g3 && !ok(e.g3)) delete e.g3; if (e.pc && !ok(e.pc)) delete e.pc; if (e.pat && !PATS[e.pat]) delete e.pat;
  for (const k of ['ga', 'gx', 'gy', 'ps', 'po']) if (k in e) e[k] = numIn(e[k], k === 'ps' ? .5 : k === 'po' ? .05 : -720, k === 'ps' ? 4 : k === 'po' ? 1 : 720);
  if (e.sd && !['dash', 'dot'].includes(e.sd)) delete e.sd;
  if (e.alt != null) e.alt = String(e.alt).slice(0, 300); if (e.lk != null){ e.lk = String(e.lk).slice(0, 500); if (!/^(https?:\/\/|#\d+$)/i.test(e.lk)) delete e.lk; }
  if (e.an && typeof e.an === 'object'){ const a = e.an; e.an = {k:String(a.k || '').replace(/[^\w]/g, '').slice(0, 20), click:!!a.click}; if (a.t === 'em' || a.t === 'out') e.an.t = a.t; if (a.dur) e.an.dur = numIn(a.dur, .1, 8, .7); if (a.del) e.an.del = numIn(a.del, 0, 20); if (a.ease && /^[\w-]+$/.test(a.ease)) e.an.ease = a.ease.slice(0, 12); if (a.rep) e.an.rep = numIn(a.rep, 1, 99, 1); if (a.loop) e.an.loop = 1; if (!e.an.k) delete e.an; }
  const st = e.st; if (st){
    if (Array.isArray(st.tg)){ const g = st.tg.slice(0, 4).map((c, i) => i === 2 ? numIn(c, 0, 360, 90) : ok(c)); if (g[0] && g[1]) st.tg = g.filter(x => x != null); else delete st.tg; } else delete st.tg;
    if (st.to && typeof st.to === 'object') st.to = {w:numIn(st.to.w, 0, 24, 2), c:col(st.to, 'c', 't:ink'), f:st.to.f === 0 ? 0 : undefined}; else delete st.to;
    if (st.tl && typeof st.tl === 'object') st.tl = {b:numIn(st.tl.b, 0, 80, 12), c:col(st.tl, 'c', 't:ac')}; else delete st.tl;
    if (st.tsd && typeof st.tsd === 'object') st.tsd = {x:numIn(st.tsd.x, -60, 60), y:numIn(st.tsd.y, -60, 60), b:numIn(st.tsd.b, 0, 80), c:col(st.tsd, 'c', '#000000'), o:numIn(st.tsd.o, 0, 1, .4)}; else delete st.tsd;
    if (st.t3 && typeof st.t3 === 'object') st.t3 = {n:numIn(st.t3.n, 1, 40, 10), c:col(st.t3, 'c', 't:ac')}; else delete st.t3;
    if (st.tt && !['cap', 'low'].includes(st.tt)) delete st.tt; if (st.ws) st.ws = numIn(st.ws, -.3, 2);
  }
  return e;
}
