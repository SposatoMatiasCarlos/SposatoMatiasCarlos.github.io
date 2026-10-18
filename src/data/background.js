import hands from '../assets/background/hands.png';

// Elemento sullo sfondo della Home, disegnato a caratteri ASCII da <AsciiField>.
//
// Per cambiarlo basta sostituire l'immagine (o importarne un'altra qui sotto):
// le parti chiare diventano caratteri (più chiaro = carattere più pesante),
// il nero e il trasparente restano vuoti. Va bene qualsiasi PNG/JPG/SVG.
// Tieni `rows` ≈ cols / (larghezza/altezza dell'immagine × 1.8) perché i caratteri
// non risultino schiacciati. Le mani attuali vengono da un dipinto scontornato
// (pelle chiara = carattere pesante, ombre = carattere leggero).
// L'immagine occupa tutta la larghezza dello schermo, centrata,
// e l'animazione (decodifica, movimento verso il centro, mouse) resta la stessa.
export const background = {
  src: hands,
  cols: 240, // caratteri per riga
  rows: 38, // righe di caratteri
  ramp: '.:-=+*#%@', // dal più leggero al più pesante
  gap: 0.26, // spazio libero al centro per la cartella (frazione del lato corto dello schermo)
  color: '#f4f4f5',
  accent: '#0a84ff',
};
