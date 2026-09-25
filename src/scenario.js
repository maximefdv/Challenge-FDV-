import fs from "node:fs";
import path from "node:path";

// Scénario de démo : DEMO_FILE, sinon le premier demo/private/*.json, sinon le scénario fictif.
export function scenarioPath(explicit) {
  if (explicit || process.env.DEMO_FILE) return explicit || process.env.DEMO_FILE;
  const dir = "demo/private";
  const prive = fs.existsSync(dir) && fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()[0];
  return prive ? path.join(dir, prive) : "demo/rdv-decouverte.json";
}

export const loadScenario = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
