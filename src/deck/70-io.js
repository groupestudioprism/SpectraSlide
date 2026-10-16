/* ---------- Fichiers : PDF, PowerPoint (.pptx), page web, sauvegarde .spectraslide ; import PowerPoint, images ---------- */
const LIB_PPTX = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
const LIB_ZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const libs = {};
function loadLib(url, glob){ if (window[glob]) return Promise.resolve(window[glob]); return libs[url] || (libs[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = () => window[glob] ? res(window[glob]) : rej(new Error('Bibliothèque indisponible')); s.onerror = () => { delete libs[url]; rej(new Error('Impossible de charger le module d\'export. Vérifiez votre connexion.')); }; document.head.appendChild(s); })); }
function getJSON(){
  const used = usedMedia(), media = {}; for (const k of used) if (D.media[k]) media[k] = D.media[k];
  return JSON.stringify({v:1, app:'spectraslide', title:D.title, theme:D.theme, size:D.size, slides:D.slides, media});
}
const fileBase = () => (window.SWSafeName ? window.SWSafeName(D.title) : 'presentation');
/* ---------- PDF : une diapositive par page, au format exact ---------- */
function printDeck(onlyCur){
  if (EDT) stopEdit(); const [W, H] = dims(); ensureThemeFonts();
  let pa = g$('printArea'); if (!pa){ pa = document.createElement('div'); pa.id = 'printArea'; document.body.appendChild(pa); }
  const list = onlyCur ? [CUR] : visibleSlides();
  pa.innerHTML = `<style>@page{size:${W}px ${H}px;margin:0}</style>` + list.map(i => `<div class="pr-pg" style="width:${W}px;height:${H}px">${renderSlide(D.slides[i], {print:true})}</div>`).join('');
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); pa.innerHTML = ''; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(() => { window.print(); setTimeout(() => { if (document.body.classList.contains('printing')) done(); }, 1500); }, 250));
}
/* ---------- Rendu en image (PNG) d'un SVG : décors, icônes, formes particulières ---------- */
function svgToPng(svg, w, h, scale = 2){
  return new Promise(res => { const im = new Image(), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * scale)); c.height = Math.max(1, Math.round(h * scale));
    im.onload = () => { c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/png')); }; im.onerror = () => res(null);
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); });
}
function imgCrop(e, scale = 1.5){
  return new Promise(res => { const src = mediaSrc(e.src); if (!src) return res(null); const im = new Image();
    im.onload = () => { const W = Math.round(e.w * scale), H = Math.round(e.h * scale), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const f = IMG_FILTERS[e.filter]?.[1]; if (f) x.filter = f;
      const m = e.mask || (e.r ? 'round' : 'none'), mask = m !== 'none';
      if (mask){ x.beginPath(); if (m === 'circle') x.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2); else if (m === 'hex') { x.moveTo(W * .25, 0); x.lineTo(W * .75, 0); x.lineTo(W, H / 2); x.lineTo(W * .75, H); x.lineTo(W * .25, H); x.lineTo(0, H / 2); } else if (m === 'diamond'){ x.moveTo(W / 2, 0); x.lineTo(W, H / 2); x.lineTo(W / 2, H); x.lineTo(0, H / 2); }
        else { const r = m === 'arch' ? Math.min(W / 2, H) : m === 'blob' ? Math.min(W, H) * .4 : (e.r || Math.min(e.w, e.h) * .08) * scale; x.roundRect ? x.roundRect(0, 0, W, H, m === 'arch' ? [r, r, 0, 0] : r) : x.rect(0, 0, W, H); } x.clip(); }
      const iw = im.naturalWidth, ih = im.naturalHeight, cover = e.fit !== 'contain', k = cover ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih), dw = iw * k, dh = ih * k;
      const dx = (W - dw) * (e.px ?? 50) / 100, dy = (H - dh) * (e.py ?? 50) / 100;
      if (e.flip){ x.translate(W, 0); x.scale(-1, 1); }
      x.drawImage(im, e.flip ? W - dx - dw : dx, dy, dw, dh);
      res(mask || /png/.test(src.slice(0, 20)) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .9)); };
    im.onerror = () => res(null); im.src = src; });
}
/* ---------- HTML d'un texte → morceaux de texte PowerPoint ---------- */
function htmlRuns(html, base, sv){
  const d = document.createElement('div'); d.innerHTML = html || ''; const out = []; let para = {};
  const walk = (n, st) => {
    for (const c of n.childNodes){
      if (c.nodeType === 3){ const t = c.nodeValue.replace(/\s+/g, ' '); if (t) out.push({text:st.up ? t.toUpperCase() : t, options:{...st.o, ...para}}); continue; }
      if (c.nodeType !== 1) continue; const tag = c.localName, o = {...st.o};
      if (tag === 'br'){ out.push({text:'', options:{...o, breakLine:true}}); continue; }
      if (tag === 'b' || tag === 'strong') o.bold = true; if (tag === 'i' || tag === 'em') o.italic = true; if (tag === 'u') o.underline = {style:'sng'}; if (tag === 's' || tag === 'strike') o.strike = 'sngStrike';
      const cs = c.style; if (cs?.color){ const m = cs.color.match(/\d+/g); if (m) o.color = rgbHex(+m[0], +m[1], +m[2]).slice(1).toUpperCase(); else if (/^#/.test(cs.color)) o.color = cs.color.slice(1); }
      if (cs?.fontWeight && +cs.fontWeight >= 600 || cs?.fontWeight === 'bold') o.bold = true; if (cs?.fontStyle === 'italic') o.italic = true;
      if (tag === 'li'){ const keep = para; para = {bullet:{indent:Math.round(base.fs * .9)}}; walk(c, {...st, o}); if (out.length) out[out.length - 1].options = {...out[out.length - 1].options, breakLine:true}; para = keep; continue; }
      if (tag === 'ul' || tag === 'ol'){ walk(c, {...st, o}); continue; }
      walk(c, {...st, o});
    }
  };
  walk(d, {o:{}, up:base.up});
  if (out.length && out[out.length - 1].options.breakLine) out[out.length - 1].options = {...out[out.length - 1].options, breakLine:false};
  return out.length ? out : [{text:''}];
}
/* forme en SVG autonome (export) */
function shapeSVG(e, sv){
  const k = e.k || 'rect', w = e.w, h = e.h, sw = +e.sw || 0, stroke = e.stroke && sw ? ` stroke="${realCol(e.stroke, sv)}" stroke-width="${sw}"` : '';
  let defs = '', fill = e.fill ? realCol(e.fill, sv) : 'none';
  if (e.fill && e.g2){ const a = (e.ga ?? 135) * Math.PI / 180; defs = `<defs><linearGradient id="g" x1="${.5 - Math.cos(a - Math.PI / 2) / 2}" y1="${.5 - Math.sin(a - Math.PI / 2) / 2}" x2="${.5 + Math.cos(a - Math.PI / 2) / 2}" y2="${.5 + Math.sin(a - Math.PI / 2) / 2}"><stop offset="0" stop-color="${realCol(e.fill, sv)}"/><stop offset="1" stop-color="${realCol(e.g2, sv)}"/></linearGradient></defs>`; fill = 'url(#g)'; }
  let body;
  if (k === 'ellipse') body = `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - sw / 2}" ry="${h / 2 - sw / 2}" fill="${fill}"${stroke}/>`;
  else if (['rect', 'round', 'pill'].includes(k)){ const r = k === 'pill' ? Math.min(w, h) / 2 : k === 'round' ? (e.r ?? 18) : (e.r || 0); body = `<rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" rx="${r}" fill="${fill}"${stroke}/>`; }
  else body = `<svg viewBox="0 0 100 100" width="${w}" height="${h}" preserveAspectRatio="none"><path d="${SHAPES[k]?.[1] || SHAPES.tri[1]}" fill="${fill}"${stroke ? stroke + ' vector-effect="non-scaling-stroke"' : ''}/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs}${body}</svg>`;
}
const hx = c => String(c || '#000000').replace('#', '').slice(0, 6).toUpperCase();
const pxIn = v => v / 96, pxPt = v => v * .75;
const PPT_SHAPES = {rect:'rect', round:'roundRect', ellipse:'ellipse', pill:'roundRect', tri:'triangle', rtri:'rtTriangle', diamond:'diamond', hex:'hexagon', oct:'octagon', star:'star5', star4:'star4', arrow:'rightArrow', chev:'chevron', plus:'mathPlus', heart:'heart', bubble:'wedgeRoundRectCallout', pent:'pentagon'};
async function exportPptx(){
  toast('Préparation du fichier PowerPoint…');
  const P = await loadLib(LIB_PPTX, 'PptxGenJS'); const p = new P(); const [W, H] = dims(), th = dtheme(D.theme);
  p.defineLayout({name:'SPECTRA', width:pxIn(W), height:pxIn(H)}); p.layout = 'SPECTRA'; p.title = D.title; p.company = 'Studio Prism'; p.author = 'SPECTRA Slide';
  for (const i of visibleSlides()){
    const s = D.slides[i], sl = p.addSlide(), sv = slideVars(th, s.v || 'content'); if (s.bg?.c && !String(s.bg.c).startsWith('t:')) sv.bg = s.bg.c;
    // fond : couleur simple, ou image (dégradé, décor du thème, photo)
    const deco = !s.nodeco && !s.bg?.img ? decorSVG(th, s.v || 'content', W, H, sv) : '';
    if (s.bg?.img){ const src = mediaSrc(s.bg.img); if (src) sl.background = {data:src.replace(/^data:/, '')}; if (s.bg.dim) sl.addShape(p.ShapeType.rect, {x:0, y:0, w:pxIn(W), h:pxIn(H), fill:{color:'000000', transparency:Math.round(100 - s.bg.dim * 100)}, line:{type:'none'}}); }
    else if (deco || s.bg?.g){ const bgc = s.bg?.g ? `<defs><linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${realCol(s.bg.g[0], sv)}"/><stop offset="1" stop-color="${realCol(s.bg.g[1], sv)}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>` : `<rect width="${W}" height="${H}" fill="${realCol(s.bg?.c, sv) || sv.bg}"/>`;
      const png = await svgToPng(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${bgc}${deco.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`, W, H, 1.5); if (png) sl.background = {data:png.replace(/^data:/, '')}; else sl.background = {color:hx(sv.bg)}; }
    else sl.background = {color:hx(realCol(s.bg?.c, sv) || sv.bg)};
    for (const e of s.els){
      const pos = {x:pxIn(e.x), y:pxIn(e.y), w:pxIn(e.w), h:pxIn(e.h), rotate:e.rot || 0};
      const tr = e.op != null && e.op < 1 ? Math.round((1 - e.op) * 100) : 0;
      const txtOpts = st => ({fontFace:fontOf(st.f, sv), fontSize:pxPt(st.fs || 24), color:hx(realCol(st.fc || 't:ink', sv)), bold:!!st.b, italic:!!st.i, underline:st.u ? {style:'sng'} : undefined,
        align:{l:'left', c:'center', r:'right', j:'justify'}[st.ha || 'l'], valign:{t:'top', m:'middle', b:'bottom'}[st.va || 't'], lineSpacingMultiple:st.lh || 1.3, charSpacing:st.ls ? pxPt(st.ls * st.fs) : undefined, margin:0, paraSpaceAfter:0, fit:'none'});
      try {
        if (e.t === 'text'){ const st = e.st || {}; const o = {...pos, ...txtOpts(st)}; if (st.bg){ o.fill = {color:hx(realCol(st.bg, sv))}; o.margin = pxPt(st.pad ?? 16); o.rectRadius = pxIn(st.r ?? 10); o.shape = p.ShapeType.roundRect; } if (tr) o.transparency = tr; sl.addText(htmlRuns(e.html, st, sv), o); }
        else if (e.t === 'shape'){
          const st = e.st || {}, fill = e.fill ? {color:hx(realCol(e.fill, sv)), transparency:tr} : {type:'none'}, line = e.sw && e.stroke ? {color:hx(realCol(e.stroke, sv)), width:pxPt(e.sw)} : {type:'none'};
          const prst = PPT_SHAPES[e.k];
          if (prst && !e.g2){ const o = {...pos, fill, line, shape:p.ShapeType[prst] || prst, rectRadius:e.k === 'pill' ? pxIn(Math.min(e.w, e.h) / 2) : e.k === 'round' ? pxIn(e.r ?? 18) : undefined};
            if (e.html) sl.addText(htmlRuns(e.html, st, sv), {...o, ...txtOpts({ha:'c', va:'m', fc:'t:on', fs:22, ...st}), margin:4}); else sl.addShape(o.shape, o); }
          else { const png = await svgToPng(shapeSVG(e, sv), e.w, e.h);
            if (png) sl.addImage({data:png, ...pos, transparency:tr || undefined}); if (e.html) sl.addText(htmlRuns(e.html, st, sv), {...pos, ...txtOpts({ha:'c', va:'m', fc:'t:on', fs:22, ...st})}); }
        }
        else if (e.t === 'line'){ const a2 = e.a2 || (e.k === 'arrowline' ? 'arrow' : ''); sl.addShape(p.ShapeType.line, {x:pos.x, y:pxIn(e.y + e.h / 2), w:pos.w, h:0, rotate:pos.rotate, line:{color:hx(realCol(e.stroke || 't:ink', sv)), width:pxPt(e.lw || 3), dashType:e.dash === 'dot' ? 'sysDot' : e.dash ? 'dash' : 'solid', beginArrowType:e.a1 === 'arrow' ? 'triangle' : e.a1 === 'dot' ? 'oval' : undefined, endArrowType:a2 === 'arrow' ? 'triangle' : a2 === 'dot' ? 'oval' : undefined}}); }
        else if (e.t === 'img'){ const data = await imgCrop(e); if (data) sl.addImage({data, ...pos, transparency:tr || undefined}); }
        else if (e.t === 'icon'){ const png = await svgToPng(iconSVG(e.n, realCol(e.fc || 't:ac', sv), e.sw || 1.8).replace('<svg ', `<svg width="${e.w}" height="${e.h}" `), e.w, e.h, 3); if (png) sl.addImage({data:png, ...pos}); }
        else if (e.t === 'table'){
          const hc = realCol(e.hc || 't:ac', sv), rows = e.rows.map((r, i) => r.map(c => { const head = i === 0 && e.head !== false; const t = c.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            return {text:t, options:{bold:head, color:hx(head ? onColor(hc) : sv.ink), fill:head ? {color:hx(hc)} : e.band !== false && i % 2 === 0 && i ? {color:hx(sv.soft)} : undefined}}; }));
          sl.addTable(rows, {x:pos.x, y:pos.y, w:pos.w, fontFace:fontOf(e.f || 'b', sv), fontSize:pxPt(e.fs || 18), color:hx(sv.ink), border:{type:'solid', color:hx(sv.line), pt:.75}, margin:pxPt((e.fs || 18) * .5), colW:e.cw ? e.cw.map(f => pos.w * f) : undefined, autoPage:false});
        }
        else if (e.t === 'chart'){
          const T = {col:'bar', bar:'bar', stack:'bar', line:'line', area:'area', pie:'pie', donut:'doughnut'}[e.ct] || 'bar', pal = chartPal(e, sv).map(hx);
          const data = (['pie', 'donut'].includes(e.ct) ? e.series.slice(0, 1) : e.series).map(x => ({name:x.n || ' ', labels:e.labels, values:x.v.map(v => v ?? 0)}));
          sl.addChart(p.ChartType[T] || T, data, {...pos, barDir:e.ct === 'bar' ? 'bar' : 'col', barGrouping:e.ct === 'stack' ? 'stacked' : 'clustered', chartColors:['pie', 'donut'].includes(e.ct) || e.vary ? pal : pal.slice(0, data.length),
            showLegend:e.legend !== false && (data.length > 1 || ['pie', 'donut'].includes(e.ct)), legendPos:'b', showValue:e.vals !== false && !['pie', 'donut'].includes(e.ct), showPercent:e.vals !== false && ['pie', 'donut'].includes(e.ct),
            catAxisLabelColor:hx(sv.ink), valAxisLabelColor:hx(sv.mut), dataLabelColor:hx(sv.ink), legendColor:hx(sv.mut), valGridLine:{color:hx(sv.line), size:.75}, catGridLine:{style:'none'},
            fontFace:sv.fb, catAxisLabelFontFace:sv.fb, valAxisLabelFontFace:sv.fb, legendFontFace:sv.fb, dataLabelFontFace:sv.fb, catAxisLabelFontSize:12, valAxisLabelFontSize:11, dataLabelFontSize:11, legendFontSize:12, holeSize:60, lineSize:3, lineDataSymbolSize:8});
        }
      } catch(x){ console.warn('[SPECTRA Slide] export pptx', e, x); }
    }
    if (s.notes) sl.addNotes(s.notes);
  }
  const blob = await p.write({outputType:'blob'});
  await window.SWDownload(fileBase() + '.pptx', blob); toast('PowerPoint (.pptx) prêt');
}
/* ---------- Page web autonome : la présentation se lit dans n'importe quel navigateur ---------- */
async function exportHTML(){
  const [W, H] = dims(), th = dtheme(D.theme), list = visibleSlides();
  const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n').match(/\/\* @slide-css \*\/[^]*?\/\* @end-slide-css \*\//)?.[0] || '';
  const fonts = [th.fh, th.fb].filter(f => FONT_Q[f]).map(f => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:${FONT_Q[f]}&display=swap">`).join('');
  const slides = list.map(i => { const s = D.slides[i]; return `<section class="pv-slide" data-tr="${s.tr || ''}"><div class="anchor">${renderSlide(s, {present:true})}</div></section>`; }).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escH(D.title)}</title>${fonts}<style>${css}
html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:system-ui,sans-serif}.deck{position:fixed;inset:0}.pv-slide{position:absolute;display:none}.pv-slide.on{display:block}.pv-slide .sl{transform-origin:0 0}
.bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;align-items:center;padding:6px 10px;border-radius:99px;background:rgb(20 16 40 / .7);color:#fff;font:600 13px system-ui;opacity:0;transition:opacity .3s}body:hover .bar{opacity:1}.bar button{border:0;background:none;color:#fff;font-size:16px;cursor:pointer;padding:4px 8px}.made{position:fixed;right:12px;bottom:10px;font:500 11px system-ui;color:#fff8}</style></head>
<body><div class="deck">${slides}</div><div class="bar"><button onclick="go(i-1)" aria-label="Précédente">‹</button><span id="n"></span><button onclick="go(i+1)" aria-label="Suivante">›</button><button onclick="document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()" aria-label="Plein écran">⤢</button></div><span class="made">SPECTRA Slide · Studio Prism</span>
<script>var S=[].slice.call(document.querySelectorAll('.pv-slide')),i=0,W=${W},H=${H};function fit(){var k=Math.min(innerWidth/W,innerHeight/H);S.forEach(function(s){s.style.width=W*k+'px';s.style.height=H*k+'px';s.style.left=(innerWidth-W*k)/2+'px';s.style.top=(innerHeight-H*k)/2+'px';s.firstChild.firstChild.style.transform='scale('+k+')'})}
function go(n){if(n<0||n>=S.length)return;S[i].classList.remove('on');i=n;var s=S[i];s.classList.add('on');[].forEach.call(s.querySelectorAll('.el'),function(e,j){e.classList.remove('an-run');void e.offsetWidth});var t=s.dataset.tr;s.className='pv-slide on'+(t?' tr-in tr-'+t:'');s.style.setProperty('--dir',1);document.getElementById('n').textContent=(i+1)+' / '+S.length}
addEventListener('keydown',function(e){if(['ArrowRight','ArrowDown',' ','PageDown','Enter'].indexOf(e.key)>=0)go(i+1);if(['ArrowLeft','ArrowUp','PageUp','Backspace'].indexOf(e.key)>=0)go(i-1);if(e.key==='Home')go(0);if(e.key==='End')go(S.length-1)});
addEventListener('click',function(e){if(!e.target.closest('.bar'))go(i+1)});addEventListener('resize',fit);fit();go(0);<\/script></body></html>`;
  await window.SWDownload(fileBase() + '.html', new Blob([html], {type:'text/html'})); toast('Page web prête : elle s\'ouvre dans n\'importe quel navigateur');
}
async function doExport(kind){
  const paid = window.SWHome?.canExport ? window.SWHome.canExport() : true;
  if (['pptx', 'html', 'json'].includes(kind) && !paid) return window.SWHome?.licence?.('export');
  try {
    if (kind === 'pdf') return printDeck(false); if (kind === 'pdf1') return printDeck(true);
    if (kind === 'pptx') return await exportPptx(); if (kind === 'html') return await exportHTML();
    if (kind === 'json') return window.SWDownload(fileBase() + '.spectraslide', new Blob([getJSON()], {type:'application/json'}));
  } catch(e){ console.warn(e); toast(e.message || 'Export impossible'); }
}
function exportPop(anchor){
  const paid = window.SWHome?.canExport ? window.SWHome.canExport() : true, lk = paid ? '' : '<span class="lk">Licence</span>';
  openPop(anchor, `<div class="pop-menu">
    <button type="button" data-x="present"><b>▶ Présenter</b><span>Plein écran, depuis la diapositive ${CUR + 1} · F5</span></button><hr>
    <button type="button" data-x="pdf"><b>PDF</b><span>Une page par diapositive, au format exact</span></button>
    <button type="button" data-x="pdf1"><b>PDF de cette diapositive</b><span>Seulement la diapositive ${CUR + 1}</span></button>
    <button type="button" data-x="pptx"><b>PowerPoint (.pptx)${lk}</b><span>Textes, formes, tableaux et graphiques modifiables dans PowerPoint, Keynote ou Google Slides</span></button>
    <button type="button" data-x="html"><b>Page web (.html)${lk}</b><span>La présentation dans un seul fichier, lisible partout</span></button>
    <button type="button" data-x="json"><b>Sauvegarde SPECTRA (.spectraslide)${lk}</b><span>Le fichier complet, à rouvrir dans SPECTRA Slide</span></button></div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-x]'); if (!b) return; closePop(); b.dataset.x === 'present' ? present(CUR) : doExport(b.dataset.x); };
  }, 'menu');
}
/* ---------- Import ---------- */
async function importFile(f){
  const n = f.name.toLowerCase();
  if (/\.(spectraslide|json)$/.test(n)){ const j = JSON.parse(await f.text()); if (!Array.isArray(j.slides)) throw new Error('Ce fichier n\'est pas une présentation SPECTRA.'); return JSON.stringify(cleanDeck(j)); }
  if (/\.pptx$/.test(n)) return JSON.stringify(await importPptx(f));
  if (/\.(ppt|key|odp)$/.test(n)) throw new Error('Ce format n\'est pas pris en charge : enregistrez-le d\'abord en .pptx (PowerPoint récent).');
  if (/^image\//.test(f.type)){ const d = newDeck(f.name.replace(/\.[^.]+$/, ''), 'mono'); const keep = D; D = d; try { const {src} = await compressImage(f); const s = buildSlide({layout:'photo', title:d.title}); s.els[0].src = mediaPut(src); d.slides = [s]; } finally { D = keep; } return JSON.stringify(d); }
  throw new Error('Format non pris en charge. Ouvrez un fichier PowerPoint (.pptx), une image ou une sauvegarde SPECTRA.');
}
/* PowerPoint → SPECTRA Slide : textes, formes, images, tableaux, graphiques, notes, fonds */
async function importPptx(file){
  const Z = await loadLib(LIB_ZIP, 'JSZip'), zip = await Z.loadAsync(file);
  const rd = async p => { const f = zip.file(p); return f ? new DOMParser().parseFromString(await f.async('string'), 'application/xml') : null; };
  const kids = (n, tag) => n ? [...n.children].filter(c => c.localName === tag) : [];
  const kid = (n, tag) => kids(n, tag)[0] || null;
  const desc = (n, tag) => n ? n.getElementsByTagNameNS('*', tag)[0] || null : null;
  const relsOf = async p => { const d = await rd(p.replace(/([^/]+)$/, '_rels/$1.rels')); const m = {}; d?.querySelectorAll('Relationship').forEach(r => m[r.getAttribute('Id')] = {t:r.getAttribute('Target'), type:r.getAttribute('Type')}); return m; };
  const res = (base, t) => { if (t.startsWith('/')) return t.slice(1); const parts = base.split('/'); parts.pop(); for (const s of t.split('/')){ if (s === '..') parts.pop(); else if (s !== '.') parts.push(s); } return parts.join('/'); };
  const pres = await rd('ppt/presentation.xml'); if (!pres) throw new Error('Fichier PowerPoint illisible.');
  const sz = desc(pres, 'sldSz'), cx = +sz?.getAttribute('cx') || 12192000, cy = +sz?.getAttribute('cy') || 6858000, ratio = cx / cy;
  const size = Object.entries(SIZES).sort((a, b) => Math.abs(a[1][0] / a[1][1] - ratio) - Math.abs(b[1][0] / b[1][1] - ratio))[0][0];
  const [W, H] = SIZES[size], kx = W / cx, ky = H / cy, emuPt = 12700;
  // thème : couleurs et polices
  const prels = await relsOf('ppt/presentation.xml');
  const themeP = Object.values(prels).find(r => /theme$/.test(r.type)); const thx = themeP ? await rd(res('ppt/presentation.xml', themeP.t)) : null;
  const scheme = {}; const cs = desc(thx, 'clrScheme'); if (cs) [...cs.children].forEach(c => { const v = desc(c, 'srgbClr')?.getAttribute('val') || desc(c, 'sysClr')?.getAttribute('lastClr'); if (v) scheme[c.localName] = '#' + v; });
  const MAP = {tx1:'dk1', bg1:'lt1', tx2:'dk2', bg2:'lt2'};
  const fMaj = desc(desc(thx, 'majorFont'), 'latin')?.getAttribute('typeface') || 'Inter', fMin = desc(desc(thx, 'minorFont'), 'latin')?.getAttribute('typeface') || 'Inter';
  const knownFont = f => FONTS.some(x => x[0] === f) ? f : /serif|garamond|times|georgia|cambria/i.test(f) ? 'Source Serif 4' : 'Inter';
  const colorOf = n => { if (!n) return null; const s = desc(n, 'srgbClr'), sc = desc(n, 'schemeClr'), sy = desc(n, 'sysClr'); let c = s ? '#' + s.getAttribute('val') : sc ? scheme[MAP[sc.getAttribute('val')] || sc.getAttribute('val')] : sy ? '#' + (sy.getAttribute('lastClr') || '000000') : null; if (!c) return null;
    const m = s || sc || sy; const lm = desc(m, 'lumMod')?.getAttribute('val'), lo = desc(m, 'lumOff')?.getAttribute('val'), tint = desc(m, 'tint')?.getAttribute('val'), shd = desc(m, 'shade')?.getAttribute('val');
    if (lm || lo){ const [r, g, b] = hexRgb(c).map(v => v / 255), l = Math.max(r, g, b); const f = (lm ? +lm / 1e5 : 1), off = lo ? +lo / 1e5 : 0; c = rgbHex(...[r, g, b].map(v => (v * f + off * (l ? 1 : 1)) * 255)); }
    if (tint) c = mix(c, '#ffffff', 1 - +tint / 1e5); if (shd) c = mix(c, '#000000', 1 - +shd / 1e5); return c; };
  const alphaOf = n => { const a = n && desc(n, 'alpha')?.getAttribute('val'); return a ? +a / 1e5 : 1; };
  const mediaCache = {};
  const imgData = async (base, rels, rid, crop) => { const r = rels[rid]; if (!r) return null; const p = res(base, r.t); const key = p + JSON.stringify(crop || {}); if (mediaCache[key]) return mediaCache[key]; const f = zip.file(p); if (!f) return null;
    const ext = p.split('.').pop().toLowerCase(), mime = {png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', webp:'image/webp', bmp:'image/bmp'}[ext]; if (!mime) return null;
    const blob = new Blob([await f.async('arraybuffer')], {type:mime}); try { const {src} = await compressImage(blob, 1600, crop); return mediaCache[key] = src; } catch(e){ return null; } };
  const deck = {v:1, app:'spectraslide', title:file.name.replace(/\.pptx$/i, ''), theme:{id:'mono', ac:scheme.accent1 || '#2563EB', ac2:scheme.accent2 || '#0EA5E9', ac3:scheme.accent3 || '#F59E0B', fh:knownFont(fMaj), fb:knownFont(fMin)}, size, slides:[], media:{}};
  const keep = D; D = deck;
  try {
    const order = kids(desc(pres, 'sldIdLst'), 'sldId').map(n => prels[n.getAttribute('r:id') || n.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')]?.t).filter(Boolean);
    for (const t of order.slice(0, 200)){
      const sp = res('ppt/presentation.xml', t), sx = await rd(sp); if (!sx) continue; const srels = await relsOf(sp);
      const layP = Object.values(srels).find(r => /slideLayout$/.test(r.type)), lp = layP ? res(sp, layP.t) : null, lx = lp ? await rd(lp) : null, lrels = lp ? await relsOf(lp) : {};
      const mP = Object.values(lrels).find(r => /slideMaster$/.test(r.type)), mp = mP ? res(lp, mP.t) : null, mx = mp ? await rd(mp) : null, mrels = mp ? await relsOf(mp) : {};
      const phMap = {}; for (const x of [mx, lx]) x?.querySelectorAll('sp').forEach(s => { const ph = desc(s, 'ph'); const xf = desc(desc(s, 'spPr'), 'xfrm'); if (!ph || !xf) return; const k1 = 'i' + (ph.getAttribute('idx') || ''), k2 = 't' + (ph.getAttribute('type') || 'body'); const v = {xf, sz:desc(desc(desc(s, 'txBody'), 'lstStyle'), 'defRPr')?.getAttribute('sz')}; if (ph.getAttribute('idx')) phMap[k1] = v; phMap[k2] = v; });
      const s = {id:sid(), v:'content', lay:'blank', els:[], notes:''};
      // fond
      for (const [x, base, rels] of [[sx, sp, srels], [lx, lp, lrels], [mx, mp, mrels]]){ const bg = desc(x, 'bg'); if (!bg) continue; const bp = desc(bg, 'bgPr');
        const blip = desc(bp, 'blip'); if (blip){ const d = await imgData(base, rels, blip.getAttribute('r:embed')); if (d){ s.bg = {img:mediaPut(d)}; break; } }
        const sf = kid(bp, 'solidFill'); if (sf){ const c = colorOf(sf); if (c){ s.bg = {c}; break; } }
        const gf = kid(bp, 'gradFill'); if (gf){ const st = [...gf.getElementsByTagNameNS('*', 'gs')].map(colorOf).filter(Boolean); if (st.length > 1){ s.bg = {g:[st[0], st[st.length - 1]], a:135}; break; } }
        const ref = desc(bg, 'bgRef'); if (ref){ const c = colorOf(ref); if (c){ s.bg = {c}; break; } } }
      if (!s.bg) s.bg = {c:'#FFFFFF'};
      const walk = async (tree, tf) => {
        for (const n of tree.children){
          const ln = n.localName;
          if (ln === 'grpSp'){ const xf = desc(kid(n, 'grpSpPr'), 'xfrm'); if (!xf){ await walk(n, tf); continue; }
            const off = kid(xf, 'off'), ext = kid(xf, 'ext'), co = kid(xf, 'chOff'), ce = kid(xf, 'chExt');
            const ox = +off.getAttribute('x'), oy = +off.getAttribute('y'), ew = +ext.getAttribute('cx'), eh = +ext.getAttribute('cy'), cxo = +co?.getAttribute('x') || 0, cyo = +co?.getAttribute('y') || 0, cw = +ce?.getAttribute('cx') || ew, ch = +ce?.getAttribute('cy') || eh;
            const sxk = cw ? ew / cw : 1, syk = ch ? eh / ch : 1; await walk(n, b => tf({x:ox + (b.x - cxo) * sxk, y:oy + (b.y - cyo) * syk, w:b.w * sxk, h:b.h * syk, rot:b.rot})); continue; }
          if (!['sp', 'pic', 'graphicFrame', 'cxnSp'].includes(ln)) continue;
          const ph = desc(n, 'ph'), spPr = kid(n, 'spPr') || kid(n, 'xfrm') && n, xfN = ln === 'graphicFrame' ? kid(n, 'xfrm') : desc(spPr, 'xfrm');
          let xf = xfN; const phKey = ph ? (ph.getAttribute('idx') ? 'i' + ph.getAttribute('idx') : 't' + (ph.getAttribute('type') || 'body')) : null;
          if (!xf && ph) xf = (phMap[phKey] || phMap['t' + (ph.getAttribute('type') || 'body')] || {}).xf;
          if (!xf) continue; const off = kid(xf, 'off'), ext = kid(xf, 'ext'); if (!off || !ext) continue;
          const b0 = tf({x:+off.getAttribute('x'), y:+off.getAttribute('y'), w:+ext.getAttribute('cx'), h:+ext.getAttribute('cy'), rot:(+xf.getAttribute('rot') || 0) / 60000});
          const box = {x:Math.round(b0.x * kx), y:Math.round(b0.y * ky), w:Math.max(2, Math.round(b0.w * kx)), h:Math.max(2, Math.round(b0.h * ky)), rot:Math.round(b0.rot * 10) / 10 || undefined};
          if (ln === 'pic'){ const bf = kid(n, 'blipFill'), blip = desc(bf, 'blip'), sr = desc(bf, 'srcRect'); const crop = sr ? ['l', 't', 'r', 'b'].map(k => (+sr.getAttribute(k) || 0) / 1e5) : null;
            const d = blip && await imgData(sp, srels, blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed'), crop);
            if (d) s.els.push({id:nid(), t:'img', ...box, src:mediaPut(d), fit:'cover', px:50, py:50, mask:desc(spPr, 'prstGeom')?.getAttribute('prst') === 'ellipse' ? 'circle' : undefined}); continue; }
          if (ln === 'graphicFrame'){
            const tbl = desc(n, 'tbl'); if (tbl){ const rows = kids(tbl, 'tr').map(tr => kids(tr, 'tc').map(tc => escT([...tc.getElementsByTagNameNS('*', 'p')].map(p => [...p.getElementsByTagNameNS('*', 't')].map(x => x.textContent).join('')).join('\n'))));
              const sz0 = desc(tbl, 'rPr')?.getAttribute('sz'); s.els.push({id:nid(), t:'table', ...box, rows, fs:Math.round((sz0 ? +sz0 / 100 : 14) * emuPt * ky), head:true, band:true}); continue; }
            const cref = desc(n, 'chart'); if (cref){ const rid = cref.getAttribute('r:id') || cref.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'); const cp = srels[rid] ? res(sp, srels[rid].t) : null; const cx2 = cp ? await rd(cp) : null;
              if (cx2){ const pa = desc(cx2, 'plotArea'); const typeN = pa && [...pa.children].find(c => /Chart$/.test(c.localName)); const tn = typeN?.localName || 'barChart';
                const dir = desc(typeN, 'barDir')?.getAttribute('val'), grp = desc(typeN, 'grouping')?.getAttribute('val');
                const ct = tn === 'pieChart' || tn === 'pie3DChart' ? 'pie' : tn === 'doughnutChart' ? 'donut' : tn === 'lineChart' ? 'line' : tn === 'areaChart' ? 'area' : grp === 'stacked' || grp === 'percentStacked' ? 'stack' : dir === 'bar' ? 'bar' : 'col';
                const sers = kids(typeN, 'ser'); const pts = node => [...(node?.getElementsByTagNameNS('*', 'pt') || [])].map(p => ({i:+p.getAttribute('idx'), v:desc(p, 'v')?.textContent}));
                let labels = []; const series = sers.map((sr, j) => { const cat = pts(desc(sr, 'cat')); if (!labels.length) cat.forEach(p => labels[p.i] = p.v); const vals = []; pts(desc(sr, 'val')).forEach(p => vals[p.i] = +p.v); return {n:desc(desc(sr, 'tx'), 'v')?.textContent || `Série ${j + 1}`, v:Array.from({length:Math.max(vals.length, labels.length)}, (_, i) => vals[i] ?? null)}; });
                labels = Array.from({length:Math.max(labels.length, ...series.map(x => x.v.length))}, (_, i) => labels[i] ?? '');
                if (series.length) s.els.push({id:nid(), t:'chart', ...box, ct, labels, series, legend:series.length > 1 || ct === 'pie' || ct === 'donut', vals:true}); } }
            continue; }
          // formes, textes, connecteurs
          const prst = desc(spPr, 'prstGeom')?.getAttribute('prst') || (ln === 'cxnSp' ? 'line' : 'rect');
          const sf = kid(spPr, 'solidFill'), gf = kid(spPr, 'gradFill'), nf = kid(spPr, 'noFill'), lnN = kid(spPr, 'ln');
          let fill = sf ? colorOf(sf) : gf ? colorOf([...gf.getElementsByTagNameNS('*', 'gs')][0]) : null;
          if (!fill && !nf && !ph && ln === 'sp'){ const fr = desc(kid(n, 'style'), 'fillRef'); if (fr && +fr.getAttribute('idx') > 0) fill = colorOf(fr); }
          const lnCol = lnN && !kid(lnN, 'noFill') ? colorOf(kid(lnN, 'solidFill')) || (!ph && desc(kid(n, 'style'), 'lnRef') && +desc(kid(n, 'style'), 'lnRef').getAttribute('idx') > 0 ? colorOf(desc(kid(n, 'style'), 'lnRef')) : null) : null;
          const lw = lnN?.getAttribute('w') ? Math.max(1, Math.round(+lnN.getAttribute('w') / emuPt * ky / .75 * .75)) : 2;
          if (prst === 'line' || /connector/i.test(prst) || ln === 'cxnSp'){ if (!lnCol && !fill) continue; const len = Math.hypot(box.w, box.h), ang = Math.atan2(box.h, box.w) * 180 / Math.PI * ((xf.getAttribute('flipV') === '1') ? -1 : 1);
            s.els.push({id:nid(), t:'line', k:'line', x:Math.round(box.x + box.w / 2 - len / 2), y:Math.round(box.y + box.h / 2 - 10), w:Math.round(len), h:20, rot:Math.round(((box.rot || 0) + ang) * 10) / 10 || undefined, stroke:lnCol || '#000000', lw:Math.max(1, Math.round(lw)), a2:desc(lnN, 'tailEnd') && desc(lnN, 'tailEnd').getAttribute('type') !== 'none' ? 'arrow' : '', a1:desc(lnN, 'headEnd') && desc(lnN, 'headEnd').getAttribute('type') !== 'none' ? 'arrow' : ''}); continue; }
          // texte
          const tb = kid(n, 'txBody'); let html = '', fs0 = 0, st = {};
          if (tb){
            const bp = kid(tb, 'bodyPr'), anchor = bp?.getAttribute('anchor'); st.va = anchor === 'ctr' ? 'm' : anchor === 'b' ? 'b' : 't';
            const phType = ph?.getAttribute('type') || (ph ? 'body' : ''), isTitle = /title|ctrTitle/i.test(phType);
            const defSz = (phMap[phKey]?.sz ? +phMap[phKey].sz / 100 : 0) || (phType === 'ctrTitle' ? 54 : isTitle ? 40 : phType === 'subTitle' ? 24 : phType === 'body' || phType === '' && ph ? 24 : 18);
            const paras = kids(tb, 'p'); let anyBullet = false; const lines = []; let align = null, sizes = [];
            for (const p of paras){
              const pPr = kid(p, 'pPr'); const al = pPr?.getAttribute('algn'); if (al && !align) align = al;
              const bullet = !kid(pPr, 'buNone') && (kid(pPr, 'buChar') || kid(pPr, 'buAutoNum') || (phType === 'body' || (ph && !phType)) && !isTitle);
              let ph2 = '';
              for (const r of p.children){
                if (r.localName === 'br'){ ph2 += '<br>'; continue; }
                if (r.localName !== 'r' && r.localName !== 'fld') continue;
                const rp = kid(r, 'rPr'), t = escH(kid(r, 't')?.textContent || ''); if (!t) continue;
                const sz = rp?.getAttribute('sz') ? +rp.getAttribute('sz') / 100 : defSz; sizes.push(sz);
                let x = t; const c = colorOf(kid(rp, 'solidFill')); if (c) x = `<span style="color:${c}">${x}</span>`;
                if (rp?.getAttribute('b') === '1') x = `<b>${x}</b>`; if (rp?.getAttribute('i') === '1') x = `<i>${x}</i>`; if (rp?.getAttribute('u') && rp.getAttribute('u') !== 'none') x = `<u>${x}</u>`;
                ph2 += x;
              }
              lines.push({h:ph2, bullet:bullet && ph2.replace(/<[^>]+>/g, '').trim()}); if (bullet && ph2.replace(/<[^>]+>/g, '').trim()) anyBullet = true;
            }
            while (lines.length && !lines[lines.length - 1].h.replace(/<[^>]+>/g, '').trim()) lines.pop();
            if (anyBullet){ let o = '', inL = false; for (const l of lines){ if (l.bullet){ if (!inL){ o += '<ul>'; inL = true; } o += `<li>${l.h}</li>`; } else { if (inL){ o += '</ul>'; inL = false; } o += (o && !o.endsWith('</ul>') ? '<br>' : '') + l.h; } } if (inL) o += '</ul>'; html = o; }
            else html = lines.map(l => l.h).join('<br>');
            fs0 = sizes.length ? sizes.sort((a, b) => sizes.filter(v => v === b).length - sizes.filter(v => v === a).length)[0] : defSz;
            st = {...st, f:isTitle ? 'h' : 'b', fs:Math.max(6, Math.round(fs0 * emuPt * ky * 10) / 10), lh:1.2, ha:{ctr:'c', r:'r', just:'j'}[align] || 'l', fc:'#1A1A1A'};
            const rp0 = desc(tb, 'rPr'); const fcol = colorOf(kid(rp0, 'solidFill')); if (fcol){ st.fc = fcol; html = html.replace(new RegExp(`<span style="color:${fcol}">([^<]*)</span>`, 'g'), '$1'); }
            if (!fcol && fill) st.fc = onColor(fill);
            if (/^(<b>[^]*<\/b>)$/.test(html) && !/<br>|<ul>/.test(html)){ st.b = 1; html = html.slice(3, -4); }
          }
          const hasText = html.replace(/<[^>]+>/g, '').trim();
          if (!fill && !lnCol && !hasText) continue;
          if (!fill && !lnCol){ s.els.push({id:nid(), t:'text', ...box, html, st}); continue; }
          const k = {rect:'rect', roundRect:'round', ellipse:'ellipse', triangle:'tri', rtTriangle:'rtri', diamond:'diamond', hexagon:'hex', octagon:'oct', star5:'star', star4:'star4', rightArrow:'arrow', chevron:'chev', homePlate:'arrow', plus:'plus', mathPlus:'plus', heart:'heart', wedgeRoundRectCallout:'bubble', wedgeRectCallout:'bubble', pentagon:'pent', flowChartAlternateProcess:'round'}[prst] || 'rect';
          const a = alphaOf(sf); s.els.push({id:nid(), t:'shape', k, ...box, fill:fill || '', stroke:lnCol || undefined, sw:lnCol ? Math.max(1, lw) : undefined, op:a < 1 ? a : undefined, r:k === 'round' ? Math.round(Math.min(box.w, box.h) * .16) : undefined, ...(hasText ? {html, st} : {})});
        }
      };
      const tree = desc(desc(sx, 'cSld'), 'spTree'); if (tree) await walk(tree, b => b);
      // notes
      const nP = Object.values(srels).find(r => /notesSlide$/.test(r.type)); if (nP){ const nx = await rd(res(sp, nP.t)); if (nx){ const body = [...nx.querySelectorAll('sp')].find(x => desc(x, 'ph')?.getAttribute('type') === 'body'); if (body) s.notes = [...body.getElementsByTagNameNS('*', 'p')].map(p => [...p.getElementsByTagNameNS('*', 't')].map(t => t.textContent).join('')).join('\n').trim(); } }
      // une diapositive au fond sombre prend les couleurs « titre » pour les éléments ajoutés ensuite
      s.nodeco = true; deck.slides.push(s);
    }
  } finally { D = keep; }
  if (!deck.slides.length) throw new Error('Aucune diapositive trouvée dans ce fichier.');
  return deck;
}
/* présentation chargée depuis l'extérieur : HTML assaini, valeurs vérifiées */
function cleanDeck(j){
  const d = {v:1, app:'spectraslide', title:String(j.title || 'Présentation sans titre').slice(0, 120), theme:j.theme && typeof j.theme === 'object' ? j.theme : {id:'spectra'}, size:SIZES[j.size] ? j.size : '16:9', slides:[], media:{}};
  for (const [k, v] of Object.entries(j.media || {})) if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/.test(String(v))) d.media[k] = v;
  const okCol = c => c == null || c === '' || /^t:[a-z0-9]+$/.test(c) || /^#[0-9a-f]{3,8}$/i.test(c) ? c : undefined;
  for (const s0 of (j.slides || []).slice(0, 400)){
    if (!s0 || !Array.isArray(s0.els)) continue;
    const s = {id:String(s0.id || sid()), v:['title', 'section', 'content', 'end'].includes(s0.v) ? s0.v : 'content', lay:String(s0.lay || ''), els:[], notes:String(s0.notes || '').slice(0, 20000), tr:s0.tr ? String(s0.tr) : undefined, an:s0.an ? String(s0.an) : undefined, hide:!!s0.hide || undefined, nodeco:!!s0.nodeco || undefined};
    if (s0.bg && typeof s0.bg === 'object'){ const b = {}; if (okCol(s0.bg.c)) b.c = s0.bg.c; if (Array.isArray(s0.bg.g)) b.g = s0.bg.g.map(okCol).filter(Boolean).slice(0, 2); if (/^m:\w+$/.test(s0.bg.img || '')) b.img = s0.bg.img; if (+s0.bg.dim) b.dim = clamp(+s0.bg.dim, 0, .9); if (b.g && b.g.length < 2) delete b.g; if (Object.keys(b).length) s.bg = b; }
    for (const e0 of s0.els.slice(0, 300)){
      if (!e0 || !['text', 'shape', 'line', 'img', 'icon', 'table', 'chart'].includes(e0.t)) continue;
      const e = {...e0}; e.id = String(e.id || nid()); for (const k of ['x', 'y', 'w', 'h']) e[k] = +e[k] || 0; e.w = Math.max(1, e.w); e.h = Math.max(1, e.h);
      if (e.html != null) e.html = SAN(String(e.html)); if (e.rows) e.rows = (Array.isArray(e.rows) ? e.rows : []).slice(0, 60).map(r => (Array.isArray(r) ? r : []).slice(0, 20).map(c => SAN(String(c ?? ''))));
      for (const k of ['fill', 'g2', 'stroke', 'fc', 'hc']) if (k in e && okCol(e[k]) === undefined) delete e[k];
      if (e.st){ e.st = {...e.st}; for (const k of ['fc', 'bg', 'hl']) if (k in e.st && okCol(e.st[k]) === undefined) delete e.st[k]; if (e.st.f && !['h', 'b'].includes(e.st.f) && !FONTS.some(f => f[0] === e.st.f)) e.st.f = 'b'; }
      if (e.t === 'img' && e.src && !/^m:\w+$/.test(e.src)){ if (/^data:image\/(png|jpe?g|gif|webp);base64,/.test(e.src)){ const id = uidS(); d.media[id] = e.src; e.src = 'm:' + id; } else e.src = ''; }
      if (e.t === 'icon' && !ICONS[e.n]) e.n = 'star'; if (e.t === 'shape' && !SHAPES[e.k]) e.k = 'rect';
      if (e.t === 'chart'){ e.labels = (e.labels || []).map(String).slice(0, 60); e.series = (e.series || []).slice(0, 12).map(x => ({n:String(x.n || ''), v:(x.v || []).slice(0, 60).map(v => v == null || isNaN(+v) ? null : +v)})); }
      s.els.push(e);
    }
    d.slides.push(s);
  }
  if (!d.slides.length){ const keep = D; D = d; try { d.slides.push(buildSlide({layout:'title', title:d.title})); } finally { D = keep; } }
  return d;
}
