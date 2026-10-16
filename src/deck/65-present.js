/* ---------- Mode présentation : plein écran, transitions, animations, notes, vue d'ensemble, pointeur ---------- */
const PV = {on:false, i:0, list:[], step:0, steps:[], idle:0, num:'', laser:false, notes:false, t0:0, timer:0};
function visibleSlides(){ const l = D.slides.map((s, i) => s.hide ? -1 : i).filter(i => i >= 0); return l.length ? l : [0]; }
function present(from = 0, opts = {}){
  if (!D) return; if (EDT) stopEdit(); closePop(); if (panel) openPanel(null);
  PV.list = visibleSlides(); let k = PV.list.indexOf(from); if (k < 0) k = PV.list.findIndex(i => i > from); if (k < 0) k = 0;
  PV.on = true; PV.notes = !!opts.notes; PV.t0 = Date.now(); const p = g$('present'); p.hidden = false; p.classList.toggle('with-notes', PV.notes);
  ensureThemeFonts(); g$('pvStage').innerHTML = '';
  if (!opts.window && p.requestFullscreen && !document.fullscreenElement) p.requestFullscreen().catch(() => {});
  showSlide(k, 0); wake(); clearInterval(PV.timer); PV.timer = setInterval(pvClock, 1000); pvClock();
  p.focus();
}
function exitPresent(){
  if (!PV.on) return; PV.on = false; clearInterval(PV.timer);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  g$('present').hidden = true; g$('pvStage').innerHTML = ''; g$('pvGrid').hidden = true; g$('pvBlack').hidden = true;
  goSlide(PV.list[PV.i] ?? CUR); g$('stage').focus({preventScroll:true});
}
function pvScale(){ const [W, H] = dims(), st = g$('pvStage'); const w = st.clientWidth, h = st.clientHeight; return {k:Math.min(w / W, h / H), w, h, W, H}; }
function slideLayer(i){
  const s = D.slides[i], {k, w, h, W, H} = pvScale(), d = document.createElement('div');
  d.className = 'pv-slide'; d.innerHTML = renderSlide(s, {present:true}); const sl = d.firstElementChild;
  sl.style.transform = `scale(${k})`; d.style.width = W * k + 'px'; d.style.height = H * k + 'px'; d.style.left = (w - W * k) / 2 + 'px'; d.style.top = (h - H * k) / 2 + 'px';
  // animations : automatiques (avec délai) ou au clic (étapes)
  const order = s.els.map((e, j) => ({e, j})); const steps = []; let auto = 0;
  const pos = [...order].sort((a, b) => (a.e.y - b.e.y) || (a.e.x - b.e.x));
  for (const {e} of pos){
    const n = d.querySelector(`.el[data-id="${CSS.escape(e.id)}"]`); if (!n) continue;
    const an = e.an?.k || (s.an && !(e.t === 'img' && e.w >= W * .95) && !(e.t === 'shape' && e.w >= W * .95 && e.h >= H * .95) ? s.an : '');
    if (!an) continue; n.dataset.an = an;
    if (e.an?.click){ n.classList.add('an-wait'); steps.push(n); }
    else { n.style.setProperty('--d', (auto * (s.an === 'fade' ? 120 : 110) + 250) + 'ms'); n.classList.add('an-run'); auto++; }
  }
  return {d, steps};
}
function showSlide(k, dir){
  k = clamp(k, 0, PV.list.length - 1); const i = PV.list[k], s = D.slides[i], st = g$('pvStage');
  const {d, steps} = slideLayer(i); const old = [...st.children];
  const tr = dir === 0 ? '' : (dir > 0 ? s.tr : D.slides[PV.list[PV.i]]?.tr) || '';
  if (tr && old.length){ d.classList.add('tr-in', 'tr-' + tr); d.style.setProperty('--dir', dir > 0 ? 1 : -1); old.forEach(o => { o.classList.add('tr-out', 'tr-' + tr); o.style.setProperty('--dir', dir > 0 ? 1 : -1); }); }
  st.appendChild(d);
  if (tr && old.length) setTimeout(() => old.forEach(o => o.remove()), 720); else old.forEach(o => o.remove());
  PV.i = k; PV.steps = steps; PV.step = 0;
  g$('pvNum').textContent = `${k + 1} / ${PV.list.length}`;
  g$('pvProg').style.width = ((k + 1) / PV.list.length * 100) + '%';
  const nt = g$('pvNotes'); if (nt){ nt.querySelector('.pn-txt').textContent = s.notes || 'Pas de notes pour cette diapositive.'; const nx = PV.list[k + 1]; nt.querySelector('.pn-next').innerHTML = nx != null ? `<span>Suivante</span><div class="pn-nm">${renderSlide(D.slides[nx], {present:true})}</div>` : '<span>Fin de la présentation</span>'; const m = nt.querySelector('.pn-nm'); if (m){ const [W] = dims(); m.firstElementChild.style.transform = `scale(${200 / W})`; } }
}
function pvNext(){
  if (!g$('pvBlack').hidden){ g$('pvBlack').hidden = true; return; }
  if (PV.step < PV.steps.length){ const n = PV.steps[PV.step++]; n.classList.remove('an-wait'); n.style.setProperty('--d', '0ms'); n.classList.add('an-run'); return; }
  if (PV.i < PV.list.length - 1) showSlide(PV.i + 1, 1); else pvEnd();
}
function pvPrev(){ if (!g$('pvBlack').hidden){ g$('pvBlack').hidden = true; return; } if (PV.i > 0) showSlide(PV.i - 1, -1); }
function pvEnd(){ const b = g$('pvBlack'); if (!b.hidden && b.classList.contains('end')) return exitPresent(); b.className = 'pv-black end'; b.innerHTML = '<p>Fin de la présentation<br><small>Cliquez ou appuyez sur Échap pour quitter</small></p>'; b.hidden = false; }
function pvBlackout(white){ const b = g$('pvBlack'); if (!b.hidden && !b.classList.contains('end')){ b.hidden = true; return; } b.className = 'pv-black' + (white ? ' white' : ''); b.innerHTML = ''; b.hidden = false; }
function pvGrid(){
  const g = g$('pvGrid'); if (!g.hidden){ g.hidden = true; return; } const [W] = dims(), tw = Math.min(280, (innerWidth - 80) / 4);
  g.innerHTML = PV.list.map((i, k) => `<button type="button" data-k="${k}" class="${k === PV.i ? 'on' : ''}"><span class="pg-m" style="width:${tw}px"><span class="pg-s" style="transform:scale(${tw / W})">${renderSlide(D.slides[i], {present:true})}</span></span><b>${k + 1}</b></button>`).join('');
  g.hidden = false; g.querySelector('.on')?.scrollIntoView({block:'center'});
}
function pvClock(){ const s = Math.floor((Date.now() - PV.t0) / 1000), c = g$('pvClock'); if (c) c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function wake(){ const p = g$('present'); p.classList.remove('idle'); clearTimeout(PV.idle); PV.idle = setTimeout(() => p.classList.add('idle'), 2600); }
function pvKey(e){
  if (!PV.on) return; const k = e.key; e.stopPropagation();
  if (!g$('pvGrid').hidden){ if (k === 'Escape' || k.toLowerCase() === 'g'){ e.preventDefault(); g$('pvGrid').hidden = true; } return; }
  if (/^[0-9]$/.test(k)){ PV.num += k; return; }
  if (k === 'Enter' && PV.num){ e.preventDefault(); showSlide(+PV.num - 1, +PV.num - 1 > PV.i ? 1 : -1); PV.num = ''; return; }
  PV.num = '';
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter', 'n', 'N'].includes(k)){ e.preventDefault(); pvNext(); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P'].includes(k)){ e.preventDefault(); pvPrev(); }
  else if (k === 'Home'){ e.preventDefault(); showSlide(0, -1); } else if (k === 'End'){ e.preventDefault(); showSlide(PV.list.length - 1, 1); }
  else if (k === 'Escape'){ e.preventDefault(); exitPresent(); }
  else if (k === 'b' || k === 'B' || k === '.'){ pvBlackout(false); } else if (k === 'w' || k === 'W' || k === ','){ pvBlackout(true); }
  else if (k === 'g' || k === 'G'){ pvGrid(); } else if (k === 'f' || k === 'F'){ const p = g$('present'); document.fullscreenElement ? document.exitFullscreen() : p.requestFullscreen?.().catch(() => {}); }
  else if (k === 'l' || k === 'L'){ PV.laser = !PV.laser; g$('present').classList.toggle('laser', PV.laser); g$('pvLaser').hidden = !PV.laser; }
  else if (k === 's' || k === 'S'){ PV.notes = !PV.notes; g$('present').classList.toggle('with-notes', PV.notes); requestAnimationFrame(() => showSlide(PV.i, 0)); }
}
function wirePresent(){
  const p = g$('present');
  p.addEventListener('keydown', pvKey);
  p.addEventListener('mousemove', e => { wake(); if (PV.laser){ const l = g$('pvLaser'); l.style.left = e.clientX + 'px'; l.style.top = e.clientY + 'px'; } });
  g$('pvStage').addEventListener('click', e => { if (e.target.closest('a')) return; pvNext(); });
  g$('pvBlack').addEventListener('click', () => { if (g$('pvBlack').classList.contains('end')) exitPresent(); else g$('pvBlack').hidden = true; });
  p.addEventListener('contextmenu', e => { e.preventDefault(); pvPrev(); });
  g$('pvGrid').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; g$('pvGrid').hidden = true; const k = +b.dataset.k; showSlide(k, k > PV.i ? 1 : -1); });
  g$('pvBar').addEventListener('click', e => { const b = e.target.closest('[data-pv]'); if (!b) return; e.stopPropagation(); const k = b.dataset.pv;
    if (k === 'prev') pvPrev(); else if (k === 'next') pvNext(); else if (k === 'grid') pvGrid(); else if (k === 'exit') exitPresent(); else if (k === 'notes') pvKey({key:'s', stopPropagation(){}, preventDefault(){}}); else if (k === 'laser') pvKey({key:'l', stopPropagation(){}, preventDefault(){}});
    else if (k === 'fs') pvKey({key:'f', stopPropagation(){}, preventDefault(){}}); });
  let tx = null; p.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true});
  p.addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 50){ dx < 0 ? pvNext() : pvPrev(); } }, {passive:true});
  addEventListener('resize', debounce(() => { if (PV.on) showSlide(PV.i, 0); }, 150));
  document.addEventListener('fullscreenchange', () => { if (PV.on) setTimeout(() => showSlide(PV.i, 0), 60); });
}
/* aperçus dans l'éditeur */
function previewTransition(){ const v = g$('slideView'); const tr = cur().tr; if (!tr) return; v.classList.remove('tr-in'); void v.offsetWidth; v.className = 'slide-view tr-in tr-' + tr; v.style.setProperty('--dir', 1); setTimeout(() => { v.className = 'slide-view'; }, 800); previewSlideAnim(); }
function previewSlideAnim(){
  const s = cur(), [W, H] = dims(); let i = 0;
  [...s.els].sort((a, b) => (a.y - b.y) || (a.x - b.x)).forEach(e => { const an = e.an?.k || s.an; if (!an || (e.t === 'img' && e.w >= W * .95) || (e.t === 'shape' && e.w >= W * .95 && e.h >= H * .95)) return; const n = elNode(e.id); if (!n) return;
    n.classList.remove('an-run'); void n.offsetWidth; n.dataset.an = an; n.style.setProperty('--d', (i++ * 110 + 120) + 'ms'); n.classList.add('an-run'); setTimeout(() => { n.classList.remove('an-run'); delete n.dataset.an; n.style.removeProperty('--d'); }, 1600 + i * 110); });
}
