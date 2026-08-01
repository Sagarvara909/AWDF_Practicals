import "./Spinner.css";

function Spinner() {
  return (
    <div className="spinner-wrapper" role="status" aria-live="polite">
      <div className="spinner-ring">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
      <p className="spinner-label">
        <span className="spinner-bracket">[</span>
        fetching_repositories<span className="spinner-cursor">_</span>
        <span className="spinner-bracket">]</span>
      </p>
    </div>
  );
}

export default Spinner;