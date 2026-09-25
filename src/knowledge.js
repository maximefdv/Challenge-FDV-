import fs from "node:fs";
import path from "node:path";

const ROOT = "knowledge";
const PRIVATE = path.join(ROOT, "private");
const listDocs = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /\.(md|txt)$/.test(f)).sort().map((f) => path.join(dir, f))
    : [];

// Docs réels (knowledge/private, ignorés par git) prioritaires : s'il y en a, on n'injecte pas
// les docs fictifs pour éviter de mélanger deux offres. KNOWLEDGE=demo force les docs fictifs.
// Ordre trié = préfixe stable pour le cache de prompt.
export function loadKnowledge() {
  const prives = listDocs(PRIVATE);
  const files = prives.length && process.env.KNOWLEDGE !== "demo" ? prives : listDocs(ROOT);
  const text = files
    .map((f) => `=== SOURCE: ${path.basename(f)} ===\n${fs.readFileSync(f, "utf8").trim()}`)
    .join("\n\n");
  return { files: files.map((f) => path.basename(f)), text };
}

// Checklist de découverte propre à l'offre : knowledge/private/checklist.json puis knowledge/checklist.json.
export function loadChecklist() {
  const f = [path.join(PRIVATE, "checklist.json"), path.join(ROOT, "checklist.json")].find((x) => fs.existsSync(x));
  return f ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}
