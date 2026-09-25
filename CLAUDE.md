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
1. Idées → FAIT (choix : D "Le Souffleur")
2. Plan → VALIDÉ. Contexte équipe : Teams desktop + Windows (capture = partage écran + son système)
3. Dev : 1-3 FAITES (KB fictive, moteur src/souffleur.js, UI public/index.html + src/server.js ws, --mock).
   Prochaine : 4 (audio Teams → Deepgram 2 canaux). Docs Xerfi + checklist.json dans knowledge/private, scénario demo/private (gitignorés).
   Pas de budget clé Anthropic → mode "precalc" par défaut. UI v2 "produit" (?kiosk&theme=dark). Vidéo 1 min
   (public/video.html + TTS Kokoro, outillage hors repo). Scénarios demo/private/video-60s.json

## Idées (Phase 1)
- A-F proposées. Retenue : D "Le Souffleur" = copilote live en RDV découverte
  (audio → transcription streaming → Claude + docs internes → cartes réponse + checklist découverte → CR/Pipedrive)

## Décisions
- Node.js (Express + ws), front HTML/JS vanilla, pas de base vectorielle : docs .md en contexte + prompt caching
- Live : Claude Haiku 4.5 ; CR fin de RDV : Sonnet 5. STT : Deepgram streaming (fr)
- 3 modes d'entrée : transcript rejoué (sans STT) / fichier audio / live (onglet + micro)

Branche : claude/sales-automation-challenge-3keafc
