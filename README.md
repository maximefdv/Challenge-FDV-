# Le Souffleur 🎙️💡

Copilote temps réel pour les RDV de découverte B2B sur Teams : il écoute l'échange, détecte les objections et questions du prospect, et affiche en quelques secondes une **carte de réponse sourcée** (réponse orale, preuve chiffrée, question de rebond) tirée des documents internes. En parallèle, il coche la **checklist de découverte** (besoin, budget, décideur, délai…) et signale ce qui reste à creuser avant de raccrocher.

> Statut : MVP en cours – étape 3/6 (interface web, mode démo). Données 100 % fictives.

## Lancer
```bash
npm install
cp .env.example .env        # renseigner ANTHROPIC_API_KEY
npm start                   # → http://localhost:3000 puis « Lancer la démo »
npm run start:mock          # force le mode mots-clés
```
**Modes** : `claude` (clé API présente, analyse en direct) · `precalc` (sans clé : rejoue les analyses enregistrées dans le scénario) · `mock` (mots-clés, tests).

Astuce : ouvrir la page en demi-écran à côté de Teams (mise en page adaptée).

Vidéo de démo : `http://localhost:3000/video.html` = appel visio simulé + Souffleur côte à côte (option `finMs` dans le scénario pour retarder la fin).

En ligne de commande : `npm run replay` (ou `replay:mock`), option `--realtime` pour respecter le timing.

## Base documentaire
- `knowledge/*.md` : documents fictifs (offre, tarifs, cas clients, FAQ, objections).
- `knowledge/private/*.md|.txt` : vos vrais documents (ignorés par git). S'ils existent, ils remplacent les docs fictifs (`KNOWLEDGE=demo` pour forcer les fictifs).
- `knowledge/private/checklist.json` : votre checklist de découverte `{ "cle": "Libellé" }`.
- Scénario de démo : `DEMO_FILE`, sinon `demo/private/*.json` (ignoré par git), sinon `demo/rdv-decouverte.json`.

## Sécurité / RGPD
Clés API uniquement dans `.env`. Aucun transcript stocké par défaut. Informer le prospect de l'assistance IA en début de RDV.
