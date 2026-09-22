import "./CertificateCard.css";

function CertificateCard({ file }) {
  const { name, download_url } = file;
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(name);
  const isPdf = /\.pdf$/i.test(name);

  return (
    <article className="cert-card">
      <div className="cert-preview">
        {isImage && download_url ? (
          <img src={download_url} alt={`${name} certificate preview`} />
        ) : (
          <span className="cert-file-type">{isPdf ? 'PDF' : 'CERT'}</span>
        )}
      </div>
      <div className="cert-card-body">
        <h4 className="cert-name">{name}</h4>
        <p className="cert-sub">Certificate available to view and download</p>
      </div>

      <div className="cert-actions">
        {download_url && (
          <a
            className="cert-btn"
            href={download_url}
            download={name}
          >
            Download Certificate
          </a>
        )}
      </div>
    </article>
  );
}

export default CertificateCard;
