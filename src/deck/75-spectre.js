/* ---------- Le Spectre (Ctrl + K) : actions, phrases comprises sur place, et l'IA pour le reste ---------- */
const SPX = {items:[], all:[], i:0};
const AIS = {busy:false, res:null, prompt:'', ctx:null, ctl:0};
function spectreActions(){
  const A = [], add = (g, t, run, k = '') => A.push({g, t, run, k});
  add('Présenter', 'Présenter depuis le début', () => present(0), 'diaporama lancer plein écran f5'); add('Présenter', 'Présenter depuis cette diapositive', () => present(CUR), 'diaporama');
  add('Diapositives', 'Nouvelle diapositive', () => addSlide({layout:'bullets'}), 'ajouter page'); add('Diapositives', 'Dupliquer la diapositive', () => dupSlide(), 'copie'); add('Diapositives', 'Supprimer la diapositive', () => delSlide(), 'effacer');
  add('Diapositives', 'Masquer / afficher la diapositive', () => toggleHide(), 'cacher'); add('Diapositives', 'Notes de l\'orateur', () => toggleNotes(true), 'commentaires');
  LAYOUTS.forEach(([k, t]) => add('Mise en page', 'Mise en page : ' + t.toLowerCase(), () => applyLayout(k), 'disposition')); LAYOUTS.forEach(([k, t]) => add('Nouvelle diapositive', 'Nouvelle diapositive : ' + t.toLowerCase(), () => addSlide({layout:k}), 'ajouter'));
  Object.entries(TEXT_STYLES).forEach(([k, [t]]) => add('Insérer', 'Ajouter : ' + t.toLowerCase(), () => addText(k), 'texte'));
  SHAPE_ORDER.forEach(k => add('Insérer', 'Forme : ' + SHAPES[k][0].toLowerCase(), () => addShape(k), 'forme'));
  add('Insérer', 'Image…', () => pickImage(), 'photo'); add('Insérer', 'Icône…', () => iconPop(g$('edBar')), 'pictogramme'); add('Insérer', 'Tableau', () => addTable(4, 3)); CHART_TYPES.forEach(([k, t]) => add('Insérer', 'Graphique : ' + t.toLowerCase(), () => addChart(k), 'diagramme'));
  BLOCKS.forEach(([k, t]) => add('Insérer', 'Élément : ' + t.toLowerCase(), () => addEls(blockEls(k), t)));
  DTHEMES.forEach(t => add('Design', 'Thème ' + t.name, () => { D.theme = {id:t.id}; ensureThemeFonts(); THUMB.clear(); renderAll(); commit('Thème'); }, 'couleurs style'));
  Object.entries(SIZE_NAMES).forEach(([k, t]) => add('Design', 'Format ' + t, () => resizeDeck(k), 'taille'));
  add('Design', 'Fond de la diapositive…', () => bgPop(g$('edBar')), 'couleur arrière-plan');
  add('Animer', 'Animer toute la présentation', () => { openPanel('anim'); g$('edPanelBody').querySelector('[data-a="magic"]')?.click(); }, 'animation transition'); TRANS.slice(1).forEach(([k, t]) => add('Animer', 'Transition : ' + t.toLowerCase(), () => { cur().tr = k; commit('Transition'); previewTransition(); }));
  add('Fichier', 'Exporter en PDF', () => doExport('pdf'), 'imprimer'); add('Fichier', 'Exporter en PowerPoint (.pptx)', () => doExport('pptx'), 'ppt'); add('Fichier', 'Exporter en page web', () => doExport('html'));
  add('Fichier', 'Ouvrir un fichier PowerPoint…', () => g$('homeFile').click(), 'importer pptx'); add('Fichier', 'Enregistrer comme modèle', saveTplDlg); add('Fichier', 'Publier dans la Communauté', () => window.SWHome?.publishCurrent?.()); add('Fichier', 'Partager…', () => window.SWShareCurrent?.());
  add('Édition', 'Annuler', undo); add('Édition', 'Rétablir', redo); add('Édition', 'Tout sélectionner', () => select(cur().els.map(e => e.id))); add('Édition', 'Raccourcis clavier', shortcutsDlg, 'aide');
  if (SEL.size){ add('Sélection', 'Dupliquer', dupSel); add('Sélection', 'Supprimer', delSel); add('Sélection', 'Premier plan', () => layer('front')); add('Sélection', 'Arrière-plan', () => layer('back')); ['l', 'c', 'r', 't', 'm', 'b'].forEach((k, i) => add('Sélection', 'Aligner : ' + ['à gauche', 'au centre', 'à droite', 'en haut', 'au milieu', 'en bas'][i], () => alignSel(k))); add('Sélection', 'Grouper', groupSel); add('Sélection', 'Verrouiller', lockSel); }
  D.slides.forEach((s, i) => { if (i !== CUR) add('Aller à', `Diapositive ${i + 1}${slideTitle(s) ? ' · ' + slideTitle(s) : ''}`, () => goSlide(i)); });
  return A;
}
const slideTitle = s => { const t = s.els.find(e => e.ph === 'title') || s.els.filter(e => e.t === 'text').sort((a, b) => (b.st?.fs || 0) - (a.st?.fs || 0))[0]; return (t?.html || '').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim().slice(0, 60); };
const SP_START = ['Présenter depuis le début', 'Nouvelle diapositive', 'Ajouter : titre', 'Image…', 'Animer toute la présentation', 'Exporter en PowerPoint (.pptx)'];
const COLORS_FR = {rouge:'#E5484D', orange:'#F76B15', jaune:'#FFC53D', vert:'#30A46C', bleu:'#0090FF', 'bleu marine':'#1E3A8A', marine:'#1E3A8A', turquoise:'#12A594', cyan:'#00A2C7', violet:'#6E56CF', mauve:'#8E4EC6', rose:'#D6409F', noir:'#000000', blanc:'#FFFFFF', gris:'#71717A', beige:'#E8DCC4', marron:'#8B5A2B', or:'#C9A227', doré:'#C9A227'};
function parseIntent(raw){
  const q = nrmS(raw).replace(/[’']/g, ' ').trim(); if (!q) return null; const out = [], one = (t, run) => out.push({t, run});
  const num = q.match(/\b(\d+)\b/)?.[1];
  const layoutWord = () => { const M = [['deux colonnes|2 colonnes|colonnes', 'two'], ['titre et liste|liste|puces|points', 'bullets'], ['image|photo', 'image'], ['cartes', 'cards'], ['chiffres cles|chiffres|statistiques', 'stats'], ['grand chiffre|un chiffre', 'stat'], ['etapes|processus', 'process'], ['frise|chronologie|calendrier', 'timeline'], ['comparaison|comparer|avant apres', 'compare'], ['graphique', 'chart'], ['tableau', 'table'], ['sommaire|agenda|plan', 'agenda'], ['citation', 'quote'], ['equipe', 'team'], ['message|grand texte', 'big'], ['section|partie', 'section'], ['titre|couverture', 'title'], ['fin|merci|conclusion', 'end'], ['vide|blanche', 'blank'], ['texte|paragraphe', 'text']];
    for (const [re, k] of M) if (new RegExp(`\\b(${re})\\b`).test(q)) return k; return null; };
  if (/^(presente|presenter|lance|lancer|demarre|diaporama|plein ecran)/.test(q)){ one('Présenter', () => present(/debut|premiere/.test(q) ? 0 : CUR)); return out; }
  if (/^(annule|annuler|defais)/.test(q)){ one('Annuler', undo); return out; }
  if (/(exporte|exporter|telecharge|enregistre).*(pdf)/.test(q)){ one('Exporter en PDF', () => doExport('pdf')); return out; }
  if (/(exporte|exporter|telecharge|enregistre).*(powerpoint|pptx|ppt)/.test(q)){ one('Exporter en PowerPoint', () => doExport('pptx')); return out; }
  let m;
  if ((m = q.match(/^(va|aller|vas|retourne)?\s*(a|à)?\s*(la\s+)?diapo(sitive)?\s+(\d+)$/))){ const n = +m[5]; one(`Aller à la diapositive ${n}`, () => goSlide(n - 1)); return out; }
  if (/^(nouvelle|ajoute|ajouter|cree|creer|insere)\s+(une\s+)?(nouvelle\s+)?diapo/.test(q)){ const L = layoutWord() || 'bullets'; one(`Nouvelle diapositive : ${LAYOUTS.find(x => x[0] === L)[1].toLowerCase()}`, () => addSlide({layout:L})); return out; }
  if (/^dupli/.test(q) && /diapo/.test(q)){ one('Dupliquer la diapositive', () => dupSlide()); return out; }
  if (/^(supprime|efface|retire)/.test(q) && /diapo/.test(q)){ one('Supprimer la diapositive', () => delSlide()); return out; }
  if (/^(masque|cache)/.test(q) && /diapo/.test(q)){ one('Masquer la diapositive', () => toggleHide()); return out; }
  if (/(mise en page|disposition|en forme de|mets en|passe en)/.test(q) && layoutWord() && !/couleur|rouge|bleu|vert/.test(q)){ const L = layoutWord(); one(`Mise en page : ${LAYOUTS.find(x => x[0] === L)[1].toLowerCase()}`, () => applyLayout(L)); return out; }
  const th = DTHEMES.find(t => q.includes('theme ' + nrmS(t.name)) || q === nrmS(t.name) || q.includes('theme ' + t.id)); if (th){ one(`Thème ${th.name}`, () => { D.theme = {id:th.id}; ensureThemeFonts(); THUMB.clear(); renderAll(); commit('Thème'); }); return out; }
  if (/format (carre|1:1)|en carre/.test(q)){ one('Format carré', () => resizeDeck('1:1')); return out; } if (/story|9:16|vertical/.test(q) && /format|passe|mets/.test(q)){ one('Format story', () => resizeDeck('9:16')); return out; } if (/16:9|ecran large/.test(q)){ one('Format 16:9', () => resizeDeck('16:9')); return out; } if (/4:3/.test(q)){ one('Format 4:3', () => resizeDeck('4:3')); return out; }
  if (/^(ajoute|insere|mets|ajouter|inserer|cree)\b/.test(q)){
    if ((m = q.match(/tableau\s*(de\s*)?(\d+)\s*(x|×|lignes?\s*(et|sur)?)\s*(\d+)/))){ const a = +m[2], b = +m[5], rows = /x|×/.test(m[3]) ? b : a, cols = /x|×/.test(m[3]) ? a : b; one(`Tableau ${cols} × ${rows}`, () => addTable(rows, cols)); return out; }
    if (/tableau/.test(q)){ one('Tableau', () => addTable(4, 3)); return out; }
    if (/graphique|diagramme|camembert/.test(q)){ const ct = /secteur|camembert/.test(q) ? 'pie' : /anneau|donut/.test(q) ? 'donut' : /courbe|ligne/.test(q) ? 'line' : /aire/.test(q) ? 'area' : /barre/.test(q) ? 'bar' : /empil/.test(q) ? 'stack' : 'col'; one(`Graphique : ${CHART_TYPES.find(x => x[0] === ct)[1].toLowerCase()}`, () => addChart(ct)); return out; }
    if (/image|photo/.test(q)){ one('Image…', () => pickImage()); return out; }
    if ((m = q.match(/icone\s+(de\s+|d\s+)?(\w+)/))){ const w = m[2]; const ic = Object.entries(ICONS).find(([k, v]) => nrmS(k + ' ' + v[0]).split(' ').some(x => x.startsWith(w.slice(0, 4)))); one(`Icône ${ic ? ICONS[ic[0]][0].split(' ')[0] : w}`, () => ic ? addIcon(ic[0]) : iconPop(g$('edBar'))); return out; }
    const SH = [['cercle|rond', 'ellipse'], ['carre|rectangle', 'rect'], ['arrondi', 'round'], ['triangle', 'tri'], ['losange', 'diamond'], ['hexagone', 'hex'], ['etoile', 'star'], ['fleche', 'arrow'], ['chevron', 'chev'], ['coeur', 'heart'], ['bulle', 'bubble'], ['ligne|trait', 'line'], ['pilule|bouton', 'pill']];
    for (const [re, k] of SH) if (new RegExp(re).test(q) && !/texte|titre/.test(q)){ one(`Forme : ${SHAPES[k][0].toLowerCase()}`, () => addShape(k)); return out; }
    const TX = [['sous-titre|sous titre', 'sub'], ['titre', 'title'], ['liste|puces', 'list'], ['citation', 'quote'], ['chiffre', 'big'], ['etiquette|badge|pastille', 'label'], ['legende|source', 'small'], ['texte|paragraphe', 'body']];
    for (const [re, k] of TX) if (new RegExp(re).test(q)){ one(`Ajouter : ${TEXT_STYLES[k][0].toLowerCase()}`, () => addText(k)); return out; }
  }
  // couleurs
  const colName = Object.keys(COLORS_FR).sort((a, b) => b.length - a.length).find(c => new RegExp(`\\b${nrmS(c)}\\b`).test(q));
  if (colName && /\bfond\b|arriere/.test(q)){ const c = COLORS_FR[colName]; one(`Fond ${colName}`, () => { cur().bg = {c}; renderAll(); commit('Fond'); }); return out; }
  if (colName && SEL.size){ const c = COLORS_FR[colName]; one(`En ${colName}`, () => { const l = selEls(); if (l.some(e => e.t === 'text')) setSt({fc:c}, 'Couleur'); else setProps(x => { if (x.t === 'shape') x.fill = c; else if (x.t === 'icon') x.fc = c; else if (x.t === 'line') x.stroke = c; }, 'Couleur'); }); return out; }
  if (SEL.size){
    if (/^(centre|centrer)/.test(q)){ one('Centrer', () => alignSel('c')); if (/milieu|vertical|page|tout/.test(q)) one('Au milieu', () => alignSel('m')); return out; }
    if (/plus grand|agrandi|grossi/.test(q)){ one('Plus grand', () => sizeStep(1)); return out; } if (/plus petit|reduis|retreci/.test(q)){ one('Plus petit', () => sizeStep(-1)); return out; }
    if (/^(en )?gras$/.test(q)){ one('Gras', () => setSt({b:1}, 'Gras')); return out; } if (/^(en )?italique$/.test(q)){ one('Italique', () => setSt({i:1}, 'Italique')); return out; }
    if (/^(supprime|efface)/.test(q)){ one('Supprimer', delSel); return out; } if (/^dupli/.test(q)){ one('Dupliquer', dupSel); return out; }
    if (/premier plan|devant/.test(q)){ one('Premier plan', () => layer('front')); return out; } if (/arriere.plan|derriere/.test(q)){ one('Arrière-plan', () => layer('back')); return out; }
    const an = ANIMS.find(([k, t]) => k && q.includes(nrmS(t))); if (an && /anim/.test(q)){ one(`Animation : ${an[1].toLowerCase()}`, () => setProps(x => { x.an = {k:an[0]}; }, 'Animation', false)); return out; }
  }
  if (/^anime/.test(q) && /tout|presentation/.test(q)){ one('Animer toute la présentation', () => { openPanel('anim'); g$('edPanelBody').querySelector('[data-a="magic"]')?.click(); }); return out; }
  if (/^anime/.test(q)){ one('Animer cette diapositive', () => { cur().an = 'rise'; cur().tr = cur().tr || 'fade'; commit('Animation'); previewSlideAnim(); }); return out; }
  const tr = TRANS.find(([k, t]) => k && q.includes('transition') && q.includes(nrmS(t))); if (tr){ one(`Transition : ${tr[1].toLowerCase()}`, () => { cur().tr = tr[0]; commit('Transition'); previewTransition(); }); return out; }
  if (/^notes?\b/.test(q)){ one('Notes de l\'orateur', () => toggleNotes(true)); return out; }
  return null;
}
function runIntents(list){ list.forEach((a, i) => setTimeout(() => { try { a.run(); } catch(e){ console.warn(e); } }, 10 + i * 60)); }
/* ---------- interface du Spectre ---------- */
function openSpectre(){ if (EDT) stopEdit(); closePop(); g$('spectre').hidden = false; const q = g$('spQ'); q.value = ''; SPX.all = spectreActions(); SPX.i = 0; drawSpectre(); setTimeout(() => q.focus(), 10); }
function closeSpectre(){ g$('spectre').hidden = true; g$('spectre').classList.remove('ai'); AIS.ctl++; AIS.busy = false; g$('stage').focus({preventScroll:true}); }
const AI_QUICK = [
  {t:'Créer une présentation complète…', prefill:'Crée une présentation de 8 diapositives sur '},
  {t:'Améliorer les textes de cette diapositive', p:'Améliore les textes de cette diapositive : plus clairs, plus courts et plus percutants, sans changer le sens ni la mise en page.'},
  {t:'Écrire les notes de l\'orateur', p:'Écris des notes d\'orateur utiles et naturelles (3 à 5 phrases) pour chaque diapositive de la présentation.'},
  {t:'Ajouter une diapositive…', prefill:'Ajoute après celle-ci une diapositive sur '},
  {t:'Transformer en mise en page visuelle', p:'Refais cette diapositive avec la mise en page la plus visuelle et la plus adaptée à son contenu (cartes, chiffres clés, étapes, frise…), en gardant le fond.'},
  {t:'Traduire en anglais', p:'Traduis tous les textes de la présentation en anglais, sans changer la mise en page.'},
];
function spAiItem(q){ return {g:'IA', t:q ? `Demander à l'IA : « ${q.length > 70 ? q.slice(0, 68) + '…' : q} »` : 'Demander à l\'IA', ai:true, run:() => aiAsk(q)}; }
function drawSpectre(){
  g$('spectre').classList.remove('ai'); AIS.ctl++; AIS.busy = false;
  const raw = g$('spQ').value.trim(), q = nrmS(raw), words = q.split(/\s+/).filter(Boolean); let l, head = '';
  if (words.length){
    const fz = SPX.all.map(a => { const hay = nrmS(a.t + ' ' + a.g + ' ' + a.k); if (!words.every(w => hay.includes(w))) return null; const tt = nrmS(a.t); return {...a, sc:tt.startsWith(words[0]) ? 0 : tt.includes(words[0]) ? 1 : 2}; }).filter(Boolean).sort((a, b) => a.sc - b.sc);
    const it = parseIntent(raw); l = [];
    if (it) l.push({g:'Compris', t:it.map(a => a.t).join(' · '), run:() => runIntents(it), intent:true});
    const ai = raw.length >= 3 ? spAiItem(raw) : null;
    if (ai && !it && (!fz.length || words.length >= 3)) l.push(ai, ...fz.slice(0, 40)); else { l.push(...fz.slice(0, 40)); if (ai) l.push(ai); }
  } else {
    l = [...AI_QUICK.map(x => ({g:'IA', t:x.t, ai:true, prefill:x.prefill, run:() => aiAsk(x.p)})), ...SP_START.map(t => SPX.all.find(a => a.t === t)).filter(Boolean)];
    head = `<p class="sp-h">Suggestions <small>Écrivez aussi une phrase : « nouvelle diapo en deux colonnes », « thème océan », « ajoute un tableau 3 x 4 », « mets le titre en bleu », « présente »…</small></p>`;
  }
  SPX.items = l.slice(0, 60); SPX.i = clamp(SPX.i, 0, Math.max(0, SPX.items.length - 1));
  g$('spList').innerHTML = head + (SPX.items.length ? SPX.items.map((a, i) => `<button type="button" data-sp="${i}" class="${i === SPX.i ? 'on' : ''}${a.ai ? ' k-ai' : ''}${a.intent ? ' k-do' : ''}" role="option">${a.ai ? '<i class="sp-ai">✦</i>' : a.intent ? '<i class="sp-do">↵</i>' : ''}<span>${escH(a.t)}</span><small>${escH(a.intent ? 'Entrée pour exécuter' : a.g)}</small></button>`).join('') : '<p class="sp-none">Rien ne correspond.</p>');
  g$('spList').querySelector('.on')?.scrollIntoView({block:'nearest'});
}
function runSpectre(i){
  const a = SPX.items[i]; if (!a) return;
  if (a.prefill){ const q = g$('spQ'); q.value = a.prefill; q.focus(); q.setSelectionRange(q.value.length, q.value.length); SPX.i = 0; drawSpectre(); return; }
  if (a.ai) return a.run();
  closeSpectre(); setTimeout(() => a.run(), 10);
}
/* ---------- l'IA : contexte, réponse, application ---------- */
const plain = h => String(h || '').replace(/<br\s*\/?>/g, '\n').replace(/<\/li>/g, '\n').replace(/<li>/g, '• ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
function aiContext(){
  const s = cur(), all = D.slides.length <= 30;
  const slideDump = (x, i) => `Diapositive ${i + 1}${i === CUR ? ' (affichée)' : ''} · mise en page « ${x.lay || '?'} »${x.notes ? ' · notes : ' + x.notes.slice(0, 200).replace(/\n/g, ' ') : ''}\n` + x.els.filter(e => e.html || e.rows || e.t === 'chart').map(e => `  [${e.id}] ${e.t}${e.ph ? ' ' + e.ph : ''}${SEL.has(e.id) ? ' (sélectionné)' : ''} : ${e.t === 'table' ? e.rows.map(r => r.map(plain).join(' | ')).join(' / ') : e.t === 'chart' ? `graphique ${e.ct} ${JSON.stringify({labels:e.labels, series:e.series})}` : plain(e.html).slice(0, 600)}`).join('\n');
  return {title:D.title, theme:D.theme.id, size:D.size, count:D.slides.length, cur:CUR + 1, empty:D.slides.length <= 1 && !D.slides[0].els.some(e => plain(e.html || '').length > 2 && !/sous-titre ou nom/i.test(plain(e.html || ''))),
    current:slideDump(s, CUR), outline:D.slides.map((x, i) => `${i + 1}. ${slideTitle(x) || '(sans titre)'} [${x.lay || '?'}]`).join('\n'), deck:all ? D.slides.map(slideDump).join('\n\n').slice(0, 30000) : '',
    sel:[...SEL].join(', '), layouts:LAYOUTS.map(l => l[0]).join(', '), themes:DTHEMES.map(t => `${t.id} (${t.name})`).join(', '), icons:Object.keys(ICONS).join(', ')};
}
async function aiAsk(prompt){
  prompt = String(prompt || '').trim(); if (!prompt){ g$('spQ').focus(); return; }
  const box = g$('spList'); g$('spectre').hidden = false; g$('spectre').classList.add('ai');
  if (!window.SWAI || !window.SWAI.available()) return aiShow({err:window.SWAI?.why?.() || 'L\'IA de SPECTRA Slide fonctionne sur le site en ligne, avec un compte Studio Prism.'});
  AIS.busy = true; AIS.prompt = prompt; AIS.res = null; const ctl = ++AIS.ctl; AIS.ctx = aiContext();
  box.innerHTML = `<div class="ai-view"><p class="ai-q">${escH(prompt)}</p><div class="ai-wait"><i></i><span>Spectra prépare vos diapositives…</span></div></div>`;
  try {
    const res = await window.SWAI.run(prompt, AIS.ctx, sec => { if (ctl !== AIS.ctl) return; const w = g$('spList').querySelector('.ai-wait span'); if (!w) return; let k = sec; const tick = () => { if (ctl !== AIS.ctl || !w.isConnected) return; w.textContent = k > 0 ? `Quota gratuit atteint : nouvel essai automatique dans ${k} s…` : 'Spectra prépare vos diapositives…'; if (k-- > 0) setTimeout(tick, 1000); }; tick(); });
    if (ctl !== AIS.ctl || g$('spectre').hidden) return; AIS.res = res; aiShow(res);
  } catch(e){ if (ctl === AIS.ctl) aiShow({err:e?.message || String(e)}); }
  finally { if (ctl === AIS.ctl) AIS.busy = false; }
}
const MODE_LABEL = {replace_all:'Nouvelle présentation', append:'Diapositives ajoutées à la fin', insert:'Diapositives ajoutées après celle-ci', replace_current:'Cette diapositive refaite', notes:'Notes de l\'orateur', text:'Textes modifiés'};
function aiShow(res){
  const box = g$('spList');
  if (res.err){ box.innerHTML = `<div class="ai-view"><p class="ai-q">${escH(AIS.prompt || '')}</p><div class="ai-err"><b>L'IA n'a pas pu répondre</b><p>${escH(res.err)}</p></div><div class="ai-acts"><button type="button" class="ap-btn alt" data-ai="back">Retour</button>${AIS.prompt && window.SWAI?.available() ? '<button type="button" class="ap-btn" data-ai="retry">Réessayer</button>' : ''}</div></div>`; return; }
  const slides = Array.isArray(res.slides) ? res.slides.slice(0, 30) : [], texts = Array.isArray(res.texts) ? res.texts : [], notes = Array.isArray(res.notes) ? res.notes : [];
  const mode = res.mode && MODE_LABEL[res.mode] ? res.mode : slides.length ? (AIS.ctx.empty ? 'replace_all' : 'insert') : texts.length ? 'text' : notes.length ? 'notes' : 'answer';
  res.mode = mode; const can = mode !== 'answer';
  let prev = '';
  if (slides.length){ const [W] = dims(), k = 180 / W, th = res.theme && DTHEMES.some(t => t.id === res.theme) ? {id:res.theme} : null;
    prev = `<div class="ai-slides">${slides.slice(0, 12).map(sp => { let h = ''; try { h = renderSlide(buildSlide(normSpec(sp)), {preview:true, theme:th || (mode === 'replace_all' ? D.theme : D.theme)}); } catch(e){} return `<span class="ai-sl"><span style="transform:scale(${k})">${h}</span></span>`; }).join('')}</div>`; }
  else if (texts.length) prev = `<ul class="ai-txts">${texts.slice(0, 8).map(t => `<li>${escH(plain(t.html || t.text || '').slice(0, 160))}</li>`).join('')}</ul>`;
  else if (notes.length) prev = `<ul class="ai-txts">${notes.slice(0, 6).map(n => `<li><b>Diapositive ${escH(n.slide)}</b> · ${escH(String(n.text || '').slice(0, 140))}</li>`).join('')}</ul>`;
  box.innerHTML = `<div class="ai-view"><p class="ai-q">${escH(AIS.prompt)}</p>${res.reply ? `<p class="ai-reply">${escH(res.reply)}</p>` : ''}${can ? `<ul class="ai-chips"><li>${escH(MODE_LABEL[mode])}${slides.length ? ' · ' + slides.length + ' diapositive' + (slides.length > 1 ? 's' : '') : ''}</li>${res.theme ? `<li>Thème ${escH(DTHEMES.find(t => t.id === res.theme)?.name || res.theme)}</li>` : ''}</ul>` : ''}${prev}
    <div class="ai-acts"><button type="button" class="ap-btn alt" data-ai="back">Retour</button><button type="button" class="ap-btn alt" data-ai="retry">Autre proposition</button>${can ? '<button type="button" class="ap-btn" data-ai="apply">Appliquer</button>' : ''}</div>
    <p class="ai-foot">Généré par l'IA : relisez les chiffres et les noms. Ctrl + Z annule tout d'un coup.</p></div>`;
  [...box.querySelectorAll('.ai-sl')].forEach(x => { const [W, H] = dims(); x.style.height = Math.round(H * 180 / W) + 'px'; });
  box.querySelector('[data-ai="apply"]')?.focus();
}
/* une diapositive décrite par l'IA → spec de mise en page validée */
function normSpec(sp){
  const o = {...(sp || {})}; o.layout = LAYOUTS.some(l => l[0] === o.layout) ? o.layout : (o.bullets ? 'bullets' : 'text');
  for (const k of ['title', 'subtitle', 'kicker', 'text', 'quote', 'author', 'role', 'stat', 'label', 'notes', 'footer', 'image']) if (o[k] != null) o[k] = String(o[k]).slice(0, 600);
  if (o.bullets) o.bullets = (Array.isArray(o.bullets) ? o.bullets : [o.bullets]).map(x => String(x).slice(0, 220)).slice(0, 9);
  for (const k of ['left', 'right']) if (o[k]) o[k] = {title:String(o[k].title || ''), bullets:(o[k].bullets || []).map(String).slice(0, 7)};
  if (o.items) o.items = (Array.isArray(o.items) ? o.items : []).slice(0, 6).map(it => typeof it === 'string' ? {title:it} : {title:String(it.title || ''), text:it.text ? String(it.text) : '', icon:ICONS[it.icon] ? it.icon : undefined, value:it.value != null ? String(it.value) : undefined, date:it.date != null ? String(it.date) : undefined});
  if (o.table) o.table = (Array.isArray(o.table) ? o.table : []).slice(0, 12).map(r => (Array.isArray(r) ? r : [r]).slice(0, 7).map(c => String(c ?? '')));
  if (o.chart){ const c = o.chart; o.chart = {type:String(c.type || 'col'), labels:(c.labels || []).map(String).slice(0, 24), series:(c.series || []).slice(0, 6).map(s => ({name:String(s.name || ''), values:(s.values || []).map(v => +v || 0).slice(0, 24)}))}; }
  return o;
}
function aiApply(){
  const res = AIS.res; if (!res) return; closeSpectre(); const mode = res.mode;
  const slides = (res.slides || []).slice(0, 30).map(normSpec);
  if (res.theme && DTHEMES.some(t => t.id === res.theme) && (mode === 'replace_all' || /th[eè]me|couleur|style|design/i.test(AIS.prompt))){ D.theme = {id:res.theme}; ensureThemeFonts(); THUMB.clear(); }
  const built = slides.map(sp => { const s = buildSlide(sp); if (sp.notes) s.notes = sp.notes; s.tr = 'fade'; s.an = VARIANT_DARK[s.v] ? 'blur' : 'rise'; return s; });
  if (mode === 'replace_all' && built.length){ D.slides = built; CUR = 0; if (res.title || slides[0]?.title) D.title = String(res.title || slides[0].title).replace(/<[^>]+>/g, '').slice(0, 120); g$('docTitle').value = D.title; }
  else if (mode === 'append' && built.length){ D.slides.push(...built); CUR = D.slides.length - built.length; }
  else if (mode === 'insert' && built.length){ D.slides.splice(CUR + 1, 0, ...built); CUR = CUR + 1; }
  else if (mode === 'replace_current' && built.length){ const old = cur(); const n = built[0]; n.id = old.id; n.notes = n.notes || old.notes; n.bg = old.bg; const imgs = old.els.filter(e => e.t === 'img' && e.src), slots = n.els.filter(e => e.t === 'img'); imgs.forEach((im, i) => { if (slots[i]){ slots[i].src = im.src; } }); D.slides[CUR] = n; if (built.length > 1) D.slides.splice(CUR + 1, 0, ...built.slice(1)); }
  else if (mode === 'notes'){ (res.notes || []).forEach(n => { const s = D.slides[(+n.slide || 0) - 1]; if (s) s.notes = String(n.text || '').slice(0, 4000); }); toggleNotes(true); }
  else if (mode === 'text'){ (res.texts || []).forEach(t => { for (const s of D.slides){ const e = s.els.find(x => x.id === t.id); if (!e) continue;
      if (e.t === 'table' && Array.isArray(t.rows)) e.rows = t.rows.map(r => r.map(c => escT(String(c)))); else { const v = String(t.html ?? t.text ?? ''); e.html = /<(ul|li|b|i|br)\b/.test(v) ? SAN(v) : /\n/.test(v) && /<li>/.test(e.html) ? bul(v.split('\n').map(x => x.replace(/^[•\-*]\s*/, '')).filter(Boolean)) : escT(v); } } }); }
  SEL.clear(); THUMB.clear(); renderAll(); fitTexts(); commit('Assistant IA');
  toast(res.reply ? String(res.reply).slice(0, 140) : 'Fait');
}
