/* ---------- Polices et thèmes de présentation ----------
   Un thème = palette + paire de polices + décor dessiné en fond. Les éléments ne stockent pas de couleurs figées
   mais des références (« t:ac », « t:ink »…) : changer de thème recolore toute la présentation d'un coup.
   Les diapositives de titre et de section prennent les couleurs « t* » du thème (souvent un fond sombre). */
const FONT_Q = {
  'Inter':'ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', 'Plus Jakarta Sans':'ital,wght@0,400;0,600;0,700;0,800;1,400',
  'Bricolage Grotesque':'opsz,wght@12..96,500;12..96,650;12..96,800', 'Outfit':'wght@400;500;600;700;800', 'Sora':'wght@400;600;700;800',
  'Manrope':'wght@400;500;700;800', 'Syne':'wght@500;600;700;800', 'Unbounded':'wght@400;500;700;800', 'Space Grotesk':'wght@400;500;600;700',
  'Poppins':'ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', 'Montserrat':'ital,wght@0,400;0,600;0,700;0,800;1,400', 'DM Sans':'ital,wght@0,400;0,500;0,700;1,400',
  'IBM Plex Sans':'ital,wght@0,400;0,500;0,600;0,700;1,400', 'Nunito':'ital,wght@0,400;0,600;0,700;0,800;1,400',
  'Fraunces':'ital,wght@0,400;0,600;0,800;1,400', 'Instrument Serif':'ital@0;1', 'Playfair Display':'ital,wght@0,400;0,600;0,700;0,800;1,400',
  'DM Serif Display':'ital@0;1', 'Lora':'ital,wght@0,400;0,600;0,700;1,400', 'Source Serif 4':'ital,wght@0,400;0,600;0,700;1,400',
  'Libre Baskerville':'ital,wght@0,400;0,700;1,400', 'Caveat':'wght@400;600;700', 'JetBrains Mono':'wght@400;600',
};
const FONTS = [
  ['Inter', 'sans-serif'], ['Plus Jakarta Sans', 'sans-serif'], ['Bricolage Grotesque', 'sans-serif'], ['Outfit', 'sans-serif'], ['Sora', 'sans-serif'],
  ['Manrope', 'sans-serif'], ['Syne', 'sans-serif'], ['Unbounded', 'sans-serif'], ['Space Grotesk', 'sans-serif'], ['Poppins', 'sans-serif'], ['Montserrat', 'sans-serif'],
  ['DM Sans', 'sans-serif'], ['IBM Plex Sans', 'sans-serif'], ['Nunito', 'sans-serif'], ['Fraunces', 'serif'], ['Instrument Serif', 'serif'], ['Playfair Display', 'serif'],
  ['DM Serif Display', 'serif'], ['Lora', 'serif'], ['Source Serif 4', 'serif'], ['Libre Baskerville', 'serif'], ['Caveat', 'cursive'], ['JetBrains Mono', 'monospace'],
  ['Arial', 'sans-serif'], ['Georgia', 'serif'], ['Verdana', 'sans-serif'],
];
const fontStack = n => { const f = FONTS.find(x => x[0] === n); return `'${String(n).replace(/'/g, '')}', ${f ? f[1] : 'sans-serif'}`; };
const loadedFonts = new Set(['Inter', 'Plus Jakarta Sans', 'JetBrains Mono', 'Bricolage Grotesque']); // déjà chargées par la page
function ensureFont(name, doc = document){
  if (!name || !FONT_Q[name]) return; if (doc === document){ if (loadedFonts.has(name)) return; loadedFonts.add(name); }
  const l = doc.createElement('link'); l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:${FONT_Q[name]}&display=swap`;
  doc.head.appendChild(l);
}
function hexRgb(h){ h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b){ return '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t){ const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function shade(a, t){ return t < 0 ? mix(a, '#000000', -t) : mix(a, '#ffffff', t); }
const luma = h => { const [r, g, b] = hexRgb(h); return (r * 299 + g * 587 + b * 114) / 255000; };
const onColor = h => luma(h) > .6 ? '#17142A' : '#FFFFFF';

/* bg fond · ink texte · mut texte secondaire · ac/ac2/ac3 accents · soft fond des cartes · line filets
   tbg/tink/tmut : couleurs des diapositives de titre et de section · fh/fb polices des titres et du texte · hw graisse des titres
   decor : dessin de fond · r : arrondi des cartes · up : petits titres en capitales */
const DTHEMES = [
  {id:'spectra', name:'Spectra', bg:'#FFFFFF', ink:'#16122B', mut:'#5E5878', ac:'#6D3BFF', ac2:'#00A6E8', ac3:'#FF4D8D', soft:'#F4F1FF', line:'#E6E1F5', tbg:'#0F0B1E', tink:'#FFFFFF', tmut:'#B9B2D6', fh:'Bricolage Grotesque', fb:'Inter', hw:800, decor:'prism', r:18, up:1},
  {id:'aurore', name:'Aurore', bg:'#FBFAFF', ink:'#1E1B34', mut:'#625E7D', ac:'#7C5CFF', ac2:'#FF6FAE', ac3:'#22C3E6', soft:'#FFFFFF', line:'#ECE8F8', tbg:'#F7F4FF', tink:'#1E1B34', tmut:'#625E7D', fh:'Outfit', fb:'Inter', hw:700, decor:'aurora', r:22, up:1},
  {id:'minuit', name:'Minuit', bg:'#0E0C1A', ink:'#F4F2FF', mut:'#A7A1C4', ac:'#9D7BFF', ac2:'#3DDCFF', ac3:'#FF5FA2', soft:'#1A1730', line:'#2A2547', tbg:'#07060F', tink:'#FFFFFF', tmut:'#A7A1C4', fh:'Sora', fb:'Inter', hw:700, decor:'stars', r:18, up:1},
  {id:'studio', name:'Studio Prism', bg:'#FFFFFF', ink:'#0F1B33', mut:'#4A5570', ac:'#0A5E8E', ac2:'#03A2AC', ac3:'#F2A541', soft:'#EEF6F8', line:'#DDE5EA', tbg:'#071B55', tink:'#FFFFFF', tmut:'#A9BCD9', fh:'Montserrat', fb:'Inter', hw:800, decor:'band', r:10, up:1},
  {id:'ardoise', name:'Ardoise', bg:'#F8FAFC', ink:'#0F172A', mut:'#475569', ac:'#2563EB', ac2:'#0EA5E9', ac3:'#F59E0B', soft:'#FFFFFF', line:'#E2E8F0', tbg:'#0F172A', tink:'#FFFFFF', tmut:'#94A3B8', fh:'Manrope', fb:'Manrope', hw:800, decor:'grid', r:14, up:1},
  {id:'editorial', name:'Éditorial', bg:'#FFFDF8', ink:'#1A1A1A', mut:'#5C5852', ac:'#B42318', ac2:'#1D2939', ac3:'#E8A33D', soft:'#F6F1E7', line:'#E5DED0', tbg:'#FFFDF8', tink:'#1A1A1A', tmut:'#5C5852', fh:'Fraunces', fb:'Source Serif 4', hw:600, decor:'frame', r:4, up:1},
  {id:'nature', name:'Nature', bg:'#F6F8F1', ink:'#1D2A20', mut:'#56645A', ac:'#2F7D4E', ac2:'#8BBF6A', ac3:'#E0A526', soft:'#FFFFFF', line:'#DDE7D8', tbg:'#1F4D33', tink:'#F6F8F1', tmut:'#B9D3BF', fh:'Fraunces', fb:'DM Sans', hw:600, decor:'waves', r:20, up:0},
  {id:'ocean', name:'Océan', bg:'#F2FAFC', ink:'#0B2530', mut:'#4A6670', ac:'#0E7490', ac2:'#22D3EE', ac3:'#F97316', soft:'#FFFFFF', line:'#D3E8EE', tbg:'#0B3C5D', tink:'#FFFFFF', tmut:'#A5D8E6', fh:'Sora', fb:'IBM Plex Sans', hw:700, decor:'waves', r:16, up:1},
  {id:'corail', name:'Corail', bg:'#FFF8F5', ink:'#2A1E22', mut:'#6E5A60', ac:'#E8505B', ac2:'#F9A26C', ac3:'#14B8A6', soft:'#FFFFFF', line:'#F3DEDA', tbg:'#E8505B', tink:'#FFFFFF', tmut:'#FFE1DC', fh:'Poppins', fb:'Poppins', hw:700, decor:'geo', r:24, up:0},
  {id:'pastel', name:'Pastel', bg:'#FDF9F3', ink:'#2D2A3E', mut:'#6C6880', ac:'#6E5FD8', ac2:'#E58AAE', ac3:'#3FB3A6', soft:'#FFFFFF', line:'#EDE6F5', tbg:'#EFE9FF', tink:'#2D2A3E', tmut:'#6C6880', fh:'Unbounded', fb:'DM Sans', hw:600, decor:'blobs', r:28, up:0},
  {id:'elegant', name:'Élégant', bg:'#FBF8F3', ink:'#2B2622', mut:'#6B6259', ac:'#9A7B4F', ac2:'#2E2A26', ac3:'#C9A96E', soft:'#FFFFFF', line:'#E7DED0', tbg:'#1F1B18', tink:'#F3EBDD', tmut:'#C9B79C', fh:'Playfair Display', fb:'Lora', hw:600, decor:'frame', r:2, up:1},
  {id:'neon', name:'Néon', bg:'#0B0D17', ink:'#EFF3FF', mut:'#9AA3C7', ac:'#00E5FF', ac2:'#FF2BD6', ac3:'#C6FF3D', soft:'#141829', line:'#232946', tbg:'#05060D', tink:'#FFFFFF', tmut:'#9AA3C7', fh:'Syne', fb:'Space Grotesk', hw:800, decor:'grid', r:12, up:1},
  {id:'craie', name:'Tableau noir', bg:'#23382F', ink:'#F2F0E6', mut:'#C3CBBE', ac:'#FFD166', ac2:'#8ECAE6', ac3:'#F28482', soft:'#2C463B', line:'#3C5A4D', tbg:'#1C2E26', tink:'#F2F0E6', tmut:'#C3CBBE', fh:'Caveat', fb:'Nunito', hw:700, decor:'chalk', r:10, up:0},
  {id:'sable', name:'Sable', bg:'#F4EDE3', ink:'#2F2A24', mut:'#6E655A', ac:'#C2410C', ac2:'#7C9473', ac3:'#D4A373', soft:'#FBF7F1', line:'#E2D6C6', tbg:'#2F2A24', tink:'#F4EDE3', tmut:'#CDBFAD', fh:'Instrument Serif', fb:'DM Sans', hw:400, decor:'arch', r:16, up:1},
  {id:'bauhaus', name:'Bauhaus', bg:'#F5F1E8', ink:'#111111', mut:'#4B4B4B', ac:'#E63946', ac2:'#1D4ED8', ac3:'#F4B400', soft:'#FFFFFF', line:'#DDD6C8', tbg:'#111111', tink:'#F5F1E8', tmut:'#BDB6A7', fh:'Space Grotesk', fb:'Space Grotesk', hw:700, decor:'bauhaus', r:0, up:1},
  {id:'mono', name:'Monochrome', bg:'#FFFFFF', ink:'#0A0A0A', mut:'#525252', ac:'#0A0A0A', ac2:'#737373', ac3:'#FF3B30', soft:'#F5F5F5', line:'#E5E5E5', tbg:'#0A0A0A', tink:'#FFFFFF', tmut:'#A3A3A3', fh:'Inter', fb:'Inter', hw:800, decor:'none', r:8, up:1},
];
/* spec : {id, ac, ac2, ac3, fh, fb} (objet de la présentation, couleurs et polices personnalisées en option) */
function dtheme(spec){
  spec = typeof spec === 'string' ? {id:spec} : spec || {};
  const base = DTHEMES.find(t => t.id === spec.id) || DTHEMES[0], t = {...base};
  for (const k of ['ac', 'ac2', 'ac3', 'fh', 'fb', 'bg', 'ink']) if (spec[k]) t[k] = spec[k];
  if (spec.ac && spec.ac !== base.ac){
    const dark = luma(t.bg) < .35; t.soft = dark ? mix(t.bg, spec.ac, .12) : mix(spec.ac, '#ffffff', .93);
    if (luma(base.tbg) > .3 && luma(base.tbg) < .8 && base.tbg === base.ac) t.tbg = spec.ac;  // fond de titre = accent (Corail…)
  }
  if (spec.bg && spec.bg !== base.bg){ t.line = mix(t.bg, t.ink, .12); if (!spec.ink) { t.ink = onColor(t.bg) === '#FFFFFF' ? '#F4F2FF' : '#16122B'; } t.mut = mix(t.ink, t.bg, .38); }
  return t;
}
const FONT_W = {'Syne':.66, 'Unbounded':.68, 'Montserrat':.6, 'Space Grotesk':.57, 'Poppins':.6, 'Sora':.58, 'Manrope':.55, 'Outfit':.52, 'Bricolage Grotesque':.53, 'Inter':.55, 'Fraunces':.52, 'Playfair Display':.5, 'DM Serif Display':.5, 'Instrument Serif':.43, 'Caveat':.42, 'Nunito':.54, 'DM Sans':.54, 'IBM Plex Sans':.55, 'Lora':.52, 'Source Serif 4':.5};
const VARIANT_DARK = {title:1, section:1, end:1};
/* couleurs effectives d'une diapositive (titre/section : palette « t* ») */
function slideVars(t, v){
  const ttl = VARIANT_DARK[v];
  const bg = ttl ? t.tbg : t.bg, ink = ttl ? t.tink : t.ink, mut = ttl ? t.tmut : t.mut;
  const dark = luma(bg) < .45;
  return {bg, ink, mut, ac:t.ac, ac2:t.ac2, ac3:t.ac3, soft:ttl ? (dark ? mix(bg, '#ffffff', .08) : mix(bg, t.ac, .08)) : t.soft, line:ttl ? mix(bg, ink, .16) : t.line,
    on:onColor(t.ac), on2:onColor(t.ac2), fh:t.fh, fb:t.fb, hw:t.hw, r:t.r, dark};
}
function varsCss(sv){
  return `--bg:${sv.bg};--ink:${sv.ink};--mut:${sv.mut};--ac:${sv.ac};--ac2:${sv.ac2};--ac3:${sv.ac3};--soft:${sv.soft};--line:${sv.line};--on:${sv.on};--on2:${sv.on2};`
    + `--fh:${fontStack(sv.fh).replace(/"/g, "'")};--fb:${fontStack(sv.fb).replace(/"/g, "'")};--hw:${sv.hw};--rad:${sv.r}px`;
}
/* une couleur d'élément : « t:ac » → variable CSS (édition) ou valeur (exports) */
const TCOL = ['bg', 'ink', 'mut', 'ac', 'ac2', 'ac3', 'soft', 'line', 'on', 'on2'];
function cssCol(c){ if (!c) return 'transparent'; if (typeof c === 'string' && c.startsWith('t:')){ const k = c.slice(2); return TCOL.includes(k) ? `var(--${k})` : 'currentColor'; } return c; }
function realCol(c, sv){ if (!c) return null; if (typeof c === 'string' && c.startsWith('t:')) return sv[c.slice(2)] || sv.ink; return c; }
const fontOf = (f, sv) => f === 'h' ? sv.fh : f === 'b' || !f ? sv.fb : f;
const cssFont = f => f === 'h' ? 'var(--fh)' : f === 'b' || !f ? 'var(--fb)' : fontStack(f).replace(/"/g, "'");

/* ---------- Décors : dessinés en SVG (aucune image), selon le type de diapositive ---------- */
function rng(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
let DEC_N = 0;
function decorSVG(t, v, W, H, sv){
  const sx = (++DEC_N).toString(36);
  const d = t.decor, ttl = v === 'title' || v === 'section' || (v === 'end' && !['band', 'arch', 'bauhaus', 'geo'].includes(d)), A = sv.ac, B = sv.ac2, C = sv.ac3;
  let g = '', defs = '';
  const blob = (id, cx, cy, r, col, op) => { id += sx; defs += `<radialGradient id="${id}" cx="${cx / W}" cy="${cy / H}" r="${r / Math.max(W, H)}" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`; g += `<rect width="${W}" height="${H}" fill="url(#${id})"/>`; };
  const prismLine = (y, h, op = 1) => { defs += `<linearGradient id="dpl${sx}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7B2FF7"/><stop offset=".3" stop-color="#2D6BFF"/><stop offset=".5" stop-color="#00C2FF"/><stop offset=".68" stop-color="#22D39A"/><stop offset=".84" stop-color="#FFC83D"/><stop offset="1" stop-color="#FF5E62"/></linearGradient>`; g += `<rect x="0" y="${y}" width="${W}" height="${h}" fill="url(#dpl${sx})" opacity="${op}"/>`; };
  if (d === 'prism'){
    if (ttl){ blob('db1', W * .86, H * .1, W * .55, A, .55); blob('db2', W * .08, H * .95, W * .45, B, .38); blob('db3', W * .55, H * 1.05, W * .35, C, .28); prismLine(H - 8, 8); }
    else prismLine(H - 5, 5, .9);
  } else if (d === 'aurora'){
    blob('da1', W * .05, H * .05, W * (ttl ? .6 : .45), A, ttl ? .26 : .14); blob('da2', W * .98, H * .95, W * (ttl ? .55 : .4), B, ttl ? .24 : .12); if (ttl) blob('da3', W * .8, H * .05, W * .35, C, .16);
  } else if (d === 'stars'){
    const r = rng(7); let s = ''; for (let i = 0; i < (ttl ? 90 : 45); i++) s += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(r() * 1.6 + .4).toFixed(1)}"/>`;
    g += `<g fill="#fff" opacity="${ttl ? .5 : .28}">${s}</g>`; blob('ds1', W * .85, H * .2, W * .5, A, ttl ? .35 : .16);
  } else if (d === 'band'){
    if (ttl){ g += `<path d="M${W * .78} 0H${W}V${H}H${W * .66}Z" fill="${B}" opacity=".9"/><path d="M${W * .86} 0H${W}V${H}H${W * .74}Z" fill="${A}" opacity=".85"/>`; }
    else g += `<rect x="0" y="0" width="12" height="${H}" fill="${A}"/><rect x="0" y="0" width="12" height="${H * .3}" fill="${B}"/>`;
  } else if (d === 'grid'){
    const st = 48; let s = ''; for (let x = st; x < W; x += st) s += `M${x} 0V${H}`; for (let y = st; y < H; y += st) s += `M0 ${y}H${W}`;
    g += `<path d="${s}" stroke="${sv.ink}" stroke-opacity="${sv.dark ? .07 : .05}" stroke-width="1" fill="none"/>`; if (ttl) blob('dg1', W * .9, H * .9, W * .5, A, .3);
  } else if (d === 'frame'){
    g += `<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${ttl ? A : sv.line}" stroke-width="${ttl ? 2 : 1.5}"/>`; if (ttl) g += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${A}" stroke-opacity=".45" stroke-width="1"/>`;
  } else if (d === 'waves'){
    const wv = (y, a, ph) => `M0 ${y} C ${W * .25} ${y - a + ph} ${W * .5} ${y + a} ${W * .75} ${y - ph} S ${W} ${y - a} ${W} ${y} V${H} H0Z`;
    if (ttl) g += `<path d="${wv(H * .7, 50, 20)}" fill="${B}" opacity=".35"/><path d="${wv(H * .8, 40, -10)}" fill="${A}" opacity=".55"/>`;
    else g += `<path d="${wv(H * .93, 18, 8)}" fill="${B}" opacity=".22"/><path d="${wv(H * .96, 14, -6)}" fill="${A}" opacity=".3"/>`;
  } else if (d === 'geo'){
    if (ttl) g += `<circle cx="${W * .92}" cy="${H * .12}" r="${H * .38}" fill="#fff" opacity=".12"/><circle cx="${W * .08}" cy="${H * .98}" r="${H * .26}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="18"/><circle cx="${W * .8}" cy="${H * .85}" r="26" fill="${C}"/>`;
    else g += `<circle cx="${W + 40}" cy="-40" r="170" fill="${B}" opacity=".22"/><circle cx="${W - 70}" cy="70" r="34" fill="none" stroke="${A}" stroke-width="8" opacity=".55"/>`;
  } else if (d === 'blobs'){
    const bl = (x, y, s, col, op) => `<path transform="translate(${x} ${y}) scale(${s})" d="M60 -80C95 -60 120 -20 110 25C100 70 60 105 10 105C-45 105 -100 75 -105 25C-110 -25 -75 -65 -35 -85C0 -100 30 -98 60 -80Z" fill="${col}" opacity="${op}"/>`;
    g += ttl ? bl(W * .9, H * .15, 2.2, B, .45) + bl(W * .06, H * .9, 1.6, C, .4) + bl(W * .75, H * .95, .8, A, .35) : bl(W * .97, H * .02, 1.2, B, .25) + bl(W * .02, H * 1.02, .9, C, .22);
  } else if (d === 'chalk'){
    const r = rng(3); let s = ''; for (let i = 0; i < 6; i++){ const y = 20 + r() * 12; s += `M${18 + r() * 10} ${y + i * .7}L${W - 20 - r() * 10} ${y + i}`; }
    g += `<path d="${s}" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/><rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3" rx="6"/>`;
  } else if (d === 'arch'){
    if (ttl) g += `<path d="M${W * .74} ${H}V${H * .5}A${W * .1} ${W * .1} 0 0 1 ${W * .94} ${H * .5}V${H}Z" fill="${A}"/><circle cx="${W * .92}" cy="${H * .22}" r="30" fill="${C}"/>`;
    else g += `<path d="M${W - 150} ${H}V${H - 80}A75 75 0 0 1 ${W} ${H - 80}V${H}Z" fill="${B}" opacity=".35"/>`;
  } else if (d === 'bauhaus'){
    if (ttl) g += `<circle cx="${W * .86}" cy="${H * .3}" r="${Math.min(W, H) * .2}" fill="${A}"/><path d="M${W * .7} ${H}A${Math.min(W, H) * .18} ${Math.min(W, H) * .18} 0 0 1 ${W * .7 + Math.min(W, H) * .36} ${H}Z" fill="${C}"/><rect x="${W * .9}" y="${H * .62}" width="${Math.min(W, H) * .2}" height="${Math.min(W, H) * .2}" fill="${B}"/>`;
    else g += `<rect x="${W - 64}" y="0" width="64" height="64" fill="${B}"/><circle cx="${W - 64}" cy="64" r="32" fill="${A}"/><rect x="0" y="${H - 10}" width="${W * .33}" height="10" fill="${C}"/>`;
  }
  if (!g) return '';
  return `<svg class="sl-deco" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none" aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ''}${g}</svg>`;
}
const SIZES = {'16:9':[1280, 720], '4:3':[960, 720], '1:1':[1080, 1080], '4:5':[1080, 1350], '9:16':[720, 1280]};
const SIZE_NAMES = {'16:9':'Écran large 16:9', '4:3':'Standard 4:3', '1:1':'Carré (réseaux sociaux)', '4:5':'Portrait 4:5', '9:16':'Story 9:16'};
