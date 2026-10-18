import { lazy, Suspense } from 'react';
import AsciiField from '../../components/AsciiField/AsciiField.jsx';
import { background } from '../../data/background.js';
import { projects } from '../../data/projects.js';
import './Home.css';

// La cartella 3D viene caricata a parte: finché three.js non è pronto si vede la lista
const HomeScene = lazy(() => import('./HomeScene.jsx'));

function ProjectList({ setPage, className = '' }) {
  return (
    <ul className={`home__list ${className}`}>
      {projects.map(p => (
        <li key={p.page}>
          <button type="button" onClick={() => setPage(p.page)}>
            {p.title}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Home({ setPage }) {
  return (
    <main className="home">
      {/* Sfondo in tipografia ASCII: per cambiarlo vedi src/data/background.js */}
      <AsciiField {...background} />
      <Suspense fallback={<ProjectList setPage={setPage} />}>
        <HomeScene projects={projects} setPage={setPage} />
        {/* Per tastiera e screen reader: nascosta finché non riceve il focus */}
        <ProjectList setPage={setPage} className="home__list--a11y" />
      </Suspense>
    </main>
  );
}

export default Home;
