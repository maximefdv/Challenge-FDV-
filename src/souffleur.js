import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { config } from "./config.js";
import { loadKnowledge } from "./knowledge.js";

export const CHECKLIST = {
  besoin: "Besoin / douleur principale",
  volume: "Volume / taille du périmètre",
  solution_actuelle: "Solution ou outils actuels",
  budget: "Budget / enveloppe",
  decideur: "Décideur et processus de décision",
  delai: "Délai / échéance du projet",
  prochaine_etape: "Prochaine étape convenue",
};

const Analyse = z.object({
  declencheur: z.enum(["aucun", "objection", "question", "signal_achat"]),
  carte: z
    .object({
      titre: z.string().describe("5 mots max, ex: 'Objection prix'"),
      reponse: z.string().describe("Ce que le commercial peut dire, 2 phrases max, à l'oral"),
      preuve: z.string().describe("Chiffre ou cas client tiré des documents"),
      question_rebond: z.string().describe("Question à poser au prospect pour reprendre la main"),
      sources: z.array(z.string()).describe("Noms des fichiers SOURCE utilisés"),
    })
    .nullable(),
  checklist: z
    .array(z.object({ item: z.enum(Object.keys(CHECKLIST)), info: z.string() }))
    .describe("Points de découverte couverts par CETTE réplique uniquement"),
});

const INSTRUCTIONS = `Tu es "Le Souffleur", copilote d'un commercial B2B pendant un RDV de découverte en direct.
Tu reçois la transcription au fil de l'eau. Pour la DERNIÈRE réplique uniquement :
1. Si le prospect émet une objection, pose une question sur l'offre, ou montre un signal d'achat, produis une carte de réponse.
   - Réponse courte, orale, naturelle, en français, utilisable immédiatement.
   - Appuie-toi UNIQUEMENT sur les documents ci-dessous. N'invente aucun chiffre. Si l'info manque, dis-le dans "reponse" et propose de revenir vers le prospect.
   - Ne refais pas une carte déjà affichée (liste fournie) sauf élément nouveau.
2. Sinon, declencheur = "aucun" et carte = null.
3. Indique les points de la checklist de découverte que cette réplique renseigne (info = fait appris, 10 mots max).
Checklist : ${Object.entries(CHECKLIST).map(([k, v]) => `${k} (${v})`).join(", ")}.`;

export function createSouffleur({ mock = false } = {}) {
  const knowledge = loadKnowledge();
  const client = mock ? null : new Anthropic();
  const system = [
    { type: "text", text: INSTRUCTIONS },
    { type: "text", text: `DOCUMENTS INTERNES :\n\n${knowledge.text}`, cache_control: { type: "ephemeral" } },
  ];
  const history = [];
  const cartesAffichees = [];
  const checklist = {};

  async function analyze(replique) {
    history.push(replique);
    const t0 = Date.now();
    const result = mock ? mockAnalyze(replique) : await callClaude(replique);
    if (result.carte) cartesAffichees.push(result.carte.titre);
    for (const { item, info } of result.checklist) checklist[item] = info;
    return { ...result, latenceMs: Date.now() - t0 };
  }

  async function callClaude(replique) {
    const contexte = history.slice(-8, -1).map((r) => `${r.qui}: ${r.texte}`).join("\n");
    const content = `Cartes déjà affichées : ${cartesAffichees.join(" | ") || "aucune"}
Points checklist déjà couverts : ${Object.keys(checklist).join(", ") || "aucun"}

Contexte récent :
${contexte || "(début du RDV)"}

DERNIÈRE RÉPLIQUE (${replique.qui}) : ${replique.texte}`;
    const response = await client.messages.parse({
      model: config.modelLive,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(Analyse) },
    });
    if (!response.parsed_output) throw new Error(`Réponse non exploitable (stop_reason=${response.stop_reason})`);
    return { ...response.parsed_output, usage: response.usage };
  }

  return { analyze, checklist, knowledgeFiles: knowledge.files };
}

// Mode hors ligne : détection par mots-clés, pour tester la chaîne sans clé API.
const MOCK_RULES = [
  [/cher|prix|coût/i, "objection", { titre: "Objection prix", reponse: "On facture uniquement les utilisateurs actifs, et nos clients économisent en moyenne 35 € par note de frais.", preuve: "Viaterra : ROI visible dès le 2e mois.", question_rebond: "Combien vous coûte aujourd'hui le traitement d'une note ?", sources: ["02-tarifs.md", "03-cas-clients.md"] }],
  [/cegid|compta/i, "question", { titre: "Intégration Cegid", reponse: "Oui, connecteur natif Cegid, vous gardez votre compta.", preuve: "Connecteurs natifs : Sage, Cegid, Pennylane, SAP…", question_rebond: "Quelle version de Cegid utilisez-vous ?", sources: ["01-offre.md"] }],
  [/dsi|sécurité|hébergé/i, "objection", { titre: "Sécurité / DSI", reponse: "Hébergement 100 % France, ISO 27001 ; je peux organiser un call entre notre RSSI et votre DSI.", preuve: "Medilys : validation IT en 2 semaines.", question_rebond: "Quels sont ses critères de validation habituels ?", sources: ["04-faq-technique.md", "05-objections.md"] }],
  [/appli|utiliser/i, "objection", { titre: "Adoption terrain", reponse: "Appli notée 4,7/5, un ticket se saisit en moins de 10 secondes.", preuve: "Batirex : chefs de chantier autonomes en une semaine.", question_rebond: "Vos chauffeurs utilisent-ils déjà des applis métier ?", sources: ["05-objections.md", "03-cas-clients.md"] }],
];
const MOCK_CHECK = [
  [/papier|ressaisit|découvre les factures/i, "besoin", "Process papier, ressaisie, achats hors circuit"],
  [/par mois|salariés/i, "volume", "300-350 notes/mois"],
  [/cegid|mail/i, "solution_actuelle", "Mails + ressaisie Cegid"],
  [/euros|enveloppe/i, "budget", "< 30 k€/an"],
  [/daf|tranche/i, "decideur", "DAF décideur final"],
  [/prochain échange|synthèse/i, "prochaine_etape", "Synthèse + prochain échange"],
];
function mockAnalyze({ qui, texte }) {
  const rule = qui === "prospect" && MOCK_RULES.find(([re]) => re.test(texte));
  return {
    declencheur: rule ? rule[1] : "aucun",
    carte: rule ? rule[2] : null,
    checklist: MOCK_CHECK.filter(([re]) => re.test(texte)).map(([, item, info]) => ({ item, info })),
  };
}
