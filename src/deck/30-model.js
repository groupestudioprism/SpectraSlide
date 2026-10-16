/* ---------- Modèle : présentation, diapositives, éléments, mises en page, historique ----------
   Présentation : {v, app, title, theme:{id,…}, size:'16:9', slides:[…], media:{id:dataURL}}
   Diapositive : {id, v:'title'|'section'|'content'|'end', lay, els:[…], bg?, notes, tr (transition), an (animation d'entrée), hide}
   Élément : {id, t:'text'|'shape'|'line'|'img'|'icon'|'table'|'chart', x, y, w, h, rot, op, lock, g (groupe), an:{k, click}} + propriétés du type
   Les images sont rangées une fois dans media (src « m:id ») : l'historique ne recopie jamais leurs données. */
let D = null, CUR = 0;
const SEL = new Set();
const nid = () => 'e' + uidS() + uidS().slice(0, 3);
const sid = () => 's' + uidS() + uidS().slice(0, 3);
const dims = () => SIZES[D?.size] || SIZES['16:9'];
const cur = () => D.slides[CUR];
const elById = (id, s = cur()) => s?.els.find(e => e.id === id);
const selEls = () => cur() ? cur().els.filter(e => SEL.has(e.id)) : [];
const escT = s => escH(s).replace(/\n/g, '<br>');
const bul = items => `<ul>${items.map(x => `<li>${escT(x)}</li>`).join('')}</ul>`;
const KICK = {f:'b', fs:16, b:1, ls:.16, up:1, fc:'t:ac'};
function T(x, y, w, h, html, st = {}, ex = {}){ return {id:nid(), t:'text', x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h), html, st:{f:'b', fs:24, fc:'t:ink', ha:'l', va:'t', lh:1.3, ...st}, ...ex}; }
function SH(k, x, y, w, h, fill = 't:ac', ex = {}){ return {id:nid(), t:k === 'line' || k === 'arrowline' ? 'line' : 'shape', k, x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h), fill, ...ex}; }
function LN(x, y, w, col = 't:line', lw = 3, ex = {}){ return {id:nid(), t:'line', k:'line', x:Math.round(x), y:Math.round(y - 10), w:Math.round(w), h:20, stroke:col, lw, ...ex}; }
function IMG(x, y, w, h, ex = {}){ return {id:nid(), t:'img', x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h), src:'', fit:'cover', px:50, py:50, ...ex}; }
function ICO(n, x, y, s, col = 't:ac', ex = {}){ return {id:nid(), t:'icon', n:ICONS[n] ? n : 'star', x:Math.round(x), y:Math.round(y), w:s, h:s, fc:col, sw:1.8, ...ex}; }
function CHART(x, y, w, h, ct, labels, series, ex = {}){ return {id:nid(), t:'chart', ct, x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h), labels, series, legend:series.length > 1 || ct === 'pie' || ct === 'donut', vals:true, ...ex}; }
function TABLE(x, y, w, rows, ex = {}){ const fs = rows.length > 7 ? 16 : 19; return {id:nid(), t:'table', x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(rows.length * (fs * 2.3 + 2)), rows:rows.map(r => r.map(c => escT(c))), fs, head:true, band:true, ...ex}; }
/* hauteur estimée d'un texte (avant mesure réelle dans la page) */
function estH(text, fs, w, lh = 1.25){ const s = String(text || '').replace(/<[^>]+>/g, ' '); const lines = s.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length * fs * .53 / Math.max(40, w))), 0); return Math.ceil(lines * fs * lh + 6); }

/* ---------- Mises en page : une description (spec) → une diapositive complète ----------
   spec : {layout, title, subtitle, kicker, bullets[], text, left{title,bullets}, right{…}, items[{title,text,icon,value,date}], stat, label,
           quote, author, role, chart{type,labels,series[{name,values}]}, table[[…]], notes, footer} */
