import './FcppLeases.css';

// fcpp-leases è una repo separata con la sua GitHub Page, servita sullo stesso
// dominio in /fcpp-leases/: la includiamo con un iframe invece di copiarne il codice.
const FCPP_LEASES_URL = 'https://sposatomatiascarlos.github.io/fcpp-leases/';

function FcppLeases() {
  return <iframe className="fcpp-leases" src={FCPP_LEASES_URL} title="fcpp leases" />;
}

export default FcppLeases;
