/* ---------- Actions sur les éléments et les diapositives ---------- */
function addEls(els, label = 'Ajouter'){
  if (V.ro || !els.length) return; cur().els.push(...els); renderStage(); select(els.map(e => e.id)); commit(label);
}
function centerBox(w, h){ const [W, H] = dims(); return {x:Math.round((W - w) / 2), y:Math.round((H - h) / 2)}; }
const TEXT_STYLES = {
  title:['Titre', {f:'h', fs:64, b:1, lh:1.08}, 'Ajoutez un titre'], sub:['Sous-titre', {f:'h', fs:34, b:1, lh:1.15}, 'Ajoutez un sous-titre'],
  body:['Texte', {fs:24, lh:1.45}, 'Ajoutez du texte'], kicker:['Surtitre', {...KICK, fs:16}, 'SURTITRE'], list:['Liste à puces', {fs:24, lh:1.45}, null],
  quote:['Citation', {f:'h', fs:36, i:1, lh:1.25}, '« Une phrase qui marque. »'], big:['Chiffre', {f:'h', fs:120, b:1, fc:'t:ac', lh:1}, '42 %'],
  label:['Étiquette', {fs:18, b:1, fc:'t:on', bg:'t:ac', pad:10, r:99, ha:'c'}, 'Nouveau'], small:['Légende', {fs:16, fc:'t:mut', lh:1.4}, 'Légende ou source'],
};
function addText(kind = 'body'){
  const [name, st, txt] = TEXT_STYLES[kind] || TEXT_STYLES.body, [W] = dims();
  const w = kind === 'title' ? Math.round(W * .7) : kind === 'big' ? 420 : kind === 'label' ? 220 : kind === 'kicker' ? 360 : Math.round(W * .5);
  const html = kind === 'list' ? bul(['Premier point', 'Deuxième point', 'Troisième point']) : escT(txt);
  const h = kind === 'list' ? 130 : estH(txt, st.fs, w, st.lh || 1.3) + (st.bg ? 24 : 0), p = centerBox(w, h);
  const e = T(p.x, p.y, w, h, html, {...st, ha:st.ha || (kind === 'big' || kind === 'quote' ? 'c' : 'l')});
  addEls([e], name); setTimeout(() => startEdit(e.id, 'all'), 30);
}
function addShape(k){
  const s = k === 'line' || k === 'arrowline' ? null : (k === 'pill' ? [320, 110] : k === 'arrow' || k === 'chev' ? [300, 160] : k === 'bubble' ? [300, 220] : [240, 240]);
  if (!s){ const p = centerBox(400, 20); return addEls([LN(p.x, p.y + 10, 400, 't:ink', 4, {k, a2:k === 'arrowline' ? 'arrow' : ''})], 'Ligne'); }
  const p = centerBox(s[0], s[1]); addEls([SH(k, p.x, p.y, s[0], s[1], 't:ac', k === 'round' ? {r:24} : {})], SHAPES[k]?.[0] || 'Forme');
}
function addIcon(n){ const p = centerBox(140, 140); addEls([ICO(n, p.x, p.y, 140, 't:ac')], 'Icône'); }
function addTable(r = 4, c = 3){
  const [W] = dims(), w = Math.min(W - 160, c * 260), rows = [Array.from({length:c}, (_, j) => `Colonne ${j + 1}`), ...Array.from({length:r - 1}, () => Array.from({length:c}, () => ''))];
  const t = TABLE(0, 0, w, rows); const p = centerBox(w, t.h); t.x = p.x; t.y = p.y; addEls([t], 'Tableau');
}
function addChart(ct = 'col'){
  const p = centerBox(720, 420);
  addEls([CHART(p.x, p.y, 720, 420, ct, ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin'], ct === 'pie' || ct === 'donut' ? [{n:'Part', v:[42, 26, 18, 14]}] : [{n:'2025', v:[18, 24, 21, 30, 34, 41]}, ...(ct === 'line' || ct === 'stack' ? [{n:'2026', v:[22, 28, 30, 36, 39, 48]}] : [])], {labels:ct === 'pie' || ct === 'donut' ? ['Produits', 'Services', 'Formation', 'Autres'] : ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin']})], 'Graphique');
}
/* ---------- Images : compressées (taille raisonnable pour le cloud), rangées une seule fois ---------- */
function compressImage(file, max = 1600, crop){
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Ce fichier n\'est pas une image.'));
    if (file.type === 'image/svg+xml' && file.size < 200000 && !crop){ const r = new FileReader(); r.onload = () => res({src:r.result, w:800, h:600}); r.onerror = rej; r.readAsDataURL(file); return; }
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const cl = crop || [0, 0, 0, 0], sx0 = im.naturalWidth * cl[0], sy0 = im.naturalHeight * cl[1], sw0 = Math.max(1, im.naturalWidth * (1 - cl[0] - cl[2])), sh0 = Math.max(1, im.naturalHeight * (1 - cl[1] - cl[3]));
      const k = Math.min(1, max / Math.max(sw0, sh0)), w = Math.max(1, Math.round(sw0 * k)), h = Math.max(1, Math.round(sh0 * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, sx0, sy0, sw0, sh0, 0, 0, w, h); URL.revokeObjectURL(url);
      let alpha = false; if (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'){ const d = x.getImageData(0, 0, w, h).data; for (let i = 3; i < d.length; i += 16) if (d[i] < 250){ alpha = true; break; } }
      let src = alpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .82);
      if (alpha && src.length > 400000) src = c.toDataURL('image/webp', .85);
      res({src, w, h}); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Image illisible.')); }; im.src = url;
  });
}
let imgTarget = null;
function pickImage(targetId){ if (V.ro) return; imgTarget = targetId || null; g$('edImgFile').click(); }
async function insertImageFile(file, at){
  try {
    const {src, w, h} = await compressImage(file); const ref = mediaPut(src);
    const t = imgTarget ? elById(imgTarget) : null; imgTarget = null;
    if (t && t.t === 'img'){ t.src = ref; t.px = 50; t.py = 50; renderStage(); select(t.id); commit('Image'); return; }
    const [W, H] = dims(), k = Math.min(1, (W * .5) / w, (H * .6) / h), ew = Math.round(w * k), eh = Math.round(h * k), p = at ? {x:Math.round(at.x - ew / 2), y:Math.round(at.y - eh / 2)} : centerBox(ew, eh);
    addEls([IMG(p.x, p.y, ew, eh, {src:ref})], 'Image');
    checkSize();
  } catch(e){ toast(e.message || 'Image impossible à ajouter'); }
}
function checkSize(){ const n = byteSize(); if (n > 820000) toast(`Présentation lourde (${Math.round(n / 1000)} Ko sur 950) : réduisez ou retirez des images.`); }
const byteSize = () => new TextEncoder().encode(getJSON()).length;
/* ---------- Édition des éléments sélectionnés ---------- */
function setProps(fn, label, inner = true){
  const list = selEls(); if (!list.length || V.ro) return;
  list.forEach(e => fn(e)); list.forEach(e => updateEl(e, inner)); fitTexts(list.map(e => e.id)); renderSel(); commit(label); refreshToolbar();
}
function setSt(patch, label = 'Mise en forme'){
  if (EDT && hasTextSel()){
    // sur une partie du texte seulement
    if ('b' in patch) execFmt('bold'); else if ('i' in patch) execFmt('italic'); else if ('u' in patch) execFmt('underline'); else if ('fc' in patch) execFmt('foreColor', realCol(patch.fc, curVars()));
    else if ('hl' in patch) execFmt('hiliteColor', patch.hl ? realCol(patch.hl, curVars()) : 'transparent');
    return;
  }
  const keepEdit = EDT?.id; if (EDT) stopEdit(true);
  setProps(e => { if (e.t === 'text' || e.t === 'shape' || e.t === 'table'){ e.st = {...(e.st || {})}; for (const [k, v] of Object.entries(patch)){ if (v === null) delete e.st[k]; else e.st[k] = v; }
    if (e.t === 'table'){ if (patch.fs) e.fs = patch.fs; if (patch.f) e.f = patch.f; }
    if (('b' in patch || 'i' in patch || 'u' in patch || 'fc' in patch || 'f' in patch) && e.html) e.html = stripInline(e.html, Object.keys(patch)); } }, label);
  if (keepEdit) startEdit(keepEdit);
}
/* retirer la mise en forme locale qui contredirait un réglage appliqué à tout l'élément */
function stripInline(h, keys){
  const d = document.createElement('div'); d.innerHTML = h;
  d.querySelectorAll('[style]').forEach(n => { if (keys.includes('fc')) n.style.removeProperty('color'); if (keys.includes('f')) n.style.removeProperty('font-family'); if (keys.includes('fs')) n.style.removeProperty('font-size'); if (keys.includes('b')) n.style.removeProperty('font-weight'); if (!n.getAttribute('style')) n.removeAttribute('style'); });
  if (keys.includes('b')) d.querySelectorAll('b,strong').forEach(n => n.replaceWith(...n.childNodes));
  if (keys.includes('i')) d.querySelectorAll('i,em').forEach(n => n.replaceWith(...n.childNodes));
  if (keys.includes('u')) d.querySelectorAll('u').forEach(n => n.replaceWith(...n.childNodes));
  if (keys.includes('fs')) d.querySelectorAll('font[size]').forEach(n => n.replaceWith(...n.childNodes));
  return d.innerHTML;
}
const curVars = () => slideVars(dtheme(D.theme), cur().v || 'content');
function delSel(){
  if (V.ro || !SEL.size) return; const n = SEL.size;
  cur().els = cur().els.filter(e => !SEL.has(e.id) || e.lock); SEL.clear(); renderStage(); commit(n > 1 ? `Supprimer ${n} éléments` : 'Supprimer'); refreshToolbar();
}
function dupSel(){
  const list = selEls(); if (!list.length || V.ro) return; const gm = {};
  const copies = list.map(e => { const c = JSON.parse(JSON.stringify(e)); c.id = nid(); c.x += 24; c.y += 24; c.lock = false; if (c.g) c.g = gm[c.g] || (gm[c.g] = 'g' + uidS()); return c; });
  addEls(copies, 'Dupliquer');
}
function nudge(dx, dy){ const list = selEls().filter(e => !e.lock); if (!list.length) return; list.forEach(e => { e.x += dx; e.y += dy; updateEl(e); }); renderSel(); clearTimeout(nudge.t); nudge.t = setTimeout(() => commit('Déplacer'), 400); }
function layer(dir){
  const s = cur(), ids = SEL; if (!ids.size) return;
  const sel = s.els.filter(e => ids.has(e.id)), rest = s.els.filter(e => !ids.has(e.id));
  if (dir === 'front') s.els = [...rest, ...sel]; else if (dir === 'back') s.els = [...sel, ...rest];
  else { const arr = s.els; const idx = sel.map(e => arr.indexOf(e)).sort((a, b) => dir === 'up' ? b - a : a - b);
    for (const i of idx){ const j = dir === 'up' ? i + 1 : i - 1; if (j < 0 || j >= arr.length || ids.has(arr[j].id)) continue; [arr[i], arr[j]] = [arr[j], arr[i]]; } }
  renderStage(); commit('Ordre des plans');
}
function alignSel(k){
  const list = selEls().filter(e => !e.lock); if (!list.length) return; const [W, H] = dims();
  const ref = list.length > 1 ? bbox(list) : {x:0, y:0, w:W, h:H};
  if (k === 'dh' || k === 'dv'){ if (list.length < 3) return toast('Sélectionnez au moins 3 éléments à répartir');
    const h = k === 'dh', srt = [...list].sort((a, b) => h ? a.x - b.x : a.y - b.y), tot = srt.reduce((s, e) => s + (h ? e.w : e.h), 0), span = h ? ref.w : ref.h, gap = (span - tot) / (srt.length - 1); let p = h ? ref.x : ref.y;
    srt.forEach(e => { if (h) e.x = Math.round(p); else e.y = Math.round(p); p += (h ? e.w : e.h) + gap; });
  } else list.forEach(e => { const b = bbox([e]), ox = e.x - b.x, oy = e.y - b.y;
    if (k === 'l') e.x = Math.round(ref.x + ox); if (k === 'c') e.x = Math.round(ref.x + (ref.w - b.w) / 2 + ox); if (k === 'r') e.x = Math.round(ref.x + ref.w - b.w + ox);
    if (k === 't') e.y = Math.round(ref.y + oy); if (k === 'm') e.y = Math.round(ref.y + (ref.h - b.h) / 2 + oy); if (k === 'b') e.y = Math.round(ref.y + ref.h - b.h + oy); });
  list.forEach(e => updateEl(e)); renderSel(); commit('Aligner');
}
function groupSel(){ const list = selEls(); if (list.length < 2) return toast('Sélectionnez au moins deux éléments'); const g = 'g' + uidS(); list.forEach(e => e.g = g); renderSel(); commit('Grouper'); toast('Éléments groupés · Ctrl + Maj + G pour dissocier'); }
function ungroupSel(){ const list = selEls(); if (!list.some(e => e.g)) return; list.forEach(e => delete e.g); renderSel(); commit('Dissocier'); }
function lockSel(){ const list = selEls(); if (!list.length) return; const on = !list.every(e => e.lock); list.forEach(e => e.lock = on); renderStage(); commit(on ? 'Verrouiller' : 'Déverrouiller'); refreshToolbar(); toast(on ? 'Verrouillé : il ne bouge plus' : 'Déverrouillé'); }
/* ---------- Presse-papiers (éléments entre diapositives et présentations du même navigateur) ---------- */
const CLIP = {els:null, media:{}, txt:''};
function copySel(ev, cut){
  const list = selEls(); if (!list.length || EDT) return false;
  CLIP.els = JSON.parse(JSON.stringify(list)); CLIP.media = {}; list.forEach(e => { if (e.t === 'img' && String(e.src).startsWith('m:')) CLIP.media[e.src] = mediaSrc(e.src); });
  CLIP.txt = list.map(e => (e.html || (e.rows || []).map(r => r.join('\t')).join('\n') || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, ' ').trim()).filter(Boolean).join('\n') || '[éléments SPECTRA Slide]';
  try { lsSet('ss.clip', {els:CLIP.els, txt:CLIP.txt}); } catch(x){}
  if (ev?.clipboardData){ ev.clipboardData.setData('text/plain', CLIP.txt); ev.preventDefault(); }
  if (cut){ delSel(); } else toast(list.length > 1 ? `${list.length} éléments copiés` : 'Copié');
  return true;
}
function pasteEls(){
  if (!CLIP.els || V.ro) return false; const gm = {};
  const copies = CLIP.els.map(e => { const c = JSON.parse(JSON.stringify(e)); c.id = nid(); if (c.g) c.g = gm[c.g] || (gm[c.g] = 'g' + uidS());
    if (c.t === 'img' && CLIP.media[c.src]) c.src = mediaPut(CLIP.media[c.src]);
    if (cur().els.some(x => x.x === c.x && x.y === c.y && x.t === c.t)){ c.x += 24; c.y += 24; } return c; });
  CLIP.els = copies.map(c => JSON.parse(JSON.stringify(c))); addEls(copies, 'Coller'); return true;
}
function onPaste(ev){
  if (g$('app').hidden || !g$('apDlg').hidden || !g$('spectre').hidden) return;
  const ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.id !== 'stage') return;
  const cd = ev.clipboardData; if (!cd) return;
  const file = [...(cd.files || [])].find(f => /^image\//.test(f.type)) || [...(cd.items || [])].find(i => i.kind === 'file' && /^image\//.test(i.type))?.getAsFile();
  if (EDT){
    if (file){ ev.preventDefault(); return; }
    ev.preventDefault(); const t = cd.getData('text/plain'); document.execCommand('insertText', false, t); return;
  }
  if (V.ro) return;
  if (file){ ev.preventDefault(); insertImageFile(file); return; }
  const t = cd.getData('text/plain');
  if (CLIP.els && t === CLIP.txt){ ev.preventDefault(); pasteEls(); return; }
  if (!CLIP.els){ const st = lsGet('ss.clip'); if (st && st.txt === t && st.els){ CLIP.els = st.els; CLIP.media = {}; ev.preventDefault(); pasteEls(); return; } }
  if (t && t.trim()){ ev.preventDefault(); const [W] = dims(), w = Math.round(W * .55), lines = t.trim().split(/\r?\n/).filter(x => x.trim());
    const html = lines.length > 2 && lines.every(l => l.length < 120) ? bul(lines.map(l => l.replace(/^[-•*·]\s*/, ''))) : escT(t.trim().slice(0, 4000));
    const e = T(0, 0, w, estH(t, 24, w, 1.45), html, {fs:24, lh:1.45}); const p = centerBox(w, e.h); e.x = p.x; e.y = Math.max(40, p.y); addEls([e], 'Coller du texte'); }
}
/* ---------- Diapositives ---------- */
function goSlide(i, keepSel){
  if (!D) return; if (EDT) stopEdit(); i = clamp(i, 0, D.slides.length - 1); if (i === CUR && g$('slideView').firstChild) return;
  CUR = i; if (!keepSel) SEL.clear(); renderStage(); renderRail(true); refreshToolbar(); if (panel === 'anim' || panel === 'layout') renderPanel();
}
function addSlide(spec, at = CUR + 1, label = 'Nouvelle diapositive'){
  if (V.ro) return; const s = spec?.els ? spec : buildSlide(spec || {layout:'bullets', title:'', bullets:[]});
  if (!spec?.els && spec?.layout !== 'blank'){ s.els.forEach(e => { if (e.ph === 'title' && !spec?.title) e.html = ''; if (e.ph === 'body' && !(spec?.bullets?.length) && !spec?.text) e.html = '<ul><li></li></ul>'; }); }
  s.tr = cur()?.tr || s.tr; D.slides.splice(at, 0, s); CUR = at; SEL.clear(); renderAll(); commit(label);
}
function dupSlide(i = CUR){ if (V.ro) return; const c = cloneSlide(D.slides[i]); D.slides.splice(i + 1, 0, c); CUR = i + 1; SEL.clear(); renderAll(); commit('Dupliquer la diapositive'); }
function delSlide(i = CUR){
  if (V.ro) return; if (D.slides.length <= 1){ D.slides[0] = buildSlide({layout:'blank'}); CUR = 0; renderAll(); commit('Vider la diapositive'); return; }
  D.slides.splice(i, 1); CUR = clamp(i >= D.slides.length ? D.slides.length - 1 : i, 0, D.slides.length - 1); SEL.clear(); renderAll(); commit('Supprimer la diapositive'); toast('Diapositive supprimée · Ctrl + Z pour annuler');
}
function moveSlide(from, to){ if (V.ro || from === to) return; const [s] = D.slides.splice(from, 1); D.slides.splice(to, 0, s); CUR = to; renderAll(); commit('Déplacer la diapositive'); }
function toggleHide(i = CUR){ const s = D.slides[i]; s.hide = !s.hide; renderRail(); commit(s.hide ? 'Masquer la diapositive' : 'Afficher la diapositive'); toast(s.hide ? 'Diapositive masquée pendant la présentation' : 'Diapositive affichée'); }
/* appliquer une mise en page à la diapositive en gardant son contenu (titre, texte, listes) */
function specOf(s){
  const txt = e => (e.html || '').replace(/<br\s*\/?>/g, '\n').replace(/<\/li>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const texts = s.els.filter(e => e.t === 'text' || (e.t === 'shape' && e.html)).map(e => ({e, t:txt(e), fs:e.st?.fs || 0}));
  const title = texts.find(x => x.e.ph === 'title') || [...texts].sort((a, b) => b.fs - a.fs)[0];
  const rest = texts.filter(x => x !== title && x.t);
  const listEl = rest.find(x => /<li/.test(x.e.html)); const bullets = rest.filter(x => /<li/.test(x.e.html)).length > 1 ? rest.filter(x => /<li/.test(x.e.html)).flatMap(x => x.t.split('\n')).map(x => x.trim()).filter(Boolean) : listEl ? listEl.t.split('\n').map(x => x.trim()).filter(Boolean) : rest.filter(x => x.fs <= 30 && x.t.length < 160).map(x => x.t).slice(0, 8);
  const sub = rest.find(x => x !== listEl && x.e.ph === 'sub') || rest.find(x => x !== listEl && x.fs >= 18 && x.fs <= 34 && !bullets.includes(x.t));
  const chart = s.els.find(e => e.t === 'chart'), table = s.els.find(e => e.t === 'table');
  // deux listes ou plus : colonnes gauche / droite, chacune avec le texte posé juste au-dessus
  const lists = rest.filter(x => /<li/.test(x.e.html)).sort((a, b) => a.e.x - b.e.x);
  const colOf = L => { const head = rest.filter(x => x !== L && !/<li/.test(x.e.html) && x.e.y < L.e.y && x.e.x < L.e.x + L.e.w && x.e.x + x.e.w > L.e.x).sort((a, b) => b.e.y - a.e.y)[0]; return {title:head?.t || '', bullets:L.t.split('\n').map(v => v.trim()).filter(Boolean)}; };
  const cols = lists.length >= 2 ? [colOf(lists[0]), colOf(lists[1])] : null;
  // éléments disposés en colonnes (cartes, chiffres, étapes, frise, équipe) : un élément par colonne
  const loose = rest.filter(x => !/<li/.test(x.e.html) && x.t.length < 200 && !(x.e.st?.up && x.e.y < (title?.e.y ?? 0) + 5));
  const clusters = []; for (const x of [...loose].sort((a, b) => a.e.x - b.e.x)){ const c = clusters.find(k => Math.abs(k.x - x.e.x) < 46); if (c) c.l.push(x); else clusters.push({x:x.e.x, l:[x]}); }
  const isNum = t => /^[\d\s+\-−,.%€$£kKM×x/:h]+$/.test(t) && t.length < 12;
  const colItems = clusters.filter(c => !c.l.every(x => /^\d{1,2}$/.test(x.t))).map(c => { const l = c.l.sort((a, b) => a.e.y - b.e.y); let v = ''; if (l.length > 1 && (isNum(l[0].t) || (l[0].fs >= 40 && l[0].t.length < 14))) v = l.shift().t; return {value:v || undefined, date:v || undefined, title:l[0]?.t || '', text:l.slice(1).map(x => x.t).join(' ')}; }).filter(x => x.title || x.value);
  return {title:title?.t || '', subtitle:sub?.t || '', bullets, text:rest.filter(x => x.t.length >= 160).map(x => x.t).join('\n') || '', notes:s.notes,
    chart:chart ? {type:chart.ct, labels:chart.labels, series:chart.series.map(x => ({name:x.n, values:x.v}))} : undefined, table:table ? table.rows.map(r => r.map(c => c.replace(/<[^>]+>/g, ''))) : undefined,
    left:cols?.[0], right:cols?.[1], items:colItems.length >= 2 && !cols ? colItems.slice(0, 6) : (cols ? [...cols[0].bullets, ...cols[1].bullets] : bullets).slice(0, 6).map(b => ({title:b}))};
}
function applyLayout(L){
  if (V.ro) return; const s = cur(), sp = {...specOf(s), layout:L};
  const imgs = s.els.filter(e => e.t === 'img' && e.src);
  const n = buildSlide(sp); n.id = s.id; n.notes = s.notes; n.tr = s.tr; n.an = s.an; n.bg = s.bg; n.hide = s.hide;
  // les images existantes remplissent les emplacements d'image de la nouvelle mise en page
  const slots = n.els.filter(e => e.t === 'img'); imgs.forEach((im, i) => { if (slots[i]){ slots[i].src = im.src; slots[i].px = im.px; slots[i].py = im.py; } else n.els.push(im); });
  D.slides[CUR] = n; SEL.clear(); renderAll(); commit('Mise en page'); toast(`Mise en page « ${LAYOUTS.find(x => x[0] === L)?.[1] || L} »`);
}
