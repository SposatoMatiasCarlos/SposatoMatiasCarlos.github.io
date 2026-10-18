import hands from '../assets/background/hands.png';

// Elemento sullo sfondo della Home, disegnato a caratteri ASCII da <AsciiField>.
//
// Per cambiarlo basta sostituire l'immagine (o importarne un'altra qui sotto):
// le parti chiare diventano caratteri (più chiaro = carattere più pesante),
// il nero e il trasparente restano vuoti. Va bene qualsiasi PNG/JPG/SVG.
// Le mani attuali vengono da un dipinto scontornato
// (pelle chiara = carattere pesante, ombre = carattere leggero).
// L'immagine occupa tutta la larghezza dello schermo, centrata; su schermi verticali
// (telefono) ruota di 90° e le due metà arrivano dall'alto e dal basso.
// L'animazione (decodifica, movimento verso il centro, mouse) resta la stessa.
export const background = {
  src: hands,
  cols: 240, // caratteri per riga su schermi orizzontali (le righe si ricavano dall'immagine)
  colsPortrait: 60, // caratteri per riga su schermi verticali
  ramp: '.:-=+*#%@', // dal più leggero al più pesante
  // Spazio libero al centro per la cartella, in frazione del lato corto dello schermo
  gap: 0.2,
  gapPortrait: 0.5,
  color: '#f4f4f5',
  accent: '#0a84ff',
};
