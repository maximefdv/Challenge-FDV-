# Challenge FDV – Automatisation commerciale (MVP)

## Contexte
Challenge interne FDV B2B : projet d'automatisation qui fait gagner le plus de temps à l'équipe.
Stack : Pipedrive, Lemlist, Lusha, M365/Outlook, Gmail, Google Calendar, Skipcall, API Claude.

## Règles projet
- Économie de tokens : réponses courtes, extraits de fichiers seulement.
- Aucun code sans validation explicite à chaque phase.
- MVP minimal, démontrable en 5 min devant le jury.
- Dry-run par défaut : aucune écriture Pipedrive/Lemlist sans flag explicite (--live).
- Clés API uniquement dans .env (jamais dans code/logs). Données fictives uniquement. RGPD.

## Phases
1. Proposer 3 idées → choix utilisateur  ← EN COURS (idées proposées, attente du choix)
2. Plan : archi, stack, clés API, 4-6 étapes → validation
3. Dev étape par étape + point court (fait / à faire / blocage)

## Idées proposées (Phase 1)
- A. "Call-to-Cash Autopilot" : Skipcall → Claude → Pipedrive (CR, étape, tâches) → relance Lemlist/Outlook
- B. "Morning Brief FDV" : pipeline Pipedrive + agenda → top priorités + prépa RDV du jour
- C. "Objection Radar" : analyse corpus Skipcall → objections, meilleures réponses, coaching pitch

## Décisions
- (à compléter après choix)

## Branche
claude/sales-automation-challenge-3keafc
