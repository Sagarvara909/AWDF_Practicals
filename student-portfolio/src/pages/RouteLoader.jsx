import './Spinner.css';

/**
 * RouteLoader:
 * Meaningful and accessible fallback UI while route chunks or components are loading.
 * Features an orbital spinner ring, branded typography, and animated progress track.
 */
function RouteLoader({ label = 'Loading page...' }) {
  return (
    <div className="route-loading-container" role="status" aria-live="polite">
      <div className="spinner-ring" aria-hidden="true">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
      <p className="route-loading-label">
        <span className="spinner-bracket">[</span>
        <span className="route-loading-text">{label}</span>
        <span className="spinner-cursor">_</span>
        <span className="spinner-bracket">]</span>
      </p>
      <div className="route-loading-bar-track" aria-hidden="true">
        <div className="route-loading-bar-thumb" />
      </div>
    </div>
  );
}

export default RouteLoader;
