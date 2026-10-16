/* ---------- La scène : la diapositive au centre, sélection, déplacement, redimensionnement, rotation, repères, édition du texte ---------- */
const g$ = id => document.getElementById(id);
const V = {z:1, zoom:0, ro:false};          // zoom 0 = ajusté à la fenêtre
const DRAG = {mode:null};
let EDT = null;                              // élément dont le texte est en cours d'édition : {id, node}
const PAD = () => innerWidth < 760 ? 14 : 44;
function stageFit(){
  const st = g$('stage'), [W, H] = dims(); if (!st) return 1;
  const aw = st.clientWidth - PAD() * 2, ah = st.clientHeight - PAD() * 2 - (innerWidth < 760 ? 120 : 96);
  return Math.max(.1, Math.min(aw / W, ah / H));
}
function layoutStage(){
  const [W, H] = dims(), fit = stageFit(); V.z = V.zoom ? V.zoom : fit;
  const host = g$('slideHost'), st = g$('stage');
  host.style.width = Math.round(W * V.z) + 'px'; host.style.height = Math.round(H * V.z) + 'px';
  g$('slideView').style.transform = `scale(${V.z})`;
  const inn = g$('stageIn'); const padB = innerWidth < 760 ? 140 : 110;
  inn.style.width = Math.max(st.clientWidth, Math.round(W * V.z) + PAD() * 2) + 'px';
  inn.style.minHeight = Math.max(st.clientHeight, Math.round(H * V.z) + PAD() + padB) + 'px';
  inn.style.paddingTop = Math.max(PAD(), Math.round((st.clientHeight - padB - H * V.z) / 2)) + 'px';
  const zv = g$('zoomVal'); if (zv) zv.textContent = Math.round(V.z * 100) + ' %';
}
function renderStage(){
  if (!D || !cur()) return;
  if (EDT) stopEdit(true);
  layoutStage();
  g$('slideView').innerHTML = renderSlide(cur(), {edit:true});
  fitTexts(); renderSel(); updateStat();
}
/* la hauteur d'un texte suit son contenu (jamais tronqué) */
function fitTexts(ids){
  let ch = false;
  for (const e of cur().els){
    if (ids && !ids.includes(e.id)) continue;
    if (e.t !== 'text') continue; const need = textH(e.id); if (need > e.h + 1){ e.h = need; elNode(e.id).style.height = need + 'px'; ch = true; }
  }
  return ch;
}
/* hauteur réelle du contenu d'un texte */
function textH(id){ const n = elNode(id); if (!n) return 0; const h0 = n.style.height; n.style.height = 'auto'; const h = Math.ceil(n.firstElementChild ? n.firstElementChild.offsetHeight : n.offsetHeight); n.style.height = h0; return h; }
const elNode = id => g$('slideView').querySelector(`.el[data-id="${CSS.escape(id)}"]`);
function updateEl(e, inner){
  const n = elNode(e.id); if (!n) return;
  n.setAttribute('style', boxCss(e));
  if (inner){ const th = dtheme(D.theme), sv = slideVars(th, cur().v || 'content'); if (cur().bg?.c && !String(cur().bg.c).startsWith('t:')) sv.bg = cur().bg.c; n.innerHTML = elInner(e, sv, {edit:true}); n.className = `el el-${e.t}${e.lock ? ' lk' : ''}`; }
}
/* coordonnées de la diapositive à partir d'un événement souris */
function slideXY(ev){ const r = g$('slideHost').getBoundingClientRect(); return {x:(ev.clientX - r.left) / V.z, y:(ev.clientY - r.top) / V.z}; }
function bbox(list){ if (!list.length) return null; let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const e of list){ const c = corners(e); for (const p of c){ x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y); x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y); } }
  return {x:x1, y:y1, w:x2 - x1, h:y2 - y1}; }
