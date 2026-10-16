import { Suspense, useState } from 'react';
import BackButton from './components/BackButton/BackButton.jsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import Home from './pages/Home/Home.jsx';
import Cv from './pages/Cv/Cv.jsx';
import Bkch from './pages/Bkch/Bkch.jsx';
import FcppLeases from './pages/FcppLeases/FcppLeases.jsx';

function App() {
  const [page, setPage] = useState('Home');

  const renderPage = () => {
    switch (page) {
      case 'Home': return <Home setPage={setPage} />;
      case 'Cv':   return <Cv />;
      case 'Bkch': return <Bkch />;
      case 'FcppLeases': return <FcppLeases />;
      default:     return <Home setPage={setPage} />;
    }
  };

  return (
    <>
      {page !== 'Home' && <BackButton onClick={() => setPage('Home')} />}
      <ErrorBoundary resetKey={page}>
        <Suspense fallback={null}>{renderPage()}</Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
