// Genera Sempre-in-Linea-presentazione.pptx (4 slide, 16:9).
// Numero, scadenza, posti e P.IVA arrivano da CONFIG in index.html, come per locandina e volantino.
// Sfondi, onda e icone vengono disegnati in HTML e fotografati con Playwright, poi inseriti come immagini;
// tutti i testi restano testo vero, modificabile in PowerPoint.
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import pptxgen from "pptxgenjs";

const dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(dir, "Sempre-in-Linea-presentazione.pptx");

const html = await readFile(join(dir, "index.html"), "utf8");
const CONFIG = new Function(`return ${html.match(/const CONFIG = (\{[\s\S]*?\});/)[1]}`)();
const TEL = `tel:${CONFIG.PHONE_TEL}`;
const left = Math.min(CONFIG.SPOTS_TOTAL, Math.max(0, CONFIG.SPOTS_LEFT));
const deadline = new Date(CONFIG.DEADLINE);
const part = (o) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", ...o }).format(deadline);
const DAY = part({ day: "numeric" });
const MONTH = part({ month: "short" }).replace(".", "").toUpperCase();
const TIME = part({ hour: "2-digit", minute: "2-digit" });
const DAY_LONG = part({ weekday: "long", day: "numeric", month: "long" });

// Palette della landing
const K = {
  bg: "04090A", surface: "0F1A1A", border: "1C2B2A", text: "EEF4F2", soft: "C3D0CD",
  muted: "8FA3A0", teal: "2CCFAE", ink: "03110E", alarm: "FF2B2B", alarmDim: "5A1717",
};
// Font presenti su Windows e Mac: la presentazione appare uguale su qualsiasi computer
const SERIF = "Georgia", SANS = "Arial", MONO = "Courier New";

