/* ---------- Rendu d'une diapositive en HTML (édition, vignettes, présentation, impression, aperçus) ---------- */
const HA = {l:'left', c:'center', r:'right', j:'justify'}, VA = {t:'top', m:'middle', b:'bottom'};
const IMG_FILTERS = {none:['Original', ''], vivid:['Éclatant', 'saturate(1.45) contrast(1.06)'], warm:['Chaud', 'sepia(.22) saturate(1.25) brightness(1.03)'], cool:['Froid', 'hue-rotate(-10deg) saturate(.92) brightness(1.04)'],
  bright:['Lumineux', 'brightness(1.13) contrast(1.04)'], dark:['Sombre', 'brightness(.72)'], gray:['Noir et blanc', 'grayscale(1) contrast(1.06)'], sepia:['Sépia', 'sepia(.75)'], blur:['Flou', 'blur(5px)']};
const MASKS = {none:'Rectangle', round:'Arrondi', circle:'Cercle', arch:'Arche', hex:'Hexagone', blob:'Galet', diamond:'Losange'};
function maskCss(e){
  const m = e.mask || 'none';
  if (m === 'circle') return 'border-radius:50%;';
  if (m === 'round') return `border-radius:${Math.round(Math.min(e.w, e.h) * .08)}px;`;
  if (m === 'arch') return `border-radius:${e.w / 2}px ${e.w / 2}px 0 0 / ${Math.min(e.w / 2, e.h)}px ${Math.min(e.w / 2, e.h)}px 0 0;`;
  if (m === 'hex') return 'clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);';
  if (m === 'diamond') return 'clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);';
  if (m === 'blob') return 'border-radius:63% 37% 54% 46% / 55% 48% 52% 45%;';
  return e.r ? `border-radius:${e.r}px;` : '';
}
function txCss(st = {}){
  let c = `font-family:${cssFont(st.f)};font-size:${st.fs || 24}px;color:${cssCol(st.fc || 't:ink')};line-height:${st.lh || 1.3};text-align:${HA[st.ha] || 'left'};vertical-align:${VA[st.va] || 'top'};`;
  c += `font-weight:${st.b ? (st.f === 'h' ? 'var(--hw)' : '700') : (st.f === 'h' ? '500' : '400')};`;
  if (st.i) c += 'font-style:italic;'; if (st.u) c += 'text-decoration:underline;'; if (st.s) c += 'text-decoration:line-through;';
  if (st.ls) c += `letter-spacing:${st.ls}em;`; if (st.up) c += 'text-transform:uppercase;';
  if (st.sh) c += `text-shadow:0 2px 14px rgb(0 0 0 / .35);`;
  if (st.hl) c += `--hl:${cssCol(st.hl)};`;
  return c;
}
function boxCss(e){
  let c = `left:${Math.round(e.x)}px;top:${Math.round(e.y)}px;width:${Math.round(e.w)}px;height:${Math.round(e.h)}px;`;
  if (e.rot) c += `transform:rotate(${+e.rot}deg);`;
  if (e.op != null && e.op < 1) c += `opacity:${+e.op};`;
  if (e.shadow) c += `filter:drop-shadow(0 ${Math.round(e.shadow * .5)}px ${e.shadow}px rgb(10 8 30 / .28));`;
  return c;
}
const fillCss = e => !e.fill ? 'transparent' : e.g2 ? `linear-gradient(${e.ga ?? 135}deg,${cssCol(e.fill)},${cssCol(e.g2)})` : cssCol(e.fill);
let GRAD_N = 0;
function shapeHTML(e, sv){
  const k = e.k || 'rect', sw = +e.sw || 0, stroke = e.stroke && sw ? cssCol(e.stroke) : '';
  let g = '';
  if (['rect', 'round', 'ellipse', 'pill'].includes(k)){
    const r = k === 'ellipse' ? '50%' : k === 'pill' ? Math.min(e.w, e.h) / 2 + 'px' : k === 'round' ? (e.r ?? 18) + 'px' : (e.r || 0) + 'px';
    g = `<div class="shp" style="background:${fillCss(e)};border-radius:${r};${stroke ? `box-shadow:inset 0 0 0 ${sw}px ${stroke};` : ''}"></div>`;
  } else {
    const d = SHAPES[k]?.[1] || SHAPES.tri[1]; let fill = e.fill ? realCol(e.fill, sv) : 'none', defs = '';
    if (e.fill && e.g2){ const id = 'sg' + (++GRAD_N).toString(36); const a = (e.ga ?? 135) * Math.PI / 180; defs = `<defs><linearGradient id="${id}" x1="${.5 - Math.cos(a - Math.PI / 2) / 2}" y1="${.5 - Math.sin(a - Math.PI / 2) / 2}" x2="${.5 + Math.cos(a - Math.PI / 2) / 2}" y2="${.5 + Math.sin(a - Math.PI / 2) / 2}"><stop offset="0" stop-color="${realCol(e.fill, sv)}"/><stop offset="1" stop-color="${realCol(e.g2, sv)}"/></linearGradient></defs>`; fill = `url(#${id})`; }
    g = `<svg class="shp" viewBox="0 0 100 100" preserveAspectRatio="none">${defs}<path d="${d}" fill="${fill}"${stroke ? ` stroke="${realCol(e.stroke, sv)}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round"` : ''}/></svg>`;
  }
  if (e.html != null) g += `<div class="txw"><div class="tx in" style="${txCss({ha:'c', va:'m', fc:'t:on', fs:22, ...(e.st || {})})}">${e.html}</div></div>`;
  return g;
}
function lineHTML(e, sv){
  const w = Math.max(1, e.w), h = Math.max(1, e.h), lw = +e.lw || 3, col = realCol(e.stroke || 't:ink', sv), y = h / 2, hs = lw * 3.2;
  const a1 = e.a1 || '', a2 = e.a2 || (e.k === 'arrowline' ? 'arrow' : '');
  const x1 = a1 === 'arrow' ? hs * .8 : 0, x2 = a2 === 'arrow' ? w - hs * .8 : w;
  let o = `<svg class="shp" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="overflow:visible"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${col}" stroke-width="${lw}" stroke-linecap="${e.dash ? 'butt' : 'round'}"${e.dash ? ` stroke-dasharray="${e.dash === 'dot' ? `${lw} ${lw * 1.8}` : `${lw * 3.5} ${lw * 2.2}`}"` : ''}/>`;
  if (a2 === 'arrow') o += `<path d="M${w - hs * 1.6} ${y - hs}L${w} ${y}L${w - hs * 1.6} ${y + hs}Z" fill="${col}"/>`;
  if (a1 === 'arrow') o += `<path d="M${hs * 1.6} ${y - hs}L0 ${y}L${hs * 1.6} ${y + hs}Z" fill="${col}"/>`;
  if (a2 === 'dot') o += `<circle cx="${w - lw * 1.6}" cy="${y}" r="${lw * 1.8}" fill="${col}"/>`;
  if (a1 === 'dot') o += `<circle cx="${lw * 1.6}" cy="${y}" r="${lw * 1.8}" fill="${col}"/>`;
  return o + '</svg>';
}
function tableHTML(e, sv){
  const rows = e.rows || [[]], fs = e.fs || 18, cw = e.cw && e.cw.length === (rows[0] || []).length ? e.cw : null;
  const hc = cssCol(e.hc || 't:ac'), hf = e.hc ? cssCol(onColor(realCol(e.hc, sv))) : 'var(--on)';
  return `<table class="stbl${e.band !== false ? ' band' : ''}${e.head !== false ? ' head' : ''}" style="font-size:${fs}px;--thb:${hc};--thf:${hf};font-family:${cssFont(e.f || 'b')}">`
    + (cw ? `<colgroup>${cw.map(x => `<col style="width:${(x * 100).toFixed(2)}%">`).join('')}</colgroup>` : '')
    + rows.map((r, i) => `<tr>${r.map((c, j) => { const tag = i === 0 && e.head !== false ? 'th' : 'td'; const al = e.al?.[j]; return `<${tag} data-r="${i}" data-c="${j}"${al ? ` style="text-align:${HA[al]}"` : ''}>${c}</${tag}>`; }).join('')}</tr>`).join('') + '</table>';
}
/* graphiques : SVG aux couleurs du thème */
const fmtN = (v, u = '') => { if (v == null || isNaN(v)) return ''; const a = Math.abs(v); const s = a >= 1e6 ? (v / 1e6).toLocaleString('fr-FR', {maximumFractionDigits:1}) + ' M' : a >= 1e4 ? (v / 1e3).toLocaleString('fr-FR', {maximumFractionDigits:a >= 1e5 ? 0 : 1}) + ' k' : v.toLocaleString('fr-FR', {maximumFractionDigits:2}); return u ? (u === '%' ? s + ' %' : s + ' ' + u) : s; };
function niceTicks(min, max, n = 5){
  if (min === max){ max = min + 1; min = Math.min(0, min); }
  const span = max - min, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), f = step0 / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toPrecision(12)); return out;
}
function chartPal(e, sv){ return e.colors?.length ? e.colors.map(c => realCol(c, sv)) : [sv.ac, sv.ac2, sv.ac3, mix(sv.ac, sv.bg, .45), mix(sv.ac2, sv.bg, .45), mix(sv.ink, sv.bg, .45), mix(sv.ac3, sv.bg, .45)]; }
function chartSVG(e, sv){
  const W = Math.max(60, e.w), H = Math.max(40, e.h), fs = clamp(Math.round(Math.min(W, H * 1.6) / 34), 11, 26), pal = chartPal(e, sv), ink = sv.ink, mut = sv.mut, grid = sv.line;
  const S = (e.series || []).map(s => ({n:s.n, v:(s.v || []).map(x => x == null || x === '' || isNaN(+x) ? null : +x)})).filter(s => s.v.some(x => x != null));
  const cats = (e.labels || []).map(String), u = e.unit || '';
  let o = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${escH(fontStack(sv.fb).replace(/"/g, "'"))}" font-size="${fs}">`;
  if (!S.length) return o + `<rect width="${W}" height="${H}" rx="12" fill="${sv.soft}"/><text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="${mut}">Double-cliquez pour saisir les données</text></svg>`;
  const legend = e.legend !== false && (S.length > 1 || e.ct === 'pie' || e.ct === 'donut'), legH = legend ? fs * 2.4 : 0;
  const legendSVG = names => { const items = names.slice(0, 10), widths = items.map(n => n.length * fs * .56 + fs * 2.4), tot = widths.reduce((a, b) => a + b, 0); let x = Math.max(0, (W - tot) / 2), out = '';
    items.forEach((n, i) => { out += `<rect x="${x}" y="${H - fs * 1.35}" width="${fs * .9}" height="${fs * .9}" rx="${fs * .2}" fill="${pal[i % pal.length]}"/><text x="${x + fs * 1.3}" y="${H - fs * .5}" fill="${mut}">${escH(n)}</text>`; x += widths[i]; }); return out; };
  if (e.ct === 'pie' || e.ct === 'donut'){
    const s = S[0], vals = s.v.map(v => Math.max(0, v || 0)), tot = vals.reduce((a, b) => a + b, 0) || 1;
    const cy = (H - legH) / 2, R = Math.max(10, Math.min(W / 2 - 10, (H - legH) / 2 - 6)), cx = W / 2, r0 = e.ct === 'donut' ? R * .6 : 0; let a = -Math.PI / 2;
    const p = (ang, rr) => `${(cx + Math.cos(ang) * rr).toFixed(2)},${(cy + Math.sin(ang) * rr).toFixed(2)}`;
    vals.forEach((v, i) => { const a2 = a + v / tot * Math.PI * 2, large = a2 - a > Math.PI ? 1 : 0, c = pal[i % pal.length];
      if (v / tot > .9999) o += r0 ? `<circle cx="${cx}" cy="${cy}" r="${(R + r0) / 2}" fill="none" stroke="${c}" stroke-width="${R - r0}"/>` : `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${c}"/>`;
      else if (v > 0) o += `<path d="M${p(a, R)}A${R},${R} 0 ${large} 1 ${p(a2, R)}${r0 ? `L${p(a2, r0)}A${r0},${r0} 0 ${large} 0 ${p(a, r0)}` : `L${cx},${cy}`}Z" fill="${c}" stroke="${sv.bg}" stroke-width="${Math.max(1.5, fs * .14)}"/>`;
      const mid = (a + a2) / 2, pc = v / tot; if (e.vals !== false && pc > .045){ const lr = r0 ? (R + r0) / 2 : R * .64; o += `<text x="${cx + Math.cos(mid) * lr}" y="${cy + Math.sin(mid) * lr + fs * .35}" text-anchor="middle" fill="${onColor(c)}" font-weight="700">${Math.round(pc * 100)} %</text>`; }
      a = a2; });
    if (r0) o += `<text x="${cx}" y="${cy + fs * .5}" text-anchor="middle" font-size="${fs * 1.6}" font-weight="800" fill="${ink}" font-family="${escH(fontStack(sv.fh).replace(/"/g, "'"))}">${escH(fmtN(tot, u))}</text>`;
    if (legend) o += legendSVG(cats); return o + '</svg>';
  }
  const horiz = e.ct === 'bar', stacked = e.ct === 'stack', n = Math.max(1, ...S.map(s => s.v.length), cats.length);
  const all = []; if (stacked){ for (let i = 0; i < n; i++){ let pp = 0, nn = 0; S.forEach(s => { const v = s.v[i] || 0; v >= 0 ? pp += v : nn += v; }); all.push(pp, nn); } } else S.forEach(s => s.v.forEach(v => v != null && all.push(v)));
  let mn = Math.min(0, ...all), mx = Math.max(0, ...all);
  if ((e.ct === 'line') && all.length && Math.min(...all) > 0 && Math.min(...all) > (Math.max(...all) - Math.min(...all)) * 1.5) mn = Math.min(...all) * .9;
  const ticks = niceTicks(mn, mx, Math.max(3, Math.round((horiz ? W : H) / (fs * 5)))), lo = ticks[0], hi = ticks[ticks.length - 1];
  const labW = Math.max(...ticks.map(v => fmtN(v, u).length)) * fs * .58 + fs, catW = horiz ? Math.min(W * .32, Math.max(...cats.map(c => c.length), 2) * fs * .56 + fs) : 0;
  const Lx = horiz ? catW + fs * .5 : labW + fs * .4, Rr = fs, T = fs, B = H - legH - fs * (horiz ? 1.8 : 2.2), pw = W - Lx - Rr, ph = B - T;
  if (pw < 20 || ph < 20) return o + '</svg>';
  const sc = v => horiz ? Lx + (v - lo) / (hi - lo) * pw : B - (v - lo) / (hi - lo) * ph;
  for (const v of ticks){ const q = sc(v);
    o += horiz ? `<line x1="${q}" y1="${T}" x2="${q}" y2="${B}" stroke="${v === 0 ? mut : grid}" stroke-width="${v === 0 ? 1.4 : 1}"/><text x="${q}" y="${B + fs * 1.3}" text-anchor="middle" fill="${mut}">${escH(fmtN(v, u))}</text>`
      : `<line x1="${Lx}" y1="${q}" x2="${Lx + pw}" y2="${q}" stroke="${v === 0 ? mut : grid}" stroke-width="${v === 0 ? 1.4 : 1}"/><text x="${Lx - fs * .5}" y="${q + fs * .35}" text-anchor="end" fill="${mut}">${escH(fmtN(v, u))}</text>`; }
  const band = (horiz ? ph : pw) / n, every = Math.ceil(n / Math.max(1, Math.floor((horiz ? ph / (fs * 1.5) : pw / (fs * 4.5)))));
  cats.slice(0, n).forEach((c, i) => { if (i % every) return; const m = (horiz ? T : Lx) + band * (i + .5); const t = c.length > 18 ? c.slice(0, 17) + '…' : c;
    o += horiz ? `<text x="${Lx - fs * .5}" y="${m + fs * .35}" text-anchor="end" fill="${ink}">${escH(t)}</text>` : `<text x="${m}" y="${B + fs * 1.45}" text-anchor="middle" fill="${ink}">${escH(t)}</text>`; });
  if (e.ct === 'line' || e.ct === 'area'){
    S.forEach((s, j) => { const c = pal[j % pal.length]; const pts = s.v.map((v, i) => v == null ? null : [Lx + band * (i + .5), sc(v)]).filter(Boolean); if (!pts.length) return;
      const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
      if (e.ct === 'area') o += `<path d="${d}L${pts[pts.length - 1][0]} ${sc(Math.max(lo, 0))}L${pts[0][0]} ${sc(Math.max(lo, 0))}Z" fill="${c}" opacity="${S.length > 1 ? .28 : .22}"/>`;
      o += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${Math.max(2.5, fs * .22)}" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach(q => o += `<circle cx="${q[0]}" cy="${q[1]}" r="${Math.max(3, fs * .28)}" fill="${sv.bg}" stroke="${c}" stroke-width="${Math.max(2, fs * .16)}"/>`);
      if (e.vals !== false && S.length === 1) s.v.forEach((v, i) => v != null && (o += `<text x="${Lx + band * (i + .5)}" y="${sc(v) - fs * .8}" text-anchor="middle" fill="${ink}" font-weight="700">${escH(fmtN(v, u))}</text>`)); });
  } else {
    const groups = stacked ? 1 : S.length, gw = band * .72, bw = gw / groups, rad = Math.min(bw * .18, fs * .5);
    for (let i = 0; i < n; i++){ let pos = 0, neg = 0;
      S.forEach((s, j) => { const v = s.v[i]; if (v == null) return; const c = pal[(S.length === 1 && e.vary ? i : j) % pal.length];
        let a0, a1; if (stacked){ if (v >= 0){ a0 = pos; pos += v; a1 = pos; } else { a0 = neg; neg += v; a1 = neg; } } else { a0 = 0; a1 = v; }
        const p0 = sc(Math.max(lo, Math.min(hi, a0))), p1 = sc(a1), off = (horiz ? T : Lx) + band * i + (band - gw) / 2 + (stacked ? 0 : j * bw);
        const rx = stacked ? 0 : rad;
        o += horiz ? `<rect x="${Math.min(p0, p1)}" y="${off + bw * .06}" width="${Math.max(.5, Math.abs(p1 - p0))}" height="${bw * .88}" rx="${rx}" fill="${c}"/>` : `<rect x="${off + bw * .06}" y="${Math.min(p0, p1)}" width="${bw * .88}" height="${Math.max(.5, Math.abs(p1 - p0))}" rx="${rx}" fill="${c}"/>`;
        if (e.vals !== false && !stacked && (horiz ? ph / n : bw) > fs * 1.6) o += horiz ? `<text x="${p1 + fs * .4}" y="${off + bw / 2 + fs * .35}" fill="${ink}" font-weight="700">${escH(fmtN(v, u))}</text>` : `<text x="${off + bw / 2}" y="${p1 - fs * .45}" text-anchor="middle" fill="${ink}" font-weight="700" font-size="${bw < fs * 3 ? fs * .8 : fs}">${escH(fmtN(v, u))}</text>`;
      }); }
  }
  if (legend) o += legendSVG(S.map(s => s.n || ''));
  return o + '</svg>';
}
function elInner(e, sv, o){
  switch (e.t){
    case 'text': return `<div class="tx" style="${txCss(e.st)}${e.st?.bg ? `background:${cssCol(e.st.bg)};padding:${e.st.pad ?? 16}px ${Math.round((e.st.pad ?? 16) * 1.4)}px;border-radius:${e.st.r ?? 10}px;` : ''}">${e.html || ''}</div>`;
    case 'shape': return shapeHTML(e, sv);
    case 'line': return lineHTML(e, sv);
    case 'icon': return iconSVG(e.n, realCol(e.fc || 't:ac', sv), e.sw || 1.8);
    case 'table': return tableHTML(e, sv);
    case 'chart': return chartSVG(e, sv);
    case 'img': {
      const src = o.preview ? '' : mediaSrc(e.src), f = IMG_FILTERS[e.filter]?.[1] || '';
      if (!src) return o.present || o.print ? `<div class="imgw" style="${maskCss(e)}background:${cssCol('t:soft')}"></div>` : `<div class="imgw ph-img" style="${maskCss(e)}">${o.preview ? '' : iconSVG('camera')}${o.preview || e.w < 160 ? '' : `<span>${escH(e.hint ? 'Image : ' + e.hint : 'Double-cliquez pour ajouter une image')}</span>`}</div>`;
      return `<div class="imgw" style="${maskCss(e)}${e.stroke && e.sw ? `box-shadow:inset 0 0 0 ${e.sw}px ${cssCol(e.stroke)};` : ''}"><img src="${escH(src)}" alt="" draggable="false" style="object-fit:${e.fit === 'contain' ? 'contain' : 'cover'};object-position:${e.px ?? 50}% ${e.py ?? 50}%;${f ? `filter:${f};` : ''}${e.flip ? 'transform:scaleX(-1);' : ''}"></div>`;
    }
  }
  return '';
}
function slideBg(s, sv, o = {}){
  const b = s.bg || {};
  if (b.g) return `linear-gradient(${b.a ?? 135}deg,${cssCol(b.g[0])},${cssCol(b.g[1])})`;
  if (b.c) return cssCol(b.c);
  return sv.bg;
}
/* opts : {edit, preview (sans images, pour les vignettes enregistrées), present, print, theme, size} */
function renderSlide(s, o = {}){
  const th = dtheme(o.theme || D.theme), [W, H] = SIZES[o.size || D.size] || SIZES['16:9'], sv = slideVars(th, s.v || 'content');
  if (s.bg?.c && !s.bg.c.startsWith?.('t:')){ const dk = luma(s.bg.c) < .45; if (dk !== sv.dark && (s.bg.ink !== false)){ sv.ink = dk ? '#FFFFFF' : th.ink === '#FFFFFF' ? '#16122B' : th.ink; sv.mut = mix(sv.ink, s.bg.c, .35); sv.line = mix(s.bg.c, sv.ink, .16); sv.soft = mix(s.bg.c, sv.ink, .06); sv.dark = dk; } sv.bg = s.bg.c; }
  let h = `<div class="sl${sv.dark ? ' dk' : ''}" style="width:${W}px;height:${H}px;${varsCss(sv)};background:${slideBg(s, sv, o)}">`;
  const bi = s.bg?.img && !o.preview ? mediaSrc(s.bg.img) : '';
  if (bi) h += `<div class="sl-bgi" style="background-image:url('${bi.replace(/'/g, '%27')}');${s.bg.dim ? '' : ''}"></div>${s.bg.dim ? `<div class="sl-bgi" style="background:#000;opacity:${s.bg.dim}"></div>` : ''}`;
  if (!s.nodeco && !s.bg?.img) h += decorSVG(th, s.v || 'content', W, H, sv);
  for (const e of s.els){
    if (o.present && e.t === 'img' && !mediaSrc(e.src) && e.w * e.h > W * H * .15) continue;
    h += `<div class="el el-${e.t}${e.lock ? ' lk' : ''}" ${o.edit || o.present ? `data-id="${e.id}" ` : ''}style="${boxCss(e)}">${elInner(e, sv, o)}</div>`;
  }
  return h + '</div>';
}
/* aperçu enregistré avec la présentation (accueil, Communauté) : la première diapositive, sans images, assez court pour les métadonnées */
function previewOfDeck(d, max = 5800){
  const keep = D; D = d; try {
    const s = d.slides.find(x => !x.hide) || d.slides[0]; if (!s) return '';
    let h = renderSlide(s, {preview:true}); if (h.length > max) h = renderSlide({...s, nodeco:true}, {preview:true});
    if (h.length > max) h = renderSlide({...s, nodeco:true, els:s.els.filter(e => e.t === 'text' || e.t === 'shape').slice(0, 8)}, {preview:true});
    return h.length > max ? '' : h;
  } finally { D = keep; }
}
