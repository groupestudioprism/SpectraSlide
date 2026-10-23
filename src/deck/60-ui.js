/* ---------- Barre Prisme (contextuelle), fenêtres contextuelles, menu contextuel, état ---------- */
let popClose = null;
function openPop(anchor, html, wire, cls = ''){
  closePop(); const p = g$('edPop'); p.className = 'pop ' + cls; p.innerHTML = html; p.hidden = false;
  const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : {left:anchor.x, right:anchor.x, top:anchor.y, bottom:anchor.y};
  const w = p.offsetWidth, h = p.offsetHeight;
  p.style.left = clamp(r.left, 8, innerWidth - w - 8) + 'px'; p.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 6) + 'px';
  wire && wire(p);
  popClose = e => { if (!p.contains(e.target) && !(anchor.contains && anchor.contains(e.target))) closePop(); };
  setTimeout(() => document.addEventListener('mousedown', popClose), 0);
}
function closePop(){ const p = g$('edPop'); if (p) p.hidden = true; if (popClose) document.removeEventListener('mousedown', popClose); popClose = null; }
const STD_COLORS = ['#FFFFFF', '#E7E5EE', '#9C98AE', '#4B475E', '#16122B', '#000000', '#E5484D', '#F76B15', '#FFC53D', '#30A46C', '#12A594', '#00A2C7', '#0090FF', '#3E63DD', '#6E56CF', '#8E4EC6', '#D6409F', '#E54666'];
const T_NAMES = {'t:ac':'Accent', 't:ac2':'Accent 2', 't:ac3':'Accent 3', 't:ink':'Texte', 't:mut':'Texte secondaire', 't:bg':'Fond', 't:soft':'Fond doux', 't:line':'Filet', 't:on':'Sur accent'};
function colorPop(anchor, cur0, apply, opts = {}){
  const sv = curVars(), tc = ['t:ac', 't:ac2', 't:ac3', 't:ink', 't:mut', 't:bg', 't:soft', 't:line'];
  const recent = (lsGet('ss.recentCol') || []).slice(0, 6);
  openPop(anchor, `<p class="pop-h">Couleurs du thème <small>suivent le thème</small></p><div class="pop-sw">${tc.map(c => `<button type="button" data-c="${c}" title="${T_NAMES[c]}" style="background:${realCol(c, sv)}"${cur0 === c ? ' class="on"' : ''}></button>`).join('')}</div>
    <p class="pop-h">Couleurs</p><div class="pop-sw">${STD_COLORS.map(c => `<button type="button" data-c="${c}" style="background:${c}"${cur0 === c ? ' class="on"' : ''}></button>`).join('')}</div>
    ${recent.length ? `<p class="pop-h">Récentes</p><div class="pop-sw">${recent.map(c => `<button type="button" data-c="${c}" style="background:${c}"></button>`).join('')}</div>` : ''}
    ${opts.grad ? `<p class="pop-h">Dégradés</p><div class="pop-sw grad">${GRADS.map((g, i) => `<button type="button" data-g="${i}" style="background:linear-gradient(135deg,${realCol(g[0], sv)},${realCol(g[1], sv)})"></button>`).join('')}</div>` : ''}
    <div class="pop-row"><label class="pop-custom"><input type="color" id="popCol" value="${/^#[0-9a-f]{6}$/i.test(realCol(cur0, sv) || '') ? realCol(cur0, sv) : '#6d3bff'}"><span>Personnalisée</span></label>${opts.none !== false ? `<button type="button" class="pop-link" data-c="">${opts.noneLabel || 'Aucune'}</button>` : ''}</div>`, p => {
    const done = v => { closePop(); if (v && v.startsWith('#')){ const r = [v, ...(lsGet('ss.recentCol') || []).filter(x => x !== v)].slice(0, 6); lsSet('ss.recentCol', r); } apply(v); };
    p.onclick = e => { const b = e.target.closest('[data-c]'); if (b) return done(b.dataset.c); const g = e.target.closest('[data-g]'); if (g){ closePop(); apply(null, GRADS[+g.dataset.g]); } };
    p.querySelector('#popCol').onchange = e => done(e.target.value);
  }, 'wide');
}
const GRADS = [['t:ac', 't:ac2'], ['t:ac2', 't:ac3'], ['t:ac', 't:ac3'], ['#7B2FF7', '#00C2FF'], ['#FF5E62', '#FFC83D'], ['#0F0B1E', '#3B1F6E'], ['#22D39A', '#2D6BFF'], ['#F2F0FF', '#FFE7F1']];
function fontPop(anchor){
  const e = selEls().find(x => x.st) || {st:{}}, cf = e.st?.f || 'b', th = dtheme(D.theme);
  FONTS.forEach(f => ensureFont(f[0]));
  openPop(anchor, `<p class="pop-h">Polices du thème</p><div class="pop-list"><button type="button" data-f="h" class="${cf === 'h' ? 'on' : ''}" style="font-family:${fontStack(th.fh)}"><b>Titres</b>&nbsp;· ${escH(th.fh)}</button><button type="button" data-f="b" class="${cf === 'b' ? 'on' : ''}" style="font-family:${fontStack(th.fb)}"><b>Texte</b>&nbsp;· ${escH(th.fb)}</button></div>
    <p class="pop-h">Toutes les polices</p><div class="pop-fonts">${FONTS.map(f => `<button type="button" data-f="${escH(f[0])}" class="${cf === f[0] ? 'on' : ''}" style="font-family:${fontStack(f[0])}">${escH(f[0])}</button>`).join('')}</div>`, p => {
    p.onclick = ev => { const b = ev.target.closest('[data-f]'); if (!b) return; closePop(); setSt({f:b.dataset.f}, 'Police'); };
  }, 'wide');
}
function sizeStep(d){
  const l = selEls().filter(e => e.st || e.t === 'table'); if (!l.length) return;
  const steps = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 120, 144, 180, 220, 280];
  const f = l[0].st?.fs || l[0].fs || 24, n = d > 0 ? steps.find(s => s > f) || f + 20 : [...steps].reverse().find(s => s < f) || Math.max(6, f - 2);
  setSt({fs:n}, 'Taille du texte');
}
function alignPop(anchor){
  const st = selEls()[0]?.st || {};
  const A = [['l', 'al', 'À gauche'], ['c', 'ac', 'Centré'], ['r', 'ar', 'À droite'], ['j', 'aj', 'Justifié']], VV = [['t', 'Haut'], ['m', 'Milieu'], ['b', 'Bas']];
  openPop(anchor, `<p class="pop-h">Alignement</p><div class="pop-row4">${A.map(([k, ic, t]) => `<button type="button" data-ha="${k}" class="${(st.ha || 'l') === k ? 'on' : ''}">${IC[ic]}${t}</button>`).join('')}</div>
    <p class="pop-h">Dans la boîte</p><div class="seg">${VV.map(([k, t]) => `<button type="button" data-va="${k}" aria-checked="${(st.va || 't') === k}">${t}</button>`).join('')}</div>`, p => {
    p.onclick = e => { const a = e.target.closest('[data-ha]'), v = e.target.closest('[data-va]'); if (a){ closePop(); setSt({ha:a.dataset.ha}, 'Alignement'); } if (v){ closePop(); setSt({va:v.dataset.va}, 'Alignement vertical'); } };
  });
}
function spacingPop(anchor){
  const st = selEls()[0]?.st || {};
  openPop(anchor, `<p class="pop-h">Interligne <small id="lhV">${(st.lh || 1.3).toFixed(2).replace('.', ',')}</small></p><div class="pop-rg"><input type="range" id="lhR" min=".8" max="2.4" step=".05" value="${st.lh || 1.3}"></div>
    <p class="pop-h">Espacement des lettres <small id="lsV">${Math.round((st.ls || 0) * 100)}</small></p><div class="pop-rg"><input type="range" id="lsR" min="-.06" max=".4" step=".01" value="${st.ls || 0}"></div>`, p => {
    const live = (k, v) => { selEls().forEach(e => { if (e.st){ e.st[k] = v; updateEl(e, true); } }); fitTexts(); renderSel(); };
    p.querySelector('#lhR').oninput = e => { p.querySelector('#lhV').textContent = (+e.target.value).toFixed(2).replace('.', ','); live('lh', +e.target.value); };
    p.querySelector('#lsR').oninput = e => { p.querySelector('#lsV').textContent = Math.round(e.target.value * 100); live('ls', +e.target.value); };
    p.querySelectorAll('input').forEach(i => i.onchange = () => commit('Espacement'));
  });
}
function effectsPop(anchor){
  const e = selEls()[0], st = e?.st || {};
  openPop(anchor, `<div class="pop-list">
    <label class="pop-toggle"><input type="checkbox" data-x="up" ${st.up ? 'checked' : ''}><div><b>Capitales</b><small>Tout le texte en majuscules</small></div></label>
    <label class="pop-toggle"><input type="checkbox" data-x="sh" ${st.sh ? 'checked' : ''}><div><b>Ombre du texte</b><small>Lisible sur une photo</small></div></label>
    <label class="pop-toggle"><input type="checkbox" data-x="bg" ${st.bg ? 'checked' : ''}><div><b>Étiquette</b><small>Un fond coloré derrière le texte</small></div></label>
    <label class="pop-toggle"><input type="checkbox" data-x="s" ${st.s ? 'checked' : ''}><div><b>Barré</b><small>Ligne au milieu du texte</small></div></label></div>
    ${st.bg ? `<div class="pop-row"><span>Couleur de l'étiquette</span><button type="button" class="pop-link" id="bgCol">Choisir</button></div>` : ''}`, p => {
    p.onchange = ev => { const x = ev.target.dataset.x; if (!x) return; const on = ev.target.checked; closePop();
      setSt(x === 'bg' ? (on ? {bg:'t:soft', pad:12, r:10} : {bg:null}) : {[x]:on ? 1 : null}, 'Effet'); };
    p.querySelector('#bgCol')?.addEventListener('click', () => colorPop(anchor, st.bg, v => setSt({bg:v || null}, 'Étiquette')));
  });
}
function opacityPop(anchor){
  const e = selEls()[0]; if (!e) return; const v0 = Math.round((e.op ?? 1) * 100);
  openPop(anchor, `<p class="pop-h">Transparence <small id="opV">${v0} %</small></p><div class="pop-rg"><input type="range" id="opR" min="5" max="100" step="1" value="${v0}"></div>
    <p class="pop-h">Ombre portée</p><div class="seg">${[[0, 'Aucune'], [12, 'Légère'], [28, 'Marquée'], [50, 'Forte']].map(([k, t]) => `<button type="button" data-sh="${k}" aria-checked="${(e.shadow || 0) === k}">${t}</button>`).join('')}</div>`, p => {
    p.querySelector('#opR').oninput = ev => { p.querySelector('#opV').textContent = ev.target.value + ' %'; selEls().forEach(x => { x.op = +ev.target.value / 100; if (x.op >= 1) delete x.op; updateEl(x); }); };
    p.querySelector('#opR').onchange = () => commit('Transparence');
    p.onclick = ev => { const b = ev.target.closest('[data-sh]'); if (!b) return; closePop(); setProps(x => { x.shadow = +b.dataset.sh || undefined; }, 'Ombre', false); };
  });
}
function posPop(anchor){
  const l = selEls(), many = l.length > 1;
  openPop(anchor, `<p class="pop-h">Aligner ${many ? 'la sélection' : 'sur la diapositive'}</p><div class="pop-row4 six">
      ${[['l', 'À gauche', 'M4 4v16M8 7h10v4H8zM8 14h6v4H8z'], ['c', 'Centre', 'M12 3v18M6 7h12v4H6zM8 14h8v4H8z'], ['r', 'À droite', 'M20 4v16M6 7h10v4H6zM10 14h6v4h-6z'], ['t', 'En haut', 'M4 4h16M7 8h4v10H7zM14 8h4v6h-4z'], ['m', 'Milieu', 'M3 12h18M7 6h4v12H7zM14 8h4v8h-4z'], ['b', 'En bas', 'M4 20h16M7 6h4v10H7zM14 10h4v6h-4z']].map(([k, t, d]) => `<button type="button" data-al="${k}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg>${t}</button>`).join('')}</div>
    ${l.length > 2 ? `<div class="pop-row4"><button type="button" data-al="dh"><svg viewBox="0 0 24 24"><path d="M4 4v16M20 4v16M9 8h6v8H9z"/></svg>Répartir ↔</button><button type="button" data-al="dv"><svg viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 9h8v6H8z"/></svg>Répartir ↕</button></div>` : ''}
    <p class="pop-h">Plans</p><div class="pop-row4"><button type="button" data-ly="front">${IC.up}Premier plan</button><button type="button" data-ly="up">${IC.up}Avancer</button><button type="button" data-ly="down">${IC.down}Reculer</button><button type="button" data-ly="back">${IC.down}Arrière-plan</button></div>
    <div class="pop-list"><hr>${many ? `<button type="button" data-x="group">${iconSVG('layers')}Grouper<kbd>Ctrl G</kbd></button>` : ''}${l.some(e => e.g) ? `<button type="button" data-x="ungroup">${iconSVG('grid')}Dissocier<kbd>Ctrl Maj G</kbd></button>` : ''}
    <button type="button" data-x="lock">${iconSVG('lock')}${l.every(e => e.lock) ? 'Déverrouiller' : 'Verrouiller la position'}</button></div>`, p => {
    p.onclick = e => { const a = e.target.closest('[data-al]'), y = e.target.closest('[data-ly]'), x = e.target.closest('[data-x]'); if (!a && !y && !x) return; closePop();
      if (a) alignSel(a.dataset.al); if (y) layer(y.dataset.ly); if (x?.dataset.x === 'group') groupSel(); if (x?.dataset.x === 'ungroup') ungroupSel(); if (x?.dataset.x === 'lock') lockSel(); };
  }, 'wide');
}
const ANIMS = [['', 'Aucune'], ['fade', 'Fondu'], ['rise', 'Monter'], ['drop', 'Descendre'], ['left', 'Glisser'], ['zoom', 'Zoom'], ['pop', 'Rebond'], ['wipe', 'Balayage'], ['blur', 'Mise au point'], ['type', 'Machine à écrire']];
function animPop(anchor){
  const l = selEls(); if (!l.length) return; const an = l[0].an || {};
  openPop(anchor, `<p class="pop-h">Animation d'entrée <small>pendant la présentation</small></p><div class="pop-chips">${ANIMS.map(([k, t]) => `<button type="button" data-an="${k}" aria-pressed="${(an.k || '') === k}">${t}</button>`).join('')}</div>
    <div class="pop-list"><hr><label class="pop-toggle"><input type="checkbox" id="anClick" ${an.click ? 'checked' : ''}><div><b>Au clic</b><small>Apparaît quand vous avancez, au lieu d'apparaître tout seul</small></div></label></div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-an]'); if (!b) return; const k = b.dataset.an; setProps(x => { if (!k) delete x.an; else x.an = {k, click:p.querySelector('#anClick').checked}; }, 'Animation', false); p.querySelectorAll('[data-an]').forEach(x => x.setAttribute('aria-pressed', x === b)); if (k) previewAnim(selEls()); };
    p.querySelector('#anClick').onchange = e => setProps(x => { if (x.an) x.an.click = e.target.checked; }, 'Animation au clic', false);
  });
}
function previewAnim(list){ list.forEach((e, i) => { const n = elNode(e.id); if (!n || !e.an) return; n.classList.remove('an-run'); n.style.removeProperty('--d'); void n.offsetWidth; n.dataset.an = e.an.k; n.style.setProperty('--d', i * 90 + 'ms'); n.classList.add('an-run'); setTimeout(() => { n.classList.remove('an-run'); delete n.dataset.an; }, 1400 + i * 90); }); }
/* fond de la diapositive */
function bgPop(anchor){
  const s = cur(), sv = curVars();
  openPop(anchor, `<p class="pop-h">Fond de la diapositive</p><div class="pop-sw">${['', 't:soft', 't:ac', 't:ac2', 't:ink', ...STD_COLORS.slice(0, 7)].map(c => `<button type="button" data-c="${c}" title="${c ? T_NAMES[c] || c : 'Fond du thème'}" style="background:${c ? realCol(c, sv) : `linear-gradient(135deg,${sv.bg} 50%,${sv.soft} 50%)`}"${(s.bg?.c || '') === c && !s.bg?.g && !s.bg?.img ? ' class="on"' : ''}></button>`).join('')}</div>
    <p class="pop-h">Dégradés</p><div class="pop-sw grad">${GRADS.map((g, i) => `<button type="button" data-g="${i}" style="background:linear-gradient(135deg,${realCol(g[0], sv)},${realCol(g[1], sv)})"></button>`).join('')}</div>
    <div class="pop-list"><hr><button type="button" data-b="img">${IC.img}Image de fond…</button>${s.bg?.img ? `<label class="pop-toggle"><input type="range" id="bgDim" min="0" max=".8" step=".05" value="${s.bg.dim || 0}"><div><b>Assombrir l'image</b></div></label>` : ''}
    <label class="pop-toggle"><input type="checkbox" id="bgDeco" ${s.nodeco ? '' : 'checked'}><div><b>Décor du thème</b><small>Les formes dessinées par le thème</small></div></label>
    <button type="button" data-b="custom">${IC.color}Couleur personnalisée…</button><button type="button" data-b="all">${IC.copy}Appliquer ce fond à toutes les diapositives</button></div>`, p => {
    p.onclick = e => { const c = e.target.closest('[data-c]'), g = e.target.closest('[data-g]'), b = e.target.closest('[data-b]');
      if (c){ closePop(); s.bg = c.dataset.c ? {c:c.dataset.c} : undefined; if (!s.bg) delete s.bg; renderAll(); commit('Fond'); }
      if (g){ closePop(); s.bg = {g:GRADS[+g.dataset.g], a:135}; renderAll(); commit('Fond dégradé'); }
      if (b?.dataset.b === 'img'){ closePop(); imgTarget = '@bg'; g$('edImgFile').click(); }
      if (b?.dataset.b === 'custom'){ colorPop(anchor, s.bg?.c, v => { if (v){ s.bg = {c:v}; renderAll(); commit('Fond'); } }, {none:false}); }
      if (b?.dataset.b === 'all'){ closePop(); D.slides.forEach(x => { if (x !== s){ if (s.bg) x.bg = JSON.parse(JSON.stringify(s.bg)); else delete x.bg; x.nodeco = s.nodeco; } }); renderAll(); commit('Fond pour toutes'); toast('Fond appliqué à toutes les diapositives'); } };
    p.querySelector('#bgDeco').onchange = e => { s.nodeco = !e.target.checked || undefined; renderAll(); commit('Décor'); };
    p.querySelector('#bgDim')?.addEventListener('input', e => { s.bg.dim = +e.target.value; renderStage(); });
    p.querySelector('#bgDim')?.addEventListener('change', () => { commit('Fond'); renderRail(true); });
  }, 'wide');
}
function layoutMini(k){
  const R = (x, y, w, h, o = 1, r = 1.5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" opacity="${o}"/>`;
  const m = {title:R(8, 18, 40, 6) + R(8, 28, 26, 3, .45), section:R(8, 12, 12, 8, .9) + R(8, 26, 36, 5), bullets:R(8, 7, 30, 4) + R(8, 17, 44, 2.5, .45) + R(8, 23, 44, 2.5, .45) + R(8, 29, 36, 2.5, .45),
    text:R(8, 7, 30, 4) + R(8, 17, 48, 2.5, .45) + R(8, 22, 48, 2.5, .45) + R(8, 27, 40, 2.5, .45), two:R(8, 7, 30, 4) + R(8, 17, 22, 2.5, .8) + R(8, 23, 22, 2.5, .45) + R(34, 17, 22, 2.5, .8) + R(34, 23, 22, 2.5, .45),
    image:R(6, 10, 22, 4) + R(6, 19, 22, 2.5, .45) + R(6, 24, 18, 2.5, .45) + R(34, 0, 30, 40, .3, 0), cards:R(8, 6, 26, 4) + R(6, 15, 16, 19, .3) + R(24, 15, 16, 19, .3) + R(42, 15, 16, 19, .3),
    stats:R(8, 6, 26, 4) + R(8, 17, 12, 7) + R(26, 17, 12, 7) + R(44, 17, 12, 7) + R(8, 27, 12, 2.5, .45) + R(26, 27, 12, 2.5, .45) + R(44, 27, 12, 2.5, .45), stat:R(8, 8, 30, 14) + R(8, 26, 24, 3.5, .7),
    process:R(8, 6, 26, 4) + '<path d="M6 17h13l3 4-3 4H6zM22 17h13l3 4-3 4H22zM38 17h13l3 4-3 4H38z"/>', timeline:R(8, 6, 26, 4) + R(6, 21, 52, 1.2, .5) + '<circle cx="12" cy="21.6" r="2.4"/><circle cx="30" cy="21.6" r="2.4"/><circle cx="48" cy="21.6" r="2.4"/>',
    compare:R(8, 6, 26, 4) + R(6, 14, 25, 21, .3) + R(33, 14, 25, 21, .85), chart:R(8, 6, 26, 4) + R(8, 24, 5, 10) + R(16, 18, 5, 16) + R(24, 21, 5, 13) + R(32, 14, 5, 20) + R(44, 18, 14, 3, .45),
    table:R(8, 6, 26, 4) + R(8, 15, 48, 4) + R(8, 21, 48, 3, .3) + R(8, 26, 48, 3, .3) + R(8, 31, 48, 3, .3), agenda:R(6, 12, 16, 6) + '<circle cx="30" cy="11" r="2.5"/><circle cx="30" cy="20" r="2.5"/><circle cx="30" cy="29" r="2.5"/>' + R(35, 10, 20, 2.5, .6) + R(35, 19, 20, 2.5, .6) + R(35, 28, 20, 2.5, .6),
    quote:'<text x="6" y="20" font-size="22" font-weight="800" opacity=".35">“</text>' + R(14, 16, 40, 4) + R(14, 23, 30, 4) + R(14, 31, 14, 2.5, .45), team:R(8, 6, 26, 4) + '<circle cx="14" cy="21" r="6" opacity=".35"/><circle cx="32" cy="21" r="6" opacity=".35"/><circle cx="50" cy="21" r="6" opacity=".35"/>' + R(9, 30, 10, 2.5) + R(27, 30, 10, 2.5) + R(45, 30, 10, 2.5),
    big:R(10, 15, 44, 5) + R(16, 23, 32, 5), photo:R(0, 0, 64, 40, .3, 0) + R(6, 26, 30, 5), end:R(18, 15, 28, 7) + R(22, 26, 20, 3, .45), blank:''};
  return `<svg viewBox="0 0 64 40" fill="currentColor">${m[k] || ''}</svg>`;
}
function layoutPop(anchor, isNew){
  openPop(anchor, `<p class="pop-h">${isNew ? 'Nouvelle diapositive' : 'Mise en page de cette diapositive'}<small>${isNew ? 'choisissez une mise en page' : 'le contenu est conservé'}</small></p>
    <div class="lay-grid">${LAYOUTS.map(([k, t]) => `<button type="button" data-lay="${k}" title="${escH(LAYOUTS.find(x => x[0] === k)[2])}"><span class="lay-m">${layoutMini(k)}</span><b>${escH(t)}</b></button>`).join('')}</div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-lay]'); if (!b) return; closePop(); if (isNew) addSlide({layout:b.dataset.lay}); else applyLayout(b.dataset.lay); };
  }, 'lay');
}
function iconPop(anchor, replaceId){
  const draw = q => { const n = nrmS(q); return Object.entries(ICONS).filter(([k, v]) => !n || nrmS(k + ' ' + v[0]).includes(n)).map(([k]) => `<button type="button" data-ic="${k}" title="${escH(ICONS[k][0].split(' ')[0])}">${iconSVG(k)}</button>`).join('') || '<p class="pop-none">Aucune icône</p>'; };
  openPop(anchor, `<div class="pop-search">${IC.search}<input id="icQ" placeholder="Chercher une icône (équipe, argent, idée…)"></div><div class="pop-icons" id="icG">${draw('')}</div>`, p => {
    p.querySelector('#icQ').oninput = e => { p.querySelector('#icG').innerHTML = draw(e.target.value); };
    p.querySelector('#icQ').onkeydown = e => e.stopPropagation();
    p.onclick = e => { const b = e.target.closest('[data-ic]'); if (!b) return; closePop(); const t = replaceId && elById(replaceId); if (t){ t.n = b.dataset.ic; updateEl(t, true); commit('Icône'); } else addIcon(b.dataset.ic); };
    setTimeout(() => p.querySelector('#icQ').focus(), 30);
  }, 'wide');
}
const nrmS = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function linePop(anchor){
  const e = selEls()[0];
  openPop(anchor, `<p class="pop-h">Épaisseur <small id="lwV">${e.lw || 3} px</small></p><div class="pop-rg"><input type="range" id="lwR" min="1" max="24" step="1" value="${e.lw || 3}"></div>
    <p class="pop-h">Style</p><div class="seg">${[['', 'Plein'], ['dash', 'Tirets'], ['dot', 'Points']].map(([k, t]) => `<button type="button" data-ds="${k}" aria-checked="${(e.dash || '') === k}">${t}</button>`).join('')}</div>
    <p class="pop-h">Extrémités</p><div class="seg">${[['', '', 'Aucune'], ['', 'arrow', 'Flèche →'], ['arrow', 'arrow', '↔'], ['dot', 'dot', 'Points']].map(([a, b, t]) => `<button type="button" data-a1="${a}" data-a2="${b}" aria-checked="${(e.a1 || '') === a && (e.a2 || (e.k === 'arrowline' ? 'arrow' : '')) === b}">${t}</button>`).join('')}</div>`, p => {
    p.querySelector('#lwR').oninput = ev => { p.querySelector('#lwV').textContent = ev.target.value + ' px'; selEls().forEach(x => { x.lw = +ev.target.value; updateEl(x, true); }); };
    p.querySelector('#lwR').onchange = () => commit('Épaisseur');
    p.onclick = ev => { const d = ev.target.closest('[data-ds]'), a = ev.target.closest('[data-a1]'); if (d) setProps(x => { x.dash = d.dataset.ds || undefined; }, 'Style de ligne'); if (a) setProps(x => { x.a1 = a.dataset.a1; x.a2 = a.dataset.a2; x.k = 'line'; }, 'Extrémités'); if (d || a) closePop(); };
  });
}
function strokePop(anchor){
  const e = selEls()[0];
  openPop(anchor, `<p class="pop-h">Contour <small id="swV">${e.sw || 0} px</small></p><div class="pop-rg"><input type="range" id="swR" min="0" max="30" step="1" value="${e.sw || 0}"></div>
    <div class="pop-row"><span>Couleur du contour</span><button type="button" class="pop-link" id="stCol">Choisir</button></div>
    ${e.k === 'round' || e.k === 'rect' || e.t === 'img' ? `<p class="pop-h">Arrondi des coins <small id="rV">${e.r || 0} px</small></p><div class="pop-rg"><input type="range" id="rR" min="0" max="${Math.round(Math.min(e.w, e.h) / 2)}" step="1" value="${e.r || 0}"></div>` : ''}`, p => {
    p.querySelector('#swR').oninput = ev => { p.querySelector('#swV').textContent = ev.target.value + ' px'; selEls().forEach(x => { x.sw = +ev.target.value; if (x.sw && !x.stroke) x.stroke = 't:ink'; updateEl(x, true); }); };
    p.querySelector('#swR').onchange = () => commit('Contour');
    p.querySelector('#rR')?.addEventListener('input', ev => { p.querySelector('#rV').textContent = ev.target.value + ' px'; selEls().forEach(x => { x.r = +ev.target.value; if (x.k === 'rect' && x.r) x.k = 'round'; if (x.t === 'img') x.mask = 'none'; updateEl(x, true); }); });
    p.querySelector('#rR')?.addEventListener('change', () => commit('Arrondi'));
    p.querySelector('#stCol').onclick = () => colorPop(anchor, e.stroke, v => setProps(x => { x.stroke = v || undefined; if (v && !x.sw) x.sw = 3; }, 'Couleur du contour'));
  });
}
/* images */
function imgPop(anchor, kind){
  const e = selEls()[0]; if (!e) return; const src = mediaSrc(e.src);
  if (kind === 'filter') return openPop(anchor, `<p class="pop-h">Filtres</p><div class="pop-filters">${Object.entries(IMG_FILTERS).map(([k, [t, f]]) => `<button type="button" data-fl="${k}" aria-pressed="${(e.filter || 'none') === k}"><span>${src ? `<img src="${escH(src)}" alt="" style="filter:${f || 'none'}">` : ''}</span>${t}</button>`).join('')}</div>`, p => {
    p.onclick = ev => { const b = ev.target.closest('[data-fl]'); if (b){ setProps(x => { x.filter = b.dataset.fl === 'none' ? undefined : b.dataset.fl; }, 'Filtre'); p.querySelectorAll('[data-fl]').forEach(x => x.setAttribute('aria-pressed', x === b)); } };
  }, 'wide');
  if (kind === 'mask') return openPop(anchor, `<p class="pop-h">Forme de l'image</p><div class="pop-masks">${Object.entries(MASKS).map(([k, t]) => `<button type="button" data-mk="${k}" aria-pressed="${(e.mask || 'none') === k}"><i style="${maskCss({mask:k, w:40, h:40, r:0})}"></i>${t}</button>`).join('')}</div>`, p => {
    p.onclick = ev => { const b = ev.target.closest('[data-mk]'); if (!b) return; closePop(); setProps(x => { x.mask = b.dataset.mk === 'none' ? undefined : b.dataset.mk; if ((b.dataset.mk === 'circle') && Math.abs(x.w - x.h) > 2){ const s = Math.min(x.w, x.h); x.x += (x.w - s) / 2; x.y += (x.h - s) / 2; x.w = x.h = s; } }, 'Forme de l\'image'); };
  });
  // recadrage : remplir / ajuster, position du cadrage, miroir
  openPop(anchor, `<p class="pop-h">Cadrage</p><div class="seg"><button type="button" data-fit="cover" aria-checked="${e.fit !== 'contain'}">Remplir le cadre</button><button type="button" data-fit="contain" aria-checked="${e.fit === 'contain'}">Image entière</button></div>
    <p class="pop-h">Position horizontale</p><div class="pop-rg"><input type="range" id="pxR" min="0" max="100" value="${e.px ?? 50}"></div><p class="pop-h">Position verticale</p><div class="pop-rg"><input type="range" id="pyR" min="0" max="100" value="${e.py ?? 50}"></div>
    <div class="pop-list"><hr><button type="button" data-x="flip">${iconSVG('cycle')}Miroir horizontal</button><button type="button" data-x="ratio">${iconSVG('grid')}Taille d'origine (proportions)</button></div>`, p => {
    const live = (k, v) => { selEls().forEach(x => { x[k] = +v; updateEl(x, true); }); };
    p.querySelector('#pxR').oninput = ev => live('px', ev.target.value); p.querySelector('#pyR').oninput = ev => live('py', ev.target.value);
    p.querySelectorAll('input').forEach(i => i.onchange = () => commit('Cadrage'));
    p.onclick = ev => { const f = ev.target.closest('[data-fit]'), x = ev.target.closest('[data-x]');
      if (f){ setProps(y => { y.fit = f.dataset.fit; }, 'Cadrage'); p.querySelectorAll('[data-fit]').forEach(b => b.setAttribute('aria-checked', b === f)); }
      if (x?.dataset.x === 'flip'){ setProps(y => { y.flip = !y.flip || undefined; }, 'Miroir'); }
      if (x?.dataset.x === 'ratio'){ const im = new Image(); im.onload = () => setProps(y => { const r = im.naturalWidth / im.naturalHeight; y.h = Math.round(y.w / r); }, 'Proportions'); im.src = src; } };
  });
}
/* tableaux */
function tableOp(k){
  const e = selEls()[0]; if (!e || e.t !== 'table') return; if (EDT) stopEdit(true);
  const cols = e.rows[0].length;
  if (k === 'row+') e.rows.push(Array(cols).fill('')); if (k === 'row-' && e.rows.length > 1) e.rows.pop();
  if (k === 'col+'){ e.rows.forEach((r, i) => r.push(i === 0 && e.head !== false ? `Colonne ${cols + 1}` : '')); delete e.cw; } if (k === 'col-' && cols > 1){ e.rows.forEach(r => r.pop()); delete e.cw; }
  if (k === 'head') e.head = e.head === false; if (k === 'band') e.band = e.band === false;
  e.h = Math.max(e.h, Math.round(e.rows.length * (e.fs * 2.3 + 2))); updateEl(e, true); const n = elNode(e.id)?.firstElementChild; if (n){ e.h = Math.ceil(n.offsetHeight); updateEl(e); }
  renderSel(); commit('Tableau');
}
/* graphiques : saisie des données dans une petite grille */
const CHART_TYPES = [['col', 'Colonnes'], ['bar', 'Barres'], ['line', 'Courbes'], ['area', 'Aires'], ['stack', 'Empilé'], ['pie', 'Secteurs'], ['donut', 'Anneau']];
function chartDialog(id){
  const e = elById(id); if (!e || V.ro) return;
  let L = [...(e.labels || [])]; const S = (e.series.length ? e.series : [{n:'Série 1', v:[]}]).map(s => ({n:s.n, v:[...s.v]}));
  const grid = () => { const n = Math.max(L.length, ...S.map(s => s.v.length), 1);
    return `<table class="cd-grid"><tr><th></th>${S.map((s, j) => `<th><input data-r="-1" data-c="${j}" value="${escH(s.n)}" placeholder="Série ${j + 1}"></th>`).join('')}<th><button type="button" class="cd-add" data-cd="col+" title="Ajouter une série">+ série</button></th></tr>
    ${Array.from({length:n}, (_, i) => `<tr><th><input data-r="${i}" data-c="-1" value="${escH(L[i] ?? '')}" placeholder="Catégorie"></th>${S.map((s, j) => `<td><input data-r="${i}" data-c="${j}" inputmode="decimal" value="${s.v[i] != null ? String(s.v[i]).replace('.', ',') : ''}"></td>`).join('')}<td></td></tr>`).join('')}
    <tr><th><button type="button" class="cd-add" data-cd="row+" title="Ajouter une ligne">+ ligne</button></th></tr></table>`; };
  SWDlg.open(`<h3>Données du graphique</h3><p class="dlg-p">Tapez vos chiffres, ou collez un tableau copié depuis Excel ou SPECTRA Calc (Ctrl + V dans une case).</p>
    <div class="cd-types">${CHART_TYPES.map(([k, t]) => `<button type="button" data-ct="${k}" aria-pressed="${e.ct === k}">${t}</button>`).join('')}</div>
    <div class="cd-wrap" id="cdW">${grid()}</div>
    <div class="cd-opts"><label><input type="checkbox" id="cdV" ${e.vals !== false ? 'checked' : ''}> Afficher les valeurs</label><label><input type="checkbox" id="cdL" ${e.legend !== false ? 'checked' : ''}> Légende</label><label>Unité <input id="cdU" value="${escH(e.unit || '')}" placeholder="€, %…" maxlength="6"></label></div>
    <div class="dlg-acts"><button type="button" class="ap-btn alt" data-dlg="close">Annuler</button><button type="button" class="ap-btn" id="cdOk">Appliquer</button></div>`, d => {
    let ct = e.ct;
    const read = () => { d.querySelectorAll('#cdW input').forEach(i => { const r = +i.dataset.r, c = +i.dataset.c, v = i.value.trim();
        if (r === -1) S[c].n = v; else if (c === -1) L[r] = v; else { const x = +v.replace(/\s|€|%/g, '').replace(',', '.'); S[c].v[r] = v === '' || isNaN(x) ? null : x; } }); };
    d.addEventListener('click', ev => { const t = ev.target.closest('[data-ct]'); if (t){ ct = t.dataset.ct; d.querySelectorAll('[data-ct]').forEach(b => b.setAttribute('aria-pressed', b === t)); }
      const a = ev.target.closest('[data-cd]'); if (a){ read(); if (a.dataset.cd === 'col+') S.push({n:`Série ${S.length + 1}`, v:[]}); else L.push(''); d.querySelector('#cdW').innerHTML = grid(); } });
    d.addEventListener('paste', ev => { const i = ev.target.closest('#cdW input'); if (!i) return; const t = ev.clipboardData.getData('text/plain'); if (!/\t|\n/.test(t.trim())) return; ev.preventDefault();
      const rows = t.replace(/\r/g, '').split('\n').filter(x => x.trim()).map(r => r.split('\t')); const num = x => +String(x ?? '').replace(/\s|€|%/g, '').replace(',', '.');
      const head = rows.length > 1 && rows[0].slice(1).some(x => x.trim() && isNaN(num(x))) ? rows.shift() : null; const nc = Math.max(1, Math.max(...rows.map(r => r.length)) - 1);
      L = rows.map(r => r[0]); S.splice(0, S.length, ...Array.from({length:nc}, (_, j) => ({n:head ? head[j + 1] || '' : `Série ${j + 1}`, v:rows.map(r => { const v = num(r[j + 1]); return r[j + 1] == null || r[j + 1] === '' || isNaN(v) ? null : v; })})));
      d.querySelector('#cdW').innerHTML = grid(); });
    d.addEventListener('keydown', ev => ev.stopPropagation());
    d.querySelector('#cdOk').onclick = () => { read(); let last = L.length; for (const s of S) last = Math.max(last, s.v.length); while (last > 0 && !L[last - 1] && S.every(s => s.v[last - 1] == null)) last--;
      e.labels = L.slice(0, last).map(x => x || ''); e.series = S.map(s => ({n:s.n, v:s.v.slice(0, last)})).filter((s, i) => i === 0 || s.v.some(v => v != null)); e.ct = ct;
      e.vals = d.querySelector('#cdV').checked; e.legend = d.querySelector('#cdL').checked; e.unit = d.querySelector('#cdU').value.trim() || undefined;
      SWDlg.close(); updateEl(e, true); renderSel(); commit('Données du graphique'); refreshToolbar(); };
  }, 'wide');
}
function chartTypePop(anchor){
  const e = selEls()[0];
  openPop(anchor, `<p class="pop-h">Type de graphique</p><div class="pop-chips">${CHART_TYPES.map(([k, t]) => `<button type="button" data-ct="${k}" aria-pressed="${e.ct === k}">${t}</button>`).join('')}</div>
    <div class="pop-list"><hr><label class="pop-toggle"><input type="checkbox" id="ctVary" ${e.vary ? 'checked' : ''}><div><b>Une couleur par barre</b><small>Pour une seule série</small></div></label></div>`, p => {
    p.onclick = ev => { const b = ev.target.closest('[data-ct]'); if (!b) return; setProps(x => { x.ct = b.dataset.ct; x.legend = x.series.length > 1 || ['pie', 'donut'].includes(x.ct); }, 'Type de graphique'); p.querySelectorAll('[data-ct]').forEach(x => x.setAttribute('aria-pressed', x === b)); };
    p.querySelector('#ctVary').onchange = ev => setProps(x => { x.vary = ev.target.checked || undefined; }, 'Couleurs');
  });
}
/* ---------- La barre Prisme ---------- */
const RAYS = [['insert', 'Insérer', 'plus', '#7B3FF2'], ['design', 'Design', 'palette', '#12B5E5'], ['layout', 'Mises en page', 'grid', '#2FBF71'], ['anim', 'Animer', 'sparkle', '#F5B82E'], ['templates', 'Modèles', 'layers', '#F2387A']];
const ICX = {
  shape:'<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8.5" r="5"/><rect x="11" y="11" width="9" height="9" rx="1.5"/></svg>', text:'<svg viewBox="0 0 24 24"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
  slide:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M12 9v4M10 11h4"/></svg>', layout:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M10 9v11"/></svg>',
  bg:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg>', present:'<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
  op:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>', pos:'<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M15 4h5v5M9 20H4v-5"/></svg>',
  anim:'<svg viewBox="0 0 24 24"><path d="M5 19c2-6 5-9 14-14M14 5h5v5"/><circle cx="6" cy="18" r="1.5"/></svg>', fx:'<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  stroke:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 2.5"/></svg>', crop:'<svg viewBox="0 0 24 24"><path d="M6 2v16h16M2 6h16v16"/></svg>',
  filter:'<svg viewBox="0 0 24 24"><circle cx="9" cy="10" r="5"/><circle cx="15" cy="10" r="5"/><circle cx="12" cy="15" r="5"/></svg>', mask:'<svg viewBox="0 0 24 24"><path d="M12 3l8.7 5v8L12 21l-8.7-5V8z"/></svg>',
  replace:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4"/></svg>', data:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>',
  rowp:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M12 16v6M9 19h6"/></svg>', colp:'<svg viewBox="0 0 24 24"><path d="M6 4v16M12 4v16M16 12h6M19 9v6"/></svg>', rowm:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M9 19h6"/></svg>', colm:'<svg viewBox="0 0 24 24"><path d="M6 4v16M12 4v16M16 12h6"/></svg>',
  dash:'<svg viewBox="0 0 24 24"><path d="M3 12h4M10 12h4M17 12h4"/></svg>', size:'<svg viewBox="0 0 24 24"><path d="M4 7V4h10v3M9 4v16M7 20h4M14 12V10h7v2M17.5 10v10M16 20h3"/></svg>',
};
const tb = (k, ic, title, extra = '') => `<button type="button" class="tb" data-k="${k}" title="${escH(title)}" aria-label="${escH(title)}"${extra}>${ic}</button>`;
function buildRays(){ g$('edRail').innerHTML = RAYS.map(([k, t, ic, c]) => `<button type="button" class="ray" data-panel="${k}" style="--ray:${c}" aria-pressed="false">${iconSVG(ic)}<span>${t}</span></button>`).join(''); }
function ctxKind(){ const l = selEls(); if (!l.length) return 'slide'; if (l.length > 1) return 'multi'; const e = l[0]; return e.t === 'shape' && e.html != null && EDT ? 'text' : e.t; }
function refreshToolbar(){
  const bar = g$('edBar'); if (!bar || !D) return; const k = ctxKind(), l = selEls(), e = l[0], sv = curVars();
  const colI = (key, c) => `<span class="tcol">${key === 'fill' ? '<svg viewBox="0 0 24 24"><path d="m14 4 6 6-8 8H6v-6zM4 20h16"/></svg>' : IC.color}<i style="background:${c ? realCol(c, sv) : 'transparent'};${c ? '' : 'box-shadow:inset 0 0 0 1px #fff8'}"></i></span>`;
  let h = `<div class="tg">${tb('undo', IC.undo, 'Annuler (Ctrl + Z)')}${tb('redo', IC.redo, 'Rétablir (Ctrl + Y)')}</div>`;
  const textTools = st => `<div class="tg"><button type="button" class="tb tb-font" data-k="font" title="Police"><span>${escH((st.f === 'h' ? dtheme(D.theme).fh : st.f === 'b' || !st.f ? dtheme(D.theme).fb : st.f).split(' ')[0])}</span></button>
      <div class="tsz">${tb('fs-', IC.minus, 'Plus petit')}<input class="tsz-in" id="fsIn" value="${Math.round((st.fs || 24) * 10) / 10}" aria-label="Taille du texte">${tb('fs+', IC.plus, 'Plus grand')}</div></div>
    <div class="tg">${tb('b', IC.b, 'Gras (Ctrl + B)', st.b ? ' aria-pressed="true"' : '')}${tb('i', IC.i, 'Italique (Ctrl + I)', st.i ? ' aria-pressed="true"' : '')}${tb('u', IC.u, 'Souligné (Ctrl + U)', st.u ? ' aria-pressed="true"' : '')}
      <button type="button" class="tb" data-k="fc" title="Couleur du texte">${colI('fc', st.fc || 't:ink')}</button></div>
    <div class="tg">${tb('align', IC[{l:'al', c:'ac', r:'ar', j:'aj'}[st.ha || 'l']], 'Alignement')}${tb('list', IC.ul, 'Liste à puces')}${tb('spacing', IC.spacing, 'Espacement')}${tb('fx', ICX.fx, 'Effets du texte')}</div>`;
  const common = `<div class="tg">${tb('op', ICX.op, 'Transparence et ombre')}${tb('anim', ICX.anim, 'Animation', e?.an ? ' aria-pressed="true"' : '')}${tb('pos', ICX.pos, 'Position, alignement et plans')}${tb('dup', IC.copy, 'Dupliquer (Ctrl + D)')}${tb('del', IC.trash, 'Supprimer (Suppr)')}</div>`;
  if (k === 'slide'){
    h += `<div class="tg"><button type="button" class="tb tb-txt" data-k="newslide" title="Nouvelle diapositive (Ctrl + M)">${ICX.slide}<span>Diapo</span></button>${tb('layout', ICX.layout, 'Mise en page')}${tb('bg', ICX.bg, 'Fond de la diapositive')}</div>
      <div class="tg">${tb('text', ICX.text, 'Ajouter du texte (T)')}${tb('shape', ICX.shape, 'Ajouter une forme')}${tb('img', IC.img, 'Ajouter une image')}${tb('icon', iconSVG('star'), 'Ajouter une icône')}${tb('table', IC.table, 'Ajouter un tableau')}${tb('chart', iconSVG('chart'), 'Ajouter un graphique')}</div>`;
  } else if (k === 'text'){ h += textTools(e.st || {}) + common; }
  else if (k === 'shape'){
    h += `<div class="tg"><button type="button" class="tb" data-k="fill" title="Remplissage">${colI('fill', e.fill)}</button>${tb('stroke', ICX.stroke, 'Contour et arrondi')}${tb('shapek', ICX.shape, 'Changer de forme')}${e.html == null ? tb('addtxt', ICX.text, 'Écrire dans la forme') : ''}</div>`
      + (e.html != null ? textTools(e.st || {}) : '') + common;
  } else if (k === 'line'){ h += `<div class="tg"><button type="button" class="tb" data-k="lcol" title="Couleur">${colI('fc', e.stroke || 't:ink')}</button>${tb('lstyle', ICX.dash, 'Épaisseur, style et flèches')}</div>` + common; }
  else if (k === 'img'){ h += `<div class="tg"><button type="button" class="tb tb-txt" data-k="replace" title="Remplacer l'image">${ICX.replace}<span>${e.src ? 'Remplacer' : 'Choisir'}</span></button>${tb('crop', ICX.crop, 'Cadrage')}${tb('filter', ICX.filter, 'Filtres')}${tb('mask', ICX.mask, 'Forme de l\'image')}${tb('stroke', ICX.stroke, 'Contour et arrondi')}</div>` + common; }
  else if (k === 'icon'){ h += `<div class="tg"><button type="button" class="tb" data-k="icol" title="Couleur">${colI('fc', e.fc)}</button><button type="button" class="tb tb-txt" data-k="ichange" title="Changer d'icône">${iconSVG(e.n)}<span>Changer</span></button>${tb('isw-', IC.minus, 'Trait plus fin')}${tb('isw+', IC.plus, 'Trait plus épais')}</div>` + common; }
  else if (k === 'table'){ h += `<div class="tg">${tb('row+', ICX.rowp, 'Ajouter une ligne')}${tb('row-', ICX.rowm, 'Retirer la dernière ligne')}${tb('col+', ICX.colp, 'Ajouter une colonne')}${tb('col-', ICX.colm, 'Retirer la dernière colonne')}<button type="button" class="tb" data-k="thc" title="Couleur de l'en-tête">${colI('fill', e.hc || 't:ac')}</button>${tb('thead', IC.table, 'En-tête et lignes alternées')}</div>
      <div class="tg"><div class="tsz">${tb('fs-', IC.minus, 'Plus petit')}<input class="tsz-in" id="fsIn" value="${e.fs || 18}" aria-label="Taille du texte">${tb('fs+', IC.plus, 'Plus grand')}</div>${tb('font', '<span class="tb-aa">Aa</span>', 'Police')}</div>` + common; }
  else if (k === 'chart'){ h += `<div class="tg"><button type="button" class="tb tb-txt" data-k="cdata" title="Modifier les données">${ICX.data}<span>Données</span></button>${tb('ctype', iconSVG('chart'), 'Type de graphique')}${tb('cvals', '<span class="tb-aa">12</span>', 'Afficher les valeurs', e.vals !== false ? ' aria-pressed="true"' : '')}</div>` + common; }
  else if (k === 'multi'){ const tx = l.filter(x => x.st); h += (tx.length ? `<div class="tg">${tb('font', '<span class="tb-aa">Aa</span>', 'Police')}<button type="button" class="tb" data-k="fc" title="Couleur du texte">${colI('fc', tx[0].st.fc || 't:ink')}</button>${tb('fs-', IC.minus, 'Plus petit')}${tb('fs+', IC.plus, 'Plus grand')}</div>` : '') + `<div class="tg">${tb('group', iconSVG('layers'), 'Grouper (Ctrl + G)')}</div>` + common; }
  bar.innerHTML = h; bar.dataset.ctx = k;
  const fi = g$('fsIn'); if (fi){ fi.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Enter'){ ev.preventDefault(); const v = +fi.value.replace(',', '.'); if (v > 0) setSt({fs:clamp(v, 4, 600)}, 'Taille du texte'); fi.blur(); } }; fi.onmousedown = ev => ev.stopPropagation(); }
  bar.querySelector('[data-k="undo"]').disabled = UNDO.i <= 0; bar.querySelector('[data-k="redo"]').disabled = UNDO.i >= UNDO.list.length - 1;
  updateStat();
}
function onToolbar(ev){
  const b = ev.target.closest('[data-k]'); if (!b || b.disabled) return; const k = b.dataset.k, l = selEls(), e = l[0];
  const A = {
    undo, redo, newslide:() => layoutPop(b, true), layout:() => layoutPop(b, false), bg:() => bgPop(b), text:() => addText('body'), shape:() => shapePop(b), img:() => pickImage(), icon:() => iconPop(b), table:() => tablePop(b), chart:() => chartAddPop(b), present:() => present(CUR),
    font:() => fontPop(b), 'fs-':() => sizeStep(-1), 'fs+':() => sizeStep(1), b:() => setSt({b:e?.st?.b ? null : 1}, 'Gras'), i:() => setSt({i:e?.st?.i ? null : 1}, 'Italique'), u:() => setSt({u:e?.st?.u ? null : 1}, 'Souligné'),
    fc:() => colorPop(b, e?.st?.fc, v => setSt({fc:v || 't:ink'}, 'Couleur du texte'), {noneLabel:'Automatique'}), align:() => alignPop(b), list:toggleList, spacing:() => spacingPop(b), fx:() => effectsPop(b),
    op:() => opacityPop(b), anim:() => animPop(b), pos:() => posPop(b), dup:dupSel, del:delSel, group:groupSel,
    fill:() => colorPop(b, e.fill, (v, g) => setProps(x => { if (g){ x.fill = g[0]; x.g2 = g[1]; } else { x.fill = v || ''; delete x.g2; } }, 'Remplissage'), {grad:true}),
    stroke:() => strokePop(b), shapek:() => shapePop(b, true), addtxt:() => startEdit(e.id),
    lcol:() => colorPop(b, e.stroke, v => setProps(x => { x.stroke = v || 't:ink'; }, 'Couleur'), {none:false}), lstyle:() => linePop(b),
    replace:() => pickImage(e.id), crop:() => imgPop(b, 'crop'), filter:() => imgPop(b, 'filter'), mask:() => imgPop(b, 'mask'),
    icol:() => colorPop(b, e.fc, v => setProps(x => { x.fc = v || 't:ac'; }, 'Couleur'), {none:false}), ichange:() => iconPop(b, e.id), 'isw-':() => setProps(x => { x.sw = Math.max(.6, (x.sw || 1.8) - .4); }, 'Trait'), 'isw+':() => setProps(x => { x.sw = Math.min(4, (x.sw || 1.8) + .4); }, 'Trait'),
    'row+':() => tableOp('row+'), 'row-':() => tableOp('row-'), 'col+':() => tableOp('col+'), 'col-':() => tableOp('col-'), thead:() => theadPop(b), thc:() => colorPop(b, e.hc, v => setProps(x => { x.hc = v || undefined; }, 'En-tête'), {noneLabel:'Couleur du thème'}),
    cdata:() => chartDialog(e.id), ctype:() => chartTypePop(b), cvals:() => setProps(x => { x.vals = x.vals === false; }, 'Valeurs'),
  };
  A[k]?.();
}
function theadPop(anchor){ const e = selEls()[0]; openPop(anchor, `<div class="pop-list"><label class="pop-toggle"><input type="checkbox" data-o="head" ${e.head !== false ? 'checked' : ''}><div><b>Ligne d'en-tête</b><small>Première ligne colorée</small></div></label><label class="pop-toggle"><input type="checkbox" data-o="band" ${e.band !== false ? 'checked' : ''}><div><b>Lignes alternées</b><small>Une ligne sur deux teintée</small></div></label></div>`, p => { p.onchange = ev => tableOp(ev.target.dataset.o); }); }
function toggleList(){
  const e = selEls()[0]; if (!e || !(e.t === 'text' || e.t === 'shape')) return; if (EDT) stopEdit(true);
  const isList = /<li/.test(e.html || '');
  if (isList) e.html = (e.html || '').replace(/<\/li>\s*<li>/g, '<br>').replace(/<\/?(ul|ol|li)[^>]*>/g, '');
  else { const lines = (e.html || '').split(/<br\s*\/?>/).map(x => x.trim()).filter(Boolean); e.html = `<ul>${(lines.length ? lines : ['']).map(x => `<li>${x}</li>`).join('')}</ul>`; }
  updateEl(e, true); fitTexts([e.id]); renderSel(); commit(isList ? 'Retirer la liste' : 'Liste à puces'); refreshToolbar();
}
function shapePop(anchor, change){
  openPop(anchor, `<p class="pop-h">${change ? 'Changer de forme' : 'Formes'}</p><div class="pop-shapes">${SHAPE_ORDER.filter(k => !change || (k !== 'line' && k !== 'arrowline')).map(k => `<button type="button" data-sh="${k}" title="${escH(SHAPES[k][0])}">${shapeIcon(k)}</button>`).join('')}</div>`, p => {
    p.onclick = e => { const b = e.target.closest('[data-sh]'); if (!b) return; closePop(); if (change) setProps(x => { x.k = b.dataset.sh; }, 'Forme'); else addShape(b.dataset.sh); };
  }, 'wide');
}
function shapeIcon(k){
  if (k === 'line') return '<svg viewBox="0 0 40 40"><path d="M4 20h32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  if (k === 'arrowline') return '<svg viewBox="0 0 40 40"><path d="M4 20h28M26 13l8 7-8 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (k === 'rect') return '<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" fill="currentColor"/></svg>';
  if (k === 'round') return '<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="6" fill="currentColor"/></svg>';
  if (k === 'ellipse') return '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="currentColor"/></svg>';
  if (k === 'pill') return '<svg viewBox="0 0 40 40"><rect x="4" y="12" width="32" height="16" rx="8" fill="currentColor"/></svg>';
  return `<svg viewBox="-8 -8 116 116"><path d="${SHAPES[k][1]}" fill="currentColor"/></svg>`;
}
function tablePop(anchor){
  openPop(anchor, `<p class="pop-h">Tableau <small id="tpV">3 × 4</small></p><div class="pop-grid" id="tpG">${Array.from({length:48}, (_, i) => `<i data-r="${Math.floor(i / 8) + 1}" data-c="${i % 8 + 1}"></i>`).join('')}</div>`, p => {
    const G = p.querySelector('#tpG'); G.onmouseover = e => { const t = e.target.closest('i'); if (!t) return; const r = +t.dataset.r, c = +t.dataset.c; G.querySelectorAll('i').forEach(x => x.classList.toggle('on', +x.dataset.r <= r && +x.dataset.c <= c)); p.querySelector('#tpV').textContent = `${c} × ${r}`; };
    G.onclick = e => { const t = e.target.closest('i'); if (!t) return; closePop(); addTable(+t.dataset.r, +t.dataset.c); };
  });
}
function chartAddPop(anchor){ openPop(anchor, `<p class="pop-h">Graphique</p><div class="pop-chips">${CHART_TYPES.map(([k, t]) => `<button type="button" data-ct="${k}">${t}</button>`).join('')}</div>`, p => { p.onclick = e => { const b = e.target.closest('[data-ct]'); if (b){ closePop(); addChart(b.dataset.ct); } }; }); }
/* ---------- État (bas à gauche), zoom ---------- */
function updateStat(){
  const s = g$('slideStat'); if (!s || !D) return; const l = selEls();
  s.innerHTML = `<b>${CUR + 1}</b> / ${D.slides.length}`; s.title = `Diapositive ${CUR + 1} sur ${D.slides.length}${l.length ? ` · ${l.length > 1 ? l.length + ' éléments sélectionnés' : ({text:'texte', shape:'forme', line:'ligne', img:'image', icon:'icône', table:'tableau', chart:'graphique'})[l[0].t] + ' sélectionné'}` : ''}`;
}
function setZoom(z){ V.zoom = z ? clamp(Math.round(z * 100) / 100, .1, 4) : 0; renderStage(); }
/* ---------- Menu contextuel ---------- */
function ctxMenu(ev){
  ev.preventDefault(); const node = ev.target.closest('.el[data-id]');
  if (node && !SEL.has(node.dataset.id)){ const e = elById(node.dataset.id); if (e) select(groupOf(e).map(x => x.id)); }
  const l = selEls(), has = l.length > 0;
  const it = (k, ic, t, kb = '', dis = false) => `<button type="button" data-cm="${k}"${dis ? ' disabled' : ''}>${ic}${t}${kb ? `<kbd>${kb}</kbd>` : ''}</button>`;
  const html = `<div class="pop-list">${has ? it('cut', '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16 19 4M16 16 5 4"/></svg>', 'Couper', 'Ctrl X') + it('copy', IC.copy, 'Copier', 'Ctrl C') : ''}${it('paste', '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/></svg>', 'Coller', 'Ctrl V', !CLIP.els)}
    ${has ? '<hr>' + it('dup', IC.copy, 'Dupliquer', 'Ctrl D') + it('front', IC.up, 'Premier plan') + it('back', IC.down, 'Arrière-plan') + (l.length > 1 ? it('group', iconSVG('layers'), 'Grouper', 'Ctrl G') : '') + (l.some(e => e.g) ? it('ungroup', iconSVG('grid'), 'Dissocier') : '') + it('lock', iconSVG('lock'), l.every(e => e.lock) ? 'Déverrouiller' : 'Verrouiller') + (l.length === 1 && l[0].t === 'img' ? it('rimg', IC.img, 'Remplacer l\'image…') : '') + it('align', IC.al, l.length > 1 ? 'Aligner et répartir…' : 'Aligner sur la diapositive…') + it('anim', ICX.anim, 'Animation…') + '<hr>' + `<button type="button" data-cm="del" class="danger">${IC.trash}Supprimer<kbd>Suppr</kbd></button>`
      : '<hr>' + it('layout', ICX.layout, 'Mise en page…') + it('bg', ICX.bg, 'Fond…') + it('newslide', ICX.slide, 'Nouvelle diapositive', 'Ctrl M') + it('dupslide', IC.copy, 'Dupliquer la diapositive') + '<hr>' + it('present', ICX.slide, 'Présenter à partir d\'ici') + it('hideslide', iconSVG('eye'), D.slides[CUR]?.hide ? 'Afficher en présentation' : 'Masquer en présentation')}</div>`;
  const anchor = {getBoundingClientRect:() => ({left:ev.clientX, right:ev.clientX, top:ev.clientY, bottom:ev.clientY})};
  openPop(anchor, html, p => { p.onclick = e => { const b = e.target.closest('[data-cm]'); if (!b || b.disabled) return; closePop(); const k = b.dataset.cm;
    if (k === 'cut') copySel(null, true); else if (k === 'copy') copySel(); else if (k === 'paste') pasteEls(); else if (k === 'dup') dupSel(); else if (k === 'front' || k === 'back') layer(k);
    else if (k === 'group') groupSel(); else if (k === 'ungroup') ungroupSel(); else if (k === 'lock') lockSel(); else if (k === 'del') delSel(); else if (k === 'anim') animPop(anchor);
    else if (k === 'layout') layoutPop(anchor); else if (k === 'bg') bgPop(anchor); else if (k === 'newslide') layoutPop(anchor, true); else if (k === 'dupslide') dupSlide();
    else if (k === 'rimg') pickImage(selEls()[0]?.id); else if (k === 'align') alignObjPop(anchor); else if (k === 'present') present(CUR); else if (k === 'hideslide') toggleHide(); }; }, 'menu');
}
/* aligner sur la diapositive (un élément) ou entre eux (plusieurs) ; répartir à partir de 3 éléments */
function alignObjPop(anchor){
  const n = selEls().length;
  openPop(anchor, `<p class="pop-h">${n > 1 ? 'Aligner les éléments' : 'Aligner sur la diapositive'}</p><div class="pop-row4">${[['l', 'À gauche'], ['c', 'Centré'], ['r', 'À droite'], ['t', 'En haut'], ['m', 'Au milieu'], ['b', 'En bas']].map(([k, t]) => `<button type="button" data-al="${k}">${t}</button>`).join('')}</div>${n > 2 ? '<hr><button type="button" data-al="dh">Répartir horizontalement</button><button type="button" data-al="dv">Répartir verticalement</button>' : ''}`, p => { p.onclick = e => { const b = e.target.closest('[data-al]'); if (!b) return; closePop(); alignSel(b.dataset.al); }; }, 'menu');
}
