/* ---------- Tiroirs : Insérer, Design, Mises en page, Animer, Modèles ---------- */
let panel = null;
function openPanel(k){
  if (panel === k || !k){ panel = null; g$('edPanel').hidden = true; g$('edRail').querySelectorAll('.ray').forEach(r => r.setAttribute('aria-pressed', 'false')); return; }
  panel = k; const p = g$('edPanel'); p.hidden = false; const ray = RAYS.find(r => r[0] === k); p.style.setProperty('--ray', ray[3]);
  g$('edRail').querySelectorAll('.ray').forEach(r => r.setAttribute('aria-pressed', r.dataset.panel === k));
  renderPanel();
}
const PANEL_SUB = {insert:'Textes, formes, icônes, images, tableaux et graphiques', design:'Thème, couleurs, polices et format de toute la présentation', layout:'Réorganisez la diapositive en un clic : le contenu est conservé',
  anim:'Transitions entre diapositives et apparition des éléments', templates:'Partez d\'une présentation conçue par Studio Prism'};
const BLOCKS = [['stat', 'Chiffre clé'], ['badge', 'Pastille'], ['cta', 'Bouton'], ['iconcard', 'Carte avec icône'], ['numbered', 'Point numéroté'], ['progress', 'Barre de progression'], ['divider', 'Séparateur'], ['quoteb', 'Citation']];
function blockEls(k){
  const [W, H] = dims(), g = 'g' + uidS(), at = (w, h) => centerBox(w, h);
  if (k === 'stat'){ const p = at(360, 170); return [T(p.x, p.y, 360, 110, '87 %', {f:'h', fs:96, b:1, fc:'t:ac', lh:1}, {g}), T(p.x, p.y + 116, 360, 40, 'de clients satisfaits', {fs:24, b:1}, {g})]; }
  if (k === 'badge'){ const p = at(220, 54); return [SH('pill', p.x, p.y, 220, 54, 't:ac', {html:'Nouveau', st:{fs:20, b:1, fc:'t:on', ha:'c', va:'m'}})]; }
  if (k === 'cta'){ const p = at(300, 72); return [SH('round', p.x, p.y, 300, 72, 't:ac', {r:16, html:'Découvrir →', st:{fs:24, b:1, fc:'t:on', ha:'c', va:'m', f:'h'}, shadow:16})]; }
  if (k === 'iconcard'){ const p = at(340, 300); return [SH('round', p.x, p.y, 340, 300, 't:soft', {r:20, stroke:'t:line', sw:1, g}), SH('ellipse', p.x + 30, p.y + 30, 64, 64, 't:ac', {g}), ICO('idea', p.x + 44, p.y + 44, 36, 't:on', {g}), T(p.x + 30, p.y + 120, 280, 36, 'Une idée forte', {f:'h', fs:26, b:1}, {g}), T(p.x + 30, p.y + 166, 280, 100, 'Expliquez-la en une ou deux phrases courtes.', {fs:18, fc:'t:mut', lh:1.4}, {g})]; }
  if (k === 'numbered'){ const p = at(520, 64); return [SH('ellipse', p.x, p.y, 64, 64, 't:ac', {html:'1', st:{fs:28, b:1, f:'h', fc:'t:on', ha:'c', va:'m'}, g}), T(p.x + 88, p.y + 12, 430, 40, 'Première étape', {f:'h', fs:28, b:1}, {g})]; }
  if (k === 'progress'){ const p = at(560, 70); return [T(p.x, p.y, 400, 30, 'Avancement', {fs:20, b:1}, {g}), T(p.x + 400, p.y, 160, 30, '72 %', {fs:20, b:1, fc:'t:ac', ha:'r'}, {g}), SH('pill', p.x, p.y + 42, 560, 18, 't:soft', {stroke:'t:line', sw:1, g}), SH('pill', p.x, p.y + 42, 403, 18, 't:ac', {g})]; }
  if (k === 'divider'){ const p = at(W * .6, 20); return [LN(p.x, p.y + 10, W * .6, 't:line', 2)]; }
  if (k === 'quoteb'){ const p = at(760, 220); return [T(p.x - 6, p.y - 40, 120, 140, '“', {f:'h', fs:150, b:1, fc:'t:ac', lh:1}, {g, op:.3}), T(p.x + 60, p.y, 700, 120, 'Le design, ce n\'est pas seulement ce à quoi ça ressemble, c\'est comment ça marche.', {f:'h', fs:32, i:1, lh:1.3}, {g}), T(p.x + 60, p.y + 150, 600, 32, 'Nom de l\'auteur', {fs:20, b:1, fc:'t:ac'}, {g})]; }
  return [];
}
function themeCard(t){
  const key = 'th:' + t.id + D.size;
  let h = THUMB.get(key)?.html; if (!h){ const keep = D; const s = buildSlide({layout:'title', kicker:'Spectra', title:t.name, subtitle:'Aa — titres et texte'}); h = renderSlide(s, {theme:{id:t.id}, preview:true}); THUMB.set(key, {key, html:h}); void keep; }
  const [W] = dims(); return `<span class="th-mini" style="--k:${160 / W}"><span class="th-s">${h}</span></span>`;
}
const PALETTES = [['#6D3BFF', '#00A6E8', '#FF4D8D'], ['#0A5E8E', '#03A2AC', '#F2A541'], ['#E8505B', '#F9A26C', '#14B8A6'], ['#2F7D4E', '#8BBF6A', '#E0A526'], ['#1D4ED8', '#F59E0B', '#10B981'], ['#7C3AED', '#EC4899', '#F59E0B'], ['#0F766E', '#F97316', '#64748B'], ['#B42318', '#1D2939', '#E8A33D'], ['#111827', '#6B7280', '#EF4444'], ['#9A7B4F', '#2E2A26', '#C9A96E'], ['#00E5FF', '#FF2BD6', '#C6FF3D'], ['#E63946', '#1D4ED8', '#F4B400']];
const PAIRS = [['Bricolage Grotesque', 'Inter'], ['Outfit', 'Inter'], ['Sora', 'Inter'], ['Montserrat', 'Inter'], ['Syne', 'Space Grotesk'], ['Unbounded', 'DM Sans'], ['Fraunces', 'DM Sans'], ['Playfair Display', 'Lora'], ['Instrument Serif', 'DM Sans'], ['DM Serif Display', 'Source Serif 4'], ['Manrope', 'Manrope'], ['Poppins', 'Poppins'], ['Caveat', 'Nunito'], ['Space Grotesk', 'Space Grotesk']];
const TRANS = [['', 'Aucune'], ['fade', 'Fondu'], ['slide', 'Glisser'], ['push', 'Pousser'], ['zoom', 'Zoom'], ['flip', 'Retourner'], ['wipe', 'Balayer'], ['rise', 'Monter'], ['blur', 'Flou']];
const SLIDE_ANIMS = [['', 'Aucune'], ['rise', 'Cascade'], ['fade', 'Fondu'], ['pop', 'Rebond'], ['zoom', 'Zoom'], ['left', 'Glisser'], ['blur', 'Mise au point']];
function renderPanel(){
  const b = g$('edPanelBody'), ray = RAYS.find(r => r[0] === panel); if (!ray) return;
  g$('edPanelTitle').textContent = ray[1]; g$('edPanelSub').textContent = PANEL_SUB[panel] || '';
  const th = dtheme(D.theme), sv = curVars(); let h = '';
  if (panel === 'insert'){
    h += `<h4 class="pn-h">Textes</h4><div class="pn-texts">${Object.entries(TEXT_STYLES).map(([k, [t, st, x]]) => `<button type="button" data-ins="text:${k}" style="${txCss({...st, fs:Math.min(st.fs, k === 'big' ? 44 : 30)}).replace(/justify-content:[^;]+;/, '')}${st.bg ? `background:${realCol(st.bg, sv)};` : ''}--fh:${fontStack(th.fh).replace(/"/g, "'")};--fb:${fontStack(th.fb).replace(/"/g, "'")};--ac:${th.ac};--ink:${th.ink};--mut:${th.mut};--on:${onColor(th.ac)};--hw:${th.hw}">${k === 'list' ? '• Liste à puces' : escH(x)}</button>`).join('')}</div>
      <h4 class="pn-h">Éléments prêts à l'emploi <small>groupés, à personnaliser</small></h4><div class="pn-chips big">${BLOCKS.map(([k, t]) => `<button type="button" data-ins="block:${k}">${t}</button>`).join('')}</div>
      <h4 class="pn-h">Formes</h4><div class="pn-shapes2">${SHAPE_ORDER.map(k => `<button type="button" data-ins="shape:${k}" title="${escH(SHAPES[k][0])}" style="color:${th.ac}">${shapeIcon(k)}</button>`).join('')}</div>
      <h4 class="pn-h">Images</h4><div class="pn-imgs2"><button type="button" class="pn-drop" data-ins="img">${IC.img}<b>Importer une image</b><span>ou glissez-la sur la diapositive · Ctrl + V</span></button>${Object.entries(D.media || {}).filter(([k]) => usedMedia().has(k)).slice(0, 12).map(([k, v]) => `<button type="button" class="pn-imgthumb" data-ins="media:${k}"><img src="${escH(v)}" alt=""></button>`).join('')}</div>
      <h4 class="pn-h">Tableaux et graphiques</h4><div class="pn-chips big"><button type="button" data-ins="table:3x3">Tableau 3 × 3</button><button type="button" data-ins="table:5x4">Tableau 4 × 5</button>${CHART_TYPES.map(([k, t]) => `<button type="button" data-ins="chart:${k}">${iconSVG(k === 'pie' || k === 'donut' ? 'pie' : k === 'line' || k === 'area' ? 'trend' : 'chart')} ${t}</button>`).join('')}</div>
      <h4 class="pn-h">Icônes <small>${Object.keys(ICONS).length} icônes, aux couleurs du thème</small></h4><label class="pn-search">${IC.search}<input id="pnIcQ" placeholder="Chercher : équipe, argent, idée, maison…"></label><div class="pn-icons" id="pnIc" style="color:${th.ac}">${Object.keys(ICONS).map(k => `<button type="button" data-ins="icon:${k}" title="${escH(ICONS[k][0].split(' ')[0])}">${iconSVG(k)}</button>`).join('')}</div>`;
  } else if (panel === 'design'){
    h += `<h4 class="pn-h">Thèmes <small>toute la présentation change d'un clic</small></h4><div class="th-row2">${DTHEMES.map(t => `<button type="button" class="pn-theme2${D.theme.id === t.id ? ' on' : ''}" data-th="${t.id}">${themeCard(t)}<b>${escH(t.name)}</b></button>`).join('')}</div>
      <h4 class="pn-h">Couleurs <small>gardez le décor, changez la palette</small></h4><div class="pal-row">${PALETTES.map((p, i) => `<button type="button" data-pal="${i}" title="Palette">${p.map(c => `<i style="background:${c}"></i>`).join('')}</button>`).join('')}</div>
      <div class="th-custom"><label class="pn-color">Accent <input type="color" data-tc="ac" value="${th.ac}"></label><label class="pn-color">Accent 2 <input type="color" data-tc="ac2" value="${th.ac2}"></label><label class="pn-color">Accent 3 <input type="color" data-tc="ac3" value="${th.ac3}"></label>
        <label class="pn-color">Fond <input type="color" data-tc="bg" value="${th.bg}"></label><button type="button" class="pn-wide" data-reset="1">Couleurs d'origine du thème</button></div>
      <h4 class="pn-h">Polices <small>titres · texte</small></h4><div class="pair-row">${PAIRS.map(([a, c], i) => { ensureFont(a); ensureFont(c); return `<button type="button" data-pair="${i}" class="${th.fh === a && th.fb === c ? 'on' : ''}"><b style="font-family:${fontStack(a)}">${escH(a)}</b><span style="font-family:${fontStack(c)}">${escH(c)}</span></button>`; }).join('')}</div>
      <h4 class="pn-h">Format</h4><div class="seg fmt">${Object.entries(SIZE_NAMES).map(([k, t]) => `<button type="button" data-size="${k}" aria-checked="${D.size === k}">${t}</button>`).join('')}</div>`;
  } else if (panel === 'layout'){
    const L = cur().lay;
    h += `<h4 class="pn-h">Cette diapositive <small>le texte, les listes et les images sont repris</small></h4><div class="lay-grid big">${LAYOUTS.map(([k, t, d]) => `<button type="button" data-lay="${k}" class="${L === k ? 'on' : ''}" title="${escH(d)}"><span class="lay-m" style="color:${th.ac}">${layoutMini(k)}</span><b>${escH(t)}</b></button>`).join('')}</div>
      <h4 class="pn-h">Ajouter une diapositive</h4><div class="lay-grid big">${LAYOUTS.map(([k, t]) => `<button type="button" data-newlay="${k}"><span class="lay-m" style="color:${th.ac2}">${layoutMini(k)}</span><b>${escH(t)}</b></button>`).join('')}</div>
      <h4 class="pn-h">Couleurs de la diapositive</h4><div class="seg">${[['content', 'Contenu'], ['title', 'Titre'], ['section', 'Section']].map(([k, t]) => `<button type="button" data-var="${k}" aria-checked="${(cur().v || 'content') === k || (k === 'title' && cur().v === 'end')}">${t}</button>`).join('')}</div>`;
  } else if (panel === 'anim'){
    const s = cur(), l = selEls();
    h += `<h4 class="pn-h">Transition vers cette diapositive</h4><div class="pn-chips big">${TRANS.map(([k, t]) => `<button type="button" data-tr="${k}" aria-pressed="${(s.tr || '') === k}">${t}</button>`).join('')}</div>
      <h4 class="pn-h">Apparition des éléments <small>automatique, l'un après l'autre</small></h4><div class="pn-chips big">${SLIDE_ANIMS.map(([k, t]) => `<button type="button" data-san="${k}" aria-pressed="${(s.an || '') === k}">${t}</button>`).join('')}</div>
      ${l.length ? `<h4 class="pn-h">Élément sélectionné <small>prioritaire sur l'apparition automatique</small></h4><div class="pn-chips big">${ANIMS.map(([k, t]) => `<button type="button" data-ean="${k}" aria-pressed="${(l[0].an?.k || '') === k}">${t}</button>`).join('')}</div><label class="pop-toggle"><input type="checkbox" id="eanClick" ${l[0].an?.click ? 'checked' : ''}><div><b>Au clic</b><small>Apparaît quand vous avancez</small></div></label>` : '<p class="pn-hint">Sélectionnez un élément pour lui donner sa propre animation, ou « Au clic » pour le faire apparaître quand vous avancez.</p>'}
      <div class="pn-acts"><button type="button" class="pn-wide" data-a="preview">${ICX.present} Aperçu</button><button type="button" class="pn-wide" data-a="all">${IC.copy} Appliquer à toutes les diapositives</button><button type="button" class="pn-wide" data-a="magic">${IC.sparkle} Animer toute la présentation</button><button type="button" class="pn-wide" data-a="none">Tout retirer</button></div>`;
  } else if (panel === 'templates'){
    const mine = E2.userLib.templates || [];
    h += (mine.length ? `<h4 class="pn-h">Mes modèles</h4><div class="pn-tpls">${mine.map(t => `<button type="button" class="pn-tpl" data-tpl="${escH(t.id)}"><span class="tthumb">${tplMini(t)}</span><b>${escH(t.name)}</b></button>`).join('')}</div>` : '')
      + `<h4 class="pn-h">Modèles Studio Prism <small>une nouvelle présentation, ou leurs diapositives ajoutées ici</small></h4><div class="pn-tpls">${SS_TEMPLATES.filter(t => t.id !== 'blank').map(t => `<button type="button" class="pn-tpl" data-tpl="${t.id}"><span class="tthumb">${tplMini(t)}</span><b>${escH(t.name)}</b></button>`).join('')}</div>`;
  }
  b.innerHTML = h;
  if (panel === 'design') b.querySelectorAll('.th-mini').forEach(m => m.querySelector('.th-s').style.transform = `scale(${m.style.getPropertyValue('--k')})`);
  if (panel === 'templates') window.SWScaleMinis?.(b);
}
function onPanelClick(ev){
  const t = ev.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.ins){ const [k, v] = d.ins.split(':');
    if (k === 'text') addText(v); else if (k === 'shape') addShape(v); else if (k === 'icon') addIcon(v); else if (k === 'img') pickImage();
    else if (k === 'media'){ const src = D.media[v]; const im = new Image(); im.onload = () => { const [W, H] = dims(), kk = Math.min(1, W * .5 / im.width, H * .6 / im.height), w = Math.round(im.width * kk), h = Math.round(im.height * kk), p = centerBox(w, h); addEls([IMG(p.x, p.y, w, h, {src:'m:' + v})], 'Image'); }; im.src = src; }
    else if (k === 'table'){ const [c, r] = v.split('x'); addTable(+r, +c); } else if (k === 'chart') addChart(v); else if (k === 'block') addEls(blockEls(v), BLOCKS.find(x => x[0] === v)?.[1]);
    if (innerWidth < 760) openPanel(null); return; }
  if (V.ro && !d.tpl) return;
  if (d.th){ D.theme = {id:d.th}; ensureThemeFonts(); THUMB.clear(); renderAll(); commit('Thème'); toast(`Thème « ${DTHEMES.find(x => x.id === d.th).name} »`); return; }
  if (d.pal){ const p = PALETTES[+d.pal]; D.theme = {...D.theme, ac:p[0], ac2:p[1], ac3:p[2]}; THUMB.clear(); renderAll(); commit('Couleurs'); return; }
  if (d.reset){ D.theme = {id:D.theme.id}; THUMB.clear(); renderAll(); commit('Couleurs du thème'); return; }
  if (d.pair){ const [a, c] = PAIRS[+d.pair]; D.theme = {...D.theme, fh:a, fb:c}; ensureThemeFonts(); THUMB.clear(); renderAll(); commit('Polices'); return; }
  if (d.size){ resizeDeck(d.size); return; }
  if (d.lay){ applyLayout(d.lay); return; }
  if (d.newlay){ addSlide({layout:d.newlay}); return; }
  if (d.var){ cur().v = d.var; renderAll(); commit('Couleurs de la diapositive'); return; }
  if (d.tr != null){ cur().tr = d.tr || undefined; renderPanel(); commit('Transition'); if (d.tr) previewTransition(); return; }
  if (d.san != null){ cur().an = d.san || undefined; renderPanel(); commit('Animation'); if (d.san) previewSlideAnim(); return; }
  if (d.ean != null){ const k = d.ean, click = g$('eanClick')?.checked; setProps(x => { if (!k) delete x.an; else x.an = {k, click}; }, 'Animation', false); renderPanel(); if (k) previewAnim(selEls()); return; }
  if (d.a === 'preview'){ previewSlideAnim(); return; }
  if (d.a === 'all'){ const s = cur(); D.slides.forEach(x => { x.tr = s.tr; x.an = s.an; }); commit('Animations pour toutes'); toast('Transition et animation appliquées à toutes les diapositives'); renderPanel(); return; }
  if (d.a === 'magic'){ D.slides.forEach((x, i) => { x.tr = VARIANT_DARK[x.v] ? 'zoom' : 'fade'; x.an = VARIANT_DARK[x.v] ? 'blur' : 'rise'; }); commit('Animer la présentation'); renderPanel(); previewSlideAnim(); toast('Toute la présentation est animée · F5 pour voir'); return; }
  if (d.a === 'none'){ D.slides.forEach(x => { delete x.tr; delete x.an; x.els.forEach(e => delete e.an); }); commit('Retirer les animations'); renderPanel(); return; }
  if (d.tpl){ tplChoice(d.tpl); return; }
}
function onPanelInput(ev){
  const t = ev.target;
  if (t.id === 'pnIcQ'){ const n = nrmS(t.value); g$('pnIc').innerHTML = Object.entries(ICONS).filter(([k, v]) => !n || nrmS(k + ' ' + v[0]).includes(n)).map(([k]) => `<button type="button" data-ins="icon:${k}" title="${escH(ICONS[k][0].split(' ')[0])}">${iconSVG(k)}</button>`).join('') || '<p class="pn-hint">Aucune icône pour ce mot.</p>'; return; }
  if (t.dataset.tc && !V.ro){ D.theme = {...D.theme, [t.dataset.tc]:t.value}; THUMB.clear(); renderStage(); clearTimeout(t._t); t._t = setTimeout(() => { renderRail(); commit('Couleur du thème'); }, 300); }
}
function ensureThemeFonts(){ const t = dtheme(D.theme); ensureFont(t.fh); ensureFont(t.fb); document.fonts?.ready.then(() => { if (!g$('app').hidden){ fitTexts(); renderSel(); } }); }
/* changer de format : tout est remis à l'échelle */
function resizeDeck(size){
  if (size === D.size || !SIZES[size]) return; const [W0, H0] = dims(), [W1, H1] = SIZES[size], sx = W1 / W0, sy = H1 / H0, sf = Math.min(sx, sy);
  D.slides.forEach(s => s.els.forEach(e => {
    const cx = (e.x + e.w / 2) * sx, cy = (e.y + e.h / 2) * sy;
    if (e.t === 'img' || e.t === 'icon' || (e.t === 'shape' && ['ellipse', 'star', 'hex', 'oct', 'pent', 'heart'].includes(e.k) && Math.abs(e.w - e.h) < 2)){ e.w = Math.round(e.w * sf); e.h = Math.round(e.h * sf); if (e.t === 'img' && e.w >= W0 * .95) { e.w = W1; } if (e.t === 'img' && e.h >= H0 * .95) e.h = H1; }
    else { e.w = Math.round(e.w * sx); e.h = Math.round(e.h * (e.t === 'text' ? sf : sy)); }
    e.x = Math.round(cx - e.w / 2); e.y = Math.round(cy - e.h / 2);
    if (e.st?.fs) e.st.fs = Math.round(e.st.fs * sf * 10) / 10; if (e.fs) e.fs = Math.round(e.fs * sf);
  }));
  D.size = size; THUMB.clear(); renderAll(); commit('Format'); toast(`Format ${SIZE_NAMES[size]}`);
}