/* ------------------------------------------------------------------ immagini */
const tmp = await mkdtemp(join(tmpdir(), "sil-deck-"));
const browser = await chromium.launch();
async function shot(name, w, h, body, transparent = false) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<!doctype html><html><head><style>*{margin:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden;${transparent ? "background:transparent" : `background:#${K.bg}`}}</style></head><body>${body}</body></html>`);
  const path = join(tmp, `${name}.png`);
  await page.screenshot({ path, omitBackground: transparent });
  await page.close();
  return path;
}
const dots = (op, mask) => `<div style="position:absolute;inset:0;background:radial-gradient(rgba(143,163,160,${op}) 1.6px,transparent 2.3px) 0 0/26px 26px;-webkit-mask:${mask}"></div>`;
const ring = (size, top, blur) => `<div style="position:absolute;left:50%;top:0;width:${size}px;height:${size}px;border-radius:50%;transform:translate(-50%,${top}%);filter:blur(${blur}px);background:radial-gradient(closest-side,rgba(44,207,174,0) 70%,rgba(44,207,174,.08) 82%,rgba(44,207,174,.42) 92%,rgba(120,240,214,.85) 96.5%,rgba(44,207,174,0) 100%)"></div>`;

const BG_OPEN = await shot("bg-apertura", 1920, 1080, `
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 55% 45% at 50% 0%,rgba(44,207,174,.22),rgba(44,207,174,0) 75%)"></div>
  ${ring(2700, -84, 16)}
  ${dots(0.14, "linear-gradient(180deg,transparent 35%,#000 70%,#000)")}`);
const BG_CONTENT = await shot("bg-contenuto", 1920, 1080, `
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 45% 50% at 100% 0%,rgba(44,207,174,.13),rgba(44,207,174,0) 70%)"></div>
  ${dots(0.12, "radial-gradient(ellipse 70% 80% at 100% 100%,#000,transparent 75%)")}`);
const BG_CLOSE = await shot("bg-chiusura", 1920, 1080, `
  <div style="position:absolute;left:73%;top:55%;width:1700px;height:620px;transform:translate(-50%,-50%);filter:blur(30px);background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(44,207,174,.38),rgba(44,207,174,.1) 52%,rgba(44,207,174,0) 74%)"></div>
  ${dots(0.13, "radial-gradient(ellipse 60% 70% at 73% 55%,#000,transparent 75%)")}`);

let bars = "";
for (let i = 0; i < 72; i++) {
  const x = i / 71, env = 0.35 + 0.65 * Math.sin(Math.PI * x);
  const h = Math.max(0.08, env * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37 + 1))));
  bars += `<i style="flex:1;max-width:9px;height:${Math.round(h * 100)}%;border-radius:5px;background:#${K.teal};opacity:${x > 0.62 ? 0.38 : 1}"></i>`;
}
const WAVE = await shot("onda", 1100, 160, `<div style="display:flex;align-items:center;justify-content:space-between;gap:5px;height:160px">${bars}</div>`, true);

const svg = (paths, color, sw = 1.8) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="#${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const icon = (name, paths, color, sw) => shot(name, 256, 256, svg(paths, color, sw), true);
const P_PHONE = '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>';
const IC = {
  clock: await icon("orologio", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', K.teal),
  calendar: await icon("calendario", '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="m9 16 2 2 4-4"/>', K.teal),
  link: await icon("collega", '<path d="m9 15 6-6"/><path d="m11 6 .46-.54a5 5 0 0 1 7.08 7.08L18 13"/><path d="m13 18-.4.53a5.07 5.07 0 0 1-7.13 0 4.97 4.97 0 0 1 0-7.07L6 11"/>', K.teal),
  check: await icon("spunta", '<path d="m5 12 5 5L20 7"/>', K.teal, 2.6),
  phoneInk: await icon("telefono", P_PHONE, K.ink, 2.2),
  missed: await icon("persa", `${P_PHONE}<path d="m16 3 5 5M21 3l-5 5"/>`, K.muted, 1.8),
};
await browser.close();

/* ------------------------------------------------------------------ presentazione */
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 pollici
pres.title = "Sempre in Linea";
pres.author = "Marco Pontone";
pres.theme = { headFontFace: SERIF, bodyFontFace: SANS };
const W = 13.333, M = 0.6;

const footer = [
  { text: { text: "Sempre in Linea", options: { x: M, y: 6.95, w: 3, h: 0.3, fontFace: MONO, fontSize: 10, color: K.muted, margin: 0 } } },
];
const titlePh = (x, y, w, h, align, size) => ({
  placeholder: { options: { name: "title", type: "title", x, y, w, h, align, valign: "top", fontFace: SERIF, fontSize: size, color: K.text, margin: 0, lineSpacingMultiple: 0.95 }, text: "" },
});
pres.defineSlideMaster({ title: "Apertura", background: { path: BG_OPEN }, objects: [titlePh(1, 1.2, W - 2, 1.75, "center", 50)] });
pres.defineSlideMaster({
  title: "Contenuto", background: { path: BG_CONTENT },
  objects: [...footer, titlePh(M, 0.95, 6.4, 2.0, "left", 40)],
  slideNumber: { x: W - M - 0.5, y: 6.95, w: 0.5, h: 0.3, fontFace: MONO, fontSize: 10, color: K.muted, align: "right" },
});
pres.defineSlideMaster({
  title: "Chiusura", background: { path: BG_CLOSE },
  objects: [...footer, titlePh(M, 0.95, 6.4, 2.0, "left", 40)],
  slideNumber: { x: W - M - 0.5, y: 6.95, w: 0.5, h: 0.3, fontFace: MONO, fontSize: 10, color: K.muted, align: "right" },
});

const txt = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, lang: "it-IT", fontFace: SANS, color: K.text, valign: "top", ...o });
const eyebrow = (s, text, o = {}) => txt(s, text, { x: M, y: 0.58, w: 6.4, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: K.teal, charSpacing: 2, ...o });
const card = (s, name, x, y, w, h, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: name, x, y, w, h, rectRadius: 0.16, fill: { color: K.surface }, line: { color: K.border, width: 1 }, ...o });
const teal = (text) => ({ text, options: { italic: true, color: K.teal } });

/* 1. Il problema ----------------------------------------------------- */
{
  const s = pres.addSlide({ masterName: "Apertura" });
  s.addShape(pres.shapes.OVAL, { objectName: "Puntino logo", x: 5.53, y: 0.56, w: 0.15, h: 0.15, fill: { color: K.teal }, line: { type: "none" } });
  txt(s, "Sempre in Linea", { x: 5.78, y: 0.44, w: 3, h: 0.4, fontFace: SERIF, fontSize: 20 });
  s.addText([{ text: "Quante chiamate hai " }, { text: "perso", options: { italic: true, color: K.teal, breakLine: true } }, { text: "questa settimana?" }], { placeholder: "title", lang: "it-IT" });
  txt(s, "Non per pigrizia. Perché in quel momento avevi le mani occupate.", { x: 1.5, y: 3.0, w: W - 3, h: 0.45, fontSize: 18, color: K.soft, align: "center" });

  txt(s, "UNA GIORNATA QUALUNQUE", { x: 1.5, y: 3.85, w: W - 3, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: K.teal, charSpacing: 2, align: "center" });
  s.addShape(pres.shapes.LINE, { objectName: "Linea del tempo", x: 1.9, y: 4.5, w: W - 3.8, h: 0, line: { color: K.border, width: 1.5 } });
  const moments = [["08:40", "Sei in riunione"], ["11:15", "Sei con un cliente"], ["13:30", "Sei a pranzo"], ["20:10", "Hai già chiuso"]];
  const colW = 2.7, x0 = (W - colW * 4) / 2;
  moments.forEach(([time, what], i) => {
    const cx = x0 + colW * i + colW / 2;
    s.addShape(pres.shapes.OVAL, { objectName: `Punto ${time}`, x: cx - 0.19, y: 4.31, w: 0.38, h: 0.38, fill: { color: K.surface }, line: { color: K.muted, width: 1 } });
    s.addImage({ path: IC.missed, x: cx - 0.12, y: 4.38, w: 0.24, h: 0.24, altText: "Chiamata persa" });
    txt(s, time, { x: cx - colW / 2, y: 4.85, w: colW, h: 0.45, fontFace: MONO, fontSize: 26, bold: true, align: "center" });
    txt(s, what, { x: cx - colW / 2, y: 5.35, w: colW, h: 0.35, fontSize: 16, color: K.soft, align: "center" });
    txt(s, "chiamata persa", { x: cx - colW / 2, y: 5.72, w: colW, h: 0.25, fontFace: MONO, fontSize: 11, color: K.muted, align: "center" });
  });
  txt(s, [
    { text: "Richiami appena puoi. Ma chi ha chiamato non ha lasciato un messaggio: " },
    { text: "ha già cercato il numero successivo su Google.", options: { bold: true, color: K.text } },
  ], { x: 1.2, y: 6.45, w: W - 2.4, h: 0.6, fontSize: 17, color: K.soft, align: "center" });
  s.addNotes(`Partite da qui, con calma. Chiedete davvero: quante chiamate avete perso questa settimana? Nessuno lo sa con precisione, ed è proprio questo il punto.