const LAYOUTS = [
  ['title', 'Titre', 'Couverture de la présentation'], ['section', 'Section', 'Ouvre une partie'], ['bullets', 'Titre et liste', 'Points clés'],
  ['text', 'Titre et texte', 'Un paragraphe'], ['two', 'Deux colonnes', 'Deux listes côte à côte'], ['image', 'Texte et image', 'Liste à gauche, photo à droite'],
  ['cards', 'Cartes', '2 à 6 idées avec icônes'], ['stats', 'Chiffres clés', '2 à 4 grands nombres'], ['stat', 'Un grand chiffre', 'Le chiffre qui marque'],
  ['process', 'Étapes', 'Un processus en flèches'], ['timeline', 'Frise', 'Dates et jalons'], ['compare', 'Comparaison', 'Avant / après, A / B'],
  ['chart', 'Graphique', 'Données et message clé'], ['table', 'Tableau', 'Lignes et colonnes'], ['agenda', 'Sommaire', 'Les parties numérotées'],
  ['quote', 'Citation', 'Une phrase forte'], ['team', 'Équipe', 'Photos, noms et rôles'], ['big', 'Message', 'Une seule idée, en grand'],
  ['photo', 'Photo pleine page', 'Image et titre par-dessus'], ['end', 'Fin', 'Merci et contact'], ['blank', 'Vide', 'Une page blanche'],
];
function buildSlide(spec = {}, size){
  const [W, H] = SIZES[size || D?.size] || SIZES['16:9'], k = Math.min(W / 1280, H / 720), M = Math.round(80 * W / 1280), f = n => Math.round(n * k);
  const L = spec.layout || 'bullets', els = [], s = {id:sid(), v:'content', lay:L, els, notes:String(spec.notes || '')};
  const items = (spec.items || []).filter(Boolean).slice(0, 6);
  const titleTop = (y = Math.round(64 * H / 720), w = W - 2 * M, fs = f(44)) => {
    let yy = y; if (spec.kicker){ els.push(T(M, yy, w, f(24), escT(spec.kicker), {...KICK, fs:f(15)})); yy += f(30); }
    const th = estH(spec.title, fs, w, 1.1); els.push(T(M, yy, w, th, escT(spec.title || 'Titre'), {f:'h', fs, b:1, lh:1.1}, {ph:'title'})); return yy + th;
  };
  if (L === 'title' || L === 'end'){
    s.v = L === 'end' ? 'end' : 'title';
    const cx = L === 'end', w = cx ? W - 2 * M : Math.round(W * .7), x = M, al = cx ? 'c' : 'l';
    const fs = f(cx ? 96 : (String(spec.title || '').length > 40 ? 60 : 76)), th = estH(spec.title, fs, w, 1.04), sh = spec.subtitle ? estH(spec.subtitle, f(26), w, 1.35) : 0;
    let y = Math.round((H - th - sh - (spec.kicker ? f(40) : 0) - (sh ? f(28) : 0)) / 2) - (cx ? 0 : f(20));
    if (spec.kicker){ els.push(T(x, y, w, f(24), escT(spec.kicker), {...KICK, fs:f(16), ha:al})); y += f(40); }
    els.push(T(x, y, w, th, escT(spec.title || (cx ? 'Merci !' : 'Titre de la présentation')), {f:'h', fs, b:1, lh:1.04, ha:al}, {ph:'title'})); y += th + f(28);
    if (spec.subtitle) els.push(T(x, y, w, sh, escT(spec.subtitle), {fs:f(26), fc:'t:mut', lh:1.35, ha:al}, {ph:'sub'}));
    if (spec.footer) els.push(T(x, H - M - f(28), w, f(28), escT(spec.footer), {fs:f(17), fc:'t:mut', ha:al, b:1}));
  } else if (L === 'section'){
    s.v = 'section';
    const w = Math.round(W * .74); let y = Math.round(H * .24);
    els.push(T(M, y, f(300), f(150), escT(spec.kicker || spec.number || '01'), {f:'h', fs:f(132), b:1, fc:'t:ac', lh:1}));
    y += f(170); const th = estH(spec.title, f(62), w, 1.06);
    els.push(T(M, y, w, th, escT(spec.title || 'Nouvelle partie'), {f:'h', fs:f(62), b:1, lh:1.06}, {ph:'title'})); y += th + f(20);
    if (spec.subtitle) els.push(T(M, y, w, estH(spec.subtitle, f(24), w), escT(spec.subtitle), {fs:f(24), fc:'t:mut', lh:1.4}));
  } else if (L === 'bullets' || L === 'text'){
    const y = titleTop() + f(34), list = (spec.bullets || []).slice(0, 9), fs = f(list.length > 6 ? 22 : 26);
    const html = L === 'text' || !list.length ? escT(spec.text || 'Votre texte ici.') : bul(list);
    els.push(T(M, y, W - 2 * M, H - y - M, html, {fs:L === 'text' ? f(26) : fs, lh:L === 'text' ? 1.5 : 1.45, fc:L === 'text' ? 't:mut' : 't:ink'}, {ph:'body'}));
  } else if (L === 'two' || L === 'compare'){
    const y0 = titleTop() + f(40), gap = f(L === 'compare' ? 32 : 64), cw = Math.round((W - 2 * M - gap) / 2), ch = H - y0 - M;
    [spec.left || {}, spec.right || {}].forEach((c, i) => {
      const x = M + i * (cw + gap), pad = L === 'compare' ? f(36) : 0; let y = y0 + pad;
      if (L === 'compare') els.push(SH('round', x, y0, cw, ch, i ? 't:ac' : 't:soft', {r:Math.max(8, f(20))}));
      const ink = L === 'compare' && i ? 't:on' : 't:ink';
      els.push(T(x + pad, y, cw - 2 * pad, f(40), escT(c.title || (i ? 'Après' : 'Avant')), {f:'h', fs:f(28), b:1, fc:L === 'compare' ? ink : 't:ac'})); y += f(58);
      els.push(T(x + pad, y, cw - 2 * pad, ch - (y - y0) - pad, bul((c.bullets || []).slice(0, 7)), {fs:f(21), lh:1.45, fc:ink}));
    });
  } else if (L === 'image'){
    const w = Math.round(W * .44); let y = Math.round(H * .16);
    if (spec.kicker){ els.push(T(M, y, w, f(24), escT(spec.kicker), {...KICK, fs:f(15)})); y += f(32); }
    const th = estH(spec.title, f(44), w, 1.1); els.push(T(M, y, w, th, escT(spec.title || 'Titre'), {f:'h', fs:f(44), b:1, lh:1.1}, {ph:'title'})); y += th + f(30);
    const list = (spec.bullets || []).slice(0, 6);
    els.push(T(M, y, w, H - y - M, list.length ? bul(list) : escT(spec.text || ''), {fs:f(22), lh:1.45, fc:list.length ? 't:ink' : 't:mut'}));
    els.push(IMG(Math.round(W * .54), 0, W - Math.round(W * .54), H, {hint:spec.image || ''}));
  } else if (L === 'photo'){
    els.push(IMG(0, 0, W, H, {hint:spec.image || ''}));
    els.push(SH('rect', 0, 0, W, H, '#0B0816', {op:.45}));
    const w = Math.round(W * .7), th = estH(spec.title, f(68), w, 1.05);
    els.push(T(M, H - M - th - (spec.subtitle ? f(60) : 0), w, th, escT(spec.title || 'Titre'), {f:'h', fs:f(68), b:1, lh:1.05, fc:'#FFFFFF'}, {ph:'title'}));
    if (spec.subtitle) els.push(T(M, H - M - f(44), w, f(40), escT(spec.subtitle), {fs:f(24), fc:'#E9E6F5'}));
  } else if (L === 'cards'){
    const y0 = titleTop() + f(44), n = Math.max(1, items.length || 3), rows = n > 4 ? 2 : 1, per = Math.ceil(n / rows), gap = f(24);
    const cw = Math.round((W - 2 * M - (per - 1) * gap) / per), ch = Math.round((H - y0 - M - (rows - 1) * gap) / rows);
    (items.length ? items : [{title:'Idée 1'}, {title:'Idée 2'}, {title:'Idée 3'}]).forEach((it, i) => {
      const r = Math.floor(i / per), c = i % per, x = M + c * (cw + gap), y = y0 + r * (ch + gap), p = f(rows > 1 ? 22 : 30), ic = f(rows > 1 ? 48 : 60);
      els.push(SH('round', x, y, cw, ch, 't:soft', {r:Math.max(6, f(18)), stroke:'t:line', sw:1}));
      els.push(SH('ellipse', x + p, y + p, ic, ic, i % 3 === 1 ? 't:ac2' : i % 3 === 2 ? 't:ac3' : 't:ac'));
      els.push(ICO(it.icon || ['idea', 'target', 'rocket', 'users', 'chart', 'shield'][i % 6], x + p + ic * .22, y + p + ic * .22, Math.round(ic * .56), i % 3 === 1 ? 't:on2' : 't:on'));
      let ty = y + p + ic + f(rows > 1 ? 14 : 22);
      els.push(T(x + p, ty, cw - 2 * p, f(34), escT(it.title || ''), {f:'h', fs:f(rows > 1 ? 21 : 25), b:1, lh:1.15})); ty += f(rows > 1 ? 34 : 44);
      if (it.text) els.push(T(x + p, ty, cw - 2 * p, Math.max(f(30), y + ch - ty - p), escT(it.text), {fs:f(rows > 1 ? 15 : 18), fc:'t:mut', lh:1.4}));
    });
  } else if (L === 'stats'){
    const y0 = titleTop() + f(70), n = Math.max(1, Math.min(4, items.length || 3)), gap = f(40), cw = Math.round((W - 2 * M - (n - 1) * gap) / n);
    (items.length ? items : [{value:'98 %', title:'Clients satisfaits'}, {value:'12', title:'Pays'}, {value:'3,2 M€', title:'Chiffre d\'affaires'}]).slice(0, 4).forEach((it, i) => {
      const x = M + i * (cw + gap); let y = y0;
      els.push(SH('rect', x, y, f(56), f(6), ['t:ac', 't:ac2', 't:ac3', 't:ac'][i], {r:3})); y += f(30);
      const vf = f(n > 3 ? 64 : 84); els.push(T(x, y, cw, Math.round(vf * 1.1), escT(it.value || ''), {f:'h', fs:vf, b:1, fc:'t:ac', lh:1})); y += Math.round(vf * 1.1) + f(14);
      els.push(T(x, y, cw, f(32), escT(it.title || it.label || ''), {fs:f(23), b:1, lh:1.2})); y += f(38);
      if (it.text) els.push(T(x, y, cw, estH(it.text, f(18), cw, 1.4), escT(it.text), {fs:f(18), fc:'t:mut', lh:1.4}));
    });
  } else if (L === 'stat'){
    const w = Math.round(W * .62); let y = Math.round(H * .16);
    if (spec.kicker){ els.push(T(M, y, w, f(24), escT(spec.kicker), {...KICK, fs:f(15)})); y += f(36); }
    els.push(T(M, y, W - 2 * M, f(230), escT(spec.stat || spec.value || '73 %'), {f:'h', fs:f(210), b:1, fc:'t:ac', lh:1})); y += f(240);
    els.push(T(M, y, w, estH(spec.label || spec.title, f(36), w, 1.15), escT(spec.label || spec.title || ''), {f:'h', fs:f(36), b:1, lh:1.15}, {ph:'title'})); y += estH(spec.label || spec.title, f(36), w, 1.15) + f(14);
    if (spec.text) els.push(T(M, y, w, estH(spec.text, f(22), w, 1.45), escT(spec.text), {fs:f(22), fc:'t:mut', lh:1.45}));
    els.push(SH('ellipse', W - M - f(260), Math.round(H / 2 - f(130)), f(260), f(260), '', {stroke:'t:ac2', sw:f(22), op:.5}));
  } else if (L === 'process'){
    const y0 = titleTop() + f(70), n = Math.max(2, Math.min(5, items.length || 4)), gap = f(6), cw = Math.round((W - 2 * M - (n - 1) * gap) / n), ch = f(96);
    (items.length ? items : [{title:'Écouter'}, {title:'Concevoir'}, {title:'Réaliser'}, {title:'Livrer'}]).slice(0, 5).forEach((it, i) => {
      const x = M + i * (cw + gap), fill = i % 2 ? 't:ac2' : 't:ac';
      els.push(SH(i ? 'chev' : 'arrow', x, y0, cw + (i < n - 1 ? f(18) : 0), ch, fill, {html:`<b>${String(i + 1).padStart(2, '0')}</b> ${escT(it.title || '')}`, st:{fs:f(n > 4 ? 18 : 21), fc:i % 2 ? 't:on2' : 't:on', ha:'c', va:'m', f:'h', b:1}}));
      if (it.text) els.push(T(x + f(10), y0 + ch + f(26), cw - f(20), estH(it.text, f(18), cw - f(20), 1.45), escT(it.text), {fs:f(18), fc:'t:mut', lh:1.45}));
    });
  } else if (L === 'timeline'){
    titleTop(); const n = Math.max(2, Math.min(6, items.length || 4)), y = Math.round(H * .5), cw = Math.round((W - 2 * M) / n);
    els.push(SH('rect', M, y - 2, W - 2 * M, 4, 't:line', {r:2}));
    (items.length ? items : [{date:'2024', title:'Idée'}, {date:'2025', title:'Prototype'}, {date:'2026', title:'Lancement'}, {date:'2027', title:'International'}]).slice(0, 6).forEach((it, i) => {
      const x = M + i * cw;
      els.push(SH('ellipse', x, y - f(13), f(26), f(26), i % 2 ? 't:ac2' : 't:ac', {stroke:'t:bg', sw:f(5)}));
      els.push(T(x, y - f(70), cw - f(20), f(40), escT(it.date || it.value || ''), {f:'h', fs:f(30), b:1, fc:'t:ac'}));
      els.push(T(x, y + f(34), cw - f(24), f(34), escT(it.title || ''), {fs:f(22), b:1, lh:1.2}));
      if (it.text) els.push(T(x, y + f(72), cw - f(24), estH(it.text, f(17), cw - f(24), 1.4), escT(it.text), {fs:f(17), fc:'t:mut', lh:1.4}));
    });
  } else if (L === 'chart'){
    const y0 = titleTop() + f(30), cw = Math.round((W - 2 * M) * .62), c = spec.chart || {};
    const series = (c.series || [{name:'Série 1', values:[12, 19, 15, 26]}]).slice(0, 6).map(x => ({n:String(x.name || ''), v:(x.values || []).map(Number)}));
    els.push(CHART(M, y0, cw, H - y0 - M, ['col', 'bar', 'line', 'area', 'pie', 'donut', 'stack'].includes(c.type) ? c.type : 'col', (c.labels || ['T1', 'T2', 'T3', 'T4']).map(String), series));
    const x = M + cw + f(48), w = W - M - x; let y = y0 + f(20);
    els.push(T(x, y, w, f(24), 'À retenir', {...KICK, fs:f(15)})); y += f(36);
    els.push(T(x, y, w, H - y - M, escT(spec.text || 'Le message clé de ce graphique, en une ou deux phrases.'), {f:'h', fs:f(28), b:1, lh:1.25}));
  } else if (L === 'table'){
    const y0 = titleTop() + f(36), rows = (spec.table || [['Élément', 'Valeur'], ['A', '1'], ['B', '2']]).slice(0, 12).map(r => (Array.isArray(r) ? r : [r]).slice(0, 7).map(x => String(x ?? '')));
    els.push(TABLE(M, y0, W - 2 * M, rows));
  } else if (L === 'agenda'){
    const w = Math.round(W * .3);
    els.push(T(M, Math.round(H * .2), w, f(140), escT(spec.title || 'Sommaire'), {f:'h', fs:f(56), b:1, lh:1.05}, {ph:'title'}));
    if (spec.subtitle) els.push(T(M, Math.round(H * .2) + f(150), w, f(80), escT(spec.subtitle), {fs:f(20), fc:'t:mut', lh:1.4}));
    const list = (items.length ? items.map(x => x.title) : spec.bullets || ['Contexte', 'Notre solution', 'Résultats', 'Prochaines étapes']).slice(0, 6);
    const x0 = M + w + f(70), rh = Math.min(f(96), Math.round((H - 2 * M) / list.length)), y0 = Math.round((H - rh * list.length) / 2);
    list.forEach((t, i) => { const y = y0 + i * rh, d = f(52);
      els.push(SH('ellipse', x0, y + (rh - d) / 2, d, d, i % 2 ? 't:ac2' : 't:ac', {html:String(i + 1), st:{fs:f(22), b:1, f:'h', fc:i % 2 ? 't:on2' : 't:on', ha:'c', va:'m'}}));
      els.push(T(x0 + d + f(26), y + (rh - f(36)) / 2, W - M - x0 - d - f(26), f(36), escT(t), {fs:f(28), b:1, f:'h', lh:1.2}));
      if (i < list.length - 1) els.push(SH('rect', x0 + d + f(26), y + rh - 1, W - M - x0 - d - f(26), 1, 't:line'));
    });
  } else if (L === 'quote'){
    els.push(T(M - f(10), Math.round(H * .04), f(300), f(260), '“', {f:'h', fs:f(300), b:1, fc:'t:ac', lh:1}, {op:.22}));
    const w = W - 2 * M - f(80), fs = f(String(spec.quote || '').length > 140 ? 34 : 44), th = estH(spec.quote, fs, w, 1.25);
    let y = Math.max(f(150), Math.round((H - th) / 2) - f(30));
    els.push(T(M + f(60), y, w, th, escT(spec.quote || spec.title || 'Une phrase qui marque les esprits.'), {f:'h', fs, lh:1.25, i:1}, {ph:'title'})); y += th + f(36);
    els.push(SH('rect', M + f(60), y, f(48), f(4), 't:ac', {r:2}));
    els.push(T(M + f(124), y - f(16), w - f(70), f(34), escT(spec.author || ''), {fs:f(22), b:1}));
    if (spec.role) els.push(T(M + f(124), y + f(16), w - f(70), f(30), escT(spec.role), {fs:f(18), fc:'t:mut'}));
  } else if (L === 'team'){
    const y0 = titleTop() + f(60), n = Math.max(1, Math.min(5, items.length || 3)), cw = Math.round((W - 2 * M) / n), d = f(n > 4 ? 140 : 170);
    (items.length ? items : [{title:'Prénom Nom', text:'Rôle'}, {title:'Prénom Nom', text:'Rôle'}, {title:'Prénom Nom', text:'Rôle'}]).slice(0, 5).forEach((it, i) => {
      const cx = M + i * cw + cw / 2;
      els.push(IMG(cx - d / 2, y0, d, d, {mask:'circle'}));
      els.push(T(M + i * cw + f(10), y0 + d + f(24), cw - f(20), f(34), escT(it.title || ''), {f:'h', fs:f(24), b:1, ha:'c'}));
      els.push(T(M + i * cw + f(10), y0 + d + f(62), cw - f(20), f(50), escT(it.text || it.role || ''), {fs:f(18), fc:'t:mut', ha:'c', lh:1.35}));
    });
  } else if (L === 'big'){
    const w = W - 2 * M - f(80), fs = f(String(spec.title || '').length > 80 ? 48 : 62), th = estH(spec.title, fs, w, 1.12);
    let y = Math.round((H - th) / 2) - (spec.kicker ? f(20) : 0);
    if (spec.kicker){ els.push(T(M + f(40), y - f(50), w, f(24), escT(spec.kicker), {...KICK, fs:f(16), ha:'c'})); }
    els.push(T(M + f(40), y, w, th, escT(spec.title || 'Une idée, en grand.'), {f:'h', fs, b:1, lh:1.12, ha:'c'}, {ph:'title'}));
    if (spec.subtitle) els.push(T(M + f(40), y + th + f(26), w, f(60), escT(spec.subtitle), {fs:f(24), fc:'t:mut', ha:'c', lh:1.4}));
  } else if (L === 'blank'){
    // rien
  }
  return s;
}
const cloneSlide = s => { const c = JSON.parse(JSON.stringify(s)); c.id = sid(); const gm = {}; c.els.forEach(e => { e.id = nid(); if (e.g) e.g = gm[e.g] || (gm[e.g] = 'g' + uidS()); }); return c; };
function newDeck(title = 'Présentation sans titre', theme = 'spectra', slides){
  const d = {v:1, app:'spectraslide', title, theme:{id:theme}, size:'16:9', slides:[], media:{}};
  const keep = D; D = d; try { d.slides = slides || [buildSlide({layout:'title', title:title === 'Présentation sans titre' ? '' : title, subtitle:'Sous-titre ou nom de l\'orateur'})]; } finally { D = keep; }
  return d;
}

