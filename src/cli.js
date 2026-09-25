// Étape 2 : rejoue un transcript de RDV et affiche les cartes du Souffleur dans le terminal.
// Usage : node src/cli.js demo/rdv-decouverte.json [--mock] [--realtime]
import fs from "node:fs";
import { config } from "./config.js";
import { createSouffleur, CHECKLIST } from "./souffleur.js";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) || "demo/rdv-decouverte.json";
const realtime = args.includes("--realtime");
const mock = args.includes("--mock") || !config.hasAnthropicKey;
if (mock && !args.includes("--mock")) console.log("⚠ ANTHROPIC_API_KEY absente → mode --mock (mots-clés)\n");

const rdv = JSON.parse(fs.readFileSync(file, "utf8"));
const souffleur = createSouffleur({ mock });
console.log(`▶ ${rdv.titre}\n  Docs chargés : ${souffleur.knowledgeFiles.join(", ")}\n  Modèle : ${mock ? "mock" : config.modelLive}\n`);

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
