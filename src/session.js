import { createSouffleur, CHECKLIST } from "./souffleur.js";

// Une session = un RDV. Reçoit des répliques (quelle que soit la source : rejeu, audio, live)
// et pousse transcript + cartes + checklist vers le navigateur via send().
export function createSession(send, { mode }) {
  const souffleur = createSouffleur({ mode });
  let nextId = 1;

  function addReplique(replique) {
    const id = nextId++;
    send({ type: "replique", id, qui: replique.qui, texte: replique.texte });
    souffleur
      .analyze(replique)
      .then((res) => send({ type: "analyse", id, ...res, checklistEtat: souffleur.checklist }))
      .catch((err) => send({ type: "erreur", id, message: err.message }));
  }

  return { addReplique, info: { mode, docs: souffleur.knowledgeFiles, checklist: CHECKLIST } };
}
