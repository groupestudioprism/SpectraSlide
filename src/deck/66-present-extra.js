/* ---------- Présentation : stylo, surligneur, gomme, loupe, avance automatique, liens, aide ----------
   D stylo · H surligneur · E gomme · C couleur · Z loupe · X effacer le dessin · ? aide */
const INK = {tool:null, col:0, drawing:false, last:null, byslide:{}, cv:null, ctx:null, loupe:false};
const INK_COLS = ['#E5484D', '#FFC53D', '#30A46C', '#0090FF', '#FFFFFF', '#16122B'];
function inkEnsure(){
  const p = g$('present'); let cv = g$('pvInk');
  if (!cv){ cv = document.createElement('canvas'); cv.id = 'pvInk'; p.insertBefore(cv, g$('pvBar')); cv.addEventListener('pointerdown', inkDown); cv.addEventListener('pointermove', inkMove); addEventListener('pointerup', inkUp); }
  const st = g$('pvStage'), r = st.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (cv.width !== w || cv.height !== h){ const keep = INK.cv === cv && cv.width ? cv.toDataURL() : null; cv.width = w; cv.height = h; if (keep) inkDraw(keep); }
  cv.style.left = r.left + 'px'; cv.style.top = r.top + 'px'; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  INK.cv = cv; INK.ctx = cv.getContext('2d'); return cv;
}
function inkDraw(url){ const im = new Image(); im.onload = () => { INK.ctx?.drawImage(im, 0, 0, INK.cv.width, INK.cv.height); }; im.src = url; }
function inkSave(){ if (INK.cv && PV.list[PV.i] != null){ const blank = !INK.ctx.getImageData(0, 0, INK.cv.width, INK.cv.height).data.some((v, i) => i % 4 === 3 && v); INK.byslide[PV.list[PV.i]] = blank ? null : INK.cv.toDataURL(); } }
function inkLoad(i){ if (!INK.cv) return; INK.ctx.clearRect(0, 0, INK.cv.width, INK.cv.height); if (INK.byslide[i]) inkDraw(INK.byslide[i]); }
function inkTool(t){
  INK.tool = INK.tool === t ? null : t; const cv = inkEnsure(), p = g$('present');
  cv.className = INK.tool ? 'on ' + INK.tool : ''; p.classList.toggle('inking', !!INK.tool);
  p.querySelectorAll('[data-pv="pen"],[data-pv="hl"],[data-pv="erase"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pv === ({pen:'pen', hl:'hl', erase:'erase'})[INK.tool] || false));
  pvToast(INK.tool ? ({pen:'Stylo', hl:'Surligneur', erase:'Gomme'})[INK.tool] + ' · C pour changer de couleur · X pour tout effacer' : 'Stylo désactivé');
}
function inkPt(e){ const r = INK.cv.getBoundingClientRect(), k = INK.cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k, k]; }
function inkDown(e){ if (!INK.tool) return; e.preventDefault(); e.stopPropagation(); INK.drawing = true; INK.cv.setPointerCapture?.(e.pointerId); INK.last = inkPt(e); inkSeg(INK.last, INK.last); }
function inkMove(e){ if (!INK.drawing) return; const q = inkPt(e); inkSeg(INK.last, q); INK.last = q; }
function inkUp(){ if (INK.drawing){ INK.drawing = false; inkSave(); } }
function inkSeg(a, b){
  const c = INK.ctx, k = a[2], col = INK_COLS[INK.col % INK_COLS.length]; c.lineCap = c.lineJoin = 'round';
  if (INK.tool === 'erase'){ c.globalCompositeOperation = 'destination-out'; c.lineWidth = 34 * k; c.strokeStyle = '#000'; c.globalAlpha = 1; }
  else if (INK.tool === 'hl'){ c.globalCompositeOperation = 'source-over'; c.lineWidth = 26 * k; c.strokeStyle = col; c.globalAlpha = .32; }
  else { c.globalCompositeOperation = 'source-over'; c.lineWidth = 4.5 * k; c.strokeStyle = col; c.globalAlpha = 1; }
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function inkClear(){ if (!INK.cv) return; INK.ctx.clearRect(0, 0, INK.cv.width, INK.cv.height); const i = PV.list[PV.i]; if (i != null) INK.byslide[i] = null; }
function inkReset(){ INK.tool = null; INK.byslide = {}; INK.drawing = false; const cv = g$('pvInk'); if (cv){ cv.className = ''; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); } g$('present')?.classList.remove('inking'); loupeOff(); clearTimeout(PV.adv); }
function pvToast(t){ let n = g$('pvToast'); if (!n){ n = document.createElement('div'); n.id = 'pvToast'; g$('present').appendChild(n); } n.textContent = t; n.classList.add('on'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('on'), 2200); }
/* loupe */
function loupeOff(){ INK.loupe = false; g$('pvLoupe')?.remove(); g$('present')?.classList.remove('loupe'); }
function loupeToggle(){
  if (INK.loupe) return loupeOff(); INK.loupe = true; const p = g$('present'); p.classList.add('loupe');
  const lp = document.createElement('div'); lp.id = 'pvLoupe'; p.appendChild(lp); loupeFill(lp); pvToast('Loupe · Z pour la retirer');
}
function loupeFill(lp){ const cur = g$('pvStage').lastElementChild; if (!cur) return; const c = cur.cloneNode(true); c.className = 'pv-slide'; c.querySelectorAll('.el').forEach(n => { n.classList.remove('an-run', 'an-wait'); delete n.dataset.an; }); lp.innerHTML = ''; lp.appendChild(c); lp._c = c; lp._src = cur; }
function loupeMove(e){
  const lp = g$('pvLoupe'); if (!lp || !lp._c) return; const r = lp._src.getBoundingClientRect(), Z = 2.4, s = 90;
  lp.style.left = e.clientX - 110 + 'px'; lp.style.top = e.clientY - 110 + 'px';
  lp._c.style.transformOrigin = '0 0'; lp._c.style.transform = `translate(${110 - (e.clientX - r.left) * Z}px,${110 - (e.clientY - r.top) * Z}px) scale(${Z})`; lp._c.style.left = '0'; lp._c.style.top = '0'; lp._c.style.width = r.width + 'px'; lp._c.style.height = r.height + 'px';
}
/* aide */
function pvHelp(){
  let h = g$('pvHelp'); if (h){ h.remove(); return; }
  h = document.createElement('div'); h.id = 'pvHelp'; h.innerHTML = `<div><b>Raccourcis</b><button type="button" aria-label="Fermer">×</button><dl>${[['→  Espace  N', 'Suivant'], ['←  P', 'Précédent'], ['Numéro + Entrée', 'Aller à une diapositive'], ['G', 'Vue d\'ensemble'], ['S', 'Notes et minuteur'], ['D', 'Stylo'], ['H', 'Surligneur'], ['E', 'Gomme'], ['C', 'Couleur du stylo'], ['X', 'Effacer le dessin'], ['Z', 'Loupe'], ['L', 'Pointeur laser'], ['B  W', 'Écran noir / blanc'], ['F', 'Plein écran'], ['Échap', 'Quitter']].map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join('')}</dl></div>`;
  h.onclick = () => h.remove(); g$('present').appendChild(h);
}
/* touches : renvoie true si la touche est traitée ici */
function pvExtraKey(e){
  const k = e.key, K = k.length === 1 ? k.toLowerCase() : k;
  if (k === 'Escape'){ if (g$('pvHelp')){ g$('pvHelp').remove(); return true; } if (INK.tool){ inkTool(INK.tool); return true; } if (INK.loupe){ loupeOff(); return true; } return false; }
  if (K === 'd'){ inkTool('pen'); return true; } if (K === 'h'){ inkTool('hl'); return true; } if (K === 'e'){ inkTool('erase'); return true; }
  if (K === 'c' && INK.tool){ INK.col = (INK.col + 1) % INK_COLS.length; pvToast('Couleur ' + (INK.col + 1) + ' / ' + INK_COLS.length); return true; }
  if (K === 'x'){ inkClear(); return true; } if (K === 'z'){ loupeToggle(); return true; } if (k === '?'){ pvHelp(); return true; }
  return false;
}
/* à chaque diapositive : dessin de la diapositive, avance automatique */
function pvAfterShow(){
  inkEnsure(); inkLoad(PV.list[PV.i]);
  if (INK.loupe) loupeFill(g$('pvLoupe'));
  clearTimeout(PV.adv); const s = D.slides[PV.list[PV.i]];
  if (s?.adv) PV.adv = setTimeout(() => { if (!PV.on) return; if (PV.i < PV.list.length - 1) showSlide(PV.i + 1, 1); else if (D.loop) showSlide(0, 1); }, s.adv * 1000);
}
function pvLink(el){
  const u = el.dataset.lk || ''; if (/^#\d+$/.test(u)){ const n = +u.slice(1) - 1, k = PV.list.indexOf(n); if (k >= 0) showSlide(k, k > PV.i ? 1 : -1); return; }
  if (/^https?:\/\//i.test(u)) window.open(u, '_blank', 'noopener,noreferrer');
}
