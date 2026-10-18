import { useEffect, useRef } from 'react';
import './AsciiField.css';

// Disegna un'immagine come tipografia ASCII animata (halftone fatto di caratteri):
// più l'immagine è chiara in un punto, più "pesante" è il carattere scelto dalla scala `ramp`.
// - comparsa a decodifica: i caratteri girano a caso e poi si fermano, dai bordi verso il centro
// - le parti vicine al centro si allungano verso di esso a scatti di griglia (le dita che si cercano)
// - i caratteri cambiano peso seguendo un'onda lenta, con qualche glitch sparso
// - vicino al mouse (o al dito) i caratteri si rimescolano e diventano del colore d'accento
// Ai bordi orizzontali (pieno solo sopra o solo sotto) usa caratteri alti o bassi,
// così i contorni sottili come le dita restano leggibili dentro la singola cella.
// Su schermi verticali l'immagine ruota di 90°: le due metà arrivano dall'alto e dal basso.
// L'immagine è solo una maschera: si può cambiare senza toccare l'animazione.

const MIN_WIDTH = 760; // in orizzontale, sotto questa larghezza l'immagine esce dai lati
const MIN_CELL = 4.5; // px: su schermi piccoli meno colonne, perché i caratteri restino leggibili
const CHAR_RATIO = 1.8; // altezza / larghezza di una cella
const THRESHOLD = 0.06; // luminosità minima perché una cella abbia un carattere
const REACH = 3; // di quante celle si allungano le dita
const REACH_PERIOD = 6; // secondi per un ciclo avanti/indietro
const POINTER_R = 80; // raggio d'azione del mouse in px
const DECODE = 0.55; // secondi in cui ogni carattere gira prima di fermarsi
const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const EDGE = 0.4; // una metà della cella sotto questa frazione dell'altra = bordo
const TOP_GLYPHS = [..."`'\""]; // pieno solo in alto, dal più leggero al più pesante
const BOTTOM_GLYPHS = [...'.,_']; // pieno solo in basso

// Pseudo-casuale stabile per cella (e per istante, se si passa anche t)
const hash = (i, j, t = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7 + t * 74.7) * 43758.5453;
  return x - Math.floor(x);
};

// Legge l'immagine ridotta a cols × (rows × 2): ogni cella ha una metà alta e una bassa.
// values = luminosità della cella, edge = 1 se piena solo sopra, -1 solo sotto, 0 altrimenti
function sample(img, cols, rows, rotate) {
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows * 2;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  if (rotate) {
    // Ruota di 90° in senso orario: la sinistra dell'immagine va in alto
    ctx.translate(cols, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0, rows * 2, cols);
  } else {
    ctx.drawImage(img, 0, 0, cols, rows * 2);
  }
  const { data } = ctx.getImageData(0, 0, cols, rows * 2);
  const lum = k => ((data[k * 4] + data[k * 4 + 1] + data[k * 4 + 2]) / 765) * (data[k * 4 + 3] / 255);
  const values = new Float32Array(cols * rows);
  const edge = new Int8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = lum(j * 2 * cols + i);
      const b = lum((j * 2 + 1) * cols + i);
      const hi = Math.max(t, b);
      if (hi <= THRESHOLD) continue;
      const k = j * cols + i;
      // Media spostata verso la metà piena, perché i bordi sottili non spariscano
      values[k] = (hi + (t + b) / 2) / 2;
      if (b < t * EDGE) edge[k] = 1;
      else if (t < b * EDGE) edge[k] = -1;
    }
  }
  return { values, edge };
}