Non è colpa di nessuno: si perdono chiamate perché si sta lavorando. Ma il cliente che trova occupato o nessuna risposta raramente lascia un messaggio. Prende il telefono e chiama il prossimo nome su Google.`);
}

/* 2. Cos'è ----------------------------------------------------------- */
{
  const s = pres.addSlide({ masterName: "Contenuto" });
  eyebrow(s, "COS'È");
  s.addText([{ text: "Una segretaria costruita con l'" }, teal("intelligenza artificiale")], { placeholder: "title", lang: "it-IT" });
  txt(s, "Risponde al telefono della tua azienda quando tu non puoi. Parla in modo naturale, capisce cosa le chiedono e ti lascia tutto già in ordine.", { x: M, y: 3.05, w: 6.1, h: 1.0, fontSize: 17, color: K.soft, lineSpacingMultiple: 1.15 });

  card(s, "Card chiamata in arrivo", M, 4.35, 6.1, 1.9);
  s.addShape(pres.shapes.OVAL, { objectName: "Puntino linea attiva", x: M + 0.3, y: 4.66, w: 0.12, h: 0.12, fill: { color: K.teal }, line: { type: "none" } });
  txt(s, "Chiamata in arrivo · ti risponde lei", { x: M + 0.52, y: 4.6, w: 5.2, h: 0.25, fontFace: MONO, fontSize: 12, color: K.soft });
  s.addImage({ path: WAVE, x: M + 0.3, y: 5.05, w: 5.5, h: 0.8, altText: "Onda sonora di una chiamata in corso" });

  const feats = [
    [IC.clock, "Risponde sempre", "Giorno e notte, sabato e domenica. Anche quando la linea è già occupata."],
    [IC.calendar, "Fissa gli appuntamenti", "Chiede nome, motivo e urgenza, prende la richiesta e segna l'appuntamento sul tuo calendario."],
    [IC.link, "Lavora con i tuoi strumenti", "Si collega al tuo calendario e al tuo gestionale. Non devi ricopiare niente."],
  ];
  const fx = 7.35, fw = W - M - fx, fh = 1.6, gap = 0.225;
  feats.forEach(([ic, title, body], i) => {
    const y = 1.0 + i * (fh + gap);
    card(s, `Card ${title}`, fx, y, fw, fh);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Fondo icona ${i + 1}`, x: fx + 0.3, y: y + 0.3, w: 0.62, h: 0.62, rectRadius: 0.12, fill: { color: K.teal, transparency: 88 }, line: { color: K.teal, width: 0.75, transparency: 60 } });
    s.addImage({ path: ic, x: fx + 0.43, y: y + 0.43, w: 0.36, h: 0.36, altText: `Icona: ${title}` });
    txt(s, title, { x: fx + 1.17, y: y + 0.27, w: fw - 1.45, h: 0.36, fontSize: 18, bold: true });
    txt(s, body, { x: fx + 1.17, y: y + 0.68, w: fw - 1.45, h: 0.7, fontSize: 15, color: K.soft, lineSpacingMultiple: 1.1 });
  });
  s.addNotes(`Una frase sola: è una segretaria, costruita con l'intelligenza artificiale, che risponde al vostro numero quando voi non potete.
Non è un risponditore automatico con i tasti da premere. Si parla con lei come con una persona: chiede chi è, cosa serve, quanto è urgente, e fissa l'appuntamento sul vostro calendario. Voi trovate tutto già in ordine.`);
}

