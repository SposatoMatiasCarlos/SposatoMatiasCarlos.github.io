import './BackButton.css';

function BackButton({ onClick }) {
  return (
    <button type="button" className="back-button" onClick={onClick} aria-label="Torna alla home">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M19 12H5M11 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Home</span>
    </button>
  );
}

export default BackButton;
