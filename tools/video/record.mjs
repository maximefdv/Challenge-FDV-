// Enregistre public/video.html (1920×1080) image par image via le screencast Chromium.
// Usage : node tools/video/record.mjs demo/private/video.json out/frames [port]
import fs from "node:fs";
import { chromium } from "playwright-core";

const [scenarioFile, dir, port = "3999"] = process.argv.slice(2);
const { finMs } = JSON.parse(fs.readFileSync(scenarioFile, "utf8"));
const dureeS = finMs / 1000 + 6; // + plan de fin
fs.mkdirSync(dir, { recursive: true });

const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, colorScheme: "dark" });
const page = await ctx.newPage();
await page.goto(`http://localhost:${port}/video.html`);
await page.evaluate(() => window.appReady);
await page.waitForTimeout(500);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const f = `${dir}/f${String(frames.length).padStart(5, "0")}.jpg`;
  fs.writeFileSync(f, Buffer.from(data, "base64"));
  frames.push([f, metadata.timestamp]);
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92 });
await page.waitForTimeout(300);
const t0 = Date.now() / 1000;
await page.evaluate(() => window.start());
await page.waitForTimeout(dureeS * 1000);
await cdp.send("Page.stopScreencast");
await browser.close();

// Liste ffmpeg (concat) avec la durée réelle de chaque image, alignée sur t0
const fr = frames.filter(([, ts]) => ts >= t0 - 0.05);
let list = "";
fr.forEach(([f, ts], k) => {
  const next = k + 1 < fr.length ? fr[k + 1][1] : t0 + dureeS;
  list += `file '${fs.realpathSync(f)}'\nduration ${Math.max(0.001, next - (k ? ts : t0)).toFixed(3)}\n`;
});
list += `file '${fs.realpathSync(fr.at(-1)[0])}'\n`;
fs.writeFileSync(`${dir}/list.txt`, list);
console.log(`${fr.length} images, ${dureeS.toFixed(1)} s`);
