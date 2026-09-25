// Étape 3 : serveur web + WebSocket. Usage : node src/server.js [--mock]
import http from "node:http";
import express from "express";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import { createSession } from "./session.js";
import { resolveMode } from "./souffleur.js";
import { scenarioPath, loadScenario } from "./scenario.js";

const PORT = Number(process.env.PORT) || 3000;
const DEMO_FILE = scenarioPath();
const mode = resolveMode({ forceMock: process.argv.includes("--mock"), hasKey: config.hasAnthropicKey, scenario: loadScenario(DEMO_FILE) });

const app = express();
app.use(express.static("public"));
// Minutage du scénario (sans le contenu des cartes) pour la page de mise en scène vidéo public/video.html
app.get("/api/scenario", (_req, res) => {
  const { titre, finMs, repliques } = loadScenario(DEMO_FILE);
  res.json({ titre, finMs, repliques: repliques.map(({ t, debut, qui, texte, analyse }) => ({ t, debut: debut ?? t, qui, texte, carte: analyse?.carte ? analyse.declencheur : null })) });
});
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  const send = (msg) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(msg));
  let session = null;
  let timers = [];
  const stop = () => { timers.forEach(clearTimeout); timers = []; };

  send({ type: "hello", mode, model: config.modelLive });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === "demo") {
      stop();
      const rdv = loadScenario(DEMO_FILE);
      session = createSession(send, { mode });
      send({ type: "session", titre: rdv.titre, ...session.info });
      const speed = Number(msg.speed) || 1;
      for (const r of rdv.repliques) timers.push(setTimeout(() => session.addReplique(r), r.t / speed));
      const fin = (rdv.finMs ?? rdv.repliques.at(-1).t + 2500) / speed; // laisse arriver la dernière analyse
      timers.push(setTimeout(() => send({ type: "fin" }), fin));
    } else if (msg.type === "stop") {
      stop();
      send({ type: "fin" });
    }
  });
  ws.on("close", stop);
});

server.listen(PORT, () => {
  console.log(`Le Souffleur → http://localhost:${PORT}  mode=${mode}  scénario=${DEMO_FILE}`);
});
