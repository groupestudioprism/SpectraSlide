/* ---------- Schémas prêts à l'emploi (façon SmartArt) : chaque schéma est un groupe d'éléments modifiables ---------- */
(() => {
  for (let j = 1; j <= 8; j++){ const a = Math.round(50 / (j + 1) * 10) / 10, b = Math.round((100 - a) * 10) / 10; SHAPES['pyr' + j] = ['Pyramide', `M${a} 0H${b}L100 100H0Z`]; SHAPES['fun' + j] = ['Entonnoir', `M0 0H100L${b} 100H${a}Z`]; }
  SHAPES.itri = ['Triangle inversé', 'M0 0H100L50 100Z'];
})();
const SMARTS = [['process', 'Processus', 4, [3, 6]], ['cycle', 'Cycle', 4, [3, 6]], ['pyramid', 'Pyramide', 4, [3, 6]], ['funnel', 'Entonnoir', 4, [3, 6]], ['org', 'Organigramme', 3, [2, 5]], ['venn', 'Diagramme de Venn', 3, [2, 3]],
  ['matrix', 'Matrice 2 × 2', 4, [4, 4]], ['list', 'Liste verticale', 4, [3, 6]], ['target', 'Cible', 4, [3, 5]], ['hub', 'Rayonnement', 5, [3, 8]], ['steps', 'Escalier', 4, [3, 6]], ['compare', 'Avant / après', 2, [2, 2]]];
