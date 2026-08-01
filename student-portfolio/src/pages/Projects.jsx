import { useEffect, useState } from "react";
import "./Projects.css";
import ErrorMessage from "./ErrorMessage";
import RepoCard from "./RepoCard";
import Spinner from "./Spinner";
import CertificateCard from "./CertificateCard";
import "./CertificateCard.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const githubUsername = "sagarvara909"; // Replace with your GitHub username

  const fetchRepos = async ({ signal } = {}) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        // github api end point
        `https://api.github.com/users/${githubUsername}/repos?per_page=100`,
        { signal }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `GitHub user "${githubUsername}" was not found. Please update the username.`
          );
        }

        throw new Error(
          `Unable to load repositories. Status code: ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The GitHub API returned an unexpected response.");
      }

      setRepos(data);
    } catch (err) {
      setError(
        err.message || "Something went wrong while loading repositories."
      );
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController()

    async function loadRepos() {
      await fetchRepos({ signal: controller.signal })
    }

    loadRepos()

    return () => controller.abort()
  }, [])

  // Certificates state and fetch
  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsError, setCertsError] = useState("");
  const [showCerts, setShowCerts] = useState(false);

  const fetchCertificates = async () => {
    setCertsLoading(true);
    setCertsError("");

    try {
      const response = await fetch(
        `https://api.github.com/repos/${githubUsername}/certificates/contents`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `No repository named "certificates" found for ${githubUsername}.`
          );
        }
        throw new Error(`Unable to load certificates. Status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response when fetching certificates.");
      }

      // Filter to files only and map needed fields
      const files = data.filter((item) => item.type === "file");
      setCerts(files);
    } catch (err) {
      setCertsError(err.message || "Failed to load certificates.");
      setCerts([]);
    } finally {
      setCertsLoading(false);
    }
  };

  const filteredRepos = repos;

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchRepos} />;
  }

  return (
    <section className="projects-page">
      <div className="projects-header">
        <div>
          <p className="projects-kicker">API Integration</p>
          <h2>My Public GitHub Repositories</h2>
          <p className="projects-intro">
            These repositories are fetched live from the GitHub public API and
            rendered dynamically on this portfolio page.
          </p>
        </div>
      </div>

      <div className="certs-toolbar">
        <button
          className="certs-toggle-btn"
          onClick={() => {
            const next = !showCerts;
            setShowCerts(next);
            if (next && certs.length === 0 && !certsLoading) {
              fetchCertificates();
            }
          }}
        >
          {showCerts ? "Hide Certificates" : "Load Certificates"}
        </button>
      </div>

      {showCerts && (
        <section className="certs-section">
          {certsLoading ? (
            <Spinner />
          ) : certsError ? (
            <ErrorMessage message={certsError} onRetry={fetchCertificates} />
          ) : certs.length === 0 ? (
            <div className="projects-empty-state">
              <p>No certificates found in the repository.</p>
            </div>
          ) : (
            <div className="certs-grid">
              {certs.map((file) => (
                <CertificateCard key={file.sha} file={file} />
              ))}
            </div>
          )}
        </section>
      )}

      {filteredRepos.length === 0 ? (
        <div className="projects-empty-state">
          <p>No public repositories are available at the moment.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Projects;
