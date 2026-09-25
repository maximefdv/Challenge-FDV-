// Étape 2 : rejoue un transcript de RDV et affiche les cartes du Souffleur dans le terminal.
// Usage : node src/cli.js demo/rdv-decouverte.json [--mock] [--realtime]
import { config } from "./config.js";
import { createSouffleur, CHECKLIST, resolveMode } from "./souffleur.js";
import { scenarioPath, loadScenario } from "./scenario.js";

const args = process.argv.slice(2);
const file = scenarioPath(args.find((a) => !a.startsWith("--")));
const realtime = args.includes("--realtime");
const rdv = loadScenario(file);
const mode = resolveMode({ forceMock: args.includes("--mock"), hasKey: config.hasAnthropicKey, scenario: rdv });
const souffleur = createSouffleur({ mode });
console.log(`▶ ${rdv.titre}\n  Docs chargés : ${souffleur.knowledgeFiles.join(", ")}\n  Mode : ${mode === "claude" ? config.modelLive : mode}\n`);

const latences = [];
let precedent = 0;
for (const r of rdv.repliques) {
  if (realtime) await new Promise((ok) => setTimeout(ok, r.t - precedent));
  precedent = r.t;
  console.log(`${r.qui === "prospect" ? "🟠" : "🔵"} ${r.qui}: ${r.texte}`);
  try {
    const res = await souffleur.analyze(r);
    latences.push(res.latenceMs);
    if (res.carte) {
      const c = res.carte;
      console.log(`   ┌─ 💡 ${c.titre.toUpperCase()} (${res.declencheur}, ${res.latenceMs} ms)`);
      console.log(`   │ Dire : ${c.reponse}\n   │ Preuve : ${c.preuve}\n   │ Rebond : ${c.question_rebond}`);
      console.log(`   └─ Sources : ${c.sources.join(", ")}`);
    }
    for (const { item, info } of res.checklist) console.log(`   ✔ ${CHECKLIST[item]} : ${info}`);
  } catch (err) {
    console.log(`   ✖ Erreur analyse : ${err.message}`);
  }
}

console.log("\n=== Checklist de découverte ===");
for (const [k, label] of Object.entries(CHECKLIST)) {
  console.log(`${souffleur.checklist[k] ? "✅" : "❌"} ${label}${souffleur.checklist[k] ? " — " + souffleur.checklist[k] : "  ← à creuser"}`);
}
if (latences.length) {
  const sorted = [...latences].sort((a, b) => a - b);
  console.log(`\nLatence : médiane ${sorted[Math.floor(sorted.length / 2)]} ms, max ${sorted.at(-1)} ms`);
}
