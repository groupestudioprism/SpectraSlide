# SPECTRA Slide · Studio Prism

Les présentations de la **gamme SPECTRA** (Writer, Calc, Slide) : simples comme Canva, plus puissantes que PowerPoint.
Même compte que le site Studio Prism, SPECTRA Writer, SPECTRA Calc, ARCHIPLAN et Archi Vision.

**En ligne :** https://groupestudioprism.github.io/SpectraSlide/
**Démo autonome** (comptes et présentations dans le navigateur) : `dist/spectraslide-demo.html`

## Ce que fait l'app

**Connexion et accueil** : compte Studio Prism, cloud, dossiers, partage par email ou par lien, modèles personnels et **Communauté** (publication modérée par Studio Prism). « Que voulez-vous présenter ? » propose le bon modèle, une présentation existante, ou fait créer toute la présentation par l'IA. On peut aussi ouvrir un fichier PowerPoint.

**Modèles** : 16 présentations complètes et rédigées : pitch de startup, présentation d'entreprise, rapport trimestriel, lancement de projet, cours, plan marketing, réunion d'équipe, proposition commerciale, bilan annuel, lancement de produit, **projet d'architecture**, portfolio, conférence, exposé, stratégie, carrousel pour les réseaux sociaux (format carré).

**L'éditeur**
- Le film des diapositives à gauche (glisser pour réordonner, dupliquer, masquer), la diapositive au centre, la **barre Prisme** en bas : ses outils changent selon ce qui est sélectionné (texte, forme, image, icône, tableau, graphique, ligne).
- **16 thèmes** dessinés (palette, paire de polices, décor de fond), 12 palettes, 14 paires de polices : changer de thème recolore toute la présentation, car les éléments utilisent les couleurs du thème.
- **21 mises en page** (titre, section, liste, deux colonnes, texte et image, cartes, chiffres clés, grand chiffre, étapes, frise, comparaison, graphique, tableau, sommaire, citation, équipe, message, photo pleine page, fin…). Changer de mise en page garde le contenu.
- Textes, 22 formes, 64 icônes, images (recadrage, filtres, formes de masque), tableaux, **graphiques** (colonnes, barres, courbes, aires, empilé, secteurs, anneau, données collées depuis Excel ou SPECTRA Calc), éléments prêts à l'emploi.
- Déplacement avec **repères magnétiques**, redimensionnement, rotation, groupes, verrouillage, alignement et répartition, plans, copier-coller entre présentations, annuler illimité.
- **Animer** : transitions entre diapositives, apparition automatique des éléments, animations au clic, « Animer toute la présentation » en un clic.
- **Présenter** (F5) : plein écran, transitions, notes de l'orateur et minuteur (S), vue d'ensemble (G), écran noir (B), pointeur laser (L), aller à une diapositive (numéro + Entrée), glisser au doigt sur mobile.
- **Le Spectre** (Ctrl + K) comprend des phrases : « nouvelle diapo en deux colonnes », « thème océan », « ajoute un tableau 3 x 4 », « mets le fond en bleu », « présente »… Le reste part à **l'IA**, qui crée une présentation complète, ajoute ou refait des diapositives, améliore ou traduit les textes et écrit les notes. On voit un aperçu avant d'appliquer, et Ctrl + Z annule tout. Limite : 25 demandes par jour (gratuit), 300 (licence), 1 000 (admin).
- **Exports** : PDF (une diapositive par page) ; avec licence **PowerPoint .pptx** (textes, formes, tableaux et graphiques modifiables, notes), page web autonome, sauvegarde `.spectraslide`. **Import** : PowerPoint .pptx (textes, formes, images, tableaux, graphiques, notes, fonds), images.
- Formats 16:9, 4:3, carré, portrait 4:5, story 9:16. Interface claire ou sombre, mobile, installable comme une application.

## Offres

| Offre | Cloud | Dossiers | Exports |
| --- | --- | --- | --- |
| Gratuite | 10 Mo | 5 privés + 3 partagés | PDF |
| Licence SPECTRA Slide (`licenses/{uid}_spectraslide`) | 50 Mo | 5 + 3 | Tous (.pptx…) |
| Administrateur | 1 Go | 5 + 3 | Tous |

Les images sont compressées à l'import. Dans le cloud, chaque image est rangée dans son propre document (sous-collection `media` de la présentation) : une présentation peut contenir autant de photos que l'espace cloud le permet (10 Mo gratuit, 50 Mo avec licence).

## Présentation Studio Prism

`exemples/studio-prism.spectraslide` : la présentation de l'entreprise (20 diapositives, captures réelles des apps, notes de l'orateur).
Le lien **https://groupestudioprism.github.io/SpectraSlide/#/importer/studio-prism** l'ajoute au compte connecté (une seule fois : si elle y est déjà, elle s'ouvre). N'importe quel fichier `exemples/<nom>.spectraslide` peut être proposé de la même façon avec `#/importer/<nom>`.

## Contenu du dépôt

| Fichier | Rôle |
| --- | --- |
| `src/parts/` | En-tête et structure de la page (intro, compte, accueil, éditeur, mode présentation) |
| `src/css/` | Charte SPECTRA : `base`, `splash`, `auth`, `home`, `shell`, `slide` |
| `src/deck/` | L'éditeur : thèmes et décors, icônes et formes, modèle et mises en page, rendu, modèles, scène, actions, film, barre Prisme, tiroirs, présentation, import/export, Spectre, démarrage |
| `src/js/` | Compte (`auth.js`), cloud et accueil (`cloud.js`), Communauté (`community.js`), IA (`ai.js`), menu du compte (`auth-end.js`) |
| `tools/build.py` | `python3 tools/build.py` → `index.html` (en ligne) et `dist/spectraslide-demo.html` |
| `firebase/firestore.rules` | Règles Firestore complètes (site + SPECTRA Writer + Calc + Slide), à coller telles quelles dans la console |
| `firebase/firestore-spectraslide.rules` | Le seul bloc SPECTRA Slide (pour mémoire) |

On modifie `src/`, on lance `python3 tools/build.py`, on enregistre sur `main` : GitHub Pages publie en une minute.

## À faire côté Firebase (une fois)

1. Copier **tout** `firebase/firestore.rules` dans Firebase → Firestore → Règles, en remplaçant l'existant, puis Publier.
2. Créer le produit `spectraslide` (nom « SPECTRA Slide ») dans l'administration du site, pour attribuer licences et clés.
3. L'IA est la même que pour Writer et Calc (Firebase AI Logic). Pour dépasser le quota gratuit de Gemini, passer le projet en formule Blaze.

Tant que les règles ne sont pas publiées, l'app fonctionne quand même : les présentations sont enregistrées **sur l'appareil**.

La configuration Firebase écrite dans `index.html` est publique par conception ; la sécurité repose sur les règles. **Ne jamais ajouter de clé privée dans ce dépôt.**