function smartEls(kind, n){
  const [W, H] = dims(), k = W / 1280, g = 'g' + uidS(), PAL = ['t:ac', 't:ac2', 't:ac3'], col = i => PAL[i % 3], out = [];
  const cx = W / 2, cy = H / 2, wA = W * .8, hA = H * .62, x0 = (W - wA) / 2, y0 = (H - hA) / 2, f = v => Math.round(v * k), add = e => { e.g = g; out.push(e); return e; };
  const node = (shape, x, y, w, h, fill, label, st = {}, ex = {}) => add(SH(shape, x, y, w, h, fill, {html:label, st:{f:'h', fs:f(24), b:1, fc:'t:on', ha:'c', va:'m', lh:1.15, ...st}, ...ex}));
  const lab = (i, t = 'Étape') => `${t} ${i + 1}`;
  if (kind === 'process'){
    const gap = f(10), w = (wA + gap * (n - 1) * 0 - 0) / n, h = f(130), y = cy - h / 2 - f(20);
    for (let i = 0; i < n; i++){ const x = x0 + i * (wA / n); node('chev', x, y, wA / n + f(26), h, col(i), lab(i), {fs:f(n > 4 ? 20 : 24)}); add(T(x + f(14), y + h + f(18), wA / n - f(24), f(70), 'Décrivez cette étape en une phrase.', {fs:f(17), fc:'t:mut', ha:'c', lh:1.35})); }
  } else if (kind === 'cycle'){
    const R = Math.min(wA, hA) / 2 - f(64), d = f(n > 5 ? 104 : 124);
    add(SH('ellipse', cx - R, cy - R, R * 2, R * 2, '', {stroke:'t:line', sw:f(4), sd:'dash'}));
    for (let i = 0; i < n; i++){ const a = (i * 360 / n - 90) * Math.PI / 180, m = ((i + .5) * 360 / n - 90) * Math.PI / 180;
      node('ellipse', cx + R * Math.cos(a) - d / 2, cy + R * Math.sin(a) - d / 2, d, d, col(i), lab(i), {fs:f(20)});
      add(SH('tri', cx + R * Math.cos(m) - f(13), cy + R * Math.sin(m) - f(13), f(26), f(26), 't:mut', {rot:Math.round((i + .5) * 360 / n - 90 + 180) % 360})); }
    add(T(cx - f(120), cy - f(24), f(240), f(48), 'Cycle', {f:'h', fs:f(34), b:1, ha:'c'}));
  } else if (kind === 'pyramid' || kind === 'funnel'){
    const Wp = Math.min(wA, hA * 1.35), lh = hA / n, gap = f(6);
    for (let i = 0; i < n; i++){
      const fn = kind === 'funnel', bw = fn ? Wp * (n - i) / n : Wp * (i + 1) / n, shape = fn ? (i === n - 1 ? 'itri' : 'fun' + Math.min(8, n - i - 1)) : (i === 0 ? 'tri' : 'pyr' + Math.min(8, i));
      const last = fn && i === n - 1;
      node(last ? 'round' : shape, cx - (last ? Wp * 1.3 / n : bw) / 2, y0 + i * lh + gap / 2, last ? Wp * 1.3 / n : bw, lh - gap, col(i), lab(i, 'Niveau'), {fs:f(last ? 17 : 22), va:kind === 'pyramid' && i === 0 ? 'b' : 'm'}, last ? {r:f(16)} : {});
    }
  } else if (kind === 'org'){
    const bw = f(250), bh = f(78), cw = Math.min(f(250), (wA - f(24) * (n - 1)) / n), ty = y0 + f(10), cyy = y0 + hA - bh - f(10), bar = f(3);
    node('round', cx - bw / 2, ty, bw, bh, 't:ac', 'Direction', {fs:f(26)}, {r:f(14)});
    const xs = Array.from({length:n}, (_, i) => cx - (n * cw + (n - 1) * f(24)) / 2 + i * (cw + f(24)) + cw / 2), my = (ty + bh + cyy) / 2;
    add(SH('rect', cx - bar / 2, ty + bh, bar, my - ty - bh, 't:line')); add(SH('rect', xs[0] - bar / 2, my - bar / 2, xs[n - 1] - xs[0] + bar, bar, 't:line'));
    xs.forEach((x, i) => { add(SH('rect', x - bar / 2, my, bar, cyy - my, 't:line')); node('round', x - cw / 2, cyy, cw, bh, 't:soft', 'Équipe ' + (i + 1), {fs:f(22), fc:'t:ink'}, {r:f(14), stroke:col(i + 1), sw:f(3)}); });
  } else if (kind === 'venn'){
    const d = Math.min(hA * .72, wA / (n === 2 ? 1.7 : 2)), pos = n === 2 ? [[cx - d * .32, cy], [cx + d * .32, cy]] : [[cx - d * .3, cy - d * .18], [cx + d * .3, cy - d * .18], [cx, cy + d * .32]];
    pos.slice(0, n).forEach(([x, y], i) => { add(SH('ellipse', x - d / 2, y - d / 2, d, d, col(i), {op:.55})); });
    pos.slice(0, n).forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; add(T(x + dx / l * d * .22 - f(80), y + dy / l * d * .22 - f(18), f(160), f(36), 'Idée ' + (i + 1), {f:'h', fs:f(26), b:1, ha:'c', fc:'t:ink'})); });
  } else if (kind === 'matrix'){
    const gw = f(16), cw = (Math.min(wA, hA * 1.8) - gw) / 2, ch = (hA - gw) / 2, mx = cx - cw - gw / 2;
    for (let i = 0; i < 4; i++){ const x = mx + (i % 2) * (cw + gw), y = y0 + Math.floor(i / 2) * (ch + gw);
      add(SH('round', x, y, cw, ch, 't:soft', {r:f(18), stroke:'t:line', sw:1})); add(SH('rect', x + f(24), y + f(24), f(48), f(6), col(i)));
      add(T(x + f(24), y + f(42), cw - f(48), f(38), 'Quadrant ' + (i + 1), {f:'h', fs:f(26), b:1})); add(T(x + f(24), y + f(86), cw - f(48), ch - f(100), 'Un court texte explicatif.', {fs:f(18), fc:'t:mut', lh:1.4})); }
  } else if (kind === 'list'){
    const rh = Math.min(f(92), hA / n - f(12)), gap = (hA - rh * n) / Math.max(1, n - 1);
    for (let i = 0; i < n; i++){ const y = y0 + i * (rh + gap);
      add(SH('round', x0, y, wA, rh, 't:soft', {r:f(16), stroke:'t:line', sw:1})); node('ellipse', x0 + f(18), y + (rh - rh * .66) / 2, rh * .66, rh * .66, col(i), String(i + 1), {fs:f(26)});
      add(T(x0 + rh + f(20), y, wA - rh - f(40), rh, `Point ${i + 1} : une idée en une ligne`, {f:'h', fs:f(26), b:1, va:'m'})); }
  } else if (kind === 'target'){
    const R = Math.min(hA / 2, wA / 4);
    for (let i = 0; i < n; i++){ const r = R * (n - i) / n; add(SH('ellipse', cx - r, cy - r, r * 2, r * 2, col(i), {op:i === n - 1 ? 1 : .25 + .1 * i})); }
    add(T(cx - f(70), cy - f(18), f(140), f(36), 'Objectif', {f:'h', fs:f(22), b:1, ha:'c', fc:'t:on'}));
    for (let i = 0; i < n; i++){ const r = R * (n - i - .5) / n, y = cy - r * .72; add(T(cx + R + f(30), y - f(14), f(300), f(30), `Niveau ${n - i}`, {fs:f(20), b:1})); add(SH('rect', cx + r * .5, y, R + f(26) - r * .5, 2, 't:line')); }
  } else if (kind === 'hub'){
    const R = Math.min(hA / 2, wA / 3) - f(40), D = f(150), d = f(n > 6 ? 84 : 104);
    for (let i = 0; i < n; i++){ const a = (i * 360 / n - 90) * Math.PI / 180, L = R - D / 2 - d / 2 + f(8), mx = cx + (D / 2 + L / 2 - f(4)) * Math.cos(a), my = cy + (D / 2 + L / 2 - f(4)) * Math.sin(a);
      add(LN(mx - L / 2, my, L, 't:line', f(4), {rot:Math.round(i * 360 / n - 90)})); node('ellipse', cx + R * Math.cos(a) - d / 2, cy + R * Math.sin(a) - d / 2, d, d, col(i + 1), 'Idée ' + (i + 1), {fs:f(18)}); }
    node('ellipse', cx - D / 2, cy - D / 2, D, D, 't:ac', 'Sujet', {fs:f(30)});
  } else if (kind === 'steps'){
    const sw = wA / n;
    for (let i = 0; i < n; i++){ const h = hA * (.35 + .65 * (i + 1) / n); node('rect', x0 + i * sw + f(4), y0 + hA - h, sw - f(8), h, col(i), lab(i), {fs:f(24), va:'t'}, {r:0}); }
  } else if (kind === 'compare'){
    const cw = (wA - f(100)) / 2, ch = hA * .9, y = cy - ch / 2;
    [['Avant', 't:soft', 't:ink'], ['Après', 't:ac', 't:on']].forEach(([t, fill, ink], i) => { const x = x0 + i * (cw + f(100));
      add(SH('round', x, y, cw, ch, fill, {r:f(22), stroke:i ? undefined : 't:line', sw:i ? 0 : 1})); add(T(x + f(32), y + f(28), cw - f(64), f(44), t, {f:'h', fs:f(34), b:1, fc:ink})); add(T(x + f(32), y + f(94), cw - f(64), ch - f(120), `• Premier point\n• Deuxième point\n• Troisième point`, {fs:f(24), fc:ink, lh:1.6})); });
    add(SH('arrow', cx - f(38), cy - f(30), f(76), f(60), 't:ac2'));
  }
  return out;
}
let SMART_N = null;   // nombre d'éléments choisi dans le panneau (null : celui du schéma)
function addSmart(k){ const d = SMARTS.find(s => s[0] === k); addEls(smartEls(k, clamp(SMART_N ?? d[2], d[3][0], d[3][1])), d[1]); }
function smartMini(k){
  const c = 'currentColor', p = {process:'<path d="M2 10h9l4 6-4 6H2zM13 10h9l4 6-4 6h-9zM24 10h6v12h-6z" fill="currentColor"/>', cycle:'<circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><circle cx="16" cy="5" r="4" fill="currentColor"/><circle cx="26" cy="21" r="4" fill="currentColor"/><circle cx="6" cy="21" r="4" fill="currentColor"/>',
    pyramid:'<path d="M16 3l4 8H12zM11 13h10l3 7H8zM7 22h18l3 7H4z" fill="currentColor"/>', funnel:'<path d="M3 4h26l-2 7H5zM6 13h20l-3 7H9zM10 22h12l-2 7h-8z" fill="currentColor"/>', org:'<rect x="11" y="3" width="10" height="7" rx="2" fill="currentColor"/><path d="M16 10v6M6 16h20M6 16v4M16 16v4M26 16v4" stroke="currentColor" stroke-width="2" fill="none"/><rect x="2" y="20" width="9" height="7" rx="2" fill="currentColor"/><rect x="11.5" y="20" width="9" height="7" rx="2" fill="currentColor"/><rect x="21" y="20" width="9" height="7" rx="2" fill="currentColor"/>',
    venn:'<circle cx="12" cy="14" r="8" fill="currentColor" opacity=".55"/><circle cx="21" cy="14" r="8" fill="currentColor" opacity=".55"/><circle cx="16.5" cy="21" r="8" fill="currentColor" opacity=".55"/>', matrix:'<rect x="3" y="3" width="12" height="12" rx="3" fill="currentColor"/><rect x="17" y="3" width="12" height="12" rx="3" fill="currentColor" opacity=".6"/><rect x="3" y="17" width="12" height="12" rx="3" fill="currentColor" opacity=".6"/><rect x="17" y="17" width="12" height="12" rx="3" fill="currentColor"/>',
    list:'<circle cx="6" cy="7" r="3" fill="currentColor"/><rect x="12" y="4" width="17" height="6" rx="3" fill="currentColor" opacity=".5"/><circle cx="6" cy="16" r="3" fill="currentColor"/><rect x="12" y="13" width="17" height="6" rx="3" fill="currentColor" opacity=".5"/><circle cx="6" cy="25" r="3" fill="currentColor"/><rect x="12" y="22" width="17" height="6" rx="3" fill="currentColor" opacity=".5"/>',
    target:'<circle cx="16" cy="16" r="13" fill="currentColor" opacity=".25"/><circle cx="16" cy="16" r="9" fill="currentColor" opacity=".45"/><circle cx="16" cy="16" r="5" fill="currentColor"/>', hub:'<circle cx="16" cy="16" r="5" fill="currentColor"/><path d="M16 11V5M20.5 13.5 25 9M21 16h6M20.5 18.5 25 23M16 21v6M11.5 18.5 7 23M11 16H5M11.5 13.5 7 9" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="4" r="2.5" fill="currentColor"/><circle cx="27" cy="16" r="2.5" fill="currentColor"/><circle cx="16" cy="28" r="2.5" fill="currentColor"/><circle cx="5" cy="16" r="2.5" fill="currentColor"/>',
    steps:'<rect x="3" y="20" width="7" height="9" fill="currentColor"/><rect x="12" y="13" width="7" height="16" fill="currentColor" opacity=".7"/><rect x="21" y="5" width="7" height="24" fill="currentColor" opacity=".5"/>', compare:'<rect x="2" y="5" width="12" height="22" rx="3" fill="currentColor" opacity=".4"/><rect x="18" y="5" width="12" height="22" rx="3" fill="currentColor"/>'}[k];
  return `<svg viewBox="0 0 32 32">${p || ''}</svg>`;
}
