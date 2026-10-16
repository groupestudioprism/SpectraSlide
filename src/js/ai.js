/* =====================================================================
   IA de SPECTRA Slide : Gemini via Firebase AI Logic (projet Studio Prism), sans serveur.
   À activer une fois dans la console Firebase : AI Logic → Commencer → « Gemini Developer API ».
   Le SDK modulaire est chargé à la première demande seulement (aucun coût au démarrage).
   Limite quotidienne par compte (gratuit / licence), en plus des quotas configurables dans la console.
   ===================================================================== */
const AI_SDK = '13.0.0';
/* gemini-3.6-flash d'abord ; gemini-3.8-flash prend le relais quand le premier est saturé (quotas séparés) */
const AI_MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash'];
const AI_DAY = {free:25, pro:300, admin:1000};
let aiInit = null, aiBlocked = '', aiBlockedAt = 0;
const aiGone = new Set();   // modèles introuvables pour ce projet
const aiDayKey = () => `ss.ai.${me?.uid || 'x'}.${new Date().toISOString().slice(0, 10)}`;
const aiUsed = () => +store.get(aiDayKey()) || 0;
const aiLimit = () => AI_DAY[planKey()] || AI_DAY.free;
function aiWhy(){
  if (!FIREBASE_CONFIG) return 'Cette version de démonstration n\'a pas d\'IA : elle fonctionne sur le site en ligne de SPECTRA Slide, avec votre compte Studio Prism. Les phrases simples (« nouvelle diapo en deux colonnes », « thème océan », « présente »…) marchent partout.';
  if (!me) return 'Connectez-vous pour utiliser l\'IA.';
  if (aiBlocked && Date.now() - aiBlockedAt < 30000) return aiBlocked;   // on retente après 30 s : un réglage corrigé dans la console marche sans recharger
  if (aiUsed() >= aiLimit()) return `Vous avez utilisé vos ${aiLimit()} demandes à l'IA du jour${planKey() === 'free' ? ' (offre gratuite). Une licence SPECTRA Slide en donne bien plus.' : '.'} Le compteur repart demain.`;
  return '';
}
async function aiModel(sys = AI_SYSTEM, name = AI_MODELS[0]){
  if (!aiInit) aiInit = (async () => {
    const base = `https://www.gstatic.com/firebasejs/${AI_SDK}/`;
    const [A, I] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-ai.js')]);
    const app = A.getApps().find(x => x.name === 'sw-ai') || A.initializeApp(FIREBASE_CONFIG, 'sw-ai');
    return {I, ai:I.getAI(app, {backend:new I.GoogleAIBackend()})};
  })().catch(e => { aiInit = null; throw e; });
  const {I, ai} = await aiInit;
  return I.getGenerativeModel(ai, {model:name, systemInstruction:sys,
    generationConfig:{responseMimeType:'application/json', temperature:.7, maxOutputTokens:16384}});
}
const AI_SYSTEM = `Tu es Spectra, l'assistant intégré à SPECTRA Slide, l'outil de présentations de Studio Prism. Tu réponds en français (sauf si on te demande une traduction).
Tu reçois une demande et la présentation en cours (diapositives, éléments avec leur identifiant entre crochets). Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour :
{"reply":"une ou deux phrases : ce que tu proposes, ou la réponse à la question","mode":"…","title":"titre de la présentation (mode replace_all)","theme":"identifiant de thème (facultatif)","slides":[…],"texts":[…],"notes":[…]}
Modes :
- "replace_all" : créer une présentation complète (quand elle est vide ou qu'on demande d'en créer une) → "slides".
- "insert" : ajouter des diapositives après la diapositive affichée → "slides". "append" : les ajouter à la fin.
- "replace_current" : refaire la diapositive affichée (autre mise en page, contenu amélioré) → "slides" avec une seule diapositive.
- "text" : modifier des textes existants sans toucher à la mise en page (améliorer, raccourcir, corriger, traduire) → "texts":[{"id":"identifiant","html":"nouveau texte"}] (pour un tableau : {"id":"…","rows":[["…"]]}). Garde les listes sous forme <ul><li>…</li></ul> et <b> pour le gras ; rien d'autre en HTML.
- "notes" : écrire les notes de l'orateur → "notes":[{"slide":1,"text":"…"}].
- "answer" : simple réponse dans "reply".
Une diapositive = {"layout":"…", + champs selon la mise en page, "notes":"notes de l'orateur (facultatif)"} :
- "title" : title, subtitle, kicker (petit surtitre), footer. Toujours en première diapositive d'une présentation.
- "section" : kicker (ex. "01"), title, subtitle.
- "bullets" : title, kicker, bullets (3 à 6 puces courtes). "text" : title, text (un paragraphe).
- "two" : title, left {title, bullets}, right {title, bullets}. "compare" : idem, pour avant/après, problème/solution, A/B.
- "image" : title, kicker, bullets ou text, image (ce que la photo devrait montrer). "photo" : title, subtitle, image (photo pleine page).
- "cards" : title, items (2 à 6) [{title, text, icon}].
- "stats" : title, items (2 à 4) [{value:"87 %", title:"…", text}]. "stat" : stat (un grand chiffre), label, text, kicker.
- "process" : title, items (2 à 5 étapes) [{title, text}]. "timeline" : title, items (2 à 6) [{date, title, text}].
- "chart" : title, chart {type:"col|bar|line|area|pie|donut|stack", labels:[…], series:[{name, values:[nombres]}]}, text (le message à retenir).
- "table" : title, table [["en-tête", …], ["…", …]] (12 lignes max).
- "agenda" : title, items [{title}] (3 à 6 parties). "quote" : quote, author, role. "team" : title, items [{title:nom, text:rôle}].
- "big" : kicker, title (une phrase forte), subtitle. "end" : title ("Merci !"), subtitle (contact).
Règles de rédaction : des titres courts et parlants (8 mots maximum), des puces de 4 à 12 mots, jamais de paragraphes dans les puces, des chiffres concrets et plausibles, aucune phrase « lorem ipsum ». Varie les mises en page pour que la présentation soit visuelle (cartes, chiffres, étapes, frise, citation, graphique) plutôt qu'une suite de listes. Une présentation complète compte 6 à 12 diapositives, commence par "title" et finit souvent par "end".
Icônes disponibles (champ icon) : la liste fournie. Thèmes disponibles : la liste fournie (choisis-en un adapté au sujet en mode replace_all).
Refuse poliment toute demande haineuse, illégale ou dangereuse.`;
function aiPrompt(q, c){
  const parts = [`Demande : ${q}`, `Présentation « ${c.title} » · thème ${c.theme} · format ${c.size} · ${c.count} diapositive(s) · diapositive affichée : ${c.cur}${c.empty ? ' · la présentation est vide' : ''}${c.sel ? ' · éléments sélectionnés : ' + c.sel : ''}`];
  parts.push(`Plan :\n${c.outline}`);
  parts.push(`Diapositive affichée :\n${c.current}`);
  if (c.deck) parts.push(`Toute la présentation :\n${c.deck}`);
  parts.push(`Mises en page : ${c.layouts}`, `Thèmes : ${c.themes}`, `Icônes : ${c.icons}`);
  return parts.join('\n\n');
}
function aiParse(t){
  t = String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch(e){}
  const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a >= 0 && b > a){ try { return JSON.parse(t.slice(a, b + 1)); } catch(e){} }
  return {reply:t.slice(0, 600), mode:'answer'};
}
function aiErr(e){
  const m = String(e?.message || e || ''), code = String(e?.code || '');
  if (/Template-Only Mode/i.test(m))
    return {fatal:true, msg:'Le projet Firebase est en « mode modèles uniquement » : il refuse les demandes libres de SPECTRA Slide. Dans la console Firebase : AI Logic → onglet Paramètres → « Modèle » → désactiver « Appliquer le mode modèles uniquement » (Enforce template-only mode), puis Confirmer.'};
  if (/api-not-enabled|has not been used|SERVICE_DISABLED|requires the Firebase AI API/i.test(m + ' ' + code))
    return {fatal:true, msg:'L\'IA n\'est pas encore activée sur le projet Studio Prism. Un administrateur doit cliquer sur « Commencer » dans la console Firebase (AI Logic) : console.firebase.google.com/project/archivision-studioprism/ailogic. Si c\'est fait, patientez quelques minutes.'};
  if (/app.?check/i.test(m)) return {msg:'La demande a été refusée par App Check (protection du projet Firebase). Vérifiez la configuration App Check d\'AI Logic dans la console.'};
  if (/API key|API_KEY|referer|referrer/i.test(m)) return {msg:'La clé du projet Firebase refuse cette demande (restriction de la clé API). Autorisez l\'API « Firebase AI Logic » pour cette clé dans Google Cloud → Identifiants.'};
  if (/403|PERMISSION_DENIED/i.test(m)) return {msg:'Le projet Firebase a refusé la demande (403) : ' + (m.match(/\[403[^\]]*\]\s*([^(]{0,220})/) || [, m.slice(0, 220)])[1].trim()};
  if (/404|not found|is not supported|unknown model/i.test(m)) return {model:true, msg:'Modèle indisponible.'};
  if (/\b429\b|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(m)){
    const wait = Math.ceil(parseFloat((m.match(/retry in ([\d.]+)s/i) || [])[1]) || 60), day = /per.?day|daily/i.test(m);
    return {busy:true, wait:day ? 0 : wait, msg:day ? 'Le quota gratuit du jour de l\'IA (Google) est épuisé pour tout le projet Studio Prism. Il repart demain, ou tout de suite en passant le projet Firebase au forfait Blaze.'
      : `Le quota gratuit de l'IA (quelques demandes par minute pour tout le projet Studio Prism) est atteint. Réessayez dans ${wait} s.`};
  }
  if (/\b(500|503)\b|high demand|overloaded|UNAVAILABLE/i.test(m)) return {busy:true, wait:3, msg:'Les serveurs de Google sont très sollicités en ce moment. Réessayez dans quelques secondes.'};
  if (/blocked|SAFETY|finishReason/i.test(m)) return {msg:'L\'IA a refusé cette demande. Reformulez-la autrement.'};
  if (/Failed to fetch|NetworkError|network|import/i.test(m)) return {msg:'Impossible de joindre l\'IA. Vérifiez votre connexion internet.'};
  return {msg:'Erreur de l\'IA : ' + m.slice(0, 220)};
}
async function aiCall(sys, prompt, onWait){
  const why = aiWhy(); if (why) throw new Error(why);
  const list = AI_MODELS.filter(n => !aiGone.has(n)); let last = null, waited = false;
  for (let i = 0; i < list.length; i++){
    try {
      const model = await aiModel(sys, list[i]);
      const r = await withTimeout(model.generateContent(prompt), 90000, 'ai/timeout');
      store.set(aiDayKey(), aiUsed() + 1);
      return aiParse(r.response.text());
    } catch(e){
      if (e?.code === 'ai/timeout') throw new Error('L\'IA a mis trop de temps à répondre. Réessayez avec une demande plus courte.');
      const x = aiErr(e); console.warn('[SPECTRA Slide] IA', list[i], e); last = x;
      if (x.model){ aiGone.add(list[i]); continue; }
      if (x.busy){
        if (i < list.length - 1) continue;                       // un autre modèle, avec son propre quota
        if (!waited && x.wait && x.wait <= 30){                  // dernier recours : on patiente une fois, puis on recommence
          waited = true; onWait?.(x.wait); await sleep(x.wait * 1000 + 300); i = -1; continue;
        }
      }
      if (x.fatal){ aiBlocked = x.msg; aiBlockedAt = Date.now(); }
      throw new Error(x.msg);
    }
  }
  throw new Error(last?.msg || 'Aucun modèle d\'IA disponible pour le moment.');
}
async function aiRun(q, ctx, onWait){
  const out = await aiCall(AI_SYSTEM, aiPrompt(q, ctx), onWait);
  if (!out.reply && !(out.slides || []).length && !(out.texts || []).length && !(out.notes || []).length) throw new Error('L\'IA a renvoyé une réponse vide. Reformulez votre demande.');
  return out;
}
const AI_MOD = `Tu es le modérateur de la bibliothèque publique de modèles de SPECTRA Slide (Studio Prism). On te donne le titre, la description et le texte d'un modèle de présentation proposé par un utilisateur.
Réponds UNIQUEMENT par un objet JSON : {"ok":true,"summary":"une phrase en français qui résume le modèle et ton avis","reasons":["…"]}.
"ok" vaut false si le contenu est haineux, violent, sexuel, discriminatoire, illégal, dangereux, trompeur (arnaque, fausse présentation officielle, usurpation), du spam ou de la publicité agressive, s'il contient des données personnelles réelles apparentes (nom complet avec adresse, téléphone, email, IBAN ou numéro d'identité qui semblent réels), ou s'il est vide, absurde ou sans intérêt comme modèle.
Les zones à compléter entre crochets, les coordonnées d'exemple (06 00 00 00 00, contact@exemple.fr…) et les personnes fictives sont normales. "reasons" liste les problèmes trouvés (vide si aucun).`;
async function aiModerate(text){ const r = await aiCall(AI_MOD, text); return {ok:r.ok !== false, summary:String(r.summary || r.reply || ''), reasons:Array.isArray(r.reasons) ? r.reasons.map(String).slice(0, 6) : []}; }
window.SWAI = {available:() => !aiWhy(), why:aiWhy, run:aiRun, moderate:aiModerate, left:() => Math.max(0, aiLimit() - aiUsed()), limit:aiLimit};
