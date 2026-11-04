/* ---------- Panneau Format : position, remplissage, contour, effets, ajustements, texte (WordArt), fond de la diapositive ----------
   Chaque réglage porte un chemin (« fx.sh.b », « st.tl.c », « bg.pat »…) : les mêmes fonctions lisent et écrivent éléments et fond. */
const FDEF = {'fx.sh':{x:0, y:10, b:24, c:'#000000', o:.35}, 'fx.gl':{b:24, c:'t:ac', o:.9}, 'st.to':{w:2, c:'t:ink'}, 'st.tl':{b:14, c:'t:ac'}, 'st.tsd':{x:3, y:3, b:6, c:'#000000', o:.4}, 'st.t3':{n:10, c:'t:ac'}, 'st.tg':['t:ac', 't:ac2', 90]};
const FM_OPEN = {pos:true};
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
function setPath(o, p, v){
  const ks = p.split('.'); let a = o;
  for (let i = 0; i < ks.length - 1; i++){ if (a[ks[i]] == null) a[ks[i]] = FDEF[ks.slice(0, i + 1).join('.')] ? JSON.parse(JSON.stringify(FDEF[ks.slice(0, i + 1).join('.')])) : {}; a = a[ks[i]]; }
  const k = ks[ks.length - 1]; if (v == null || v === '') delete a[k]; else a[k] = v;
}
/* retire les réglages neutres pour garder les documents légers */
function tidyEl(e){
  const f = e.fx; if (f){ for (const [k, d] of [['rf', 0], ['bl', 0], ['sf', 0], ['rx', 0], ['ry', 0], ['br', 100], ['ct', 100], ['sa', 100], ['hu', 0]]) if (f[k] === d) delete f[k]; if (!f.fh) delete f.fh; if (!f.fv) delete f.fv; if (!Object.keys(f).length) delete e.fx; }
  if (e.st){ if (e.st.to && !e.st.to.w && e.st.to.f !== 0) delete e.st.to; for (const k of ['ls', 'ws']) if (!e.st[k]) delete e.st[k]; }
  if (e.pat && !PATS[e.pat]) delete e.pat; if (!e.alt) delete e.alt; if (!e.lk) delete e.lk;
}
const fNum = v => Math.round(v * 100) / 100;
const FM_SHADOWS = [['Aucune', null], ['Douce', {x:0, y:8, b:24, c:'#000000', o:.25}], ['Marquée', {x:0, y:14, b:34, c:'#000000', o:.4}], ['Proche', {x:0, y:3, b:6, c:'#000000', o:.3}], ['Décalée', {x:12, y:12, b:0, c:'#000000', o:.3}], ['Lointaine', {x:0, y:34, b:60, c:'#000000', o:.3}], ['Colorée', {x:0, y:14, b:30, c:'t:ac', o:.55}]];
const FM_GRADS = [...GRADS, ['#FDE68A', '#F472B6'], ['#A7F3D0', '#3B82F6'], ['#1E1B4B', '#7C3AED'], ['#FFFFFF', '#CBD5E1']];
function formatPanelHTML(){
  const l = selEls(), e = l[0], sv = curVars();
  const sec = (key, title, body, open) => `<details class="fm-sec" data-sec="${key}"${(FM_OPEN[key] ?? open) ? ' open' : ''}><summary>${title}</summary><div class="fm-body">${body}</div></details>`;
  const rg = (p, t, min, max, step, val, unit = '') => `<label class="fm-rg"><span>${t}<b>${fNum(val)}${unit}</b></span><input type="range" data-f="${p}" data-u="${unit}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const sw = (p, t, c) => `<div class="fm-row"><span>${t}</span><button type="button" class="fm-sw" data-fcol="${p}" aria-label="${escH(t)}" style="--c:${c ? realCol(c, sv) : 'transparent'}"${c ? '' : ' data-none="1"'}></button></div>`;
  const chips = (p, items, cur) => `<div class="pn-chips">${items.map(([v, t]) => `<button type="button" data-fv="${p}" data-v="${v}" aria-pressed="${String(cur ?? '') === String(v)}">${t}</button>`).join('')}</div>`;
  const tog = (p, t, sub, on) => `<label class="pop-toggle"><input type="checkbox" data-fg="${p}"${on ? ' checked' : ''}><div><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div></label>`;
  let h = '';
  if (!e){
    /* fond de la diapositive */
    const s = cur(), b = s.bg || {}, kind = b.mesh ? 'mesh' : b.g ? 'g' : b.c ? 'c' : '';
    h += `<h4 class="pn-h">Fond de la diapositive</h4>
      <div class="fm-grid g6">${['', 't:soft', 't:ac', 't:ac2', 't:ink', '#FFFFFF', '#F5F3FF', '#FEF3C7', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#16122B'].map(c => `<button type="button" class="fm-c${(b.c || '') === c && !b.g && !b.mesh ? ' on' : ''}" data-bgc="${c}" title="${c ? T_NAMES[c] || c : 'Fond du thème'}" style="background:${c ? realCol(c, sv) : `linear-gradient(135deg,${sv.bg} 50%,${sv.soft} 50%)`}"></button>`).join('')}</div>
      ${sw('bgp.c', 'Couleur personnalisée', b.c)}
      <h4 class="pn-h">Dégradés <small>cliquez pour appliquer</small></h4><div class="fm-grid g4">${FM_GRADS.map((g, i) => `<button type="button" class="fm-c wide" data-bgg="${i}" style="background:linear-gradient(135deg,${realCol(g[0], sv)},${realCol(g[1], sv)})"></button>`).join('')}</div>
      <h4 class="pn-h">Ambiances <small>dégradés maillés</small></h4><div class="fm-grid g4">${MESHES.map((m, i) => `<button type="button" class="fm-c wide${b.mesh && b.mesh[3] === m[1][3] ? ' on' : ''}" data-bgm="${i}" title="${m[0]}" style="background:${meshCss(m[1])}"></button>`).join('')}</div>`;
    if (b.g) h += `<div class="fm-box">${sw('bgp.g.0', 'Couleur 1', b.g[0])}${sw('bgp.g.1', 'Couleur 2', b.g[1])}${chips('bg.gt', [['', 'Linéaire'], ['rad', 'Radial'], ['con', 'Conique']], b.gt || '')}${b.gt === 'rad' ? '' : rg('bg.a', 'Angle', 0, 360, 5, b.a ?? 135, '°')}</div>`;
    h += `<h4 class="pn-h">Motif <small>par-dessus le fond</small></h4><div class="pn-chips"><button type="button" data-fv="bg.pat" data-v="" aria-pressed="${!b.pat}">Aucun</button>${PAT_ORDER.map(k => `<button type="button" data-fv="bg.pat" data-v="${k}" aria-pressed="${b.pat === k}">${PATS[k][0]}</button>`).join('')}</div>`;
    if (b.pat) h += `<div class="fm-box">${sw('bgp.pc', 'Couleur du motif', b.pc || 't:ink')}${rg('bg.po', 'Intensité', .03, .6, .01, b.po ?? .12)}${rg('bg.ps', 'Taille', .5, 4, .1, b.ps ?? 1, '×')}</div>`;
    h += `<div class="pn-acts"><button type="button" class="pn-wide" data-fa="bgimg">${IC.img} Image de fond…</button>${b.img ? `<button type="button" class="pn-wide" data-fa="bgnoimg">Retirer l'image</button>` : ''}<button type="button" class="pn-wide" data-fa="bgall">${IC.copy} Appliquer à toutes</button><button type="button" class="pn-wide" data-fa="bgreset">Fond du thème</button></div>`;
    if (b.img) h += `<div class="fm-box">${rg('bg.dim', 'Assombrir l\'image', 0, .8, .05, b.dim || 0)}</div>`;
    h += tog('deco', 'Décor du thème', 'Les formes dessinées par le thème', !s.nodeco)
      + `<h4 class="pn-h">Affichage <small>aide à l'alignement</small></h4>${tog('view.grid', 'Grille', 'Quadrillage discret sur la diapositive', V.grid)}${tog('view.snapgrid', 'Magnétisme de la grille', 'Les éléments se calent sur la grille', V.snapGrid)}${tog('view.rulers', 'Marges et centre', 'Repères de la zone sûre et du milieu', V.guides)}`
      + `<p class="pn-hint">Sélectionnez un élément pour régler sa position, son remplissage, ses ombres, ses effets et son animation.</p>`;
    return h;
  }
  const st = e.st || {}, hasTxt = e.t === 'text' || (e.t === 'shape' && e.html != null), f = e.fx || {}, one = l.length === 1;
  if (one) h += sec('pos', 'Position et taille', `<div class="fm-geo">${[['x', 'X'], ['y', 'Y'], ['w', 'L'], ['h', 'H'], ['rot', '°']].map(([k, t]) => `<label><span>${t}</span><input type="number" data-geo="${k}" value="${k === 'rot' ? fNum(e.rot || 0) : Math.round(e[k])}" step="${k === 'rot' ? 5 : 1}"></label>`).join('')}</div>
      <div class="pn-chips"><button type="button" data-fv="fx.fh" data-v="${f.fh ? '' : 1}" aria-pressed="${!!f.fh}">${ICX.pos} Miroir horizontal</button><button type="button" data-fv="fx.fv" data-v="${f.fv ? '' : 1}" aria-pressed="${!!f.fv}">Miroir vertical</button><button type="button" data-fa="cpstyle">Copier le style</button><button type="button" data-fa="pastestyle">Coller le style</button></div>
      ${e.t === 'video' ? `<label class="fm-txt"><span>Adresse de la vidéo</span><input type="text" data-ft="url" maxlength="400" value="${escH(e.url || '')}"></label>` : ''}
      <label class="fm-txt"><span>Texte alternatif <small>description pour l'accessibilité</small></span><input type="text" data-ft="alt" maxlength="300" value="${escH(e.alt || '')}" placeholder="Décrivez cet élément"></label>
      <label class="fm-txt"><span>Lien <small>ouvert en cliquant en présentation</small></span><input type="text" data-ft="lk" maxlength="500" value="${escH(e.lk || '')}" placeholder="https://… ou #3 (diapositive 3)"></label>`, true);
  if (e.t === 'shape'){
    const kind = e.g2 ? (e.gt || 'lin') : e.fill ? 'solid' : 'none';
    h += sec('fill', 'Remplissage', `${chips('fillkind', [['none', 'Aucun'], ['solid', 'Uni'], ['lin', 'Dégradé'], ['rad', 'Radial'], ['con', 'Conique']], kind)}
      ${sw('fill', 'Couleur 1', e.fill)}${e.g2 ? sw('g2', 'Couleur 2', e.g2) + sw('g3', 'Couleur 3 (facultative)', e.g3) + (kind === 'rad' ? rg('gx', 'Centre horizontal', 0, 100, 5, e.gx ?? 50, ' %') + rg('gy', 'Centre vertical', 0, 100, 5, e.gy ?? 50, ' %') : rg('ga', 'Angle', 0, 360, 5, e.ga ?? 135, '°')) : ''}
      <p class="pn-sub">Motif</p><div class="pn-chips"><button type="button" data-fv="pat" data-v="" aria-pressed="${!e.pat}">Aucun</button>${PAT_ORDER.map(k => `<button type="button" data-fv="pat" data-v="${k}" aria-pressed="${e.pat === k}">${PATS[k][0]}</button>`).join('')}</div>
      ${e.pat ? sw('pc', 'Couleur du motif', e.pc || 't:ink') + rg('po', 'Intensité', .05, 1, .05, e.po ?? .3) + rg('ps', 'Taille', .5, 4, .1, e.ps ?? 1, '×') : ''}`, true);
  }
  if (e.t === 'shape' || e.t === 'img'){
    h += sec('stroke', 'Contour', `${rg('sw', 'Épaisseur', 0, 30, 1, e.sw || 0, ' px')}${sw('stroke', 'Couleur', e.stroke)}${chips('sd', [['', 'Continu'], ['dash', 'Tirets'], ['dot', 'Points']], e.sd || '')}`);
  }
  const shOn = !!f.sh, glOn = !!f.gl, sh = f.sh || FDEF['fx.sh'], gl = f.gl || FDEF['fx.gl'];
  h += sec('fx', 'Effets', `<p class="pn-sub">Ombre</p><div class="pn-chips">${FM_SHADOWS.map(([t, v], i) => `<button type="button" data-fshadow="${i}" aria-pressed="${v ? shOn && f.sh.y === v.y && f.sh.b === v.b && f.sh.x === v.x : !shOn && !e.shadow}">${t}</button>`).join('')}</div>
    ${shOn ? `<div class="fm-box">${rg('fx.sh.x', 'Décalage horizontal', -80, 80, 1, sh.x, ' px')}${rg('fx.sh.y', 'Décalage vertical', -80, 80, 1, sh.y, ' px')}${rg('fx.sh.b', 'Flou', 0, 100, 1, sh.b, ' px')}${rg('fx.sh.o', 'Opacité', 0, 1, .05, sh.o)}${sw('fx.sh.c', 'Couleur', sh.c)}</div>` : ''}
    ${tog('fx.gl', 'Lueur', 'Un halo coloré autour de l\'élément', glOn)}${glOn ? `<div class="fm-box">${rg('fx.gl.b', 'Rayon', 2, 100, 1, gl.b, ' px')}${rg('fx.gl.o', 'Intensité', .1, 1, .05, gl.o)}${sw('fx.gl.c', 'Couleur', gl.c)}</div>` : ''}
    ${rg('fx.rf', 'Reflet', 0, 1, .05, f.rf || 0)}${rg('fx.sf', 'Contour progressif', 0, 120, 2, f.sf || 0, ' px')}${rg('fx.bl', 'Flou', 0, 30, 1, f.bl || 0, ' px')}${rg('fx.rx', 'Inclinaison verticale (3D)', -60, 60, 1, f.rx || 0, '°')}${rg('fx.ry', 'Inclinaison horizontale (3D)', -60, 60, 1, f.ry || 0, '°')}`);
  h += sec('adj', 'Ajustements', `${rg('fx.br', 'Luminosité', 30, 200, 1, f.br ?? 100, ' %')}${rg('fx.ct', 'Contraste', 30, 200, 1, f.ct ?? 100, ' %')}${rg('fx.sa', 'Saturation', 0, 250, 1, f.sa ?? 100, ' %')}${rg('fx.hu', 'Teinte', -180, 180, 1, f.hu || 0, '°')}`);
  if (hasTxt){
    const to = st.to, tl = st.tl, tsd = st.tsd, t3 = st.t3, tg = st.tg;
    h += sec('txt', 'Effets de texte', `<p class="pn-sub">Styles prêts à l'emploi</p><div class="wa-grid" style="${varsCss(sv)}">${WORDART.map(([t, x], i) => `<button type="button" data-wa="${i}" title="${t}"><span style="${txCss({f:'h', fs:26, b:1, fc:'#FFFFFF', ...x})}">Abc</span><em>${t}</em></button>`).join('')}</div>
      ${tog('st.to', 'Contour du texte', '', !!to)}${to ? `<div class="fm-box">${rg('st.to.w', 'Épaisseur', 0, 12, .5, to.w, ' px')}${sw('st.to.c', 'Couleur', to.c)}${tog('st.to.f0', 'Texte creux', 'Seul le contour reste visible', to.f === 0)}</div>` : ''}
      ${tog('st.tg', 'Dégradé dans le texte', '', !!tg)}${tg ? `<div class="fm-box">${sw('st.tg.0', 'Couleur 1', tg[0])}${sw('st.tg.1', 'Couleur 2', tg[1])}${rg('st.tg.2', 'Angle', 0, 360, 5, tg[2] ?? 90, '°')}</div>` : ''}
      ${tog('st.tl', 'Lueur du texte', '', !!tl)}${tl ? `<div class="fm-box">${rg('st.tl.b', 'Rayon', 2, 60, 1, tl.b, ' px')}${sw('st.tl.c', 'Couleur', tl.c)}</div>` : ''}
      ${tog('st.tsd', 'Ombre du texte', '', !!tsd)}${tsd ? `<div class="fm-box">${rg('st.tsd.x', 'Horizontal', -30, 30, 1, tsd.x, ' px')}${rg('st.tsd.y', 'Vertical', -30, 30, 1, tsd.y, ' px')}${rg('st.tsd.b', 'Flou', 0, 40, 1, tsd.b, ' px')}${rg('st.tsd.o', 'Opacité', 0, 1, .05, tsd.o)}${sw('st.tsd.c', 'Couleur', tsd.c)}</div>` : ''}
      ${tog('st.t3', 'Extrusion 3D', 'Profondeur derrière les lettres', !!t3)}${t3 ? `<div class="fm-box">${rg('st.t3.n', 'Profondeur', 1, 30, 1, t3.n, ' px')}${sw('st.t3.c', 'Couleur', t3.c)}</div>` : ''}
      <p class="pn-sub">Casse et espacement</p>${chips('st.tt', [['', 'Normale'], ['cap', 'Initiales'], ['low', 'minuscules']], st.tt || '')}${chips('st.up', [['', 'Casse libre'], ['1', 'CAPITALES']], st.up ? '1' : '')}${chips('st.sc', [['', 'Normal'], ['1', 'Petites capitales']], st.sc ? '1' : '')}
      ${rg('st.ls', 'Espacement des lettres', -.1, .6, .01, st.ls || 0, ' em')}${rg('st.ws', 'Espacement des mots', -.3, 1.5, .05, st.ws || 0, ' em')}`, e.t === 'text');
  }
  h += `<div class="pn-acts"><button type="button" class="pn-wide" data-fa="fxreset">Réinitialiser les effets</button></div>`;
  return h;
}
/* écriture d'un réglage sur la sélection (éléments) ou la diapositive (fond) */
function fmApply(p, v, live){
  if (V.ro) return;
  const isBg = p.startsWith('bg.'), targets = isBg ? [cur()] : selEls();
  targets.forEach(t => {
    if (p === 'st.to.f0'){ if (!t.st?.to) return; if (v) t.st.to.f = 0; else delete t.st.to.f; return; }
    if (p === 'st.up' || p === 'st.sc') v = v ? 1 : null;
    if (p === 'sw' && v > 0 && !t.stroke) t.stroke = 't:ink';
    if (isBg && !t.bg) t.bg = {};
    setPath(t, p, v); if (isBg){ if (!Object.keys(t.bg).length) delete t.bg; } else { if (p.startsWith('st.') && !t.st) t.st = {}; tidyEl(t); }
  });
  if (isBg){ renderStage(); if (!live) renderRail(true); return; }
  targets.forEach(t => updateEl(t, true)); fitTexts(targets.map(t => t.id)); renderSel();
}
const fmCommit = label => { commit(label); renderRail(true); renderPanel(); refreshToolbar(); };
function fmVal(raw){ if (raw === '' || raw == null) return null; return /^-?\d+(\.\d+)?$/.test(raw) ? +raw : raw; }
function fmGroupToggle(p, on){
  if (p === 'deco'){ cur().nodeco = on ? undefined : true; if (on) delete cur().nodeco; renderAll(); commit('Décor'); return; }
  if (p.startsWith('view.')){ if (p === 'view.grid') V.grid = on; else if (p === 'view.snapgrid'){ V.snapGrid = on; if (on) V.grid = true; } else V.guides = on; lsSet('ss.view', {grid:V.grid, snapGrid:V.snapGrid, guides:V.guides}); applyView(); renderPanel(); return; }
  if (p === 'st.to.f0') return fmApply(p, on), fmCommit('Texte creux');
  fmApply(p, on ? JSON.parse(JSON.stringify(FDEF[p] || {})) : null); fmCommit('Effet');
}
function applyView(){ const h = g$('slideHost'); if (!h) return; h.classList.toggle('show-grid', !!V.grid); h.classList.toggle('show-guides', !!V.guides); }
function wireFormat(b){
  b.querySelectorAll('details.fm-sec').forEach(d => d.addEventListener('toggle', () => { FM_OPEN[d.dataset.sec] = d.open; }));
  b.querySelectorAll('input[data-f]').forEach(i => { i.oninput = () => { const v = +i.value, bt = i.previousElementSibling?.querySelector('b'); if (bt) bt.textContent = fNum(v) + (i.dataset.u || ''); fmApply(i.dataset.f, v, true); }; i.onchange = () => fmCommit('Réglage'); });
  b.querySelectorAll('input[data-fg]').forEach(i => { i.onchange = () => fmGroupToggle(i.dataset.fg, i.checked); });
  b.querySelectorAll('input[data-geo]').forEach(i => { i.onchange = () => { const k = i.dataset.geo, v = +i.value; if (!isFinite(v)) return; setProps(e => { if (k === 'rot'){ if (v) e.rot = v; else delete e.rot; } else e[k] = k === 'w' || k === 'h' ? Math.max(8, v) : v; }, 'Position', true); renderPanel(); }; });
  b.querySelectorAll('input[data-ft]').forEach(i => { i.onchange = () => { const k = i.dataset.ft; let v = i.value.trim(); if (k === 'lk' && v && !/^(https?:\/\/|#\d+$)/i.test(v)){ if (/^[\w.-]+\.[a-z]{2,}/i.test(v)) v = 'https://' + v; else { toast('Lien : une adresse https://… ou #3 pour une diapositive'); i.value = ''; v = ''; } } if (k === 'url' && !vidInfo(v)){ toast('Adresse non reconnue'); i.value = selEls()[0]?.url || ''; return; } setProps(e => { if (v) e[k] = v; else delete e[k]; }, k === 'lk' ? 'Lien' : k === 'url' ? 'Vidéo' : 'Texte alternatif', k === 'url'); }; });
  b.querySelectorAll('[data-fv]').forEach(x => { x.onclick = () => { fmApply(x.dataset.fv, fmVal(x.dataset.v)); fmCommit('Réglage'); }; });
  b.querySelectorAll('[data-fcol]').forEach(x => { x.onclick = () => {
    const p = x.dataset.fcol, isBgp = p.startsWith('bgp.'), path = isBgp ? p.slice(4) : p, root = isBgp ? (cur().bg || {}) : selEls()[0], none = path === 'fill' || path === 'g3' || path === 'stroke' || path === 'bg.c' || path === 'c' || path === 'pc' ? undefined : false;
    colorPop(x, getPath(root, path), v => {
      if (isBgp){ const s = cur(); s.bg = s.bg || {}; if (path === 'c'){ const keep = {pat:s.bg.pat, pc:s.bg.pc, po:s.bg.po, ps:s.bg.ps}; s.bg = {...(v ? {c:v} : {})}; Object.entries(keep).forEach(([k, q]) => q != null && (s.bg[k] = q)); } else if (path === 'pc') s.bg.pc = v || undefined; else setPath(s.bg, path, v); if (!Object.keys(s.bg).length) delete s.bg; renderStage(); renderRail(true); fmCommit('Fond'); return; }
      if (path === 'fill' && !v){ fmApply('fill', ''); } else fmApply(path, v || null); fmCommit('Couleur');
    }, {none:none !== false, noneLabel:'Aucune'}); }; });
  b.querySelectorAll('[data-fshadow]').forEach(x => { x.onclick = () => { const v = FM_SHADOWS[+x.dataset.fshadow][1]; setProps(e => { delete e.shadow; if (!e.fx) e.fx = {}; if (v) e.fx.sh = {...v}; else delete e.fx.sh; tidyEl(e); }, 'Ombre', false); renderPanel(); }; });
  b.querySelectorAll('[data-wa]').forEach(x => { x.onclick = () => { applyWordArt(+x.dataset.wa); renderPanel(); }; });
  b.querySelectorAll('[data-fv="fillkind"]').forEach(x => { x.onclick = () => { const k = x.dataset.v; setProps(e => { const c = e.fill || 't:ac';
    if (k === 'none'){ e.fill = ''; delete e.g2; delete e.g3; delete e.gt; } else if (k === 'solid'){ e.fill = c; delete e.g2; delete e.g3; delete e.gt; }
    else { e.fill = c; if (!e.g2) e.g2 = e.fill === 't:ac' ? 't:ac2' : 't:ac'; if (k === 'lin') delete e.gt; else e.gt = k; } }, 'Remplissage', true); renderPanel(); }; });
  b.querySelectorAll('[data-bgc]').forEach(x => { x.onclick = () => { const s = cur(), c = x.dataset.bgc, keep = {pat:s.bg?.pat, pc:s.bg?.pc, po:s.bg?.po, ps:s.bg?.ps}; s.bg = c ? {c} : {}; Object.entries(keep).forEach(([k, q]) => q != null && (s.bg[k] = q)); if (!Object.keys(s.bg).length) delete s.bg; renderAll(); fmCommit('Fond'); }; });
  const bgSet = (obj, label) => { const s = cur(), keep = {pat:s.bg?.pat, pc:s.bg?.pc, po:s.bg?.po, ps:s.bg?.ps}; s.bg = obj; Object.entries(keep).forEach(([k, q]) => q != null && (s.bg[k] = q)); renderAll(); fmCommit(label); };
  b.querySelectorAll('[data-bgg]').forEach(x => { x.onclick = () => bgSet({g:[...FM_GRADS[+x.dataset.bgg]], a:135}, 'Fond dégradé'); });
  b.querySelectorAll('[data-bgm]').forEach(x => { x.onclick = () => bgSet({mesh:[...MESHES[+x.dataset.bgm][1]]}, 'Fond ambiance'); });
  b.querySelectorAll('[data-fa]').forEach(x => { x.onclick = () => { const a = x.dataset.fa, s = cur();
    if (a === 'cpstyle'){ copyStyle(); return; } if (a === 'pastestyle'){ pasteStyle(); renderPanel(); return; }
    if (a === 'bgimg'){ imgTarget = '@bg'; g$('edImgFile').click(); }
    else if (a === 'bgnoimg'){ delete s.bg.img; delete s.bg.dim; if (!Object.keys(s.bg).length) delete s.bg; renderAll(); fmCommit('Fond'); }
    else if (a === 'bgreset'){ delete s.bg; renderAll(); fmCommit('Fond du thème'); }
    else if (a === 'bgall'){ D.slides.forEach(q => { if (q !== s){ if (s.bg) q.bg = JSON.parse(JSON.stringify(s.bg)); else delete q.bg; q.nodeco = s.nodeco; } }); renderAll(); commit('Fond pour toutes'); toast('Fond appliqué à toutes les diapositives'); }
    else if (a === 'fxreset'){ setProps(e => { delete e.fx; delete e.shadow; delete e.pat; delete e.sd; if (e.st) WORDART_KEYS.forEach(k => delete e.st[k]); }, 'Effets réinitialisés', true); renderPanel(); } }; });
}

/* actions réutilisées par le Spectre (Ctrl + K) */
function applyWordArt(i){
  const w = WORDART[i][1]; if (!selEls().some(e => e.t === 'text' || (e.t === 'shape' && e.html != null))) return toast('Sélectionnez un texte');
  setProps(e => { if (!(e.t === 'text' || e.t === 'shape')) return; if (!e.st) e.st = {}; WORDART_KEYS.forEach(k => delete e.st[k]); Object.entries(w).forEach(([k, v]) => e.st[k] = JSON.parse(JSON.stringify(v))); if (e.html) e.html = stripInline(e.html, ['fc']); tidyEl(e); }, 'Style de texte', true);
}
function applyShadow(i){ if (!SEL.size) return toast('Sélectionnez un élément'); const v = FM_SHADOWS[i][1]; setProps(e => { delete e.shadow; if (!e.fx) e.fx = {}; if (v) e.fx.sh = {...v}; else delete e.fx.sh; tidyEl(e); }, 'Ombre', false); }
function setElAnim(k){ if (!SEL.size) return toast('Sélectionnez un élément'); setProps(x => { x.an = {k, click:x.an?.click}; }, 'Animation', false); previewAnim(selEls()); }
function toggleView(k){ V[k] = !V[k]; if (k === 'snapGrid' && V.snapGrid) V.grid = true; lsSet('ss.view', {grid:V.grid, snapGrid:V.snapGrid, guides:V.guides}); applyView(); if (panel === 'format') renderPanel(); toast(V[k] ? 'Activé' : 'Désactivé'); }
function setBgPattern(k){ const s = cur(); s.bg = s.bg || {}; if (k) s.bg.pat = k; else { delete s.bg.pat; if (!Object.keys(s.bg).length) delete s.bg; } renderAll(); commit('Motif de fond'); }
