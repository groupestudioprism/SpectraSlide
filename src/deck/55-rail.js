/* ---------- Le film des diapositives (vignettes à gauche), notes de l'orateur ---------- */
const THUMB = new Map();   // id → {key, html}
function thumbHTML(s){
  const key = JSON.stringify(s) + '|' + JSON.stringify(D.theme) + D.size;
  const c = THUMB.get(s.id); if (c && c.key === key) return c.html;
  const html = renderSlide(s, {}); THUMB.set(s.id, {key, html}); return html;
}
function renderRail(onlyCur){
  const l = g$('rlList'); if (!l || !D) return; const [W, H] = dims(), horiz = innerWidth < 760;
  const tw = horiz ? 112 : 150, k = tw / W;
  if (onlyCur && l.children.length === D.slides.length){
    [...l.children].forEach((n, i) => n.classList.toggle('on', i === CUR));
    const n = l.children[CUR]; n?.querySelector('.th-s') && (n.querySelector('.th-s').innerHTML = thumbHTML(D.slides[CUR]));
    n?.scrollIntoView({block:'nearest', inline:'nearest'}); return;
  }
  l.style.setProperty('--tw', tw + 'px'); l.style.setProperty('--th', Math.round(H * k) + 'px');
  l.innerHTML = D.slides.map((s, i) => `<div class="th${i === CUR ? ' on' : ''}${s.hide ? ' hid' : ''}" data-i="${i}" draggable="${V.ro ? 'false' : 'true'}" tabindex="0" role="option" aria-selected="${i === CUR}" aria-label="Diapositive ${i + 1}">
    <span class="th-n">${i + 1}</span><div class="th-m"><div class="th-s" style="transform:scale(${k})">${thumbHTML(s)}</div>${s.hide ? `<span class="th-hid" title="Masquée">${iconSVG('eye', 'currentColor', 2)}</span>` : ''}${s.notes ? '<span class="th-note" title="Notes de l\'orateur">✎</span>' : ''}</div></div>`).join('');
  l.children[CUR]?.scrollIntoView({block:'nearest', inline:'nearest'});
}
const railCurSoon = debounce(() => renderRail(true), 250);
function railMenu(anchor, i){
  const s = D.slides[i];
  openPop(anchor, `<div class="pop-list">
    <button type="button" data-rm="new">${iconSVG('arrow')}Nouvelle diapositive après</button>
    <button type="button" data-rm="dup">${IC.copy}Dupliquer<kbd>Ctrl D</kbd></button>
    <button type="button" data-rm="hide">${iconSVG('eye')}${s.hide ? 'Afficher en présentation' : 'Masquer en présentation'}</button>
    <button type="button" data-rm="up"${i === 0 ? ' disabled' : ''}>${IC.up}Monter</button><button type="button" data-rm="down"${i === D.slides.length - 1 ? ' disabled' : ''}>${IC.down}Descendre</button>
    <hr><button type="button" data-rm="del" class="danger">${IC.trash}Supprimer</button></div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-rm]'); if (!b) return; closePop(); const k = b.dataset.rm; goSlide(i);
      if (k === 'new') layoutPop(anchor, true); else if (k === 'dup') dupSlide(i); else if (k === 'hide') toggleHide(i); else if (k === 'del') delSlide(i);
      else if (k === 'up') moveSlide(i, i - 1); else if (k === 'down') moveSlide(i, i + 1); };
  });
}
function wireRail(){
  const l = g$('rlList'); let drag = -1;
  l.addEventListener('click', e => { const t = e.target.closest('.th'); if (t) goSlide(+t.dataset.i); });
  l.addEventListener('contextmenu', e => { const t = e.target.closest('.th'); if (!t || V.ro) return; e.preventDefault(); railMenu({getBoundingClientRect:() => ({left:e.clientX, right:e.clientX, top:e.clientY, bottom:e.clientY})}, +t.dataset.i); });
  l.addEventListener('dragstart', e => { const t = e.target.closest('.th'); drag = t ? +t.dataset.i : -1; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'slide'); } catch(x){} });
  l.addEventListener('dragover', e => { if (drag < 0) return; e.preventDefault(); const t = e.target.closest('.th'); l.querySelectorAll('.drop-b,.drop-a').forEach(x => x.classList.remove('drop-b', 'drop-a')); if (t){ const r = t.getBoundingClientRect(), after = innerWidth < 760 ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2; t.classList.add(after ? 'drop-a' : 'drop-b'); } });
  l.addEventListener('drop', e => { if (drag < 0) return; e.preventDefault(); const t = e.target.closest('.th'); l.querySelectorAll('.drop-b,.drop-a').forEach(x => x.classList.remove('drop-b', 'drop-a')); if (!t){ drag = -1; return; }
    const r = t.getBoundingClientRect(), after = innerWidth < 760 ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2; let to = +t.dataset.i + (after ? 1 : 0); if (to > drag) to--; const from = drag; drag = -1; moveSlide(from, to); });
  l.addEventListener('dragend', () => { drag = -1; l.querySelectorAll('.drop-b,.drop-a').forEach(x => x.classList.remove('drop-b', 'drop-a')); });
  l.addEventListener('keydown', e => {
    const t = e.target.closest('.th'); if (!t) return; const i = +t.dataset.i, mod = e.ctrlKey || e.metaKey;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); e.stopPropagation(); goSlide(i + 1); l.children[CUR]?.focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); e.stopPropagation(); goSlide(i - 1); l.children[CUR]?.focus(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && !V.ro){ e.preventDefault(); e.stopPropagation(); delSlide(i); l.children[CUR]?.focus(); }
    else if (mod && e.key.toLowerCase() === 'd'){ e.preventDefault(); e.stopPropagation(); dupSlide(i); l.children[CUR]?.focus(); }
    else if (e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); g$('stage').focus(); }
  });
  g$('rlAdd').addEventListener('click', e => layoutPop(e.currentTarget, true));
  // notes
  const nt = g$('notesIn');
  nt.addEventListener('input', () => { if (V.ro) return; cur().notes = nt.value; emitChange(); clearTimeout(nt.t); nt.t = setTimeout(() => { commit('Notes'); railCurSoon(); }, 900); });
  nt.addEventListener('keydown', e => e.stopPropagation());
  g$('notesBtn').addEventListener('click', () => toggleNotes());
}
function toggleNotes(on){ const b = g$('notesBar'); on = on ?? b.hidden; b.hidden = !on; lsSet('ss.notes', on); g$('notesBtn').setAttribute('aria-pressed', on); if (on){ syncNotes(); g$('notesIn').focus(); } requestAnimationFrame(() => { layoutStage(); renderSel(); }); }
function syncNotes(){ const nt = g$('notesIn'); if (nt && document.activeElement !== nt) nt.value = cur()?.notes || ''; if (nt) nt.readOnly = V.ro; }
