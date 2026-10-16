/* ---------- Démarrage de l'éditeur, liens avec le cloud (window.SWEditor), raccourcis ---------- */
const E2 = {userLib:{}, ro:false};
function renderAll(){ if (!D) return; if (CUR >= D.slides.length) CUR = D.slides.length - 1; renderStage(); renderRail(); refreshToolbar(); syncNotes(); if (panel === 'layout' || panel === 'anim' || panel === 'design') renderPanel(); }
const emitSoon = debounce(() => window.dispatchEvent(new CustomEvent('sw:changed')), 300);
function emitChange(now){ if (V.ro) return; now ? window.dispatchEvent(new CustomEvent('sw:changed')) : emitSoon(); }
function afterChange(){ emitChange(); railCurSoon(); refreshToolbarSoon(); }
const refreshToolbarSoon = debounce(() => { if (!EDT || !g$('edBar').contains(document.activeElement)) { const b = g$('edBar'); const u = b.querySelector('[data-k="undo"]'), r = b.querySelector('[data-k="redo"]'); if (u) u.disabled = UNDO.i <= 0; if (r) r.disabled = UNDO.i >= UNDO.list.length - 1; } }, 60);
function parseDeck(data){ let j = null; try { j = typeof data === 'string' ? JSON.parse(data || '{}') : data; } catch(e){ j = null; } return j && Array.isArray(j.slides) ? cleanDeck(j) : newDeck(); }
function load(data, opts = {}){
  if (EDT) stopEdit(true); if (PV.on) exitPresent();
  D = parseDeck(data); if (opts.name && (!D.title || D.title === 'Présentation sans titre')) D.title = opts.name;
  CUR = 0; SEL.clear(); THUMB.clear(); undoReset();
  V.ro = !!opts.readOnly; E2.ro = V.ro; document.body.classList.toggle('ro', V.ro); V.zoom = 0;
  const ti = g$('docTitle'); ti.value = D.title; ti.readOnly = V.ro || opts.canRename === false;
  const sub = g$('docSub'); sub.textContent = opts.owner ? `Partagé par ${opts.owner}${V.ro ? ' · lecture seule' : ''}` : V.ro ? 'Lecture seule' : ''; sub.hidden = !sub.textContent;
  closePop(); if (panel) openPanel(null); g$('notesBar').hidden = !lsGet('ss.notes'); g$('notesBtn').setAttribute('aria-pressed', !g$('notesBar').hidden);
  ensureThemeFonts();
  requestAnimationFrame(() => { renderAll(); document.fonts?.ready.then(() => { if (!g$('app').hidden){ if (fitTexts()) renderSel(); THUMB.clear(); renderRail(); } }); });
}
function setReadOnly(ro){ V.ro = ro; document.body.classList.toggle('ro', ro); refreshToolbar(); }
/* aperçus et métadonnées pour l'accueil et la Communauté */
const PREV_CACHE = new Map();
function metaOf(json){ const d = parseDeck(json); return {preview:previewOfDeck(d), theme:'slide', words:d.slides.length, pageSize:d.size}; }
function textOfJSON(json){ const d = parseDeck(json); return d.slides.map(s => s.els.map(e => plain(e.html || '') + ' ' + (e.rows || []).map(r => r.map(plain).join(' ')).join(' ')).join(' ') + ' ' + (s.notes || '')).join(' \n'); }
function previewFull(json){
  const d = parseDeck(json), keep = D; D = d; const [W, H] = dims(), k = 640 / W;
  try { return `<div class="pf">${d.slides.filter(s => !s.hide).slice(0, 12).map(s => `<div class="pf-s" style="width:640px;height:${Math.round(H * k)}px"><div style="transform:scale(${k});transform-origin:0 0">${renderSlide(s, {present:true})}</div></div>`).join('')}</div>`; } finally { D = keep; }
}
function fromTemplate(id, lib){
  const mine = (lib?.templates || []).find(x => x.id === id);
  if (mine){ const d = parseDeck(mine.data); d.tpl = id; return JSON.stringify(d); }
  const t = SS_TEMPLATES.find(x => x.id === id) || SS_TEMPLATES[0]; const d = tplDeck(t); d.tpl = t.id; return JSON.stringify(d);
}
function tplPreview(t){ let h = PREV_CACHE.get(t.id); if (!h){ h = t.data ? previewOfDeck(parseDeck(t.data)) : previewOfDeck(tplDeck(t)); PREV_CACHE.set(t.id, h); } return h; }
function tplMini(t){ return `<div class="mini"><div class="mini-page swdoc">${t.data ? (t.html || tplPreview(t)) : tplPreview(t)}</div></div>`; }
for (const t of window.SW_TEMPLATES){ if (t.id === 'blank') continue; Object.defineProperty(t, 'html', {get(){ return tplPreview(SS_TEMPLATES.find(x => x.id === t.id)); }}); }
function tplChoice(id){
  const t = [...(E2.userLib.templates || []), ...SS_TEMPLATES].find(x => x.id === id); if (!t) return;
  SWDlg.open(`<h3>${escH(t.name)}</h3><p class="dlg-p">${escH(t.desc || '')}</p><div class="dlg-acts"><button type="button" class="ap-btn alt" id="tcAdd"${V.ro ? ' disabled' : ''}>Ajouter ses diapositives ici</button><button type="button" class="ap-btn" id="tcNew">Nouvelle présentation</button></div>`, d => {
    d.querySelector('#tcNew').onclick = () => { SWDlg.close(); window.SWHome?.newDoc(id); };
    d.querySelector('#tcAdd').onclick = () => { SWDlg.close(); insertDeck(JSON.parse(fromTemplate(id, E2.userLib)), 'Ajouter un modèle'); };
  });
}
/* ajouter les diapositives d'une autre présentation (modèle, fichier PowerPoint) après la diapositive courante */
function insertDeck(d, label){
  if (V.ro) return; const [W0, H0] = SIZES[d.size] || SIZES['16:9'], [W, H] = dims(), sx = W / W0, sy = H / H0, sf = Math.min(sx, sy);
  const slides = d.slides.map(s => { const c = cloneSlide(s); if (sx !== 1 || sy !== 1) c.els.forEach(e => { e.x = Math.round(e.x * sx); e.y = Math.round(e.y * sy); e.w = Math.round(e.w * sx); e.h = Math.round(e.h * (e.t === 'text' ? sf : sy)); if (e.st?.fs) e.st.fs = Math.round(e.st.fs * sf); });
    c.els.forEach(e => { if (e.t === 'img' && String(e.src).startsWith('m:') && d.media?.[e.src.slice(2)]) e.src = mediaPut(d.media[e.src.slice(2)]); }); if (c.bg?.img && d.media?.[c.bg.img.slice(2)]) c.bg.img = mediaPut(d.media[c.bg.img.slice(2)]); return c; });
  D.slides.splice(CUR + 1, 0, ...slides); CUR = CUR + 1; SEL.clear(); renderAll(); commit(label); toast(`${slides.length} diapositive${slides.length > 1 ? 's' : ''} ajoutée${slides.length > 1 ? 's' : ''} · Ctrl + Z pour annuler`);
}
async function insertFileSlides(f){ try { toast('Lecture du fichier…'); const j = JSON.parse(await importFile(f)); insertDeck(j, 'Importer des diapositives'); } catch(e){ toast(e.message || 'Fichier illisible'); } }
function saveTplDlg(){ SWAsk('Enregistrer comme modèle', 'Nom du modèle', D.title, 'Enregistrer', async v => { await SWHome.saveTemplate(v); }); }
function filePop(anchor){
  openPop(anchor, `<div class="pop-menu">
    <button type="button" data-f="new"><b>Nouvelle présentation</b><span>Vierge ou à partir d'un modèle</span></button>
    <button type="button" data-f="dup"><b>Dupliquer</b><span>Une copie, ouverte tout de suite</span></button>
    <button type="button" data-f="import"><b>Ouvrir un fichier</b><span>PowerPoint (.pptx) ou SPECTRA Slide → nouvelle présentation</span></button>
    <button type="button" data-f="ins"><b>Importer des diapositives ici</b><span>Ajoute les diapositives d'un fichier PowerPoint</span></button>
    <button type="button" data-f="share"><b>Partager…</b><span>Par email ou par lien, en lecture ou modification</span></button>
    <button type="button" data-f="tpl"><b>Enregistrer comme modèle</b><span>Dans vos modèles personnels</span></button>
    <button type="button" data-f="publish"><b>Publier dans la Communauté</b><span>Proposez cette présentation comme modèle public, vérifié par Studio Prism</span></button>
    <hr><button type="button" data-f="present"><b>Présenter</b><span>Plein écran · F5 (Maj + F5 depuis cette diapositive)</span></button>
    <button type="button" data-f="print"><b>Imprimer ou PDF</b><span>Une diapositive par page</span></button>
    <button type="button" data-f="keys"><b>Raccourcis clavier</b><span>Édition, sélection, présentation</span></button>
    <hr><button type="button" data-f="home"><b>Retour à l'accueil</b><span>Vos présentations et modèles</span></button></div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; closePop(); const k = b.dataset.f;
      if (k === 'new') window.SWHome?.show('templates'); else if (k === 'dup') window.SWHome?.duplicateCurrent(); else if (k === 'import') g$('homeFile').click(); else if (k === 'ins') g$('edInsFile').click();
      else if (k === 'share') window.SWShareCurrent?.(); else if (k === 'tpl') saveTplDlg(); else if (k === 'publish') window.SWHome?.publishCurrent?.(); else if (k === 'present') present(0); else if (k === 'print') doExport('pdf'); else if (k === 'keys') shortcutsDlg(); else if (k === 'home') window.SWHome?.show('home'); };
  }, 'menu');
}
function shortcutsDlg(){
  const k = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
  SWDlg.open(`<h3>Raccourcis et astuces</h3><div class="sc-wrap"><table class="sc">
    ${k('Double-clic', 'Modifier un texte · choisir une image · saisir les données d\'un graphique')}
    ${k('<kbd>Entrée</kbd> · <kbd>Échap</kbd>', 'Modifier le texte sélectionné · terminer')}
    ${k('<kbd>T</kbd> · <kbd>R</kbd> · <kbd>C</kbd> · <kbd>L</kbd>', 'Ajouter un texte, un rectangle, un cercle, une ligne')}
    ${k('Glisser · <kbd>Maj</kbd>', 'Déplacer (les repères roses aident à aligner) · en ligne droite')}
    ${k('<kbd>Ctrl</kbd> + glisser', 'Déplacer une copie')}
    ${k('<kbd>Alt</kbd> + glisser', 'Sans repères magnétiques · sélectionner un élément d\'un groupe')}
    ${k('Flèches · <kbd>Maj</kbd>', 'Déplacer de 1 px · de 10 px')}
    ${k('<kbd>Ctrl</kbd> <kbd>D</kbd>', 'Dupliquer l\'élément (ou la diapositive)')}
    ${k('<kbd>Ctrl</kbd> <kbd>G</kbd> · <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>G</kbd>', 'Grouper · dissocier')}
    ${k('<kbd>Ctrl</kbd> <kbd>C</kbd> / <kbd>X</kbd> / <kbd>V</kbd>', 'Copier, couper, coller (aussi entre présentations, et les images copiées ailleurs)')}
    ${k('<kbd>Ctrl</kbd> <kbd>M</kbd>', 'Nouvelle diapositive')}
    ${k('<kbd>Pg Préc</kbd> · <kbd>Pg Suiv</kbd>', 'Diapositive précédente · suivante')}
    ${k('<kbd>Ctrl</kbd> <kbd>Z</kbd> · <kbd>Ctrl</kbd> <kbd>Y</kbd>', 'Annuler · rétablir')}
    ${k('<kbd>F5</kbd> · <kbd>Maj</kbd> <kbd>F5</kbd>', 'Présenter depuis le début · depuis cette diapositive')}
    ${k('En présentation', '<kbd>→</kbd> suivante · <kbd>←</kbd> précédente · <kbd>S</kbd> notes et minuteur · <kbd>G</kbd> vue d\'ensemble · <kbd>B</kbd> écran noir · <kbd>L</kbd> pointeur laser · numéro + <kbd>Entrée</kbd> · <kbd>Échap</kbd> quitter')}
    ${k('<kbd>Ctrl</kbd> <kbd>K</kbd>', 'Le Spectre : tapez ce que vous voulez faire, en français, ou demandez à l\'IA')}
  </table></div><div class="dlg-acts"><button type="button" class="ap-btn" data-dlg="close">Compris</button></div>`, null, 'wide');
}
function globalKeys(e){
  if (PV.on){ pvKey(e); return; }
  if (g$('app').hidden) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey, lk = k.length === 1 ? k.toLowerCase() : k;
  if (mod && (lk === 'k' || k === '/')){ e.preventDefault(); return g$('spectre').hidden ? openSpectre() : closeSpectre(); }
  if (k === 'F5'){ e.preventDefault(); return present(e.shiftKey ? CUR : 0); }
  if (k === 'Escape'){
    if (!g$('spectre').hidden){ if (g$('spectre').classList.contains('ai') && document.activeElement !== g$('spQ')){ drawSpectre(); return g$('spQ').focus(); } return closeSpectre(); }
    if (!g$('edPop').hidden) return closePop(); if (!g$('apDlg').hidden) return; if (EDT){ e.preventDefault(); const id = EDT.id; stopEdit(); select(id); return; } if (panel) return openPanel(panel); if (SEL.size) return clearSel();
  }
  if (mod && lk === 'p'){ e.preventDefault(); return doExport('pdf'); }
  if (mod && lk === 's'){ e.preventDefault(); window.SWHome?.flush?.(); return toast('Enregistré automatiquement'); }
  if (!g$('spectre').hidden || !g$('apDlg').hidden) return;
  const ae = document.activeElement;
  if (EDT){
    if (mod && ['b', 'i', 'u'].includes(lk)){ e.preventDefault(); execFmt({b:'bold', i:'italic', u:'underline'}[lk]); }
    if (k === 'Tab' && selEls()[0]?.t === 'table'){ e.preventDefault(); const cells = [...EDT.node.querySelectorAll('th,td')], i = cells.indexOf(document.activeElement.closest?.('th,td') || ae); const n = cells[i + (e.shiftKey ? -1 : 1)]; if (n){ n.focus(); const r = document.createRange(); r.selectNodeContents(n); getSelection().removeAllRanges(); getSelection().addRange(r); } else if (!e.shiftKey){ tableOp('row+'); startEdit(selEls()[0].id); } }
    return;
  }
  if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) return;
  if (ae && ae.closest?.('#rlList')) return;
  if (ae && ae !== document.body && !ae.closest?.('#stage') && !ae.closest?.('#edBar') && ae.id !== 'stage') return;
  if (mod && lk === 'z' && !e.shiftKey){ e.preventDefault(); return undo(); }
  if (mod && (lk === 'y' || (lk === 'z' && e.shiftKey))){ e.preventDefault(); return redo(); }
  if (V.ro){ if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(k)) goSlide(CUR + 1); if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) goSlide(CUR - 1); return; }
  if (mod && lk === 'd'){ e.preventDefault(); return SEL.size ? dupSel() : dupSlide(); }
  if (mod && lk === 'm'){ e.preventDefault(); return addSlide({layout:'bullets'}); }
  if (mod && lk === 'g'){ e.preventDefault(); return e.shiftKey ? ungroupSel() : groupSel(); }
  if (mod && lk === 'a'){ e.preventDefault(); return select(cur().els.map(x => x.id)); }
  if (k === 'PageDown'){ e.preventDefault(); return goSlide(CUR + 1); } if (k === 'PageUp'){ e.preventDefault(); return goSlide(CUR - 1); }
  if (k === 'Delete' || k === 'Backspace'){ if (SEL.size){ e.preventDefault(); return delSel(); } return; }
  if (k.startsWith('Arrow')){ e.preventDefault(); const s = e.shiftKey ? 10 : 1;
    if (!SEL.size) return goSlide(CUR + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1));
    return nudge(k === 'ArrowLeft' ? -s : k === 'ArrowRight' ? s : 0, k === 'ArrowUp' ? -s : k === 'ArrowDown' ? s : 0); }
  if ((k === 'Enter' || k === 'F2') && SEL.size === 1){ const x = selEls()[0]; if (['text', 'shape', 'table'].includes(x.t)){ e.preventDefault(); return startEdit(x.id, 'all'); } if (x.t === 'chart'){ e.preventDefault(); return chartDialog(x.id); } }
  if (k === 'Tab'){ e.preventDefault(); const els = cur().els; if (!els.length) return; const i = els.findIndex(x => SEL.has(x.id)); select(els[(i + (e.shiftKey ? -1 : 1) + els.length) % els.length].id); return; }
  if (!mod && !e.altKey && !SEL.size){ if (lk === 't') { e.preventDefault(); return addText('body'); } if (lk === 'r'){ e.preventDefault(); return addShape('rect'); } if (lk === 'c'){ e.preventDefault(); return addShape('ellipse'); } if (lk === 'l'){ e.preventDefault(); return addShape('line'); } }
}
function wire(){
  buildRays(); wireRail(); wirePresent();
  const st = g$('stage');
  st.addEventListener('pointerdown', e => { if (e.target.closest('.ed-chips')) return; onStageDown(e); });
  addEventListener('pointermove', e => onStageMove(e));
  addEventListener('pointerup', () => onStageUp());
  st.addEventListener('dblclick', onStageDbl);
  st.addEventListener('contextmenu', e => { if (V.ro || EDT && e.target.closest('.editing')) return; ctxMenu(e); });
  st.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey){ e.preventDefault(); setZoom(V.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); } }, {passive:false});
  st.addEventListener('mouseover', e => { const n = e.target.closest('.el[data-id]'); g$('slideView').querySelectorAll('.hov').forEach(x => x !== n && x.classList.remove('hov')); if (n && !SEL.has(n.dataset.id)) n.classList.add('hov'); });
  st.addEventListener('mouseleave', () => g$('slideView').querySelectorAll('.hov').forEach(x => x.classList.remove('hov')));
  g$('slideView').addEventListener('input', onEditInput);
  g$('slideView').addEventListener('keydown', e => { if (EDT && e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); const id = EDT.id; stopEdit(); select(id); } });
  // barre Prisme, tiroirs
  g$('edBar').addEventListener('mousedown', e => { if (EDT && !e.target.closest('input')) e.preventDefault(); });
  g$('edBar').addEventListener('click', onToolbar);
  g$('edRail').addEventListener('click', e => { const r = e.target.closest('[data-panel]'); if (r) openPanel(r.dataset.panel); });
  g$('edPanelClose').addEventListener('click', () => openPanel(null));
  g$('edPanelBody').addEventListener('click', onPanelClick);
  g$('edPanelBody').addEventListener('input', onPanelInput);
  g$('edPanelBody').addEventListener('keydown', e => e.stopPropagation());
  g$('edPop').addEventListener('mousedown', e => { if (EDT && !e.target.closest('input')) e.preventDefault(); });
  document.querySelector('.ed-chips').addEventListener('click', e => { const z = e.target.closest('[data-z]'); if (!z) return; const v = z.dataset.z; setZoom(v === 'fit' ? 0 : V.z * (v === '+' ? 1.15 : 1 / 1.15)); });
  // Spectre
  g$('spQ').addEventListener('input', () => { SPX.i = 0; drawSpectre(); });
  g$('spQ').addEventListener('keydown', e => { if (!((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.key === '/'))) e.stopPropagation(); if (g$('spectre').classList.contains('ai')){ if (e.key === 'Enter'){ e.preventDefault(); const b = g$('spList').querySelector('[data-ai="apply"]') || g$('spList').querySelector('[data-ai="retry"]'); if (b && !AIS.busy) b.click(); } else if (e.key === 'Escape'){ e.preventDefault(); drawSpectre(); } return; }
    if (e.key === 'ArrowDown'){ e.preventDefault(); SPX.i = Math.min(SPX.items.length - 1, SPX.i + 1); drawSpectre(); } else if (e.key === 'ArrowUp'){ e.preventDefault(); SPX.i = Math.max(0, SPX.i - 1); drawSpectre(); } else if (e.key === 'Enter'){ e.preventDefault(); runSpectre(SPX.i); } else if (e.key === 'Escape'){ e.preventDefault(); closeSpectre(); } });
  g$('spList').addEventListener('click', e => { const b = e.target.closest('[data-sp]'); if (b) return runSpectre(+b.dataset.sp); const x = e.target.closest('[data-ai]'); if (!x) return; const k = x.dataset.ai; if (k === 'back'){ drawSpectre(); g$('spQ').focus(); } else if (k === 'retry') aiAsk(AIS.prompt); else if (k === 'apply') aiApply(); });
  g$('spectre').addEventListener('mousedown', e => { if (e.target.id === 'spectre') closeSpectre(); });
  g$('spectreBtn').addEventListener('click', openSpectre);
  // en-tête
  const ti = g$('docTitle');
  ti.addEventListener('input', () => { D.title = ti.value.trim() || 'Présentation sans titre'; emitChange(); });
  ti.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter'){ e.preventDefault(); g$('stage').focus(); } });
  ti.addEventListener('blur', () => { if (!ti.value.trim()) ti.value = D.title; });
  g$('exportBtn').addEventListener('click', e => exportPop(e.currentTarget));
  g$('presentBtn').addEventListener('click', () => present(SEL.size || CUR ? CUR : 0));
  g$('fileBtn').addEventListener('click', e => filePop(e.currentTarget));
  g$('shareBtn').addEventListener('click', () => window.SWShareCurrent?.());
  g$('homeBtn').addEventListener('click', () => { if (EDT) stopEdit(); window.SWHome?.show('home'); });
  g$('edInsFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) insertFileSlides(f); });
  g$('edImgFile').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (imgTarget === '@bg'){ imgTarget = null; try { const {src} = await compressImage(f, 1920); cur().bg = {img:mediaPut(src), dim:0}; renderAll(); commit('Image de fond'); checkSize(); } catch(x){ toast(x.message); } return; }
    insertImageFile(f); });
  // presse-papiers
  document.addEventListener('copy', e => { if (g$('app').hidden || EDT || PV.on) return; const ae = document.activeElement; if (ae && /INPUT|TEXTAREA/.test(ae.tagName)) return; copySel(e); });
  document.addEventListener('cut', e => { if (g$('app').hidden || EDT || V.ro || PV.on) return; const ae = document.activeElement; if (ae && /INPUT|TEXTAREA/.test(ae.tagName)) return; if (copySel(e, true)) e.preventDefault(); });
  document.addEventListener('paste', onPaste);
  addEventListener('keydown', globalKeys);
  addEventListener('resize', debounce(() => { if (!g$('app').hidden){ layoutStage(); renderSel(); renderRail(); } }, 120));
  // glisser des fichiers : images sur la diapositive, PowerPoint = diapositives ajoutées
  st.addEventListener('dragover', e => { if ([...(e.dataTransfer?.types || [])].includes('Files')){ e.preventDefault(); st.classList.add('drop'); } });
  st.addEventListener('dragleave', e => { if (!st.contains(e.relatedTarget)) st.classList.remove('drop'); });
  st.addEventListener('drop', e => { st.classList.remove('drop'); const fs = [...(e.dataTransfer?.files || [])]; if (!fs.length) return; e.preventDefault(); if (V.ro) return;
    const node = document.elementFromPoint(e.clientX, e.clientY)?.closest('.el-img[data-id]');
    fs.forEach((f, i) => { if (/^image\//.test(f.type)){ if (node && i === 0){ imgTarget = node.dataset.id; insertImageFile(f); } else { const p = slideXY(e); insertImageFile(f, {x:p.x + i * 30, y:p.y + i * 30}); } } else if (/\.(pptx|spectraslide|json)$/i.test(f.name)) insertFileSlides(f); }); });
  // l'appli redevient visible : remise en page
  new MutationObserver(() => { if (!g$('app').hidden){ layoutStage(); renderSel(); g$('stage').focus({preventScroll:true}); } }).observe(g$('app'), {attributes:true, attributeFilter:['hidden']});
}
function init(){
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) g$('spectreKbd').textContent = '⌘ K';
  D = newDeck(); undoReset(); wire();
  window.SWScaleMinis = root => requestAnimationFrame(() => [...(root || document).querySelectorAll('.mini')].forEach(m => { const w = m.clientWidth; if (!w) return; const sl = m.querySelector('.sl'); const W = sl ? parseFloat(sl.style.width) || 1280 : 1280; m.style.setProperty('--s', w / W); }));
  window.SWThemes = {css:() => '', vals:dtheme, list:DTHEMES, key:t => t?.id || 'spectra'};
  window.SWEditor = {
    load, get:getJSON, title:() => D.title, meta:() => ({preview:previewOfDeck(D), theme:'slide', words:D.slides.length, pageSize:D.size}),
    metaOf, fromTemplate, importFile:async f => importFile(f), setReadOnly, restoreSel(){ }, setUserLib(l){ E2.userLib = l || {}; if (panel === 'templates') renderPanel(); },
    focusTitle(blank){ if (blank){ const t = cur()?.els.find(e => e.ph === 'title'); if (t){ select(t.id); setTimeout(() => startEdit(t.id, 'all'), 60); return; } } g$('stage').focus({preventScroll:true}); },
    paginate(){ layoutStage(); renderSel(); }, doExport, textOf:textOfJSON, previewFull,
    ai(p){ openSpectre(); g$('spQ').value = p; aiAsk(p); },
  };
  // version de démonstration (dossier dist) : accès aux fonctions internes pour les tests automatiques
  if (/\/dist\//.test(location.pathname)) window.__SS = code => eval(code);
  window.__swReady = true;
  window.dispatchEvent(new Event('sw:ready'));
}
init();