function corners(e){ const a = (e.rot || 0) * Math.PI / 180, cx = e.x + e.w / 2, cy = e.y + e.h / 2, c = Math.cos(a), s = Math.sin(a);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => ({x:cx + i * e.w / 2 * c - j * e.h / 2 * s, y:cy + i * e.w / 2 * s + j * e.h / 2 * c})); }
/* ---------- Sélection et poignées ---------- */
function groupOf(e){ return e.g ? cur().els.filter(x => x.g === e.g) : [e]; }
function select(ids, add){ if (!add) SEL.clear(); (Array.isArray(ids) ? ids : [ids]).forEach(id => id && SEL.add(id)); renderSel(); refreshToolbar(); }
function clearSel(){ if (EDT) stopEdit(); if (!SEL.size) return; SEL.clear(); renderSel(); refreshToolbar(); }
function renderSel(){
  const o = g$('ovl'); if (!o) return; const z = V.z, list = selEls();
  let h = '';
  const one = list.length === 1 ? list[0] : null, grouped = list.length > 1 && list.every(e => e.g && e.g === list[0].g);
  for (const e of list){
    const sty = `left:${e.x * z}px;top:${e.y * z}px;width:${e.w * z}px;height:${e.h * z}px;${e.rot ? `transform:rotate(${e.rot}deg);` : ''}`;
    if (one && !V.ro){
      const lineish = e.t === 'line', tx = e.t === 'text';
      const hs = lineish ? ['w', 'e'] : tx ? ['nw', 'ne', 'se', 'sw', 'w', 'e'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      h += `<div class="sbox${EDT ? ' editing' : ''}${e.lock ? ' locked' : ''}" style="${sty}">${e.lock ? `<span class="lk-ic" title="Verrouillé">${iconSVG('lock', 'currentColor', 2.2)}</span>` : EDT ? '' : hs.map(d => `<i class="hd hd-${d}" data-h="${d}"></i>`).join('') + (e.t === 'line' ? '' : '<i class="hd-rot" data-h="rot" title="Faire pivoter"></i>')}</div>`;
    } else h += `<div class="sbox thin" style="${sty}"></div>`;
  }
  if (list.length > 1){ const b = bbox(list); h += `<div class="sbox multi${grouped ? ' grp' : ''}" style="left:${b.x * z - 4}px;top:${b.y * z - 4}px;width:${b.w * z + 8}px;height:${b.h * z + 8}px">${grouped ? '<span class="grp-tag">Groupe</span>' : ''}</div>`; }
  if (DRAG.guides) h += DRAG.guides.map(gd => gd.v ? `<div class="guide v" style="left:${gd.p * z}px"></div>` : `<div class="guide h" style="top:${gd.p * z}px"></div>`).join('');
  if (DRAG.mode === 'marquee' && DRAG.box) { const b = DRAG.box; h += `<div class="marq" style="left:${b.x * z}px;top:${b.y * z}px;width:${b.w * z}px;height:${b.h * z}px"></div>`; }
  if (DRAG.mode === 'rotate' && one) h += `<div class="rot-tip" style="left:${(one.x + one.w / 2) * z}px;top:${(one.y - 20) * z - 40}px">${Math.round(one.rot || 0)}°</div>`;
  if ((DRAG.mode === 'move' || DRAG.mode === 'resize') && DRAG.moved && one) h += `<div class="rot-tip" style="left:${(one.x + one.w / 2) * z}px;top:${(one.y + one.h) * z + 12}px">${DRAG.mode === 'resize' ? `${Math.round(one.w)} × ${Math.round(one.h)}` : `${Math.round(one.x)}, ${Math.round(one.y)}`}</div>`;
  o.innerHTML = h;
}
/* ---------- Repères magnétiques ---------- */
function snapMove(b, dx, dy, skip){
  const [W, H] = dims(), th = 6 / V.z, M = Math.round(80 * W / 1280);
  const xs = [0, W / 2, W, M, W - M], ys = [0, H / 2, H, Math.round(64 * H / 720), H - M];
  for (const e of cur().els){ if (skip.has(e.id)) continue; const r = bbox([e]); xs.push(r.x, r.x + r.w / 2, r.x + r.w); ys.push(r.y, r.y + r.h / 2, r.y + r.h); }
  const nx = b.x + dx, ny = b.y + dy, gd = []; let best = null;
  for (const [off, cand] of [[0, nx], [b.w / 2, nx + b.w / 2], [b.w, nx + b.w]]) for (const t of xs){ const d = t - cand; if (Math.abs(d) <= th && (!best || Math.abs(d) < Math.abs(best.d))) best = {d, p:t}; }
  let bestY = null;
  for (const cand of [ny, ny + b.h / 2, ny + b.h]) for (const t of ys){ const d = t - cand; if (Math.abs(d) <= th && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = {d, p:t}; }
  if (best){ dx += best.d; gd.push({v:1, p:best.p}); } if (bestY){ dy += bestY.d; gd.push({v:0, p:bestY.p}); }
  return {dx, dy, gd};
}
/* ---------- Souris ---------- */
function onStageDown(ev){
  if (ev.button !== 0 && ev.pointerType === 'mouse') return;
  const hd = ev.target.closest('[data-h]');
  if (hd && !V.ro){ ev.preventDefault(); const e = selEls()[0]; if (!e || e.lock) return; startHandle(ev, e, hd.dataset.h); return; }
  const node = ev.target.closest('.el[data-id]');
  if (EDT && node && node.dataset.id === EDT.id) return;   // sélection de texte à la souris
  if (EDT) stopEdit();
  if (!node || !g$('slideView').contains(node)){
    if (!ev.shiftKey) clearSel();
    if (ev.target.closest('#slideHost') || ev.target.closest('#stageIn')){ const p = slideXY(ev); DRAG.mode = 'marquee'; DRAG.p0 = p; DRAG.box = null; DRAG.add = ev.shiftKey; DRAG.keep = [...SEL]; }
    g$('stage').focus({preventScroll:true}); return;
  }
  ev.preventDefault(); g$('stage').focus({preventScroll:true});
  const e = elById(node.dataset.id); if (!e) return;
  const grp = ev.altKey ? [e] : groupOf(e);
  if (ev.shiftKey){ if (SEL.has(e.id)) grp.forEach(x => SEL.delete(x.id)); else grp.forEach(x => SEL.add(x.id)); renderSel(); refreshToolbar(); return; }
  if (!SEL.has(e.id)) select(grp.map(x => x.id));
  if (V.ro) return;
  const list = selEls().filter(x => !x.lock); if (!list.length) return;
  DRAG.mode = 'move'; DRAG.p0 = slideXY(ev); DRAG.start = list.map(x => ({e:x, x:x.x, y:x.y})); DRAG.b0 = bbox(list); DRAG.moved = false; DRAG.dup = ev.ctrlKey || ev.metaKey;
}
function startHandle(ev, e, h){
  const p = slideXY(ev);
  if (h === 'rot'){ DRAG.mode = 'rotate'; DRAG.e = e; DRAG.c = {x:e.x + e.w / 2, y:e.y + e.h / 2}; DRAG.r0 = e.rot || 0; return; }
  DRAG.mode = 'resize'; DRAG.e = e; DRAG.h = h; DRAG.o = {...e, st:{...(e.st || {})}}; DRAG.p0 = p; DRAG.moved = false;
}
function onStageMove(ev){
  if (!DRAG.mode) return;
  const p = slideXY(ev);
  if (DRAG.mode === 'marquee'){
    const a = DRAG.p0; DRAG.box = {x:Math.min(a.x, p.x), y:Math.min(a.y, p.y), w:Math.abs(p.x - a.x), h:Math.abs(p.y - a.y)};
    if (DRAG.box.w + DRAG.box.h > 4 / V.z){ SEL.clear(); if (DRAG.add) DRAG.keep.forEach(id => SEL.add(id));
      for (const e of cur().els){ const r = bbox([e]); if (r.x < DRAG.box.x + DRAG.box.w && r.x + r.w > DRAG.box.x && r.y < DRAG.box.y + DRAG.box.h && r.y + r.h > DRAG.box.y) groupOf(e).forEach(x => SEL.add(x.id)); } }
    renderSel(); return;
  }
  if (DRAG.mode === 'move'){
    let dx = p.x - DRAG.p0.x, dy = p.y - DRAG.p0.y;
    if (!DRAG.moved && Math.hypot(dx, dy) * V.z < 3) return;
    if (!DRAG.moved && DRAG.dup){ // Ctrl + glisser : déplace une copie
      const copies = DRAG.start.map(s => { const c = JSON.parse(JSON.stringify(s.e)); c.id = nid(); return c; });
      cur().els.push(...copies); renderStage(); select(copies.map(c => c.id)); DRAG.start = copies.map(x => ({e:x, x:x.x, y:x.y}));
    }
    DRAG.moved = true;
    if (ev.shiftKey){ if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    const sn = ev.altKey ? {dx, dy, gd:[]} : snapMove(DRAG.b0, dx, dy, new Set(DRAG.start.map(s => s.e.id)));
    for (const s of DRAG.start){ s.e.x = Math.round(s.x + sn.dx); s.e.y = Math.round(s.y + sn.dy); updateEl(s.e); }
    DRAG.guides = sn.gd; renderSel(); return;
  }
  if (DRAG.mode === 'rotate'){
    const e = DRAG.e; let a = Math.atan2(p.y - DRAG.c.y, p.x - DRAG.c.x) * 180 / Math.PI + 90;
    a = ((a % 360) + 360) % 360; if (ev.shiftKey) a = Math.round(a / 15) * 15; else { const m = Math.round(a / 45) * 45; if (Math.abs(a - m) < 3) a = m; }
    e.rot = Math.round(a % 360 * 10) / 10; if (e.rot > 180) e.rot -= 360; updateEl(e); renderSel(); return;
  }
  if (DRAG.mode === 'resize'){
    const e = DRAG.e, o = DRAG.o, h = DRAG.h, hx = h.includes('e') ? 1 : h.includes('w') ? -1 : 0, hy = h.includes('s') ? 1 : h.includes('n') ? -1 : 0;
    const a = (o.rot || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), cx0 = o.x + o.w / 2, cy0 = o.y + o.h / 2;
    const ax = cx0 + (-hx * o.w / 2) * c - (-hy * o.h / 2) * s, ay = cy0 + (-hx * o.w / 2) * s + (-hy * o.h / 2) * c;   // point opposé, fixe
    const vx = p.x - ax, vy = p.y - ay, lx = vx * c + vy * s, ly = -vx * s + vy * c;
    let w = hx ? Math.max(8, hx * lx) : o.w, hh = hy ? Math.max(8, hy * ly) : o.h;
    const corner = hx && hy, keep = corner && (ev.shiftKey || ['img', 'icon', 'chart'].includes(e.t) && !ev.altKey || e.t === 'text' || e.t === 'shape' && e.html && ev.shiftKey);
    if (keep){ const r = o.w / o.h; if (w / hh > r) hh = w / r; else w = hh * r; }
    if (e.t === 'line' && !hy) hh = o.h;
    DRAG.moved = true;
    // le centre suit : le point opposé ne bouge pas
    const ncx = ax + (hx * w / 2) * c - (hy * hh / 2) * s, ncy = ay + (hx * w / 2) * s + (hy * hh / 2) * c;
    e.w = Math.round(w); e.h = Math.round(hh); e.x = Math.round(ncx - w / 2); e.y = Math.round(ncy - hh / 2);
    if (e.t === 'text'){
      if (corner){ const k = w / o.w; e.st.fs = Math.max(6, Math.round(o.st.fs * k * 10) / 10); updateEl(e, true); }
      else { updateEl(e); const need = textH(e.id); if (need){ e.h = need; updateEl(e); } }
    } else updateEl(e, e.t === 'chart' || e.t === 'line' || e.t === 'img' && e.mask === 'arch');
    renderSel(); return;
  }
}
function onStageUp(){
  if (!DRAG.mode) return;
  const m = DRAG.mode, moved = DRAG.moved; DRAG.mode = null; DRAG.guides = null; DRAG.box = null;
  if (m === 'move' && moved) commit('Déplacer');
  else if (m === 'resize' && moved){ if (DRAG.e.t === 'chart' || DRAG.e.t === 'table') updateEl(DRAG.e, true); commit('Redimensionner'); }
  else if (m === 'rotate') commit('Faire pivoter');
  else if (m === 'marquee') refreshToolbar();
  renderSel();
}
function onStageDbl(ev){
  const node = ev.target.closest('.el[data-id]'); if (!node || V.ro) return;
  const e = elById(node.dataset.id); if (!e || e.lock) return;
  select(e.id);
  if (e.t === 'text' || e.t === 'shape') return startEdit(e.id, ev);
  if (e.t === 'table') return startEdit(e.id, ev);
  if (e.t === 'img') return pickImage(e.id);
  if (e.t === 'chart') return chartDialog(e.id);
  if (e.t === 'icon') return iconPop(g$('edBar'), e.id);
}
/* ---------- Édition du texte (dans la diapositive) ---------- */
function startEdit(id, ev){
  const e = elById(id); if (!e || V.ro) return;
  if (e.t === 'shape' && (e.html == null)){ e.html = ''; e.st = {ha:'c', va:'m', fc:'t:on', fs:24, ...(e.st || {})}; updateEl(e, true); }
  const node = elNode(id); if (!node) return;
  const tx = e.t === 'table' ? null : node.querySelector('.tx');
  EDT = {id, node};
  if (e.t === 'table'){
    node.querySelectorAll('th,td').forEach(c => c.contentEditable = 'true');
    const cell = ev ? document.elementFromPoint(ev.clientX, ev.clientY)?.closest('th,td') : node.querySelector('td,th'); (cell || node.querySelector('th,td'))?.focus();
  } else {
    tx.contentEditable = 'true'; tx.spellcheck = true; tx.focus();
    const r = document.createRange();
    if (ev === 'all') r.selectNodeContents(tx);
    else if (ev && document.caretRangeFromPoint){ const c = document.caretRangeFromPoint(ev.clientX, ev.clientY); if (c && tx.contains(c.startContainer)){ r.setStart(c.startContainer, c.startOffset); r.collapse(true); } else { r.selectNodeContents(tx); r.collapse(false); } }
    else { r.selectNodeContents(tx); if (ev !== 'all') r.collapse(false); }
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  node.classList.add('editing'); renderSel(); refreshToolbar();
}
function stopEdit(silent){
  if (!EDT) return; const {id, node} = EDT; EDT = null;
  const e = elById(id); node.classList.remove('editing');
  if (e?.t === 'table'){
    node.querySelectorAll('th,td').forEach(c => { c.contentEditable = 'false'; const r = +c.dataset.r, k = +c.dataset.c; if (e.rows[r]) e.rows[r][k] = cleanInline(c.innerHTML); });
  } else if (e){
    const tx = node.querySelector('.tx'); if (tx){ tx.contentEditable = 'false'; e.html = cleanInline(tx.innerHTML); }
    if (e.t === 'text' && !String(e.html).replace(/<[^>]+>|&nbsp;|\s/g, '') && !silent){ cur().els = cur().els.filter(x => x.id !== id); SEL.delete(id); renderStage(); commit('Supprimer le texte vide'); refreshToolbar(); return; }
  }
  try { getSelection().removeAllRanges(); } catch(x){}
  if (!silent){ commit('Texte'); renderSel(); refreshToolbar(); }
}
/* HTML de texte : on ne garde que la mise en forme simple */
function cleanInline(h){
  let s = SAN(h).replace(/<div><br><\/div>/g, '<br>').replace(/^(<br>)+$/, '');
  // les blocs <div> créés par l'édition deviennent des retours à la ligne
  s = s.replace(/<div>/g, '<br>').replace(/<\/div>/g, '').replace(/^<br>/, '');
  return s;
}
function onEditInput(){
  if (!EDT) return; const e = elById(EDT.id); if (!e) return;
  if (e.t === 'text'){ const need = textH(e.id); if (need > e.h){ e.h = need; EDT.node.style.height = need + 'px'; renderSel(); } }
  if (e.t === 'table'){ const n = EDT.node.firstElementChild; const need = Math.ceil(n.scrollHeight); if (need > e.h){ e.h = need; EDT.node.style.height = need + 'px'; renderSel(); } }
  emitChange();
}
/* mise en forme pendant l'édition, sur la sélection de texte */
function execFmt(cmd, val){ document.execCommand('styleWithCSS', false, true); document.execCommand(cmd, false, val); onEditInput(); }
const hasTextSel = () => { if (!EDT) return false; const s = getSelection(); return s.rangeCount && !s.isCollapsed && EDT.node.contains(s.anchorNode); };
