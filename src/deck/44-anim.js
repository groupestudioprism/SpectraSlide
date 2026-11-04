/* ---------- Animations d'éléments (entrée, emphase, sortie), transitions et leur panneau ----------
   Élément : an {k, click, dur (s), del (s), ease, rep, loop} · Diapositive : tr (transition), trd (durée, s), an (apparition automatique), adv (avance seule après n s) */
const EASES = {soft:['Douce', 'cubic-bezier(.2,.75,.25,1)'], lin:['Linéaire', 'linear'], bounce:['Rebond', 'cubic-bezier(.34,1.56,.64,1)'], elastic:['Élastique', 'cubic-bezier(.68,-.55,.27,1.55)'], acc:['Accélérée', 'cubic-bezier(.5,0,1,.5)'], inout:['Progressive', 'ease-in-out']};
/* [clé, nom, type, keyframes, durée, courbe] */
const ANIM_LIST = [
  ['fade', 'Fondu', 'in', 'an-fade', .7], ['rise', 'Monter', 'in', 'an-rise', .7], ['drop', 'Descendre', 'in', 'an-drop', .7], ['left', 'Glisser', 'in', 'an-left', .7], ['right', 'Glisser à gauche', 'in', 'an-right', .7],
  ['zoom', 'Zoom', 'in', 'an-zoom', .7], ['grow', 'Grandir', 'in', 'an-grow', .7], ['pop', 'Rebond', 'in', 'an-pop', .75], ['bounce', 'Chute rebondie', 'in', 'an-bounce', .95, 'linear'], ['swing', 'Balancier', 'in', 'an-swing', .9],
  ['flip', 'Retourner', 'in', 'an-flip', .8], ['spin', 'Tourbillon', 'in', 'an-spin', .9], ['stretch', 'Étirer', 'in', 'an-stretch', .7], ['wipe', 'Balayage', 'in', 'an-wipe', .9], ['wipev', 'Rideau', 'in', 'an-wipev', .9], ['blur', 'Mise au point', 'in', 'an-blur', .9], ['type', 'Machine à écrire', 'in', 'an-wipe', 1.4, 'steps(28)'],
  ['pulse', 'Pulsation', 'em', 'an-pulse', .8], ['beat', 'Battement', 'em', 'an-beat', 1], ['shake', 'Secousse', 'em', 'an-shake', .7], ['wobble', 'Vacillement', 'em', 'an-wobble', 1], ['tada', 'Tada', 'em', 'an-tada', 1], ['jello', 'Gélatine', 'em', 'an-jello', 1], ['flash', 'Clignotement', 'em', 'an-flash', 1], ['turn', 'Tour complet', 'em', 'an-turn', 1, 'inout'], ['float', 'Flottement', 'em', 'an-float', 2.4, 'inout'],
  ['fadeout', 'Fondu de sortie', 'out', 'an-fadeout', .6], ['zoomout', 'Zoom arrière', 'out', 'an-zoomout', .6], ['shrink', 'Disparaître', 'out', 'an-shrink', .6], ['fall', 'Chute', 'out', 'an-fall', .8, 'acc'], ['slideout', 'Sortir', 'out', 'an-slideout', .6], ['spinout', 'Tourbillon de sortie', 'out', 'an-spinout', .8], ['blurout', 'Flou de sortie', 'out', 'an-blurout', .7],
];
const ANIM_BY = Object.fromEntries(ANIM_LIST.map(a => [a[0], a]));
const ANIM_TYPES = [['in', 'Entrée'], ['em', 'Emphase'], ['out', 'Sortie']];
const TRANS = [['', 'Aucune'], ['fade', 'Fondu'], ['slide', 'Glisser'], ['push', 'Pousser'], ['zoom', 'Zoom'], ['flip', 'Retourner'], ['wipe', 'Balayer'], ['rise', 'Monter'], ['blur', 'Flou'],
  ['cube', 'Cube'], ['circle', 'Iris'], ['diamond', 'Losange'], ['curtain', 'Rideau'], ['split', 'Ouverture'], ['blinds', 'Stores'], ['uncover', 'Découvrir'], ['spin', 'Rotation'], ['fall', 'Chute'], ['roll', 'Rouleau']];