/* ---------- Historique (annuler / rétablir) : instantanés de la présentation sans les images ---------- */
const UNDO = {list:[], i:-1};
const snapOf = () => JSON.stringify({title:D.title, theme:D.theme, size:D.size, slides:D.slides});
function undoReset(){ UNDO.list = [{s:snapOf(), cur:CUR, sel:[]}]; UNDO.i = 0; }
function commit(label){
  const s = snapOf(); if (UNDO.list[UNDO.i]?.s === s) return false;
  UNDO.list.splice(UNDO.i + 1); UNDO.list.push({s, cur:CUR, sel:[...SEL], label}); if (UNDO.list.length > 150) UNDO.list.shift(); UNDO.i = UNDO.list.length - 1;
  afterChange(); return true;
}
function restore(st){
  const o = JSON.parse(st.s); Object.assign(D, o); CUR = clamp(st.cur, 0, D.slides.length - 1); SEL.clear(); (st.sel || []).forEach(id => elById(id) && SEL.add(id));
  stopEdit(true); renderAll(); emitChange();
}
function undo(){ if (UNDO.i <= 0) return toast('Rien à annuler'); const prev = UNDO.list[UNDO.i]; UNDO.i--; restore({...UNDO.list[UNDO.i], cur:prev.cur, sel:prev.sel}); toast(`Annulé${prev.label ? ' : ' + prev.label : ''}`); }
function redo(){ if (UNDO.i >= UNDO.list.length - 1) return toast('Rien à rétablir'); UNDO.i++; restore(UNDO.list[UNDO.i]); toast(`Rétabli${UNDO.list[UNDO.i].label ? ' : ' + UNDO.list[UNDO.i].label : ''}`); }
/* images : un seul exemplaire par image, référencé par les éléments ; nettoyées à l'enregistrement */
function mediaPut(dataUrl){ for (const [k, v] of Object.entries(D.media)) if (v === dataUrl) return 'm:' + k; const id = uidS(); D.media[id] = dataUrl; return 'm:' + id; }
const mediaSrc = src => !src ? '' : src.startsWith('m:') ? D?.media?.[src.slice(2)] || '' : src;
function usedMedia(d = D){ const u = new Set(); const scan = s => { if (s?.bg?.img) u.add(String(s.bg.img).slice(2)); s.els.forEach(e => { if (e.t === 'img' && String(e.src).startsWith('m:')) u.add(e.src.slice(2)); }); }; d.slides.forEach(scan); return u; }
