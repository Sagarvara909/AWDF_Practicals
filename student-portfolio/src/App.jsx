import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, getCurrentUser, getToken } from './api';
import Header from './pages/Header';
import Footer from './pages/Footer';
import NotFound from './pages/NotFound';
import RouteLoader from './pages/RouteLoader';
import DelayedFallback from './pages/DelayedFallback';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Task = lazy(() => import('./pages/task'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, [location.pathname]);

  const studentName = currentUser?.username || 'Student Portfolio';

  const skillsList = [
    'HTML & CSS', 'JavaScript ES6+', 'React & Hooks', 'Vite Build Tool',
    'Component Architecture', 'Props & State Management', 'Git & Version Control',
    'Responsive Web Design', 'Data Analytics', 'Data Visualization',
    'SQL & Database Management', 'Machine Learning', 'Python Programming',
    'Data Cleaning & Preprocessing', 'Statistical Analysis', 'Data Mining Techniques',
    'Predictive Modeling', 'Data Interpretation & Reporting', 'Big Data Technologies',
    'Data Warehousing',
  ];

  return (
    <div className={isDarkMode ? 'app dark' : 'app light'}>
      <Header name={studentName} themeColor={isDarkMode ? '#08039d' : '#4CAF50'} />

      <nav className="site-nav">
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/task" className="nav-link">Task Manager</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          {getToken() && <Link to="/profile" className="nav-link">My Profile</Link>}
          {getToken() && currentUser?.role === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
          {!getToken() && <Link to="/login" className="nav-link">Login</Link>}
        </div>

        <div className="nav-actions">
          {getToken() && (
            <button className="logout-btn" onClick={() => { clearToken(); navigate('/login'); }}>
              Logout
            </button>
          )}
          <button className="theme-btn" onClick={() => setIsDarkMode((prev) => !prev)}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </nav>

      <main className="app-main">
        <Suspense
          fallback={
            <DelayedFallback delay={300}>
              <RouteLoader label="Loading page..." />
            </DelayedFallback>
          }
        >
          <Routes>
            <Route path="/" element={<Home skillsList={skillsList} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/task" element={<Task />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

export default App;
