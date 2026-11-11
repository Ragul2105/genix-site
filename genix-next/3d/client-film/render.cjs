/**
 * Renders film.html to the hero film: steps window.render(t) at 30 fps and pipes PNG frames into ffmpeg.
 *
 *   NODE_PATH=<dir with puppeteer-core> node 3d/client-film/render.cjs <out.mp4> [--stills 3,9,15 <dir>]
 *
 * Needs puppeteer-core (not a project dependency), Google Chrome and ffmpeg.
 */
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer-core");

const FPS = 30, DURATION = 42, W = 1920, H = 1080;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const out = path.resolve(args[0] || "film.mp4");
const si = args.indexOf("--stills");
const stills = si >= 0 ? args[si + 1].split(",").map(Number) : null;
const stillDir = si >= 0 ? path.resolve(args[si + 2] || ".") : null;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(__dirname, "film.html"), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const shot = async t => {
    await page.evaluate(t => window.render(t), t);
    return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
  };

  if (stills) {
    fs.mkdirSync(stillDir, { recursive: true });
    for (const t of stills) fs.writeFileSync(path.join(stillDir, `t${t}.png`), await shot(t));
    await browser.close();
    return;
  }

  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out],
    { stdio: ["pipe", "inherit", "inherit"] });
  const total = FPS * DURATION;
  for (let f = 0; f < total; f++) {
    const buf = await shot(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (f % 150 === 0) process.stdout.write(`frame ${f}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on("close", r));
  await browser.close();
})();
