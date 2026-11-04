/* ---------- Outils : rechercher et remplacer (Ctrl + H), copier / coller le style (Ctrl + Alt + C / V) ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* applique fn à chaque morceau de texte d'un élément (le HTML reste intact) ; renvoie vrai si quelque chose a changé */
function mapElText(e, fn){
  const f = h => { const d = new DOMParser().parseFromString('<body>' + h, 'text/html'), w = document.createTreeWalker(d.body, NodeFilter.SHOW_TEXT), ns = []; let ch = false;
    while (w.nextNode()) ns.push(w.currentNode); ns.forEach(n => { const t = fn(n.nodeValue); if (t !== n.nodeValue){ n.nodeValue = t; ch = true; } }); return ch ? d.body.innerHTML : h; };
  let ch = false;
  if (e.html != null){ const n = f(e.html); if (n !== e.html){ e.html = n; ch = true; } }
  if (e.rows) e.rows = e.rows.map(r => r.map(c => { const n = f(c); if (n !== c) ch = true; return n; }));
  return ch;
}
function findHits(q, cs){
  if (!q) return []; const re = new RegExp(reEsc(q), cs ? 'g' : 'gi'), hits = [];
  D.slides.forEach((s, si) => s.els.forEach(e => { if (e.html == null && !e.rows) return; const txt = e.rows ? e.rows.flat().map(plain).join(' ') : plain(e.html); const n = (txt.match(re) || []).length; if (n) hits.push({si, id:e.id, n}); }));
  return hits;
}
const FR = {q:'', r:'', cs:false, i:-1};
function findDlg(){
  if (V.ro) return;
  SWDlg.open(`<h3>Rechercher et remplacer</h3>
    <label class="fm-txt"><span>Rechercher</span><input id="frQ" autocomplete="off" value="${escH(FR.q)}"></label>
    <label class="fm-txt"><span>Remplacer par</span><input id="frR" autocomplete="off" value="${escH(FR.r)}"></label>
    <label class="pop-toggle"><input type="checkbox" id="frC" ${FR.cs ? 'checked' : ''}><div><b>Respecter la casse</b></div></label>
    <p class="dlg-p small" id="frN" aria-live="polite"></p>
    <div class="dlg-acts"><button type="button" class="ap-btn alt" data-dlg="close">Fermer</button><button type="button" class="ap-btn alt" id="frNext">Suivant</button><button type="button" class="ap-btn alt" id="frOne">Remplacer</button><button type="button" class="ap-btn" id="frAll">Tout remplacer</button></div>`, d => {
    const q = d.querySelector('#frQ'), r = d.querySelector('#frR'), c = d.querySelector('#frC'), n = d.querySelector('#frN');
    const read = () => { FR.q = q.value; FR.r = r.value; FR.cs = c.checked; }, count = () => { read(); const h = findHits(FR.q, FR.cs), t = h.reduce((a, x) => a + x.n, 0); n.textContent = !FR.q ? '' : t ? `${t} occurrence${t > 1 ? 's' : ''} dans ${h.length} élément${h.length > 1 ? 's' : ''}` : 'Aucun résultat'; return h; };
    const go = h => { if (!h.length) return; FR.i = (FR.i + 1) % h.length; const x = h[FR.i]; goSlide(x.si, true); select(x.id); };
    const rep = all => { read(); const re = new RegExp(reEsc(FR.q), FR.cs ? 'g' : 'gi'); let tot = 0, hs = findHits(FR.q, FR.cs); if (!all) hs = hs.slice(FR.i >= 0 && FR.i < hs.length ? FR.i : 0, (FR.i >= 0 && FR.i < hs.length ? FR.i : 0) + 1); if (!FR.q || !hs.length) return;
      hs.forEach(x => { const e = elById(x.id, D.slides[x.si]); if (e) mapElText(e, t => t.replace(re, () => { tot++; return FR.r; })); });
      THUMB.clear(); renderAll(); commit('Remplacer'); count(); toast(`${tot} remplacement${tot > 1 ? 's' : ''}`); };
    q.oninput = c.onchange = () => { FR.i = -1; count(); }; q.onkeydown = ev => { if (ev.key === 'Enter'){ ev.preventDefault(); go(count()); } };
    d.querySelector('#frNext').onclick = () => go(count()); d.querySelector('#frOne').onclick = () => rep(false); d.querySelector('#frAll').onclick = () => rep(true); count();
  });
}
/* style copié : remplissage, contour, effets, texte */
const STYLE_KEYS = ['fill', 'g2', 'g3', 'gt', 'ga', 'gx', 'gy', 'pat', 'pc', 'po', 'ps', 'stroke', 'sw', 'sd', 'r', 'op', 'shadow', 'fx', 'lw', 'dash', 'fc', 'mask', 'filter'];
let STYLE_CLIP = null;
function copyStyle(){ const e = selEls()[0]; if (!e) return toast('Sélectionnez un élément'); STYLE_CLIP = {t:e.t, st:e.st ? JSON.parse(JSON.stringify(e.st)) : null, p:Object.fromEntries(STYLE_KEYS.filter(k => e[k] !== undefined).map(k => [k, JSON.parse(JSON.stringify(e[k]))]))}; toast('Style copié · Ctrl + Alt + V pour l\'appliquer'); }
function pasteStyle(){
  if (!STYLE_CLIP) return toast('Copiez d\'abord un style (Ctrl + Alt + C)'); if (!SEL.size) return toast('Sélectionnez un élément');
  setProps(e => { STYLE_KEYS.forEach(k => { if (k === 'fc' && e.t !== 'icon') return; if (k in STYLE_CLIP.p && !(e.t === 'img' && ['fill', 'g2', 'g3'].includes(k))) e[k] = JSON.parse(JSON.stringify(STYLE_CLIP.p[k])); else if (!(k in STYLE_CLIP.p) && !['fc', 'lw', 'dash', 'mask', 'filter', 'r'].includes(k)) delete e[k]; });
    if (STYLE_CLIP.st && (e.t === 'text' || e.t === 'shape')){ const keep = {ha:e.st?.ha, va:e.st?.va}; e.st = {...STYLE_CLIP.st, ...Object.fromEntries(Object.entries(keep).filter(([, v]) => v))}; if (e.html) e.html = stripInline(e.html, ['fc', 'b', 'i', 'u', 'f']); } tidyEl(e); }, 'Coller le style', true);
}