// cols / colsPortrait: caratteri per riga su schermi orizzontali / verticali (le righe si ricavano)
// gap / gapPortrait: spazio libero al centro (es. per la cartella), in frazione del lato corto
// dello schermo. Le due metà dell'immagine si allontanano per lasciarlo vuoto.
function AsciiField({
  src,
  cols: colsLandscape,
  colsPortrait = 60,
  ramp = '.:-=+*#%@',
  gap: gapLandscape = 0,
  gapPortrait = gapLandscape,
  color = '#111',
  accent = '#0a84ff',
  className = '',
}) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glyphs = [...ramp];
    const pointer = { x: -1e4, y: -1e4 };
    let img = null;
    let grid = null; // { vertical, cols, rows, values, edge }
    let size = { w: 0, h: 0 };
    let raf = 0;
    let start = 0;
    let cancelled = false;

    // Ricampiona solo quando cambiano orientamento o numero di colonne
    const ensureGrid = () => {
      if (!img || !size.w) return;
      const vertical = size.h > size.w;
      const fw = vertical ? size.w : Math.max(size.w, MIN_WIDTH);
      const cols = Math.min(vertical ? colsPortrait : colsLandscape, Math.round(fw / MIN_CELL));
      if (grid && grid.vertical === vertical && grid.cols === cols) return;
      const aspect = img.naturalWidth / img.naturalHeight || 1;
      const rows = Math.round(vertical ? (cols * aspect) / CHAR_RATIO : cols / aspect / CHAR_RATIO);
      grid = { vertical, cols, rows, aspect: vertical ? 1 / aspect : aspect, ...sample(img, cols, rows, vertical) };
    };

    const draw = t => {
      const { w, h } = size;
      ctx.clearRect(0, 0, w, h);
      if (!grid) return;
      const { vertical, cols, rows, values, edge, aspect } = grid;

      // In orizzontale l'immagine prende tutta la larghezza; in verticale pure, ed esce sopra e sotto
      const fw = vertical ? w : Math.max(w, MIN_WIDTH);
      const fh = fw / aspect;
      const left = (w - fw) / 2;
      const top = (h - fh) / 2;
      const cw = fw / cols;
      const ch = fh / rows;
      ctx.font = `${Math.min(ch * 0.9, cw / 0.6).toFixed(1)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Asse lungo cui le due metà si cercano: colonne in orizzontale, righe in verticale
      const n = vertical ? rows : cols;
      const mid = (n - 1) / 2;
      const gap = vertical ? gapPortrait : gapLandscape;
      const reach = reduce ? 0 : (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / REACH_PERIOD)) * REACH;
      // Celle di cui allontanare le due metà; l'allungamento delle dita non entra nel buco
      const open = Math.round((gap * Math.min(w, h)) / 2 / (vertical ? ch : cw)) + (gap ? REACH : 0);
      const tick = Math.floor(t * 12); // i caratteri casuali cambiano 12 volte al secondo
      const accentCells = [];

      ctx.fillStyle = color;
      for (let j = 0; j < rows; j++) {
        const y = top + (j + 0.5) * ch;
        if (y < -ch || y > h + ch) continue;
        for (let i = 0; i < cols; i++) {
          const x = left + (i + 0.5) * cw;
          if (x < -cw || x > w + cw) continue;

          // Metà allontanate dal centro, poi le dita (0 ai polsi, 1 in punta) avanzano verso di esso
          const a = vertical ? j : i;
          const tip = Math.max(0, 1 - Math.abs(a - mid) / (n * 0.3)) ** 2;
          const shift = Math.round(reach * tip) - open;
          const first = a < mid;
          const sa = first ? a - shift : a + shift;
          if (sa < 0 || sa >= n || first !== sa < mid) continue;
          const k = vertical ? sa * cols + i : j * cols + sa;
          const v = values[k];
          if (!v) continue;

          let level = v;
          let scramble = false;

          if (!reduce) {
            // Decodifica: prima vuoto, poi caratteri a caso, poi quello giusto
            const delay = (1 - Math.abs(a - mid) / mid) * 0.9 + hash(i, j) * 0.4;
            if (t < delay) continue;
            scramble = t < delay + DECODE;

            // Onda lenta che fa cambiare peso ai caratteri
            const wave = Math.sin(i * 0.18 - t * 1.4 + Math.sin(j * 0.6 + t * 0.5) * 1.5);
            level = v * (0.82 + 0.22 * wave);
            if (hash(i, j, tick) < 0.004) scramble = true;
          }

          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < POINTER_R) {
            const f = 1 - d / POINTER_R;
            if (hash(i, j, tick) < f) {
              accentCells.push(x, y, glyphs[Math.floor(hash(j, i, tick) * glyphs.length)]);
              continue;
            }
            level += f * 0.4;
          }

          const e = edge[k];
          const set = e === 1 ? TOP_GLYPHS : e === -1 ? BOTTOM_GLYPHS : glyphs;
          const g = scramble
            ? glyphs[Math.floor(hash(j, i, tick) * glyphs.length)]
            : set[Math.min(set.length - 1, Math.floor(Math.min(level, 0.999) * set.length))];
          ctx.fillText(g, x, y);
        }
      }

      ctx.fillStyle = accent;
      for (let k = 0; k < accentCells.length; k += 3) ctx.fillText(accentCells[k + 2], accentCells[k], accentCells[k + 1]);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      size = { w: width, h: height };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ensureGrid();
      if (reduce) draw(Infinity);
    };

    const loop = now => {
      if (!start) start = now;
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = e => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointer.x = pointer.y = -1e4;
    };
    // Col touch l'effetto segue il dito solo finché tocca lo schermo
    const onPointerUp = e => {
      if (e.pointerType !== 'mouse') onPointerLeave();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      img = image;
      ensureGrid();
      if (reduce) {
        draw(Infinity);
      } else {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointerleave', onPointerLeave);
        raf = requestAnimationFrame(loop);
      }
    };
    image.src = src;

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [src, colsLandscape, colsPortrait, ramp, gapLandscape, gapPortrait, color, accent]);

  return <canvas ref={canvasRef} className={`ascii-field ${className}`} aria-hidden="true" />;
}

export default AsciiField;
