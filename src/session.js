import { createSouffleur, CHECKLIST } from "./souffleur.js";

// Une session = un RDV. Reçoit des répliques (quelle que soit la source : rejeu, audio, live)
// et pousse transcript + cartes + checklist vers le navigateur via send().
export function createSession(send, { mock }) {
  const souffleur = createSouffleur({ mock });
  let nextId = 1;

  function addReplique({ qui, texte }) {
    const id = nextId++;
    send({ type: "replique", id, qui, texte });
    souffleur
      .analyze({ qui, texte })
      .then((res) => send({ type: "analyse", id, ...res, checklistEtat: souffleur.checklist }))
      .catch((err) => send({ type: "erreur", id, message: err.message }));
  }

  return { addReplique, info: { mock, docs: souffleur.knowledgeFiles, checklist: CHECKLIST } };
}
