import "./CertificateCard.css";

function CertificateCard({ file }) {
  const { name, download_url, html_url } = file;

  return (
    <article className="cert-card">
      <div className="cert-card-body">
        <h4 className="cert-name">{name}</h4>
        <p className="cert-sub">Certificate file from repository</p>
      </div>

      <div className="cert-actions">
        {download_url && (
          <a
            className="cert-btn"
            href={download_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        )}

        {html_url && (
          <a
            className="cert-link"
            href={html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        )}
      </div>
    </article>
  );
}

export default CertificateCard;