const SLIDE_ANIMS = [['', 'Aucune'], ['rise', 'Cascade'], ['fade', 'Fondu'], ['pop', 'Rebond'], ['zoom', 'Zoom'], ['left', 'Glisser'], ['grow', 'Grandir'], ['blur', 'Mise au point'], ['flip', 'Retourner']];
const isCoverEl = (e, W, H) => (e.t === 'img' && e.w >= W * .95) || (e.t === 'shape' && e.w >= W * .95 && e.h >= H * .95);
/* applique une animation à un nœud : variables CSS lues par .an-run */
function animSet(n, an, delayMs){
  const def = ANIM_BY[an.k]; if (!def) return false;
  n.dataset.an = an.k; n.dataset.at = def[2];
  n.style.setProperty('--an', def[3]); n.style.setProperty('--dur', (an.dur ?? def[4]) + 's');
  n.style.setProperty('--ease', EASES[an.ease]?.[1] || def[5] || EASES.soft[1]); n.style.setProperty('--rep', an.loop ? 'infinite' : String(an.rep || 1));
  n.style.setProperty('--d', Math.round(delayMs + (an.del || 0) * 1000) + 'ms'); return true;
}
function animClear(n){ n.classList.remove('an-run', 'an-wait'); ['an', 'at'].forEach(k => delete n.dataset[k]); ['--an', '--dur', '--ease', '--rep', '--d'].forEach(k => n.style.removeProperty(k)); }
function previewAnim(list){
  list.forEach((e, i) => { const n = elNode(e.id); if (!n || !e.an?.k) return; const a = e.an; n.classList.remove('an-run', 'an-wait'); void n.offsetWidth; if (!animSet(n, a, i * 90)) return; n.classList.add('an-run');
    setTimeout(() => animClear(n), ((a.dur ?? ANIM_BY[a.k][4]) * (a.rep || 1) + (a.del || 0)) * 1000 + 600 + i * 90); });
}
function previewSlideAnim(){
  const s = cur(), [W, H] = dims(); let i = 0;
  [...s.els].sort((a, b) => (a.y - b.y) || (a.x - b.x)).forEach(e => { const k = e.an?.k || s.an; if (!k || !ANIM_BY[k] || (!e.an?.k && isCoverEl(e, W, H))) return; const n = elNode(e.id); if (!n) return;
    animClear(n); void n.offsetWidth; const a = e.an?.k ? e.an : {k}; animSet(n, a, i++ * 110 + 120); n.classList.add('an-run'); setTimeout(() => animClear(n), 2600 + i * 110); });
}
function animPanelHTML(){
  const s = cur(), l = selEls(), e = l[0], a = e?.an || {}, def = ANIM_BY[a.k], rg = (k, t, min, max, step, v, u) => `<label class="pn-rg"><span>${t} <b id="${k}V">${v}${u}</b></span><input type="range" data-ak="${k}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
  let h = `<h4 class="pn-h">Transition vers cette diapositive</h4><div class="pn-chips big">${TRANS.map(([k, t]) => `<button type="button" data-tr="${k}" aria-pressed="${(s.tr || '') === k}">${t}</button>`).join('')}</div>
    ${s.tr ? `<div class="pn-grid2">${rg('trd', 'Durée', .2, 3, .1, s.trd ?? .7, ' s')}</div>` : ''}
    <div class="pn-grid2"><label class="pn-num"><span>Avancer seule après</span><input type="number" min="0" max="600" step="1" placeholder="Au clic" data-ak="adv" value="${s.adv || ''}"><em>s</em></label>
    <label class="pop-toggle"><input type="checkbox" data-ak="loop" ${D.loop ? 'checked' : ''}><div><b>Boucle</b><small>Recommencer à la fin</small></div></label></div>
    <h4 class="pn-h">Apparition des éléments <small>automatique, l'un après l'autre</small></h4><div class="pn-chips big">${SLIDE_ANIMS.map(([k, t]) => `<button type="button" data-san="${k}" aria-pressed="${(s.an || '') === k}">${t}</button>`).join('')}</div>`;
  if (l.length){
    h += `<h4 class="pn-h">Élément sélectionné <small>prioritaire sur l'apparition automatique</small></h4>`
      + ANIM_TYPES.map(([ty, tn]) => `<p class="pn-sub">${tn}</p><div class="pn-chips big">${ty === 'in' ? `<button type="button" data-ean="" aria-pressed="${!a.k}">Aucune</button>` : ''}${ANIM_LIST.filter(x => x[2] === ty).map(x => `<button type="button" data-ean="${x[0]}" aria-pressed="${a.k === x[0]}">${x[1]}</button>`).join('')}</div>`).join('');
    if (def) h += `<div class="pn-box"><label class="pop-toggle"><input type="checkbox" data-ak="click" ${a.click ? 'checked' : ''}><div><b>Au clic</b><small>${def[2] === 'in' ? 'Apparaît quand vous avancez' : 'Se déclenche quand vous avancez'}</small></div></label>
      <div class="pn-grid2">${rg('dur', 'Durée', .1, 5, .1, a.dur ?? def[4], ' s')}${rg('del', 'Délai', 0, 8, .1, a.del || 0, ' s')}</div>
      <div class="pn-grid2"><label class="pn-num"><span>Courbe</span><select data-ak="ease">${Object.entries(EASES).map(([k, v]) => `<option value="${k}" ${(a.ease || '') === k ? 'selected' : ''}>${v[0]}</option>`).join('')}<option value="" ${!a.ease ? 'selected' : ''}>Par défaut</option></select></label>
      <label class="pn-num"><span>Répéter</span><select data-ak="rep">${[1, 2, 3, 5].map(n => `<option value="${n}" ${!a.loop && (a.rep || 1) === n ? 'selected' : ''}>${n} fois</option>`).join('')}<option value="inf" ${a.loop ? 'selected' : ''}>En boucle</option></select></label></div></div>`;
  }
  return h + `<div class="pn-acts"><button type="button" class="pn-wide" data-a="preview">${ICX.present} Aperçu</button><button type="button" class="pn-wide" data-a="all">${IC.copy} Appliquer à toutes les diapositives</button><button type="button" class="pn-wide" data-a="magic">${ICX.fx} Animer toute la présentation</button><button type="button" class="pn-wide" data-a="none">${IC.trash} Retirer toutes les animations</button></div>`;
}
/* réglages du panneau Animer (curseurs, listes, cases) */
function animPanelInput(ev, final){
  const t = ev.target, k = t.dataset.ak; if (!k || V.ro) return; const s = cur(), v = t.type === 'checkbox' ? t.checked : t.value;
  const show = (id, txt) => { const o = g$(id); if (o) o.textContent = txt; };
  if (k === 'trd'){ s.trd = +v === .7 ? undefined : +v; show('trdV', (+v).toFixed(1) + ' s'); if (final) commit('Durée de la transition'); return; }
  if (k === 'adv'){ s.adv = +v > 0 ? clamp(+v, 1, 600) : undefined; if (final) commit('Avance automatique'); return; }
  if (k === 'loop'){ D.loop = v || undefined; commit('Boucle'); return; }
  const l = selEls().filter(e => e.an); if (!l.length) return;
  l.forEach(e => { const a = e.an;
    if (k === 'click') a.click = !!v; else if (k === 'dur'){ a.dur = +v; show('durV', (+v).toFixed(1) + ' s'); } else if (k === 'del'){ a.del = +v || undefined; show('delV', (+v).toFixed(1) + ' s'); }
    else if (k === 'ease') a.ease = v || undefined; else if (k === 'rep'){ if (v === 'inf'){ a.loop = 1; delete a.rep; } else { delete a.loop; a.rep = +v > 1 ? +v : undefined; } } });
  if (final){ commit('Animation'); previewAnim(l); }
}
