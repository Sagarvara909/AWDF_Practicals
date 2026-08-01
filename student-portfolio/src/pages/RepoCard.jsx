import "./RepoCard.css";

function RepoCard({ repo }) {
  const {
    name,
    description,
    html_url,
    language,
    stargazers_count,
    forks_count,
    updated_at,
  } = repo;

  const formattedDate = new Date(updated_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="repo-card">
      <div className="repo-card-header">
        <h3 className="repo-name">{name}</h3>
        {language && <span className="repo-language">{language}</span>}
      </div>

      <p className="repo-description">
        {description || "No description provided."}
      </p>

      <div className="repo-stats">
        <span className="repo-stat" title="Stars">
          ★ {stargazers_count}
        </span>
        <span className="repo-stat" title="Forks">
          ⑂ {forks_count}
        </span>
        <span className="repo-stat repo-updated" title="Last updated">
          updated {formattedDate}
        </span>
      </div>

      <a
        href={html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="repo-link-btn"
      >
        View Repository →
      </a>
    </article>
  );
}

export default RepoCard;