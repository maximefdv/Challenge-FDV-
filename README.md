# Le Souffleur 🎙️💡

Copilote temps réel pour les RDV de découverte B2B sur Teams : il écoute l'échange, détecte les objections et questions du prospect, et affiche en quelques secondes une **carte de réponse sourcée** (réponse orale, preuve chiffrée, question de rebond) tirée des documents internes. En parallèle, il coche la **checklist de découverte** (besoin, budget, décideur, délai…) et signale ce qui reste à creuser.

> Statut : MVP en cours – étape 2/6 (moteur en ligne de commande). Données 100 % fictives.

## Lancer (étape actuelle)
```bash
npm install
cp .env.example .env        # renseigner ANTHROPIC_API_KEY
npm run replay              # rejoue le RDV fictif demo/rdv-decouverte.json avec Claude
npm run replay:mock         # sans clé API (détection par mots-clés)
node src/cli.js demo/rdv-decouverte.json --realtime   # respecte le timing réel des répliques
```

## Base documentaire
- `knowledge/*.md` : documents fictifs (offre, tarifs, cas clients, FAQ, objections).
- `knowledge/private/*.md` : vos vrais documents (ignorés par git). Chargés automatiquement.

## Sécurité / RGPD
Clés API uniquement dans `.env`. Aucun transcript stocké par défaut. Informer le prospect de l'assistance IA en début de RDV.
