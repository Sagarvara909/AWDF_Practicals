import { useEffect, useRef, useState } from "react";
import "./Projects.css";
import RepoCard from "./RepoCard";
import Spinner from "./Spinner";
import CertificateCard from "./CertificateCard";
import "./CertificateCard.css";

function getRequestError(response, fallback) {
  if (response.status === 403) {
    return "GitHub API rate limit reached. Please wait a little and try again.";
  }
  if (response.status === 422) {
    return "Enter a valid GitHub username or search term.";
  }
  return `${fallback} (status ${response.status}).`;
}

function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");
  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsError, setCertsError] = useState("");
  const searchController = useRef(null);

  async function searchGithub(event) {
    event.preventDefault();
    const query = searchTerm.trim();

    if (!query) {
      setSearchError("Enter a GitHub username to search.");
      return;
    }

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setIsSearching(true);
    setHasSearched(true);
    setSearchError("");
    setUsers([]);
    setSelectedUser(null);
    setRepos([]);
    setCerts([]);

    try {
      const response = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=12`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        throw new Error(getRequestError(response, "Unable to search GitHub users"));
      }

      const data = await response.json();
      if (!Array.isArray(data.items)) {
        throw new Error("GitHub returned an unexpected search response.");
      }

      setUsers(data.items);
    } catch (error) {
      if (error.name !== "AbortError") {
        setSearchError(error.message || "Unable to search GitHub users.");
      }
    } finally {
      if (searchController.current === controller) {
        searchController.current = null;
        setIsSearching(false);
      }
    }
  }

  useEffect(() => {
    if (!selectedUser) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    async function loadUserContent() {
      setReposLoading(true);
      setReposError("");
      setCertsLoading(true);
      setCertsError("");

      const reposRequest = fetch(
        `https://api.github.com/users/${encodeURIComponent(selectedUser.login)}/repos?per_page=100&sort=updated`,
        { signal },
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error(getRequestError(response, "Unable to load repositories"));
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("GitHub returned an unexpected repositories response.");
        }
        setRepos(data);
      }).catch((error) => {
        if (error.name !== "AbortError") {
          setReposError(error.message || "Unable to load repositories.");
          setRepos([]);
        }
      }).finally(() => {
        if (!signal.aborted) setReposLoading(false);
      });

      const certificatesRequest = fetch(
        `https://api.github.com/repos/${encodeURIComponent(selectedUser.login)}/certificates/contents`,
        { signal },
      ).then(async (response) => {
        if (response.status === 404) {
          setCerts([]);
          return;
        }
        if (!response.ok) {
          throw new Error(getRequestError(response, "Unable to load certificates"));
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("GitHub returned an unexpected certificates response.");
        }
        setCerts(data.filter((item) => item.type === "file"));
      }).catch((error) => {
        if (error.name !== "AbortError") {
          setCertsError(error.message || "Unable to load certificates.");
          setCerts([]);
        }
      }).finally(() => {
        if (!signal.aborted) setCertsLoading(false);
      });

      await Promise.all([reposRequest, certificatesRequest]);
    }

    loadUserContent();
    return () => controller.abort();
  }, [selectedUser]);

  useEffect(() => () => searchController.current?.abort(), []);

  return (
    <section className="projects-page">
      <div className="projects-header">
        <div>
          <p className="projects-kicker">Explore GitHub</p>
          <h2>Find GitHub accounts</h2>
          <p className="projects-intro">
            Search for a GitHub username and explore their public repositories.
          </p>
        </div>
      </div>

      <form className="github-search" onSubmit={searchGithub}>
        <label htmlFor="github-id">GitHub username</label>
        <div className="github-search-row">
          <input
            id="github-id"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Try octocat or a username"
            autoComplete="off"
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search GitHub"}
          </button>
        </div>
        <p>Search GitHub accounts, then choose one to view public repositories.</p>
      </form>

      {searchError && <p className="projects-error" role="alert">{searchError}</p>}

      {isSearching && <p className="projects-loading" role="status">Searching GitHub accounts...</p>}

      {!isSearching && hasSearched && !searchError && users.length === 0 && (
        <div className="projects-empty-state">
          <p>No GitHub accounts found. Check the username and try again.</p>
        </div>
      )}

      {users.length > 0 && (
        <section className="github-users" aria-label="GitHub account search results">
          <div className="certs-heading">
            <div>
              <p className="projects-kicker">Search results</p>
              <h3>GitHub accounts</h3>
            </div>
            <p className="certs-count">{users.length} accounts</p>
          </div>
          <div className="github-users-grid">
            {users.map((user) => (
              <article className="github-user-card" key={user.id}>
                <img src={user.avatar_url} alt="" className="github-user-avatar" />
                <div className="github-user-details">
                  <h4>{user.login}</h4>
                  <span>{user.type || "GitHub user"}</span>
                </div>
                <div className="github-user-actions">
                  <button type="button" onClick={() => setSelectedUser(user)}>
                    View repositories
                  </button>
                  <a href={user.html_url} target="_blank" rel="noopener noreferrer">
                    Profile
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedUser && (
        <>
          <section className="selected-github-user">
            <div>
              <p className="projects-kicker">Selected account</p>
              <h3>@{selectedUser.login}</h3>
            </div>
            <button type="button" onClick={() => setSelectedUser(null)}>
              Back to search results
            </button>
          </section>

          {reposLoading ? (
            <Spinner />
          ) : reposError ? (
            <div className="projects-error-panel" role="alert">
              <p>{reposError}</p>
              <button type="button" onClick={() => setSelectedUser({ ...selectedUser })}>
                Retry
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="projects-empty-state">
              <p>This account has no public repositories.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {repos.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
            </div>
          )}

          <section className="certs-section">
            <div className="certs-heading">
              <div>
                <p className="projects-kicker">Credentials</p>
                <h3>Certificates repository</h3>
              </div>
              <p className="certs-count">{certs.length} available</p>
            </div>
            {certsLoading ? (
              <p className="projects-loading">Checking for certificates...</p>
            ) : certsError ? (
              <p className="projects-error" role="alert">{certsError}</p>
            ) : certs.length === 0 ? (
              <div className="projects-empty-state">
                <p>No certificates repository was found for this account.</p>
              </div>
            ) : (
              <div className="certs-grid">
                {certs.map((file) => <CertificateCard key={file.sha} file={file} />)}
              </div>
            )}
          </section>
        </>
      )}

      {!hasSearched && (
        <div className="projects-empty-state">
          <p>Search any GitHub username to get started.</p>
        </div>
      )}
    </section>
  );
}

export default Projects;