/* 3. A chi serve e come si parte ------------------------------------- */
{
  const s = pres.addSlide({ masterName: "Contenuto" });
  eyebrow(s, "A CHI SERVE");
  s.addText([{ text: "Per chi non può perdere una " }, teal("chiamata")], { placeholder: "title", lang: "it-IT" });

  card(s, "Card chi serve", M, 2.65, 6.1, 1.75, { fill: { color: K.teal, transparency: 92 }, line: { color: K.teal, width: 1.25 } });
  txt(s, [
    { text: "Se ricevi molte telefonate,", options: { breakLine: true } },
    { text: "allora fa per te", options: { breakLine: true } },
    { text: "indipendentemente dal settore.", options: { italic: true, color: K.teal } },
  ], { x: M + 0.4, y: 2.65, w: 5.4, h: 1.75, fontFace: SERIF, fontSize: 25, valign: "middle", lineSpacingMultiple: 1.05 });

  s.addImage({ path: IC.clock, x: M, y: 4.85, w: 0.42, h: 0.42, altText: "Icona: orologio" });
  txt(s, "Una segretaria intelligente che lavora per te a qualunque ora, in qualunque lingua e 24\u00A0ore\u00A0su\u00A024.", { x: M + 0.65, y: 4.8, w: 5.45, h: 0.95, fontSize: 18, color: K.soft, lineSpacingMultiple: 1.12 });

  const px = 7.35, pw = W - M - px;
  card(s, "Card come si parte", px, 1.0, pw, 5.25);
  txt(s, "COME SI PARTE", { x: px + 0.4, y: 1.35, w: pw - 0.8, h: 0.3, fontFace: MONO, fontSize: 12, bold: true, color: K.teal, charSpacing: 2 });
  txt(s, "Tu non devi fare niente di tecnico", { x: px + 0.4, y: 1.72, w: pw - 0.8, h: 0.45, fontSize: 21, bold: true });
  const steps = [
    "Una breve chiamata: ci racconti come lavori e cosa ti chiedono di solito i clienti.",
    "Prepariamo la tua segretaria: come si presenta, cosa risponde, i tuoi orari, il tuo calendario.",
    "Colleghiamo il tuo numero. Da quel momento, quando tu non puoi, risponde lei.",
  ];
  const sy = 2.75, step = 1.12;
  s.addShape(pres.shapes.LINE, { objectName: "Linea dei passaggi", x: px + 0.68, y: sy + 0.5, w: 0, h: step * 2 - 0.5, line: { color: K.teal, width: 1, transparency: 40 } });
  steps.forEach((t, i) => {
    const y = sy + i * step;
    s.addShape(pres.shapes.OVAL, { objectName: `Passaggio ${i + 1}`, x: px + 0.43, y, w: 0.5, h: 0.5, fill: { color: K.bg }, line: { color: K.teal, width: 1.25 } });
    txt(s, String(i + 1), { x: px + 0.43, y, w: 0.5, h: 0.5, fontFace: MONO, fontSize: 15, bold: true, color: K.teal, align: "center", valign: "middle" });
    txt(s, t, { x: px + 1.2, y: y + 0.04, w: pw - 1.6, h: 0.9, fontSize: 15, color: K.soft, lineSpacingMultiple: 1.1 });
  });
  s.addNotes(`Il settore conta poco: conta quante telefonate ricevete. Se il telefono squilla spesso e non potete sempre rispondere, fa per voi. Lavora a qualunque ora, in qualunque lingua.
E non serve saperne di tecnologia. Ci sentiamo, ci raccontate come lavorate, prepariamo noi la segretaria e colleghiamo il vostro numero. Voi continuate a lavorare come prima.`);
}

