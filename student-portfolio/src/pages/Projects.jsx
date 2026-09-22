import { useCallback, useEffect, useState } from "react";
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
  const [githubId, setGithubId] = useState("sagarvara909");
  const [activeGithubId, setActiveGithubId] = useState("sagarvara909");

  const defaultGithubId = "sagarvara909";

  const fetchRepos = useCallback(async ({ signal, username = defaultGithubId } = {}) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        // github api end point
        `https://api.github.com/users/${username}/repos?per_page=100`,
        { signal }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `GitHub user "${username}" was not found. Please check the GitHub ID.`
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
  }, []);

  useEffect(() => {
    const controller = new AbortController()

    async function loadRepos() {
      await fetchRepos({ signal: controller.signal, username: defaultGithubId })
    }

    loadRepos()

    return () => controller.abort()
  }, [fetchRepos])

  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certsError, setCertsError] = useState("");

  const fetchCertificates = async ({ signal, username = activeGithubId } = {}) => {
    setCertsLoading(true);
    setCertsError("");

    try {
      const response = await fetch(
        `https://api.github.com/repos/${username}/certificates/contents`,
        { signal }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `No repository named "certificates" found for ${username}.`
          );
        }
        throw new Error(`Unable to load certificates. Status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response when fetching certificates.");
      }

      const files = data.filter((item) => item.type === "file");
      setCerts(files);
    } catch (err) {
      if (err.name === "AbortError") return;
      setCertsError(err.message || "Failed to load certificates.");
      setCerts([]);
    } finally {
      setCertsLoading(false);
    }
  };

  async function searchGithub(event) {
    event.preventDefault();
    const username = githubId.trim();

    if (!username) {
      setError("Enter a GitHub ID to search.");
      return;
    }

    setActiveGithubId(username);
    setCerts([]);
    setCertsError("");

    const controller = new AbortController();
    await Promise.all([
      fetchRepos({ signal: controller.signal, username }),
      fetchCertificates({ signal: controller.signal, username }),
    ]);
  }

  const filteredRepos = repos;

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchRepos({ username: activeGithubId })} />;
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

      <form className="github-search" onSubmit={searchGithub}>
        <label htmlFor="github-id">GitHub ID</label>
        <div className="github-search-row">
          <input
            id="github-id"
            value={githubId}
            onChange={(event) => setGithubId(event.target.value)}
            placeholder="Enter a GitHub username"
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Fetching..." : "Fetch Repositories"}
          </button>
        </div>
        <p>Showing public repositories for @{activeGithubId}</p>
      </form>

      <section className="certs-section">
        <div className="certs-heading">
          <div>
            <p className="projects-kicker">Credentials</p>
            <h3>Certificates</h3>
          </div>
          <p className="certs-count">{certs.length} available</p>
        </div>
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
