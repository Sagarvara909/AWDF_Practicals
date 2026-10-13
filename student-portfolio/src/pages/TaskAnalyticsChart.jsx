import './TaskAnalyticsChart.css';

/**
 * TaskAnalyticsChart:
 * Heavy analytics and visualization component for the Task Management module.
 * Designed to be lazy-loaded on-demand via React.lazy() and Suspense, reducing
 * the initial route bundle size until the user requests task insights.
 */
function TaskAnalyticsChart({ tasks = [] }) {
  const total = tasks.length;
  const pending = tasks.filter((t) => (t.status || (t.completed ? 'completed' : 'pending')) === 'pending').length;
  const ongoing = tasks.filter((t) => (t.status || (t.completed ? 'completed' : 'pending')) === 'ongoing').length;
  const completed = tasks.filter((t) => (t.status || (t.completed ? 'completed' : 'pending')) === 'completed').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
  const ongoingRate = total > 0 ? Math.round((ongoing / total) * 100) : 0;

  return (
    <article className="task-analytics-card" aria-label="Task Analytics and Distribution Metrics">
      <div className="task-analytics-header">
        <div>
          <h3>Productivity Analytics</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Lazy-loaded chunk: rendered dynamically via React.lazy() + Suspense
          </p>
        </div>
        <span className="analytics-badge">
          ⚡ On-demand Chunk
        </span>
      </div>

      <div className="task-metrics-grid">
        <div className="metric-pill">
          <span className="metric-label">Total Tasks</span>
          <span className="metric-value">{total}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Pending</span>
          <span className="metric-value pending">{pending}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Ongoing</span>
          <span className="metric-value ongoing">{ongoing}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Completed</span>
          <span className="metric-value completed">{completed}</span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Completion</span>
          <span className="metric-value completed">{completionRate}%</span>
        </div>
      </div>

      <div className="chart-visual-wrapper">
        <div className="chart-title-row">
          <span>Status Distribution</span>
          <span>{total > 0 ? `${completed}/${total} Done` : 'No active tasks'}</span>
        </div>

        {total > 0 ? (
          <>
            <div className="progress-bar-composite" role="progressbar" aria-valuenow={completionRate} aria-valuemin="0" aria-valuemax="100">
              <div className="progress-segment completed" style={{ width: `${completionRate}%` }} title={`Completed: ${completionRate}%`} />
              <div className="progress-segment ongoing" style={{ width: `${ongoingRate}%` }} title={`Ongoing: ${ongoingRate}%`} />
              <div className="progress-segment pending" style={{ width: `${pendingRate}%` }} title={`Pending: ${pendingRate}%`} />
            </div>

            <div className="chart-bars-list">
              <div className="bar-row">
                <span className="bar-name">Completed</span>
                <div className="bar-track">
                  <div className="bar-fill completed" style={{ width: `${completionRate}%` }} />
                </div>
                <span className="bar-percent">{completionRate}%</span>
              </div>
              <div className="bar-row">
                <span className="bar-name">Ongoing</span>
                <div className="bar-track">
                  <div className="bar-fill ongoing" style={{ width: `${ongoingRate}%` }} />
                </div>
                <span className="bar-percent">{ongoingRate}%</span>
              </div>
              <div className="bar-row">
                <span className="bar-name">Pending</span>
                <div className="bar-track">
                  <div className="bar-fill pending" style={{ width: `${pendingRate}%` }} />
                </div>
                <span className="bar-percent">{pendingRate}%</span>
              </div>
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', margin: '14px 0', fontSize: '0.9rem' }}>
            Add tasks to generate distribution metrics and velocity insights.
          </p>
        )}
      </div>
    </article>
  );
}

export default TaskAnalyticsChart;
