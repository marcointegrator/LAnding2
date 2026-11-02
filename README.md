# Sempre in Linea

Landing page, locandina WhatsApp, volantino PDF e anteprima link per il programma pilota.

## File

| File | A cosa serve |
|---|---|
| `index.html` | La pagina. File unico (HTML, CSS e JS dentro). È l'unica fonte dei valori: oggetto `CONFIG` in cima allo script. |
| `locandina.html` → `locandina.png` | Immagine 1080×1350 da inoltrare su WhatsApp. |
| `og.html` → `og-image.png` | Anteprima 1200×630 che compare quando incolli il link. |
| `volantino.html` → `Sempre-in-Linea-pilota.pdf` | Volantino A4 di una pagina da mandare su WhatsApp: si legge in circa 30 secondi. Il pulsante e il numero sono cliccabili e aprono la chiamata. |
| `render.mjs` | Rigenera immagini e PDF e tiene allineati i valori. |
| `presentazione.mjs` → `Sempre-in-Linea-presentazione.pptx` | Presentazione PowerPoint di 4 slide per i potenziali clienti, con le note per chi parla sotto ogni slide. Si rigenera con `npm run deck`. |
| `shared.js`, `config.js` | Usati solo da locandina, volantino e anteprima. `config.js` è generato: non modificarlo. |
| `riferimenti/` | Screenshot di riferimento per lo stile. |

## Cosa cambiare

Apri `index.html`, cerca `const CONFIG` e modifica solo lì:

```js
const CONFIG = {
  PHONE_TEL: "+390600000000",            // formato per il link tel:
  PHONE_DISPLAY: "06 0000 0000",         // come appare a schermo
  DEADLINE: "2026-11-20T23:59:59+01:00", // fine pilota, ora di Roma
  SPOTS_TOTAL: 3,
  SPOTS_LEFT: 3,                         // lo aggiorno a mano quando entra un'azienda
  SITE_URL: "https://example.com",       // dominio vero, senza / finale
  PIVA: "",                              // se vuota, non viene mostrata
  PHOTO: ""                              // es. "marco.jpg"
};
```

Poi rigenera immagini e PDF:

```bash
npm install
```

```bash
npm run render
```

`render.mjs` legge `CONFIG` da `index.html`, scrive `config.js`, aggiorna `og:image` e `og:url` nell'`<head>` con `SITE_URL` e salva `locandina.png`, `og-image.png` e `Sempre-in-Linea-pilota.pdf`. Serve la connessione internet (i font arrivano da Google Fonts).

### La foto

1. Metti una foto quadrata chiamata `marco.jpg` (almeno 300×300) accanto a `index.html`.
2. In `CONFIG` scrivi `PHOTO: "marco.jpg"`.

Finché `PHOTO` è vuota si vedono le iniziali "MP".

### Quando entra un'azienda

Abbassa `SPOTS_LEFT`. La pagina scrive "Rimangono solo N posti" e a 1 "Rimane solo 1 posto"; a 0 passa in modalità "chiuso" con "Posti esauriti. Grazie a chi è entrato.". Se vuoi che anche la locandina dica il numero aggiornato, rilancia `npm run render` (la locandina mostra i posti totali).

## Cosa pubblicare (Netlify)

`npm run render` prepara la cartella `pubblica/` con i soli file del sito (`index.html`, `og-image.png` e la foto se impostata).

1. Vai su app.netlify.com/drop e trascina la cartella `pubblica/`.
2. Netlify ti dà un indirizzo tipo `nome-a-caso.netlify.app`: in Site configuration > Change site name puoi cambiarlo, es. `sempreinlinea.netlify.app`.
3. Metti quell'indirizzo in `SITE_URL`, rilancia `npm run render` e trascina di nuovo `pubblica/` nella pagina Deploys dello stesso sito.

WhatsApp tiene in cache l'anteprima del link: fai il passo 3 prima di condividere il link la prima volta.

## Come funziona il countdown

- Punta sempre a `DEADLINE` (offset +01:00 esplicito) e ricalcola da `Date.now()` ogni secondo: non si resetta e non usa cookie o localStorage.
- Ultime 48 ore: tessere con bordo rosso pieno, barra in alto "Ultimi 2 giorni".
- Ultime 24 ore: spariscono i giorni, le ore vanno in evidenza, il testo diventa "Ultimo giorno per candidarti".
- Scadenza passata: barra "Il programma pilota è chiuso." e card del pilota in modalità "chiuso".
