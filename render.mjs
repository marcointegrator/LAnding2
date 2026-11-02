// Genera locandina.png (1080x1350), og-image.png (1200x630) e il volantino PDF (A4).
// Fonte unica dei valori: l'oggetto CONFIG dentro index.html.
// 1. legge CONFIG da index.html e scrive config.js (usato da locandina.html e og.html)
// 2. aggiorna og:image, twitter:image e og:url in index.html con CONFIG.SITE_URL
// 3. apre le pagine in Chromium, aspetta i font e salva immagini e PDF
// 4. prepara la cartella pubblica/ con i soli file da caricare su Netlify
import { readFile, writeFile, mkdir, copyFile, rm, access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const dir = dirname(fileURLToPath(import.meta.url));
const indexPath = join(dir, "index.html");

let html = await readFile(indexPath, "utf8");
const match = html.match(/const CONFIG = (\{[\s\S]*?\});/);
if (!match) throw new Error("CONFIG non trovato in index.html");
const CONFIG = new Function(`return ${match[1]}`)();

await writeFile(
  join(dir, "config.js"),
  `// Generato da render.mjs a partire da index.html. Non modificarlo: cambia CONFIG in index.html.\nwindow.CONFIG = ${JSON.stringify(CONFIG, null, 2)};\n`
);

const site = String(CONFIG.SITE_URL).replace(/\/+$/, "");
const updated = html
  .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${site}/og-image.png$2`)
  .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${site}/og-image.png$2`)
  .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${site}/$2`);
if (updated !== html) await writeFile(indexPath, updated);

const jobs = [
  { page: "locandina.html", out: "locandina.png", width: 1080, height: 1350 },
  { page: "og.html", out: "og-image.png", width: 1200, height: 630 },
  { page: "volantino.html", out: "Sempre-in-Linea-pilota.pdf", width: 794, height: 1123, pdf: true },
];

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.width, height: job.height }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(dir, job.page)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => {
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, ""));
    return ["Instrument Serif", "Inter Tight", "JetBrains Mono"].every((f) => loaded.includes(f));
  });
  if (!ok) console.warn(`Attenzione: font non caricati in ${job.page} (sei offline?)`);
  if (job.pdf) {
    await page.emulateMedia({ media: "screen" });
    await page.pdf({ path: join(dir, job.out), preferCSSPageSize: true, printBackground: true });
  } else {
    await page.screenshot({ path: join(dir, job.out) });
  }
  console.log(`${job.out} salvato (${job.width}x${job.height})`);
  await page.close();
}
await browser.close();

// Cartella da trascinare su Netlify: solo i file che servono al sito.
const pub = join(dir, "pubblica");
await rm(pub, { recursive: true, force: true });
await mkdir(pub);
const files = ["index.html", "og-image.png"];
if (CONFIG.PHOTO) files.push(CONFIG.PHOTO);
for (const f of files) {
  try { await access(join(dir, f)); } catch { console.warn(`Attenzione: ${f} non trovato`); continue; }
  await copyFile(join(dir, f), join(pub, f));
}
console.log(`pubblica/ pronta: ${files.join(", ")}`);
