import fs from "node:fs";
import path from "node:path";

const ROOT = "knowledge";

// Charge knowledge/*.md puis knowledge/private/*.md (docs réels, ignorés par git).
// Ordre trié = préfixe stable pour le cache de prompt.
export function loadKnowledge() {
  const files = [ROOT, path.join(ROOT, "private")]
    .filter((dir) => fs.existsSync(dir))
    .flatMap((dir) =>
      fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => path.join(dir, f)),
    );
  const text = files
    .map((f) => `=== SOURCE: ${path.basename(f)} ===\n${fs.readFileSync(f, "utf8").trim()}`)
    .join("\n\n");
  return { files: files.map((f) => path.basename(f)), text };
}
