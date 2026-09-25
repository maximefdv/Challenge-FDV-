// Étape 3 : serveur web + WebSocket. Usage : node src/server.js [--mock]
import fs from "node:fs";
import http from "node:http";
import express from "express";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import { createSession } from "./session.js";

const PORT = Number(process.env.PORT) || 3000;
const mock = process.argv.includes("--mock") || !config.hasAnthropicKey;
const DEMO_FILE = process.env.DEMO_FILE || "demo/rdv-decouverte.json";

const app = express();
app.use(express.static("public"));
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  const send = (msg) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(msg));
  let session = null;
  let timers = [];
  const stop = () => { timers.forEach(clearTimeout); timers = []; };

  send({ type: "hello", mock, model: mock ? "mock" : config.modelLive });

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === "demo") {
      stop();
      const rdv = JSON.parse(fs.readFileSync(DEMO_FILE, "utf8"));
      session = createSession(send, { mock });
      send({ type: "session", titre: rdv.titre, ...session.info });
      const speed = Number(msg.speed) || 1;
      for (const r of rdv.repliques) timers.push(setTimeout(() => session.addReplique(r), r.t / speed));
      const fin = rdv.repliques.at(-1).t / speed + 1000;
      timers.push(setTimeout(() => send({ type: "fin" }), fin));
    } else if (msg.type === "stop") {
      stop();
      send({ type: "fin" });
    }
  });
  ws.on("close", stop);
});

server.listen(PORT, () => {
  console.log(`Le Souffleur → http://localhost:${PORT}  (${mock ? "mode mock" : config.modelLive})`);
});