/* 4. L'offerta ------------------------------------------------------- */
{
  const s = pres.addSlide({ masterName: "Chiusura" });
  eyebrow(s, `PROGRAMMA PILOTA · SOLO ${CONFIG.SPOTS_TOTAL} AZIENDE`);
  s.addText([{ text: "Provala sul tuo numero. " }, teal("Gratis"), { text: " per 2 settimane." }], { placeholder: "title", lang: "it-IT" });
  const checks = [
    "2 settimane gratis, con i tuoi clienti veri",
    "Configurazione fatta da noi, inclusa",
    "Primo mese soddisfatto o rimborsato",
    "Nessun vincolo: finite le 2 settimane, decidi tu",
  ];
  checks.forEach((t, i) => {
    const y = 2.85 + i * 0.55;
    s.addImage({ path: IC.check, x: M, y: y + 0.02, w: 0.3, h: 0.3, altText: "Spunta" });
    txt(s, t, { x: M + 0.5, y, w: 5.8, h: 0.36, fontSize: 18 });
  });
  txt(s, "Il rischio lo prendiamo noi: se dopo il primo mese non ti convince, ti restituiamo quello che hai pagato.", { x: M, y: 5.2, w: 6.1, h: 0.7, fontSize: 15, color: K.soft, lineSpacingMultiple: 1.1 });

  const px = 7.35, pw = W - M - px, cx = px + pw / 2;
  card(s, "Card chiamata", px, 1.0, pw, 5.25, { line: { color: K.teal, width: 1.25 }, shadow: { type: "outer", color: K.teal, blur: 24, offset: 0, angle: 90, opacity: 0.35 } });
  txt(s, "IL PILOTA CHIUDE IL", { x: px, y: 1.32, w: pw, h: 0.3, fontFace: MONO, fontSize: 13, bold: true, color: K.alarm, charSpacing: 2, align: "center" });
  const tiles = [[DAY, 1.1], [MONTH, 1.45], [TIME, 1.95]];
  const tw = tiles.reduce((a, [, w]) => a + w, 0) + 0.12 * (tiles.length - 1);
  let tx = cx - tw / 2;
  tiles.forEach(([v, w]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Tessera ${v}`, x: tx, y: 1.75, w, h: 0.95, rectRadius: 0.12, fill: { color: "000000" }, line: { color: K.alarm, width: 1.5 }, shadow: { type: "outer", color: K.alarm, blur: 14, offset: 0, angle: 90, opacity: 0.35 } });
    txt(s, v, { x: tx, y: 1.75, w, h: 0.95, fontFace: MONO, fontSize: 34, bold: true, color: K.alarm, align: "center", valign: "middle" });
    tx += w + 0.12;
  });
  const spotsText = left === 1 ? [["Rimane solo ", K.soft], ["1", K.alarm], [" posto", K.soft]] : [["Rimangono solo ", K.soft], [String(left), K.alarm], [" posti", K.soft]];
  const dotsW = CONFIG.SPOTS_TOTAL * 0.16 + (CONFIG.SPOTS_TOTAL - 1) * 0.08;
  const spotsW = dotsW + 0.15 + 2.75;
  for (let i = 0; i < CONFIG.SPOTS_TOTAL; i++) {
    const free = i < left;
    s.addShape(pres.shapes.OVAL, { objectName: `Posto ${i + 1}`, x: cx - spotsW / 2 + i * 0.24, y: 3.04, w: 0.16, h: 0.16, fill: free ? { color: K.alarm } : { color: K.surface }, line: { color: free ? K.alarm : K.muted, width: 1 } });
  }
  txt(s, spotsText.map(([t, c]) => ({ text: t, options: { color: c, bold: c === K.alarm } })), { x: cx - spotsW / 2 + dotsW + 0.15, y: 2.97, w: 2.75, h: 0.3, fontFace: MONO, fontSize: 14 });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: "Pulsante chiama", x: px + 0.4, y: 3.6, w: pw - 0.8, h: 0.85, rectRadius: 0.16, fill: { color: K.teal }, line: { type: "none" }, hyperlink: { url: TEL, tooltip: "Chiama la segretaria" } });
  s.addImage({ path: IC.phoneInk, x: cx - 1.5, y: 3.83, w: 0.4, h: 0.4, altText: "Telefono" });
  txt(s, "Chiamala adesso", { x: cx - 0.95, y: 3.6, w: 2.8, h: 0.85, fontSize: 22, bold: true, color: K.ink, valign: "middle" });
  txt(s, CONFIG.PHONE_DISPLAY, { x: px, y: 4.62, w: pw, h: 0.65, fontFace: MONO, fontSize: 38, bold: true, align: "center", valign: "middle" });
  // Area cliccabile trasparente sopra pulsante e numero: il link resta, senza la sottolineatura dei testi collegati
  s.addShape(pres.shapes.RECTANGLE, { objectName: "Link chiamata", x: px + 0.4, y: 3.6, w: pw - 0.8, h: 1.67, fill: { color: K.surface, transparency: 100 }, line: { type: "none" }, hyperlink: { url: TEL, tooltip: "Chiama la segretaria" } });
  txt(s, "Non crederci sulla parola: chiamala e mettila alla prova.", { x: px + 0.3, y: 5.35, w: pw - 0.6, h: 0.3, fontSize: 14, color: K.soft, align: "center" });
  txt(s, `Marco Pontone · Roma${CONFIG.PIVA ? ` · P.IVA ${CONFIG.PIVA}` : ""}`, { x: px + 0.3, y: 5.78, w: pw - 0.6, h: 0.25, fontSize: 11, color: K.muted, align: "center" });
  s.addNotes(`Il pilota è per ${CONFIG.SPOTS_TOTAL} aziende e chiude ${DAY_LONG} alle ${TIME}. Due settimane gratis sul vostro numero, con i vostri clienti veri. La configurazione la facciamo noi.
Se dopo decidete di continuare, il primo mese è soddisfatto o rimborsato. Il rischio è nostro, non vostro.
Chiudete facendo chiamare il numero in sala, in vivavoce: la telefonata è la dimostrazione migliore.`);
}

await pres.writeFile({ fileName: OUT });
await rm(tmp, { recursive: true, force: true });
console.log(`${OUT.split("/").pop()} salvata`);
