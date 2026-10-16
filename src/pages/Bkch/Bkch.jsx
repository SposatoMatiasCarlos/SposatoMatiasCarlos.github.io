import './Bkch.css';

// bkch è una repo separata con la sua GitHub Page, servita sullo stesso
// dominio in /bkch/: la includiamo con un iframe invece di copiarne il codice.
const BKCH_URL = 'https://sposatomatiascarlos.github.io/bkch/';

function Bkch() {
  return <iframe className="bkch" src={BKCH_URL} title="bkch" />;
}

export default Bkch;
