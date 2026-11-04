/* ---------- Formes supplémentaires (chemins dans une boîte 100 × 100) et leur rangement par famille ---------- */
(() => {
  const r1 = n => Math.round(n * 10) / 10;
  const poly = (n, rot = -90, rad = 50) => 'M' + Array.from({length:n}, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return `${r1(50 + rad * Math.cos(a))} ${r1(50 + rad * Math.sin(a))}`; }).join('L') + 'Z';
  const star = (n, k) => 'M' + Array.from({length:n * 2}, (_, i) => { const a = (-90 + i * 180 / n) * Math.PI / 180, r = i % 2 ? 50 * k : 50; return `${r1(50 + r * Math.cos(a))} ${r1(50 + r * Math.sin(a))}`; }).join('L') + 'Z';
  const gear = n => { const pts = []; for (let i = 0; i < n; i++){ const a0 = i * 360 / n - 90, st = 360 / n; [[-.3, 40], [-.17, 50], [.17, 50], [.3, 40]].forEach(([f, r]) => { const a = (a0 + st * (f + .5)) * Math.PI / 180; pts.push(`${r1(50 + r * Math.cos(a))} ${r1(50 + r * Math.sin(a))}`); }); } return 'M' + pts.join('L') + 'ZM50 30A20 20 0 1 0 50 70A20 20 0 1 0 50 30Z'; };
  const X = {
    trap:['Trapèze', 'M20 0H80L100 100H0Z'], para:['Parallélogramme', 'M25 0H100L75 100H0Z'], hept:['Heptagone', poly(7)], deca:['Décagone', poly(10)], cutc:['Coin coupé', 'M0 0H75L100 25V100H0Z'],
    snip:['Rectangle biseauté', 'M18 0H82L100 18V82L82 100H18L0 82V18Z'], doc:['Page cornée', 'M0 0H68L100 32V100H0Z'], tab:['Dossier', 'M0 100V12Q0 0 12 0H38L50 16H88Q100 16 100 28V100Z'], cyl:['Cylindre', 'M0 14C0 -5 100 -5 100 14V86C100 105 0 105 0 86Z'],
    star5:['Étoile 5 branches', star(5, .42)], star6:['Étoile 6 branches', star(6, .55)], star8:['Étoile 8 branches', star(8, .62)], star12:['Étoile 12 branches', star(12, .75)], burst:['Explosion', star(16, .7)], seal:['Sceau', star(24, .88)], gear:['Engrenage', gear(10)],
    arrowl:['Flèche gauche', 'M100 30H38V5L0 50L38 95V70H100Z'], arrowu:['Flèche haut', 'M30 100V38H5L50 0L95 38H70V100Z'], arrowd:['Flèche bas', 'M30 0V62H5L50 100L95 62H70V0Z'], arrowlr:['Double flèche', 'M0 50L28 8V32H72V8L100 50L72 92V68H28V92Z'], arrowud:['Flèche verticale', 'M50 0L92 28H68V72H92L50 100L8 72H32V28H8Z'],
    home:['Pentagone flèche', 'M0 0H70L100 50L70 100H0Z'], uturn:['Demi-tour', 'M0 100V42A42 42 0 0 1 42 0H50A42 42 0 0 1 92 42V50H100L78 78L56 50H64V42A14 14 0 0 0 50 28H42A14 14 0 0 0 28 42V100Z'], bent:['Flèche coudée', 'M0 100V45A30 30 0 0 1 30 15H65V0L100 25L65 50V35H35V100Z'], notch:['Flèche crantée', 'M0 20H62V0L100 50L62 100V80H0L20 50Z'],
    callout:['Bulle rectangulaire', 'M0 0H100V72H40L18 100V72H0Z'], bubble2:['Bulle ronde', 'M50 0C78 0 100 17 100 40S78 80 56 80L28 100L36 77C14 71 0 57 0 40C0 17 22 0 50 0Z'], thought:['Bulle de pensée', 'M30 62C8 62 5 38 24 33C22 12 52 5 62 20C78 8 100 24 90 42C106 52 92 70 74 62C66 74 40 74 30 62ZM20 80A7 7 0 1 0 20 94A7 7 0 1 0 20 80ZM6 96A3.5 3.5 0 1 0 6 103A3.5 3.5 0 1 0 6 96Z'],
    banner:['Bandeau', 'M0 15H100L88 50L100 85H0L12 50Z'], ribbon:['Fanion', 'M0 0H100V76L50 100L0 76Z'], tag:['Étiquette', 'M0 10Q0 0 10 0H55L100 45V55L55 100H10Q0 100 0 90ZM20 42A8 8 0 1 0 20 58A8 8 0 1 0 20 42Z'],
    cloud:['Nuage', 'M25 85C6 85 -4 62 14 52C4 32 26 16 42 26C50 6 80 8 84 30C104 30 108 62 90 70C98 88 78 94 70 84C60 92 40 94 25 85Z'], bolt:['Éclair', 'M58 0L14 56H42L34 100L86 40H56Z'], moon:['Lune', 'M68 0A50 50 0 1 0 68 100A60 60 0 0 1 68 0Z'], drop:['Goutte', 'M50 0C50 0 90 46 90 66A40 40 0 0 1 10 66C10 46 50 0 50 0Z'], wave:['Vague', 'M0 50C25 10 25 10 50 50S75 90 100 50V100H0Z'],
    shield:['Bouclier', 'M50 0L95 14V50C95 78 72 92 50 100C28 92 5 78 5 50V14Z'], pin:['Repère', 'M50 100C50 100 10 62 10 38A40 38 0 0 1 90 38C90 62 50 100 50 100ZM50 22A16 16 0 1 0 50 54A16 16 0 1 0 50 22Z'], check:['Coche', 'M4 55L20 39L40 59L80 14L96 30L40 92Z'], xmark:['Croix', 'M20 5L50 35L80 5L95 20L65 50L95 80L80 95L50 65L20 95L5 80L35 50L5 20Z'],
    ring:['Anneau', 'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM50 22A28 28 0 1 0 50 78A28 28 0 1 0 50 22Z'], frame:['Cadre', 'M0 0H100V100H0ZM13 13V87H87V13Z'], pie:['Camembert', 'M50 50L100 50A50 50 0 1 0 50 100Z'], quart:['Quart de cercle', 'M0 100V0A100 100 0 0 1 100 100Z'], hring:['Arc épais', 'M0 100A50 100 0 0 1 100 100H72A22 70 0 0 0 28 100Z'],
    cross:['Croix grecque', 'M33 0H67V33H100V67H67V100H33V67H0V33H33Z'], lblock:['Équerre', 'M0 0H38V62H100V100H0Z'], teardrop:['Larme', 'M50 0L88 38A44 44 0 1 1 12 38Z'], petal:['Pétale', 'M50 0C90 20 100 70 50 100C0 70 10 20 50 0Z'], leaf:['Feuille', 'M0 100C0 40 40 0 100 0C100 60 60 100 0 100Z'],
  };
  Object.assign(SHAPES, X);
  /* familles pour le panneau Insérer et le menu des formes */
  window.SHAPE_GROUPS = [
    ['Formes de base', ['rect', 'round', 'ellipse', 'pill', 'tri', 'rtri', 'diamond', 'trap', 'para', 'pent', 'hex', 'hept', 'oct', 'deca', 'cutc', 'snip', 'doc', 'tab', 'cyl', 'arc', 'arch', 'pie', 'quart', 'ring', 'frame', 'hring', 'cross', 'lblock', 'plus']],
    ['Flèches', ['arrow', 'arrowl', 'arrowu', 'arrowd', 'arrowlr', 'arrowud', 'chev', 'home', 'notch', 'bent', 'uturn', 'line', 'arrowline']],
    ['Étoiles et sceaux', ['star4', 'star', 'star5', 'star6', 'star8', 'star12', 'burst', 'seal', 'gear']],
    ['Bulles et bandeaux', ['bubble', 'bubble2', 'callout', 'thought', 'banner', 'ribbon', 'tag']],
    ['Symboles', ['heart', 'blob', 'cloud', 'bolt', 'moon', 'drop', 'teardrop', 'petal', 'leaf', 'wave', 'shield', 'pin', 'check', 'xmark']],
  ];
  SHAPE_ORDER.length = 0; SHAPE_GROUPS.forEach(g => g[1].forEach(k => { if (!SHAPE_ORDER.includes(k)) SHAPE_ORDER.push(k); }));
  window.SHAPE_SIZES = {pill:[320, 110], arrow:[300, 160], arrowl:[300, 160], arrowlr:[320, 160], chev:[300, 160], home:[300, 160], notch:[300, 160], bubble:[300, 220], bubble2:[300, 220], callout:[300, 220], thought:[300, 240], banner:[360, 160], ribbon:[360, 160], tag:[320, 160], para:[300, 180], trap:[300, 180], cloud:[320, 220], wave:[360, 180], tab:[300, 220], doc:[220, 280], cyl:[200, 260], arrowu:[160, 300], arrowd:[160, 300], arrowud:[160, 300], lblock:[240, 240]};
})();
