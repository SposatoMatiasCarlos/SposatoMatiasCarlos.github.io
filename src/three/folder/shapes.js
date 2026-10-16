import { ExtrudeGeometry, Shape } from 'three';

const EXTRUDE = {
  depth: 0.03,
  bevelEnabled: true,
  bevelThickness: 0.01,
  bevelSize: 0.01,
  bevelSegments: 2,
  curveSegments: 12,
};

// Rettangolo arrotondato con l'origine al centro del lato inferiore,
// così la rotazione su X fa da cerniera (come transform-origin: 50% 100%).
export function roundedRect(w, h, r) {
  const s = new Shape();
  s.moveTo(-w / 2 + r, 0);
  s.lineTo(w / 2 - r, 0);
  s.quadraticCurveTo(w / 2, 0, w / 2, r);
  s.lineTo(w / 2, h - r);
  s.quadraticCurveTo(w / 2, h, w / 2 - r, h);
  s.lineTo(-w / 2 + r, h);
  s.quadraticCurveTo(-w / 2, h, -w / 2, h - r);
  s.lineTo(-w / 2, r);
  s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  return new ExtrudeGeometry(s, EXTRUDE);
}

// Retro della cartella: rettangolo arrotondato con la linguetta in alto a sinistra.
export function folderBack(w, h, r, tab) {
  const tabRight = -w / 2 + w * 0.42;
  const s = new Shape();
  s.moveTo(-w / 2 + r, 0);
  s.lineTo(w / 2 - r, 0);
  s.quadraticCurveTo(w / 2, 0, w / 2, r);
  s.lineTo(w / 2, h - r);
  s.quadraticCurveTo(w / 2, h, w / 2 - r, h);
  s.lineTo(tabRight + 0.12, h);
  s.bezierCurveTo(tabRight + 0.04, h, tabRight + 0.04, h + tab, tabRight - 0.06, h + tab);
  s.lineTo(-w / 2 + r, h + tab);
  s.quadraticCurveTo(-w / 2, h + tab, -w / 2, h + tab - r);
  s.lineTo(-w / 2, r);
  s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
  return new ExtrudeGeometry(s, EXTRUDE);
}

// Pillola centrata sull'origine (per le note che escono dalla cartella).
export function pill(w, h) {
  const g = roundedRect(w, h, h / 2);
  g.translate(0, -h / 2, -EXTRUDE.depth / 2);
  return g;
}
